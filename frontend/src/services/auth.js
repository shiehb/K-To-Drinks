import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const login = async (username, password) => {
  try {
    const response = await axios.post(`${API_URL}/api/token/`, {
      username,
      password
    });
    
    if (response.data.access) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
    }
    
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const refreshToken = async () => {
  try {
    const refresh = localStorage.getItem('refresh_token');
    const response = await axios.post(`${API_URL}/api/token/refresh/`, {
      refresh
    });
    
    localStorage.setItem('access_token', response.data.access);
    return response.data.access;
  } catch (error) {
    logout();
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

export const getCurrentUser = () => {
  const token = localStorage.getItem('access_token');
  if (!token) return null;
  
  // You can decode the token to get user info if needed
  // Note: This doesn't verify the token, just decodes it
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  
  return JSON.parse(jsonPayload);
};