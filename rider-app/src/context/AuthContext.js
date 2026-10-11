import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRider();
  }, []);

  const loadRider = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('zypergo_token');
      const storedUser = await AsyncStorage.getItem('zypergo_user');
      const storedDuty = await AsyncStorage.getItem('zypergo_rider_duty');
      
      if (storedDuty !== null) {
        setIsOnDuty(storedDuty === 'true');
      }

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        try {
          const res = await api.get('/rider/me');
          if (res?.data) {
            setUser(res.data);
            await AsyncStorage.setItem('zypergo_user', JSON.stringify(res.data));
            if (res.data.isOnline !== undefined) {
              setIsOnDuty(res.data.isOnline);
            }
          }
        } catch (e) {
          // Token offline handling
        }
      }
    } catch (err) {
      console.warn('Failed to load rider auth', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login-password', { email, password });
    if (res?.token) {
      setToken(res.token);
      setUser(res.user);
      await AsyncStorage.setItem('zypergo_token', res.token);
      await AsyncStorage.setItem('zypergo_user', JSON.stringify(res.user));
    }
    return res;
  };

  const toggleDuty = async () => {
    const nextStatus = !isOnDuty;
    setIsOnDuty(nextStatus);
    await AsyncStorage.setItem('zypergo_rider_duty', String(nextStatus));
    try {
      await api.post('/rider/shift', { isOnline: nextStatus });
    } catch (e) {
      // Offline fallback
    }
    return nextStatus;
  };

  const logout = async () => {
    await AsyncStorage.removeItem('zypergo_token');
    await AsyncStorage.removeItem('zypergo_user');
    await AsyncStorage.removeItem('zypergo_rider_duty');
    setToken(null);
    setUser(null);
    setIsOnDuty(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, isOnDuty, toggleDuty, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
