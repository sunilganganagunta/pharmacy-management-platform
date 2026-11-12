import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axiosInstance';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('medicore_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('medicore_token');
    if (token) {
      api.get('/auth/me')
        .then((res) => {
          if (res?.data) {
            setUser(res.data);
            localStorage.setItem('medicore_user', JSON.stringify(res.data));
          }
        })
        .catch(() => {
          localStorage.removeItem('medicore_token');
          localStorage.removeItem('medicore_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    if (res?.success && res.data) {
      localStorage.setItem('medicore_token', res.data.token);
      localStorage.setItem('medicore_user', JSON.stringify(res.data));
      setUser(res.data);
      return res.data;
    }
    throw new Error(res?.message || 'Login failed');
  };

  const logout = () => {
    localStorage.removeItem('medicore_token');
    localStorage.removeItem('medicore_user');
    setUser(null);
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    if (res?.success && res.data) {
      localStorage.setItem('medicore_token', res.data.token);
      localStorage.setItem('medicore_user', JSON.stringify(res.data));
      setUser(res.data);
      return res.data;
    }
    throw new Error(res?.message || 'Registration failed');
  };

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isPharmacist: user?.role === 'PHARMACIST' || user?.role === 'ADMIN',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

