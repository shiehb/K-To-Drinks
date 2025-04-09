"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import { useAuth } from "../context/AuthContext"
import "../css/login.css"
import Loader from "./styled-components/Loader"

export default function Login() {
  const [error, setError] = useState("")
  const [credentials, setCredentials] = useState({ username: "", password: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const { login, user, darkMode, toggleDarkMode } = useAuth()
  const navigate = useNavigate()

  // Check if user is already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard")
    }

    // Check for saved username
    const savedUsername = localStorage.getItem("rememberedUsername")
    if (savedUsername) {
      setCredentials((prev) => ({ ...prev, username: savedUsername }))
      setRememberMe(true)
    }
  }, [user, navigate])

  // Handle input changes
  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value })
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    // Validate inputs
    if (!credentials.username.trim() || !credentials.password.trim()) {
      setError("Username and password are required")
      setLoading(false)
      return
    }

    // Set a timeout to hide the loader after 15 seconds
    const loaderTimeout = setTimeout(() => {
      setLoading(false)
      setError("Login process is taking longer than expected. Please try again.")
    }, 15000)

    try {
      // Handle remember me
      if (rememberMe) {
        localStorage.setItem("rememberedUsername", credentials.username)
      } else {
        localStorage.removeItem("rememberedUsername")
      }

      console.log("Attempting login with:", credentials.username)
      const success = await login(credentials)

      if (success) {
        console.log("Login successful, redirecting to dashboard")
        // Redirect to dashboard on success
        setTimeout(() => {
          navigate("/dashboard", { replace: true })
        }, 100)
      } else {
        // Show error message on failure
        setError("Invalid username or password")
        // Only clear password field
        setCredentials((prev) => ({ ...prev, password: "" }))
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("An error occurred during login. Please try again.")
    } finally {
      clearTimeout(loaderTimeout)
      setLoading(false)
    }
  }

  // Toggle password visibility
  const toggleShowPassword = () => {
    setShowPassword(!showPassword)
  }

  return (
    <>
      {/* Full-screen loader */}
      {loading && (
        <div className="loader-overlay">
          <Loader />
        </div>
      )}

      {/* Login Container */}
      <div className="login-wrapper">
        {/* Dark mode toggle */}
        <button
          className="theme-toggle-btn"
          onClick={toggleDarkMode}
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          <i className={`fas fa-${darkMode ? "sun" : "moon"}`}></i>
        </button>

        {/* Error message */}
        {error && <div className="error-message">{error}</div>}

        <div className="login-container">
          {/* Left Section */}
          <div className="login-left">
            <div className="login-image">
              <div className="overlay"></div>
              <div className="login-title">
                <div className="login-title-top">K-TO-DRINKS</div>
                <div className="login-title-bottom">TRADING</div>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="login-right">
            {/* Login Form */}
            <form className="login-form" onSubmit={handleSubmit}>
              {/* Welcome Message */}
              <h1>Welcome Back</h1>
              <p>Login to your account to continue</p>

              {/* Username field */}
              <div className="input-group">
                <label htmlFor="username" className="labels">
                  Username
                </label>
                <div className="input-with-icon">
                  <i className="fas fa-user input-icon"></i>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={credentials.username}
                    onChange={handleChange}
                    className="inputs"
                    placeholder="Enter your username"
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="input-group">
                <label htmlFor="password" className="labels">
                  Password
                </label>
                <div className="input-with-icon">
                  <i className="fas fa-lock input-icon"></i>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={credentials.password}
                    onChange={handleChange}
                    className="inputs"
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                  />
                  <span
                    className="password-toggle-icon"
                    onClick={toggleShowPassword}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    role="button"
                    tabIndex="0"
                    onKeyDown={(e) => e.key === "Enter" && toggleShowPassword()}
                  >
                    {showPassword ? <i className="fas fa-eye-slash"></i> : <i className="fas fa-eye"></i>}
                  </span>
                </div>
              </div>

              {/* Remember me checkbox */}
              <div className="remember-me">
                <label className="checkbox-container">
                  <input type="checkbox" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />
                  <span className="checkmark"></span>
                  Remember me
                </label>
              </div>

              {/* Login button */}
              <button type="submit" className="button" disabled={loading}>
                {loading ? "LOGGING IN..." : "LOGIN"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

