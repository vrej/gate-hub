import { apiRequest } from "./queryClient";
import { oktaAuth, type OktaUser, getOktaUserFromToken, isUserAdminByOkta } from "./okta-config";

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  department: string;
  isAdmin: boolean;
  createdAt: string;
  authType?: 'regular' | 'okta';
  oktaUser?: OktaUser;
}

export const authApi = {
  // Regular authentication methods
  login: async (email: string, password: string): Promise<AuthUser> => {
    const response = await apiRequest("POST", "/api/auth/login", { email, password });
    const data = await response.json();
    return { ...data.user, authType: 'regular' };
  },

  register: async (userData: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    department: string;
  }): Promise<AuthUser> => {
    const response = await apiRequest("POST", "/api/auth/register", userData);
    const data = await response.json();
    return { ...data.user, authType: 'regular' };
  },

  logout: async (): Promise<void> => {
    await apiRequest("POST", "/api/auth/logout");
  },

  getCurrentUser: async (silent401 = false): Promise<AuthUser | null> => {
    try {
      const response = await apiRequest("GET", "/api/auth/me", undefined, { silent401 });
      const data = await response.json();
      return { ...data.user, authType: 'regular' };
    } catch (error: any) {
      if (error.message.includes("401")) {
        return null;
      }
      throw error;
    }
  },

  // Okta authentication methods
  loginWithOkta: async (): Promise<void> => {
    if (!oktaAuth) {
      throw new Error('Okta is not configured. Please check your environment variables.');
    }
    
    try {
      // Clear any stale tokens before starting new login
      try {
        await oktaAuth.tokenManager.clear();
      } catch (clearError) {
        // Silent fail on token clear
      }
      
      await oktaAuth.signInWithRedirect({
        originalUri: window.location.origin + '/admin'
      });
    } catch (error: any) {
      // Check if error is due to browser extension interference
      if (error.message?.includes('MutationObserver') || 
          error.message?.includes('observe') ||
          error.name === 'TypeError') {
        throw new Error('Browser extension interference detected. Please try in incognito mode or disable extensions.');
      }
      
      throw new Error('Failed to initiate Okta login. Please try again.');
    }
  },

  handleOktaCallback: async (): Promise<AuthUser | null> => {
    if (!oktaAuth) {
      throw new Error('Okta is not configured. Please check your environment variables.');
    }
    
    try {
      // First, check if we're already authenticated (prevent double execution)
      if (await oktaAuth.isAuthenticated()) {
        const existingUser = await authApi.getCurrentOktaUser();
        if (existingUser) {
          return existingUser;
        }
      }
      
      // Check if we have the authorization code in the URL (fragment-based)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const authCode = hashParams.get('code');
      const state = hashParams.get('state');
      const error = hashParams.get('error');
      const errorDescription = hashParams.get('error_description');
      
      if (error) {
        throw new Error(`Okta error: ${error} - ${errorDescription || 'Unknown error'}`);
      }
      
      if (!authCode) {
        // If no auth code but we have stored tokens, try to get the user
        const storedIdToken = await oktaAuth.tokenManager.get('idToken');
        const storedAccessToken = await oktaAuth.tokenManager.get('accessToken');
        
        if (storedIdToken && storedAccessToken) {
          const existingUser = await authApi.getCurrentOktaUser();
          if (existingUser) {
            return existingUser;
          }
        }
        
        throw new Error('No authorization code found in URL fragment. Please try logging in again.');
      }
      
      // Exchange authorization code for tokens
      const tokens = await oktaAuth.token.parseFromUrl();
      
      // Store tokens in token manager
      await oktaAuth.tokenManager.setTokens(tokens.tokens);
      
      // Verify tokens are stored
      const storedIdToken = await oktaAuth.tokenManager.get('idToken');
      const storedAccessToken = await oktaAuth.tokenManager.get('accessToken');
      
      if (!storedIdToken || !storedAccessToken) {
        throw new Error('Token storage failed');
      }
      
      if (tokens.tokens?.idToken) {
        const oktaUser = getOktaUserFromToken(tokens.tokens.idToken);
        if (oktaUser) {
          const authUser: AuthUser = {
            id: 0, // Okta users don't have local IDs
            username: oktaUser.email?.split('@')[0] || oktaUser.name?.split(' ')[0] || 'okta-user',
            email: oktaUser.email,
            firstName: oktaUser.given_name || oktaUser.name?.split(' ')[0] || 'Okta',
            lastName: oktaUser.family_name || oktaUser.name?.split(' ')[1] || 'User',
            department: 'Okta User',
            isAdmin: isUserAdminByOkta(oktaUser),
            createdAt: new Date().toISOString(),
            authType: 'okta',
            oktaUser,
          };
          return authUser;
        }
      }
      return null;
    } catch (error: any) {
      // Check if error is due to browser extension interference
      if (error.message?.includes('MutationObserver') || 
          error.message?.includes('observe') ||
          error.name === 'TypeError') {
        throw new Error('Browser extension interference detected. Please try in incognito mode or disable extensions like password managers.');
      }
      
      throw new Error(error.message || 'Failed to handle Okta callback');
    }
  },

  getCurrentOktaUser: async (): Promise<AuthUser | null> => {
    if (!oktaAuth) {
      return null;
    }
    
    try {
      // Check if we have the required tokens
      const idToken = await oktaAuth.tokenManager.get('idToken');
      const accessToken = await oktaAuth.tokenManager.get('accessToken');
      
      if (!idToken || !accessToken) {
        return null;
      }

      // Check if tokens are expired (before making API call)
      const now = Math.floor(Date.now() / 1000);
      const isIdTokenExpired = idToken.expiresAt && idToken.expiresAt < now;
      const isAccessTokenExpired = accessToken.expiresAt && accessToken.expiresAt < now;
      
      if (isIdTokenExpired || isAccessTokenExpired) {
        // Tokens are expired, clear them
        await oktaAuth.tokenManager.clear();
        return null;
      }

      // Get user info using the access token
      const user = await oktaAuth.getUser();
      
      if (user && idToken) {
        const oktaUser = getOktaUserFromToken(idToken);
        if (oktaUser) {
          // For now, create a simple Okta user object
          // TODO: Implement proper database integration
          const authUser: AuthUser = {
            id: 0, // Temporary ID for Okta users
            username: oktaUser.email?.split('@')[0] || oktaUser.name?.split(' ')[0] || 'okta-user',
            email: oktaUser.email,
            firstName: oktaUser.given_name || oktaUser.name?.split(' ')[0] || 'Okta',
            lastName: oktaUser.family_name || oktaUser.name?.split(' ')[1] || 'User',
            department: 'Okta User',
            isAdmin: true, // Temporarily set to true for testing
            createdAt: new Date().toISOString(),
            authType: 'okta',
            oktaUser,
          };
          return authUser;
        }
      }
      return null;
    } catch (error: any) {
      // Check if error is due to revoked/expired tokens
      const errorMessage = error.message?.toLowerCase() || '';
      const errorName = error.name?.toLowerCase() || '';
      
      const isTokenError = 
        errorMessage.includes('revoked') ||
        errorMessage.includes('expired') ||
        errorMessage.includes('invalid_token') ||
        errorMessage.includes('invalid') ||
        errorMessage.includes('unauthorized') ||
        error.errorCode === 'invalid_token' ||
        errorName.includes('oauth');
      
      if (isTokenError) {
        // Clear invalid tokens silently (don't log - this is expected when tokens are stale)
        try {
          await oktaAuth.tokenManager.clear();
        } catch (clearError) {
          // Silent fail on clear
        }
        return null;
      }
      
      // For truly unexpected errors, silently return null
      // (Most errors here are expected auth failures)
      return null;
    }
  },

  logoutFromOkta: async (): Promise<void> => {
    if (!oktaAuth) {
      throw new Error('Okta is not configured. Please check your environment variables.');
    }
    
    try {
      await oktaAuth.signOut({
        postLogoutRedirectUri: window.location.origin + '/login'
      });
    } catch (error) {
      console.error('Okta logout error:', error);
      throw new Error('Failed to logout from Okta');
    }
  },

  // Combined authentication check
  getCurrentUserAny: async (): Promise<AuthUser | null> => {
    // Check if we have Okta tokens first (more efficient if user logged in via Okta)
    const hasOktaTokens = oktaAuth && await oktaAuth.tokenManager.get('idToken');
    
    if (hasOktaTokens) {
      // If Okta tokens exist, check Okta auth first
      try {
        const oktaUser = await authApi.getCurrentOktaUser();
        if (oktaUser) {
          return oktaUser;
        }
      } catch (error) {
        // Silent fail for Okta auth
      }
      
      // Fallback to regular auth (with silent 401 to avoid console noise)
      try {
        const regularUser = await authApi.getCurrentUser(true);
        if (regularUser) {
          return regularUser;
        }
      } catch (error) {
        // Silent fail for regular auth
      }
    } else {
      // No Okta tokens, check regular auth first (with silent 401)
      try {
        const regularUser = await authApi.getCurrentUser(true);
        if (regularUser) {
          return regularUser;
        }
      } catch (error) {
        // Silent fail for regular auth
      }

      // Then check Okta authentication
      try {
        const oktaUser = await authApi.getCurrentOktaUser();
        if (oktaUser) {
          return oktaUser;
        }
      } catch (error) {
        // Silent fail for Okta auth
      }
    }

    return null;
  },

  // Check if user is admin (works for both auth types)
  isUserAdmin: (user: AuthUser | null): boolean => {
    if (!user) return false;
    
    if (user.authType === 'okta' && user.oktaUser) {
      return isUserAdminByOkta(user.oktaUser);
    }
    
    return user.isAdmin;
  },

  // Helper to clear any stale/invalid Okta tokens
  clearStaleOktaTokens: async (): Promise<void> => {
    if (!oktaAuth) {
      return;
    }
    
    try {
      // Check if tokens exist
      const idToken = await oktaAuth.tokenManager.get('idToken');
      const accessToken = await oktaAuth.tokenManager.get('accessToken');
      
      if (!idToken && !accessToken) {
        // No tokens to clear
        return;
      }
      
      // Check if tokens are expired by examining their expiration time
      const now = Math.floor(Date.now() / 1000);
      let shouldClear = false;
      
      if (idToken && idToken.expiresAt && idToken.expiresAt < now) {
        shouldClear = true;
      }
      
      if (accessToken && accessToken.expiresAt && accessToken.expiresAt < now) {
        shouldClear = true;
      }
      
      // Check if isAuthenticated returns false (means tokens are invalid)
      const isAuth = await oktaAuth.isAuthenticated();
      if (!isAuth) {
        shouldClear = true;
      }
      
      if (shouldClear) {
        await oktaAuth.tokenManager.clear();
      }
    } catch (error) {
      // Silent fail - don't disrupt user experience
    }
  },
};
