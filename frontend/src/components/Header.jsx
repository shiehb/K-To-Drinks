"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import PropTypes from "prop-types"
import { useAuth } from "../context/AuthContext"
import "../css/header.css"
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar"

// Helper function to get initials
function getInitials(firstName, lastName, userName) {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }
  return userName ? userName[0].toUpperCase() : "G"
}

export default function Header({ toggleSidebar, sidebarOpen }) {
  const navigate = useNavigate()
  const { user, logout, darkMode, toggleDarkMode, loading } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [menuHovered, setMenuHovered] = useState(false)
  const [toastId, setToastId] = useState(null)

  // Extract user data with proper field names
  const userName = user?.username || "Guest"
  const firstName = user?.firstName || "" // Matches the casing from AuthContext
  const lastName = user?.lastName || ""   // Matches the casing from AuthContext
  const displayName = firstName && lastName ? `${firstName} ${lastName}` : userName

  // Development logging with proper Vite env variable
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("Header user data:", {
        user,
        derived: { userName, firstName, lastName, displayName }
      });
    }
  }, [user, userName, firstName, lastName, displayName]);

  // Toggle the user menu
  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev)
  }

  // Auto-close menu after timeout if not hovered
  useEffect(() => {
    if (isMenuOpen && !menuHovered) {
      const timer = setTimeout(() => {
        setIsMenuOpen(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isMenuOpen, menuHovered])

  // Handle logout confirmation
  const handleLogoutClick = () => {
    if (toastId !== null) {
      toast.dismiss(toastId)
    }

    const id = toast.warn(
      <div className="logout-confirmation">
        <p>Are you sure you want to logout?</p>
        <div className="logout-buttons">
          <button
            onClick={() => {
              logout()
              navigate("/")
              toast.dismiss(id)
            }}
            className="btn-yes"
          >
            Yes
          </button>
          <button onClick={() => toast.dismiss(id)} className="btn-no">
            No
          </button>
        </div>
      </div>,
      {
        position: "top-center",
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        closeButton: false,
        onClose: () => setToastId(null),
      }
    )

    setToastId(id)
  }

  return (
    <>
      <header className={`top-header ${darkMode ? "dark" : ""}`} role="banner">
        <div className="header-left">
          {/* Sidebar Toggle */}
          <div className="header-controls">
            <button
              className="sidebar-toggle"
              onClick={toggleSidebar}
              aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              disabled={loading}
            >
              <span className="material-icons">
                {loading ? "hourglass_empty" : sidebarOpen ? "menu_open" : "menu"}
              </span>
            </button>
          </div>

          {/* Company Name */}
          <div className="company-name">
            <div className="title-top">K-TO-DRINKS</div>
            <div className="title-bottom">TRADING</div>
          </div>
        </div>

        <div className="header-right">
          {/* Dark Mode Toggle */}
          <button
            className="dark-mode-toggle"
            onClick={toggleDarkMode}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            disabled={loading}
          >
            <span className="material-icons">
              {darkMode ? "light_mode" : "dark_mode"}
            </span>
          </button>

          {/* Replace menu-icon with Avatar */}
          <div
            className={`menu-trigger ${loading ? "loading" : ""}`}
            onClick={!loading ? toggleMenu : undefined}
            role="button"
            tabIndex={!loading ? "0" : undefined}
            aria-label={isMenuOpen ? "Close Menu" : "Open Menu"}
            onKeyDown={(e) => !loading && e.key === "Enter" && toggleMenu()}
          >
            {loading ? (
              <span className="material-icons">hourglass_empty</span>
            ) : (
              <Avatar>
                <AvatarImage src={user?.avatarUrl} alt={displayName} />
                <AvatarFallback>
                  {getInitials(firstName, lastName, userName)}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </div>
      </header>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <div
          className={`menu-dropdown ${darkMode ? "dark" : ""}`}
          onMouseEnter={() => setMenuHovered(true)}
          onMouseLeave={() => setMenuHovered(false)}
          role="menu"
        >
          <ul>
            <li role="menuitem" className="user-profile">
              <Avatar className="size-10">
                <AvatarImage src={user?.avatarUrl} alt={displayName} />
                <AvatarFallback>
                  {getInitials(firstName, lastName, userName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="user-full-name">
                  {firstName && lastName ? `${firstName} ${lastName}` : "Guest User"}
                </div>
                <div className="user-username">@{userName}</div>
              </div>
            </li>

            <li role="menuitem" className="menu-item">
              <span className="material-icons nav-icon">notifications</span>
              Notifications
            </li>

            <li role="menuitem" className="menu-item">
              <span className="material-icons nav-icon">assessment</span>
              Reports
            </li>

            <li role="menuitem" className="menu-item" onClick={toggleDarkMode}>
              <span className="material-icons nav-icon">
                {darkMode ? "light_mode" : "dark_mode"}
              </span>
              {darkMode ? "Light Mode" : "Dark Mode"}
            </li>

            <li role="menuitem" className="menu-item logout-item" onClick={handleLogoutClick}>
              <span className="material-icons nav-icon">logout</span>
              Log out
            </li>
          </ul>
        </div>
      )}
    </>
  )
}

// PropTypes validation
Header.propTypes = {
  toggleSidebar: PropTypes.func.isRequired,
  sidebarOpen: PropTypes.bool.isRequired,
  toggleSidebarVisibility: PropTypes.func,
  sidebarHidden: PropTypes.bool,
}

// Default props
Header.defaultProps = {
  toggleSidebarVisibility: () => {},
  sidebarHidden: false,
}