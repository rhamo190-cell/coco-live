import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGetMe } from '@workspace/api-client-react';
import type { User } from '@workspace/api-client-react';

interface AuthContextValue {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const { data: currentUser, isLoading: userLoading } = useGetMe({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: { enabled: !!token && isInitialized, retry: false } as any,
  });

  useEffect(() => {
    AsyncStorage.getItem('token').then((storedToken) => {
      setTokenState(storedToken);
      setIsInitialized(true);
    });
  }, []);

  useEffect(() => {
    if (currentUser && token) {
      setUser(currentUser);
    }
  }, [currentUser, token]);

  const setToken = async (newToken: string | null) => {
    setTokenState(newToken);
    if (newToken) {
      await AsyncStorage.setItem('token', newToken);
    } else {
      await AsyncStorage.removeItem('token');
    }
  };

  const logout = async () => {
    setTokenState(null);
    setUser(null);
    await AsyncStorage.removeItem('token');
  };

  const value = useMemo(() => ({
    token,
    user,
    isLoading: !isInitialized || (!!token && userLoading),
    setToken,
    setUser,
    logout,
  }), [token, user, isInitialized, userLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
