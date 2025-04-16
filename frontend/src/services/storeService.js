import axios from 'axios';
import { getAuthToken, refreshToken } from '@/utils/auth';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_URL,
});

// Add request interceptor
api.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Add response interceptor for token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            const newToken = await refreshToken();
            if (newToken) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            }
            
            // Redirect to login if refresh fails
            window.location.href = '/login';
            return Promise.reject(error);
        }
        
        return Promise.reject(error);
    }
);

const storeService = {
    getAllStores: async () => {
        try {
            const response = await api.get('/stores/');
            // Ensure we're returning the data in a consistent format
            return {
                data: Array.isArray(response.data) ? response.data : [],
                status: response.status,
            };
        } catch (error) {
            console.error('API Error:', error);
            return {
                data: [],
                status: error.response?.status || 500,
            };
        }
    },

    getActiveStores: async () => {
        const response = await api.get('/stores/active/');
        return response.data;
    },

    createStore: async (storeData) => {
        const response = await api.post('/stores/', storeData);
        return response.data;
    },

    updateStore: async (id, storeData) => {
        const response = await api.patch(`/stores/${id}/`, storeData);
        return response.data;
    },

    deleteStore: async (id) => {
        await api.delete(`/stores/${id}/`);
    },

    archiveStore: async (id) => {
        const response = await api.patch(`/stores/${id}/`, {
            is_archived: true,
            status: 'Inactive'
        });
        return response.data;
    },

    restoreStore: async (id) => {
        const response = await api.patch(`/stores/${id}/`, {
            is_archived: false,
            status: 'Active'
        });
        return response.data;
    }
};

export default storeService;