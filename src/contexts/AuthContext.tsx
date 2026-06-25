import React, { createContext, useContext, useEffect, useState } from 'react';
import { login as apiLogin } from '../services/api';
import {
  clearAuthToken,
  getAuthToken,
  saveAuthToken,
} from '../services/storage';

interface AuthContextValue {
  token: string | null;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  onDeviceUnregistered: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  token: null,
  isLoggedIn: false,
  login: async () => ({ success: false, error: 'Not initialized' }),
  logout: async () => {},
  onDeviceUnregistered: () => {},
});

interface Props {
  children: React.ReactNode;
  onDeviceUnregistered: () => void;
}

export function AuthProvider({ children, onDeviceUnregistered }: Props) {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    getAuthToken().then(saved => {
      if (saved) setToken(saved);
    });
  }, []);

  const login = async (email: string, password: string) => {
    const result = await apiLogin(email, password);
    if (result.success) {
      await saveAuthToken(result.accessToken);
      setToken(result.accessToken);
      return { success: true as const };
    }
    return { success: false as const, error: result.error };
  };

  const logout = async () => {
    await clearAuthToken();
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{ token, isLoggedIn: !!token, login, logout, onDeviceUnregistered }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
