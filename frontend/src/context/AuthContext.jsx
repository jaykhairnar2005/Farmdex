import React, { createContext, useState, useEffect, useCallback } from 'react';
import { tokenStorage } from '../utils/tokenStorage';
import { loginApi, registerApi, getMeApi } from '../services/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(tokenStorage.getToken());
  const [loading, setLoading] = useState(true);

  // Restore authenticated session on app initialization
  const loadUser = useCallback(async () => {
    const currentToken = tokenStorage.getToken();
    if (!currentToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await getMeApi();
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        setTokenState(currentToken);
      } else {
        tokenStorage.removeToken();
        setUser(null);
        setTokenState(null);
      }
    } catch {
      tokenStorage.removeToken();
      setUser(null);
      setTokenState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password) => {
    const res = await loginApi(email, password);
    if (res.success && res.data?.token) {
      tokenStorage.setToken(res.data.token);
      setTokenState(res.data.token);
      setUser(res.data.user);
      return res.data;
    } else {
      throw new Error(res.message || 'Login failed');
    }
  };

  const register = async (registerData) => {
    const res = await registerApi(registerData);
    if (res.success && res.data?.token) {
      tokenStorage.setToken(res.data.token);
      setTokenState(res.data.token);
      setUser(res.data.user);
      return res.data;
    } else {
      throw new Error(res.message || 'Registration failed');
    }
  };

  const logout = () => {
    tokenStorage.removeToken();
    setTokenState(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    loading,
    login,
    register,
    logout,
    refreshUser: loadUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
