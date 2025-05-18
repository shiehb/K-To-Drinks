import { useState, createContext, useContext, useEffect, useCallback } from "react";
import api from "../api/api_url";
import { toast } from "react-toastify";
import PropTypes from "prop-types";

export const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("Error parsing stored user:", error);
      return null;
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  // Apply dark mode
  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  const parseJwt = useCallback((token) => {
    try {
      if (!token) return null;
      
      const base64Url = token.split(".")[1];
      if (!base64Url) return null;
      
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      
      const decoded = JSON.parse(jsonPayload);
      
      return {
        id: decoded.user_id || null,
        username: decoded.username || "",
        first_name: decoded.first_name || "",
        last_name: decoded.last_name || "",
        role: decoded.role || "employee",
        exp: decoded.exp, // Add expiration time
        ...decoded
      };
    } catch (e) {
      console.error("JWT parsing error:", e);
      return null;
    }
  }, []);

  const initializeAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      const userData = parseJwt(token);
      if (!userData) {
        console.warn("No valid user data in token");
        return;
      }

      // Check token expiration
      const now = Math.floor(Date.now() / 1000);
      if (userData.exp && userData.exp < now) {
        console.warn("Token expired");
        clearAuthData();
        return;
      }

      const newUser = {
        id: userData.id,
        username: userData.username,
        firstName: userData.first_name,
        lastName: userData.last_name,
        role: userData.role
      };

      setUser(newUser);
      localStorage.setItem("user", JSON.stringify(newUser));
    } catch (error) {
      console.error("Auth initialization error:", error);
      clearAuthData();
    }
  }, [parseJwt]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const clearAuthData = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const login = async (credentials) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post("/token/", {
        username: credentials.username.trim(),
        password: credentials.password.trim(),
      });

      if (response.data?.access) {
        const userData = response.data.user;

        // Only allow admin role to login
        if (userData.role !== "admin") {
          setError("Only admin users can log in.");
          toast.error("Only admin users can log in.");
          setLoading(false);
          return false;
        }

        localStorage.setItem("access_token", response.data.access);
        localStorage.setItem("refresh_token", response.data.refresh);

        const newUser = {
          id: userData.id,
          username: userData.username,
          firstName: userData.first_name,
          lastName: userData.last_name,
          email: userData.email,
          role: userData.role,
          status: userData.status,
          avatarUrl: userData.profile?.avatar || null
        };

        setUser(newUser);
        localStorage.setItem("user", JSON.stringify(newUser));
        toast.success("Login successful");
        return true;
      }
      throw new Error("No access token in response");
    } catch (error) {
      console.error("Login error:", error.response?.data || error);
      const errorMsg =
        error.response?.data?.detail ||
        error.message ||
        "Login failed. Please check your credentials.";
      setError(errorMsg);
      toast.error(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearAuthData();
    toast.info("Logged out successfully");
    window.location.href = '/login';
  };

  const checkAuth = useCallback(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return false;
    
    const userData = parseJwt(token);
    if (!userData) return false;
    
    // Check token expiration with 5 second buffer
    const now = Math.floor(Date.now() / 1000) + 5;
    if (userData.exp && userData.exp < now) {
      clearAuthData(); // Clear auth data if token is expired or about to expire
      return false;
    }
    
    return true;
  }, [parseJwt]);

  const updateAvatar = async (file) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.put(`/users/profile/avatar/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.avatar_url) {
        const updatedUser = {
          ...user,
          avatarUrl: response.data.avatar_url
        };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating avatar:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      login,
      logout,
      checkAuth,
      darkMode,
      toggleDarkMode,
      updateAvatar,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthProvider;