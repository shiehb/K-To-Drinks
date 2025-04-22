// api_url.js
import axios from 'axios';
import { toast } from 'react-toastify';

// API Base URL
const BASE_URL = 'http://localhost:8000/api';

// Define endpoints
export const ENDPOINTS = {
  USERS: '/users',
  STORES: '/stores',
  PRODUCTS: '/products/products/', // Make sure this matches your Django URL pattern
  CATEGORIES: '/products/categories/',
  SUPPLIERS: '/products/suppliers/',
  INVENTORY: '/inventory',
  ORDERS: '/orders',
  DELIVERIES: '/deliveries'
};

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for handling auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      toast.error("Session expired. Please login again.");
      // Redirect to login or refresh token
    }
    return Promise.reject(error);
  }
);

export default api;