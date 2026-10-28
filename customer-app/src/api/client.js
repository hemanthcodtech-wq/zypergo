// API Client with automatic server detection and fallback
import { Platform } from 'react-native';

const DEFAULT_SERVER_URL = 'https://zypergo.com/api';

class ApiClient {
  constructor() {
    this.baseUrl = DEFAULT_SERVER_URL;
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  setBaseUrl(url) {
    this.baseUrl = url;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      ...(options.headers || {})
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const contentType = response.headers.get('content-type');
      let data = null;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        throw new Error(data?.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (err) {
      console.warn(`[API] ${options.method || 'GET'} ${endpoint} error:`, err.message);
      throw err;
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient();
export default api;
