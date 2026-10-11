import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// For Android emulator 10.0.2.2 points to host machine localhost, for web/iOS localhost works
const DEFAULT_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';

let API_BASE_URL = DEFAULT_URL;

export const setApiBaseUrl = (url) => {
  API_BASE_URL = url;
};

export const getApiBaseUrl = () => API_BASE_URL;

export async function request(endpoint, options = {}) {
  const token = await AsyncStorage.getItem('zypergo_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }
    return data;
  } catch (error) {
    console.warn(`API Error [${endpoint}]:`, error.message);
    throw error;
  }
}

export default {
  get: (endpoint, options) => request(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options) => request(endpoint, { method: 'POST', body: JSON.stringify(body), ...options }),
  put: (endpoint, body, options) => request(endpoint, { method: 'PUT', body: JSON.stringify(body), ...options }),
  delete: (endpoint, options) => request(endpoint, { method: 'DELETE', ...options }),
};
