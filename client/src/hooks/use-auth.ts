import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { authApi, type AuthUser } from "@/lib/auth";

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authType, setAuthType] = useState<'regular' | 'okta' | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check both regular and Okta authentication
        const currentUser = await authApi.getCurrentUserAny();
        setUser(currentUser);
        setAuthType(currentUser?.authType || null);
      } catch (error) {
        // Silent fail - user is not authenticated (expected on login page)
        setUser(null);
        setAuthType(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const user = await authApi.login(email, password);
    setUser(user);
    setAuthType('regular');
    return user;
  };

  const register = async (userData: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    department: string;
  }) => {
    const user = await authApi.register(userData);
    setUser(user);
    setAuthType('regular');
    return user;
  };

  const loginWithOkta = async () => {
    await authApi.loginWithOkta();
    // Note: This will redirect to Okta, so we don't set user state here
  };

  const handleOktaCallback = async () => {
    const user = await authApi.handleOktaCallback();
    if (user) {
      setUser(user);
      setAuthType('okta');
      return user;
    }
    return null;
  };

  const logout = async () => {
    try {
      if (authType === 'okta') {
        await authApi.logoutFromOkta();
      } else {
        await authApi.logout();
      }
    } catch (error) {
      // Silent fail - still clear local state
    } finally {
      // Always clear local state and redirect
      setUser(null);
      setAuthType(null);
      setLocation("/login");
    }
  };

  const isAdmin = (): boolean => {
    return authApi.isUserAdmin(user);
  };

  const requiresOktaForAdmin = (): boolean => {
    // Make Okta optional for admin access - allow manual login as fallback
    // This can be configured based on your organization's requirements
    // Set to false to allow manual login, true to require Okta
    return false; // Changed from true to false to allow manual login
  };

  const preferOktaForAdmin = (): boolean => {
    // Prefer Okta for admin access but allow manual login as fallback
    return true;
  };

  return {
    user,
    isLoading,
    authType,
    login,
    register,
    loginWithOkta,
    handleOktaCallback,
    logout,
    isAdmin,
    requiresOktaForAdmin,
    preferOktaForAdmin,
  };
}
