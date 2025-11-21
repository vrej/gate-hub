import React, { createContext, useContext, ReactNode } from 'react';
import { User } from '@shared/schema';

type AuthContextType = {
  user: Partial<User> | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const MinimalAuthProvider = ({ children }: { children: ReactNode }) => {
  // Simplified auth state
  const [user, setUser] = React.useState<Partial<User> | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  // Simplified auth functions
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      // Simple mock for testing
      setUser({
        id: 1,
        username,
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        isAdmin: username === 'admin'
      });
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any) => {
    setIsLoading(true);
    try {
      // Simple mock for testing
      setUser({
        id: 1,
        username: userData.username,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        isAdmin: false
      });
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useMinimalAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useMinimalAuth must be used within a MinimalAuthProvider');
  }
  return context;
};