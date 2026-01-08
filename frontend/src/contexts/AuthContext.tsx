'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import { useMutation, gql } from '@apollo/client';
import { userApolloClient } from '@/lib/apollo-client';

// GraphQL Mutations
const LOGIN_STAFF = gql`
  mutation LoginStaff($username: String!, $password: String!) {
    loginStaff(username: $username, password: $password) {
      token
      refreshToken
      expiresAt
      staff {
        id
        employeeId
        username
        name
        email
        role
      }
      message
    }
  }
`;

const REFRESH_TOKEN = gql`
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
      token
      expiresAt
      message
    }
  }
`;

const LOGOUT_MUTATION = gql`
  mutation Logout($refreshToken: String!) {
    logout(refreshToken: $refreshToken) {
      success
      message
    }
  }
`;

interface Staff {
    id: string;
    employeeId: string;
    username: string;
    name: string;
    email?: string;
    role: string;
}

interface AuthContextType {
    user: Staff | null;
    token: string | null;
    login: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
    logout: () => void;
    isAuthenticated: boolean;
    loading: boolean;
    refreshAuthToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Check if token is about to expire (within 30 minutes)
const isTokenExpiringSoon = (expiresAt: string | null): boolean => {
    if (!expiresAt) return true;
    const expiryTime = new Date(expiresAt).getTime();
    const now = Date.now();
    const thirtyMinutes = 30 * 60 * 1000;
    return expiryTime - now < thirtyMinutes;
};

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<Staff | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [refreshToken, setRefreshToken] = useState<string | null>(null);
    const [expiresAt, setExpiresAt] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const [loginMutation] = useMutation(LOGIN_STAFF, { client: userApolloClient });
    const [refreshTokenMutation] = useMutation(REFRESH_TOKEN, { client: userApolloClient });
    const [logoutMutation] = useMutation(LOGOUT_MUTATION, { client: userApolloClient });

    // Refresh the auth token using refresh token
    const refreshAuthToken = useCallback(async (): Promise<boolean> => {
        const storedRefreshToken = localStorage.getItem('refresh_token');
        if (!storedRefreshToken) {
            console.log('No refresh token available');
            return false;
        }

        try {
            const { data } = await refreshTokenMutation({
                variables: { refreshToken: storedRefreshToken },
            });

            if (data?.refreshToken?.token) {
                const { token: newToken, expiresAt: newExpiresAt } = data.refreshToken;

                // Update state
                setToken(newToken);
                setExpiresAt(newExpiresAt);

                // Update localStorage
                localStorage.setItem('auth_token', newToken);
                localStorage.setItem('token_expires_at', newExpiresAt);

                console.log('Token refreshed successfully, expires at:', newExpiresAt);
                return true;
            } else {
                console.log('Token refresh failed:', data?.refreshToken?.message);
                return false;
            }
        } catch (error) {
            console.error('Error refreshing token:', error);
            return false;
        }
    }, [refreshTokenMutation]);

    // Check for existing session on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('auth_user');
        const storedRefreshToken = localStorage.getItem('refresh_token');
        const storedExpiresAt = localStorage.getItem('token_expires_at');

        if (storedToken && storedUser) {
            try {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
                setRefreshToken(storedRefreshToken);
                setExpiresAt(storedExpiresAt);

                // Check if token is expired or expiring soon
                if (storedRefreshToken && isTokenExpiringSoon(storedExpiresAt)) {
                    console.log('Token is expiring soon, refreshing...');
                    refreshAuthToken();
                }
            } catch (error) {
                console.error('Error parsing stored user:', error);
                localStorage.removeItem('auth_token');
                localStorage.removeItem('auth_user');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('token_expires_at');
            }
        }
        setLoading(false);
    }, [refreshAuthToken]);

    // Auto-refresh token every 5 minutes
    useEffect(() => {
        if (!refreshToken || !expiresAt) return;

        // Clear existing interval
        if (refreshIntervalRef.current) {
            clearInterval(refreshIntervalRef.current);
        }

        // Check every 5 minutes if token needs refresh
        const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

        refreshIntervalRef.current = setInterval(async () => {
            console.log('Checking if token needs refresh...');
            if (isTokenExpiringSoon(expiresAt)) {
                console.log('Token is expiring soon, auto-refreshing...');
                const success = await refreshAuthToken();
                if (!success) {
                    console.log('Auto-refresh failed, user may need to re-login');
                }
            }
        }, REFRESH_INTERVAL);

        return () => {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, [refreshToken, expiresAt, refreshAuthToken]);

    const login = async (username: string, password: string) => {
        try {
            const { data } = await loginMutation({
                variables: { username, password },
            });

            if (data?.loginStaff?.token) {
                const {
                    token: newToken,
                    refreshToken: newRefreshToken,
                    expiresAt: newExpiresAt,
                    staff
                } = data.loginStaff;

                // Store in state
                setToken(newToken);
                setRefreshToken(newRefreshToken);
                setExpiresAt(newExpiresAt);
                setUser(staff);

                // Store in localStorage
                localStorage.setItem('auth_token', newToken);
                localStorage.setItem('refresh_token', newRefreshToken);
                localStorage.setItem('token_expires_at', newExpiresAt);
                localStorage.setItem('auth_user', JSON.stringify(staff));

                console.log('Login successful, token expires at:', newExpiresAt);
                return { success: true, message: data.loginStaff.message };
            } else {
                return { success: false, message: data?.loginStaff?.message || 'Login failed' };
            }
        } catch (error: any) {
            console.error('Login error:', error);
            return { success: false, message: error.message || 'An error occurred during login' };
        }
    };

    const logout = async () => {
        // Call backend to revoke refresh token
        const storedRefreshToken = localStorage.getItem('refresh_token');
        if (storedRefreshToken) {
            try {
                await logoutMutation({
                    variables: { refreshToken: storedRefreshToken },
                });
            } catch (error) {
                console.error('Error during logout:', error);
            }
        }

        // Clear interval
        if (refreshIntervalRef.current) {
            clearInterval(refreshIntervalRef.current);
        }

        // Clear state
        setToken(null);
        setRefreshToken(null);
        setExpiresAt(null);
        setUser(null);

        // Clear localStorage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('token_expires_at');
        localStorage.removeItem('auth_user');
    };

    const value = {
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token && !!user,
        loading,
        refreshAuthToken,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
