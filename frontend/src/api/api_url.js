import axios from "axios"

export const API_URL = "http://127.0.0.1:8000/api"

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor for JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If 401 error and not a retry attempt
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem("refresh_token")
        if (!refreshToken) throw new Error("No refresh token")

        const response = await axios.post(`${API_URL}/token/refresh/`, {
          refresh: refreshToken,
        })

        localStorage.setItem("access_token", response.data.access)
        api.defaults.headers.common["Authorization"] = `Bearer ${response.data.access}`

        // Retry original request with new token
        return api(originalRequest)
      } catch (refreshError) {
        // If refresh fails, clear storage and redirect to login
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
        window.location.href = "/"
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)

export default api

