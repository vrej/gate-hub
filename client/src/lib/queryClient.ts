import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { logClientError } from "./error-logger";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: { silent401?: boolean },
): Promise<Response> {
  const isFormData = data instanceof FormData;
  
  // Skip adding auth headers for login/register endpoints (they use passport session auth)
  const isAuthEndpoint = url.includes('/api/auth/login') || url.includes('/api/auth/register');
  
  // Get Okta token if available (but not for login/register endpoints)
  let authHeader = '';
  if (!isAuthEndpoint) {
    try {
      const oktaAuth = (window as any).oktaAuth;
      
      if (oktaAuth) {
        const accessToken = await oktaAuth.tokenManager.get('accessToken');
        
        if (accessToken && accessToken.accessToken) {
          authHeader = `Bearer ${accessToken.accessToken}`;
        } else {
          // Try to get the ID token as fallback
          const idToken = await oktaAuth.tokenManager.get('idToken');
          
          if (idToken && idToken.idToken) {
            authHeader = `Bearer ${idToken.idToken}`;
          }
        }
      }
    } catch (error) {
      // Silent fail - tokens not available
    }
  }
  
  const headers: Record<string, string> = {};
  if (data && !isFormData) {
    headers["Content-Type"] = "application/json";
  }
  if (authHeader) {
    headers["Authorization"] = authHeader;
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: isFormData ? data : data ? JSON.stringify(data) : undefined,
    credentials: "include",
    cache: 'no-cache', // Prevent caching
  });

  // Handle 401 silently if requested (for auth checks)
  if (options?.silent401 && res.status === 401) {
    throw new Error('401: Unauthorized');
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get Okta token if available for queries too
    let authHeader = '';
    try {
      const oktaAuth = (window as any).oktaAuth;
      if (oktaAuth) {
        const accessToken = await oktaAuth.tokenManager.get('accessToken');
        if (accessToken && accessToken.accessToken) {
          authHeader = `Bearer ${accessToken.accessToken}`;
        }
      }
    } catch (error) {
      // Silent fail for queries
    }

    const headers: Record<string, string> = {};
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const res = await fetch(queryKey[0] as string, {
      headers,
      credentials: "include",
      cache: 'no-cache', // Prevent caching
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true, // Enable refetch on window focus
      staleTime: 0, // Data is immediately stale - always refetch when invalidated
      retry: false,
      onError: (error: any) => {
        // Log query errors to our error logging system
        logClientError({
          level: 'error',
          message: `React Query Error: ${error.message}`,
          stack: error.stack,
          context: 'REACT_QUERY',
          metadata: {
            type: 'query_error',
            error: error,
          },
        });
      },
    },
    mutations: {
      retry: false,
      onError: (error: any) => {
        // Log mutation errors to our error logging system
        logClientError({
          level: 'error',
          message: `React Query Mutation Error: ${error.message}`,
          stack: error.stack,
          context: 'REACT_QUERY_MUTATION',
          metadata: {
            type: 'mutation_error',
            error: error,
          },
        });
      },
    },
  },
});
