"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import PropTypes from "prop-types"
import { useAuth } from "../context/AuthContext"
import "../css/header.css"
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar"
import { Menu, Bell, Moon, LogOut } from "lucide-react"

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

  // Extract user data
  const userName = user?.username || "Guest"
  const firstName = user?.firstName || ""
  const lastName = user?.lastName || ""
  const displayName = firstName && lastName ? `${firstName} ${lastName}` : userName

  // Development logging
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("Header user data:", {
        user,
        derived: { userName, firstName, lastName, displayName },
      })
    }
  }, [user, userName, firstName, lastName, displayName])

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
      },
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
              className={`sidebar-toggle ${loading ? "loading" : ""}`}
              onClick={toggleSidebar}
              aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              disabled={loading}
            >
              <Menu className="icon" />
            </button>
          </div>

          {/* Company Logo */}
          <div className="company-logo">
            <div className="company-name">
              <div className="title-top">K-TO-DRINKS</div>
              <div className="title-bottom">TRADING</div>
            </div>
          </div>
        </div>

        <div className="header-right">
          <div className="header-right">
            {/* Notification Bell */}
            <div className="notification-container">
              <button
                className="notification-bell"
                aria-label="Notifications"
                onClick={() => {
                  toast.info("Notifications feature coming soon!")
                }}
              >
                <Bell className={`icon ${user?.notifications?.unread > 0 ? "pulse-animation" : ""}`} size={20} />
                <span className={`notification-badge ${user?.notifications?.unread > 0 ? "pulse-badge" : ""}`}>
                  {user?.notifications?.unread || 3}
                </span>
              </button>
            </div>

            {/* User Menu */}
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
                <>
                  <Avatar className="avatar-circle">
                    <AvatarImage src={user?.avatarUrl || "/placeholder.svg"} alt={displayName} />
                    <AvatarFallback
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%",
                        height: "100%",
                        lineHeight: "1",
                      }}
                    >
                      {getInitials(firstName, lastName, userName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="user-username">@{userName}</div>
                  <svg
                    className={`dropdown-arrow ${isMenuOpen ? "open" : ""}`}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </>
              )}
            </div>
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
              <Avatar className="avatar-circle size-10">
                <AvatarImage src={user?.avatarUrl || "/placeholder.svg"} alt={displayName} />
                <AvatarFallback
                 style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  height: "100%",
                  lineHeight: "1",
                }}
                >
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
              <Bell className="nav-icon" size={18} />
              Notifications
            </li>

            <li role="menuitem" className="menu-item theme-toggle-item">
              <div className="theme-toggle-container">
                <Moon className="nav-icon" size={18} /> {/* Added icon for consistency */}
                <span className="theme-label">Dark Mode</span>
              </div>
              <label className="switch">
                <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} aria-label="Toggle dark mode" />
                <span className="slider round"></span>
              </label>
            </li>

            <li role="menuitem" className="menu-item logout-item" onClick={handleLogoutClick}>
              <LogOut className="nav-icon" size={18} />
              Log out
            </li>
          </ul>
        </div>
      )}
    </>
  )
}

Header.propTypes = {
  toggleSidebar: PropTypes.func.isRequired,
  sidebarOpen: PropTypes.bool.isRequired,
  toggleSidebarVisibility: PropTypes.func,
  sidebarHidden: PropTypes.bool,
}

Header.defaultProps = {
  toggleSidebarVisibility: () => {},
  sidebarHidden: false,
}
