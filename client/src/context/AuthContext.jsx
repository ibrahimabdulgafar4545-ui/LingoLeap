import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { initiateSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem('lingoleap_user');
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(() => {
    const hasToken = !!localStorage.getItem('token');
    const hasCachedUser = !!localStorage.getItem('lingoleap_user');
    return hasToken && !hasCachedUser;
  });
  const [error, setError] = useState(null);

  const [socket, setSocket] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  // Manage socket connection based on auth state
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (user && token) {
      const s = initiateSocket(token);
      setSocket(s);

      const handleConnect = () => setSocketConnected(true);
      const handleDisconnect = () => setSocketConnected(false);

      s.on('connect', handleConnect);
      s.on('disconnect', handleDisconnect);

      if (s.connected) {
        setSocketConnected(true);
      }

      return () => {
        s.off('connect', handleConnect);
        s.off('disconnect', handleDisconnect);
      };
    } else {
      disconnectSocket();
      setSocket(null);
      setSocketConnected(false);
    }
  }, [user]);

  // Check auth status on mount - background refresh, no blocking spinner if cached
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        if (response.data.success) {
          setUser(response.data.user);
          localStorage.setItem('lingoleap_user', JSON.stringify(response.data.user));
        }
      } catch (err) {
        console.error('Failed to fetch authenticated user:', err);
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          localStorage.removeItem('token');
          localStorage.removeItem('lingoleap_user');
          setUser(null);
        }
        // If network error, cached user is already loaded from initialization
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Register action
  const signup = async (username, email, password, targetLanguage) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/register', {
        username,
        email,
        password,
        targetLanguage
      });

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
        localStorage.setItem('lingoleap_user', JSON.stringify(response.data.user));
        return { success: true };
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed';
      setError(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  };

  // Login action
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
        localStorage.setItem('lingoleap_user', JSON.stringify(response.data.user));
        return { success: true };
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed';
      setError(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  };

  // Update learner profile / target language
  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/auth/update', profileData);
      if (response.data.success) {
        setUser(response.data.user);
        localStorage.setItem('lingoleap_user', JSON.stringify(response.data.user));
        return { success: true };
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Profile update failed';
      return { success: false, error: errMsg };
    }
  };

  // Logout action
  const logout = async () => {
    try {
      await api.get('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('lingoleap_user');
      setUser(null);
    }
  };

  // Refresh user data from API
  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        setUser(response.data.user);
        localStorage.setItem('lingoleap_user', JSON.stringify(response.data.user));
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        socket,
        socketConnected,
        loading,
        error,
        signup,
        login,
        updateProfile,
        logout,
        refreshUser,
        setError,
        setUser
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
