// api_url.js
import axios from 'axios';
import { toast } from 'react-toastify';

// Ensure all endpoints have consistent trailing slashes
export const ENDPOINTS = {
  USERS: '/users/',
  STORES: '/stores/',
  PRODUCTS: '/products/',
  INVENTORY: '/inventory/',
  ORDERS: '/orders/',
  DELIVERIES: '/deliveries/'
};

// Helper function to ensure trailing slash
const ensureTrailingSlash = (url) => {
  return url.endsWith('/') ? url : `${url}/`;
};

// Create axios instance
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

// Request interceptor to handle trailing slashes and auth
api.interceptors.request.use(
  (config) => {
    // Ensure URL has trailing slash for POST/PUT/PATCH requests
    if (['post', 'put', 'patch'].includes(config.method?.toLowerCase())) {
      config.url = ensureTrailingSlash(config.url);
    }

    // Add auth token if available
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle trailing slash errors specifically
    if (error.response?.status === 404 && 
        ['post', 'put', 'patch'].includes(error.config.method?.toLowerCase()) &&
        !error.config.url.endsWith('/')) {
      toast.error("API request failed - endpoint requires trailing slash");
    }
    // Handle unauthorized errors
    else if (error.response?.status === 401) {
      toast.error("Session expired. Please login again.");
      // Optional: Redirect to login or refresh token
    }
    // Handle other errors
    else if (error.response?.data?.detail) {
      toast.error(error.response.data.detail);
    } else if (error.message) {
      toast.error(error.message);
    }

    return Promise.reject(error);
  }
);

export default api;
