"use client"

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { useState, useEffect } from "react"

import { useAuth } from "./context/AuthContext"
import Layout from "./components/Layout"
import LoginPage from "./pages/LoginPage"
import LocalStorePage from "./pages/LocalStorePage"
import InventoryPage from "./pages/InventoryPage"
import ProductPage from "./pages/ProductsPage"
import OrderPage from "./pages/OrderPage"
import DeliveryPage from "./pages/DeliveryPage"
import DashboardPage from "./pages/DashboardPage"
import UserPage from "./pages/UserPage"

import { toast } from "react-toastify"

import api from "./api/api_url"
import "./index.css"
import "./css/pages.css"
import PropTypes from "prop-types"

// Global toast configuration
const toastConfig = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  style: {
    backgroundColor: "#fffbfc",
    color: "#333333",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
  },
}

// Enhanced PrivateRoute with token verification
const PrivateRoute = ({ element }) => {
  const { user, checkAuth } = useAuth()
  const [isAuthenticating, setIsAuthenticating] = useState(true)

  useEffect(() => {
    let isMounted = true

    const verifyToken = async () => {
      try {
        const isAuthenticated = await checkAuth()
        console.log("Authentication check result:", isAuthenticated)
        if (isMounted) {
          setIsAuthenticating(false)
        }
      } catch (error) {
        console.error("Auth verification error:", error)
        if (isMounted) {
          setIsAuthenticating(false)
        }
      }
    }

    verifyToken()

    return () => {
      isMounted = false
    }
  }, [checkAuth])

  if (isAuthenticating) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  return user ? element : <Navigate to="/" replace />
}
PrivateRoute.propTypes = {
  element: PropTypes.element.isRequired,
}

function App() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const [darkMode] = useState(false)

  // Enhanced fetch with token refresh handling
  useEffect(() => {
    let isMounted = true

    const fetchUsers = async () => {
      if (!user) {
        if (isMounted) {
          setLoading(false)
        }
        return
      }

      try {
        if (isMounted) {
          setLoading(true)
        }
        const response = await api.get("/users/")
        if (isMounted) {
          setUsers(response.data)
          console.log("Users fetched successfully:", response.data.length)
        }
      } catch (error) {
        console.error("Failed to fetch users:", error)
        if (isMounted) {
          const errorMessage = error.response?.data?.message || error.message || "Failed to fetch users"
          toast.error(errorMessage, toastConfig)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    if (user) {
      fetchUsers()
    }

    return () => {
      isMounted = false
    }
  }, [user])

  return (
    <Router>
      <ToastContainer
        {...toastConfig}
        theme={darkMode ? "dark" : "light"} // Dynamically set the theme
      />

      <Routes>
        {/* Public Route */}
        <Route path="/" element={<LoginPage />} />

        {/* Protected Routes */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<PrivateRoute element={<DashboardPage />} />} />
          <Route path="/localstore" element={<PrivateRoute element={<LocalStorePage />} />} />
          <Route path="/inventory" element={<PrivateRoute element={<InventoryPage />} />} />
          <Route path="/products" element={<PrivateRoute element={<ProductPage />} />} />
          <Route path="/order" element={<PrivateRoute element={<OrderPage />} />} />
          <Route path="/delivery" element={<PrivateRoute element={<DeliveryPage />} />} />
          <Route
            path="/user"
            element={<PrivateRoute element={<UserPage users={users} loading={loading} setUsers={setUsers} />} />}
          />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}

export default App

