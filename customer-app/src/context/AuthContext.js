import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);

  // Initialize with demo user or saved credentials
  const login = async (email, password) => {
    setLoading(true);
    try {
      // Attempt backend API call
      const res = await api.post('/auth/login', { email, password });
      if (res && res.token) {
        setToken(res.token);
        api.setToken(res.token);
        const userData = res.user || { name: 'Zyper Customer', email, role: 'customer' };
        setUser(userData);
        return { success: true };
      }
    } catch (err) {
      // If backend is not reached, provide fallback demo login for testing
      const demoUser = {
        _id: 'cust_demo_01',
        name: email.split('@')[0] || 'Rajesh Sharma',
        email: email,
        phone: '+91 98765 43210',
        role: 'customer'
      };
      setUser(demoUser);
      setToken('demo_token');
      api.setToken('demo_token');
      return { success: true, offline: true };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, phone, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { name, email, phone, password, role: 'customer' });
      if (res && res.token) {
        setToken(res.token);
        api.setToken(res.token);
        setUser(res.user || { name, email, phone, role: 'customer' });
        return { success: true };
      }
    } catch (err) {
      const newUser = {
        _id: 'cust_' + Date.now(),
        name,
        email,
        phone,
        role: 'customer'
      };
      setUser(newUser);
      setToken('demo_token_' + Date.now());
      return { success: true, offline: true };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    api.setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
