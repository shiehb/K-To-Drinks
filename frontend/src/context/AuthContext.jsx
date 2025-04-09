import { useState, createContext, useContext, useEffect, useCallback } from "react";
import api from "../api/api_url";
import { toast } from "react-toastify";

export const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
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

  // Stable JWT parser
  const parseJwt = useCallback((token) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error("JWT parsing error:", e);
      return null;
    }
  }, []);

  // Stable auth check with dependency optimization
  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return false;

      const userData = parseJwt(token);
      if (!userData) return false;

      const newUser = {
        username: userData.username || `user_${userData.user_id}`,
        firstName: userData.first_name || "",
        lastName: userData.last_name || "",
      };

      // Only update if user data has changed
      if (JSON.stringify(newUser) !== JSON.stringify(user)) {
        setUser(newUser);
        localStorage.setItem("user", JSON.stringify(newUser));
      }

      return true;
    } catch (error) {
      console.error("Auth check error:", error);
      return false;
    }
  }, [user, parseJwt]);

  // Initialize auth state once on mount
  useEffect(() => {
    const initializeAuth = async () => {
      await checkAuth();
    };
    initializeAuth();
  }, [checkAuth]);

  const clearAuthData = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
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
        localStorage.setItem("access_token", response.data.access);
        localStorage.setItem("refresh_token", response.data.refresh);

        const userData = parseJwt(response.data.access);
        const newUser = {
          username: userData.username || credentials.username,
          firstName: userData.first_name || "",
          lastName: userData.last_name || "",
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
        "Login failed";
      setError(errorMsg);
      toast.error(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    clearAuthData();
    toast.info("Logged out successfully");
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
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;