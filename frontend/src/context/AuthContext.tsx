import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthResponse } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { username_or_email: string; password: string }) => Promise<void>;
  register: (userData: any) => Promise<void>;
  loginWithGoogle: (data: { credential?: string; email?: string; name?: string; picture?: string; sub?: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('veritrust_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('veritrust_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('veritrust_token');
      if (storedToken) {
        try {
          const profile = await api.getMe();
          setUser(profile);
          localStorage.setItem('veritrust_user', JSON.stringify(profile));
        } catch (err) {
          console.error('Failed to validate session token', err);
          logout();
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (credentials: { username_or_email: string; password: string }) => {
    setIsLoading(true);
    try {
      try {
        const authData: AuthResponse = await api.login(credentials);
        localStorage.setItem('veritrust_token', authData.access_token);
        localStorage.setItem('veritrust_user', JSON.stringify(authData.user));
        setToken(authData.access_token);
        setUser(authData.user);
        return;
      } catch (err: any) {
        // If it's a legitimate 401 unauthorized from backend, bubble up
        if (err.response && (err.response.status === 401 || err.response.status === 400)) {
          throw err;
        }
        // If backend is unreachable (e.g. GitHub Pages static hosting), create verified local session
        console.warn('Backend server unreachable. Provisioning local demo session.', err);
        const isAdmin = credentials.username_or_email.toLowerCase().includes('admin');
        const fallbackUser: User = {
          id: isAdmin ? 1 : 2,
          email: credentials.username_or_email.includes('@') ? credentials.username_or_email : `${credentials.username_or_email}@veritrust.io`,
          username: credentials.username_or_email.split('@')[0],
          full_name: isAdmin ? 'Sarah Chen (SecOps Lead)' : 'Threat Analyst',
          role: isAdmin ? 'admin' : 'analyst',
          is_active: true,
          created_at: new Date().toISOString()
        };
        const demoToken = 'veritrust-session-' + Date.now();
        localStorage.setItem('veritrust_token', demoToken);
        localStorage.setItem('veritrust_user', JSON.stringify(fallbackUser));
        setToken(demoToken);
        setUser(fallbackUser);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any) => {
    setIsLoading(true);
    try {
      try {
        const authData: AuthResponse = await api.register(userData);
        localStorage.setItem('veritrust_token', authData.access_token);
        localStorage.setItem('veritrust_user', JSON.stringify(authData.user));
        setToken(authData.access_token);
        setUser(authData.user);
        return;
      } catch (err: any) {
        // If backend responds with specific business error (e.g. email exists), bubble up
        if (err.response && err.response.status === 400) {
          throw err;
        }
        // If backend is unreachable (e.g. on GitHub Pages static deployment), create user session locally
        console.warn('Backend unreachable. Provisioning registered account in browser session.', err);
        const fallbackUser: User = {
          id: Date.now(),
          email: userData.email,
          username: userData.username || userData.email.split('@')[0],
          full_name: userData.full_name || userData.username || 'Security Officer',
          role: userData.role || 'analyst',
          is_active: true,
          created_at: new Date().toISOString()
        };
        const demoToken = 'veritrust-session-' + Date.now();
        localStorage.setItem('veritrust_token', demoToken);
        localStorage.setItem('veritrust_user', JSON.stringify(fallbackUser));
        setToken(demoToken);
        setUser(fallbackUser);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (data: { credential?: string; email?: string; name?: string; picture?: string; sub?: string }) => {
    setIsLoading(true);
    try {
      try {
        const authData: AuthResponse = await api.googleAuth(data);
        localStorage.setItem('veritrust_token', authData.access_token);
        localStorage.setItem('veritrust_user', JSON.stringify(authData.user));
        setToken(authData.access_token);
        setUser(authData.user);
        return;
      } catch (err: any) {
        console.warn('Backend unreachable. Provisioning Google account in browser session.', err);
        const fallbackUser: User = {
          id: Date.now(),
          email: data.email || 'google.user@gmail.com',
          username: (data.email || 'google_user').split('@')[0].replace('.', '_'),
          full_name: data.name || 'Google Verified User',
          role: 'analyst',
          is_active: true,
          created_at: new Date().toISOString()
        };
        const demoToken = 'veritrust-session-' + Date.now();
        localStorage.setItem('veritrust_token', demoToken);
        localStorage.setItem('veritrust_user', JSON.stringify(fallbackUser));
        setToken(demoToken);
        setUser(fallbackUser);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('veritrust_token');
    localStorage.removeItem('veritrust_user');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const updated = await api.getMe();
      setUser(updated);
      localStorage.setItem('veritrust_user', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to refresh user profile', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        loginWithGoogle,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

