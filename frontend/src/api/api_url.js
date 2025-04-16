import axios from 'axios'

const BASE_URL = 'http://localhost:8000/api'

// Define API endpoints
export const ENDPOINTS = {
  STORES: '/stores',
  AUTH: '/auth',
  USERS: '/users'
}

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  
  // Log request details for debugging
  console.log('API Request:', {
    url: config.url,
    method: config.method,
    params: config.params,
    headers: config.headers
  })
  
  return config
})

api.interceptors.response.use(
  (response) => {
    // Log successful response
    console.log('API Response:', response.data)
    return response
  },
  (error) => {
    // Log error details
    console.error('API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    })
    
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

