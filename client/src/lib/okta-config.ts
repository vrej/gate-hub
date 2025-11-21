import { OktaAuth } from '@okta/okta-auth-js';

// Validate required environment variables
const requiredEnvVars = {
  VITE_OKTA_CLIENT_ID: import.meta.env.VITE_OKTA_CLIENT_ID,
  VITE_OKTA_ISSUER: import.meta.env.VITE_OKTA_ISSUER,
};

// Check for missing required environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error('❌ Missing required Okta environment variables:', missingVars);
  console.error('Please ensure these are set in your environment configuration.');
  
  if (import.meta.env.DEV) {
    console.warn('⚠️ Development mode: Okta SSO will not work without proper environment variables.');
  } else {
    console.error('🚨 Production mode: Okta SSO is broken due to missing environment variables.');
  }
}

// Okta configuration
export const oktaConfig = {
  clientId: import.meta.env.VITE_OKTA_CLIENT_ID,
  issuer: import.meta.env.VITE_OKTA_ISSUER,
  redirectUri: import.meta.env.VITE_OKTA_REDIRECT_URI || `${window.location.origin}/okta-callback`,
  scopes: ['openid', 'profile', 'email', 'groups'],
  pkce: true,
  disableHttpsCheck: import.meta.env.DEV,
  // Add additional configuration for better debugging
  devMode: import.meta.env.DEV,
  responseMode: 'fragment' as const, // Reverted back to fragment for org authorization server
  responseType: 'code' as const,
  // Add timeout configuration to handle slow loads
  maxClockSkew: 300,
  // Token manager configuration
  tokenManager: {
    autoRenew: true,
    autoRemove: true,
    storage: 'localStorage',
    // Add expireEarlySeconds to refresh tokens before they expire
    expireEarlySeconds: 300,
  },
};

// Create Okta Auth instance only if required variables are present
export const oktaAuth = missingVars.length === 0 
  ? new OktaAuth(oktaConfig)
  : null;

// Make Okta auth instance globally available for API requests
if (oktaAuth && typeof window !== 'undefined') {
  (window as any).oktaAuth = oktaAuth;
}

// Okta user interface
export interface OktaUser {
  sub: string;
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  groups?: string[];
}

// Admin group configuration
// You can customize these groups based on your Okta setup
export const ADMIN_GROUPS = [
  'Administrators',
  'Admin', 
  'admin',
  'ApplicationPortal-Admins',
  'Portal-Admins',
  'IT-Admins'
];

// Check if user is admin based on Okta groups
export const isOktaAdmin = (user: OktaUser | null): boolean => {
  if (!user) return false;
  
  // If no groups are provided, we cannot determine admin status
  if (!user.groups || user.groups.length === 0) return false;
  
  // Check if user is in any of the admin groups
  return ADMIN_GROUPS.some(group => user.groups?.includes(group));
};

// Check if a specific email should be treated as admin (fallback)
// This is useful for initial setup or emergency access
export const isAdminByEmail = (email: string): boolean => {
  // This should be replaced with a database lookup
  // For now, return false to force proper database integration
  return false;
};

// Enhanced admin checking with multiple criteria
export const isUserAdminByOkta = (user: OktaUser | null): boolean => {
  if (!user) return false;
  
  // Check by groups first
  if (isOktaAdmin(user)) return true;
  
  // Fallback: check by email
  if (isAdminByEmail(user.email)) return true;
  
  return false;
};

// Helper function to get user from Okta token
export const getOktaUserFromToken = (idToken: any): OktaUser | null => {
  if (!idToken || !idToken.claims) return null;
  
  const claims = idToken.claims;
  
  return {
    sub: claims.sub,
    email: claims.email,
    name: claims.name,
    given_name: claims.given_name,
    family_name: claims.family_name,
    groups: claims.groups || [],
  };
}; 