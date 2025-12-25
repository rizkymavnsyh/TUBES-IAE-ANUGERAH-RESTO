'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useMutation, gql } from '@apollo/client';
import { userApolloClient } from '@/lib/apollo-client';

const LOGIN_STAFF = gql`
  mutation LoginStaff($username: String!, $password: String!) {
    loginStaff(username: $username, password: $password) {
      token
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<Staff | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [loginMutation] = useMutation(LOGIN_STAFF, { client: userApolloClient });

    // Check for existing session on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('auth_user');

        if (storedToken && storedUser) {
            try {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            } catch (error) {
                console.error('Error parsing stored user:', error);
                localStorage.removeItem('auth_token');
                localStorage.removeItem('auth_user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (username: string, password: string) => {
        try {
            const { data } = await loginMutation({
                variables: { username, password },
            });

            if (data?.loginStaff?.token) {
                const { token: newToken, staff } = data.loginStaff;

                // Store in state
                setToken(newToken);
                setUser(staff);

                // Store in localStorage
                localStorage.setItem('auth_token', newToken);
                localStorage.setItem('auth_user', JSON.stringify(staff));

                return { success: true, message: data.loginStaff.message };
            } else {
                return { success: false, message: data?.loginStaff?.message || 'Login failed' };
            }
        } catch (error: any) {
            console.error('Login error:', error);
            return { success: false, message: error.message || 'An error occurred during login' };
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
    };

    const value = {
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token && !!user,
        loading,
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
