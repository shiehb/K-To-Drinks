"use client"

import { useState, useEffect, useRef } from "react"
import { NavLink, useLocation } from "react-router-dom"
import PropTypes from "prop-types"
import "../css/nav.css"

function NavBar({ isOpen, isMobile, isHidden }) {
  const location = useLocation()
  const [activeGroup, setActiveGroup] = useState("")
  const dropdownRef = useRef(null)

  // Dashboard as a standalone item
  const dashboardItem = { path: "/dashboard", icon: "dashboard", label: "Dashboard" }

  const navGroups = {
    management: [
      { path: "/user", icon: "people", label: "Users" },
      { path: "/localstore", icon: "store", label: "Stores" },
    ],
    inventory: [
      { path: "/inventory", icon: "inventory_2", label: "Stock" },
      { path: "/products", icon: "category", label: "Products" },
    ],
    operations: [
      { path: "/order", icon: "receipt", label: "Orders" },
      { path: "/delivery", icon: "local_shipping", label: "Delivery" },
    ],
    reports: [
      { path: "/reports", icon: "assessment", label: "Reports" },
    ]
  }

  const isPathActive = (path) => location.pathname === path
  const isGroupActive = (paths) => paths.some(item => isPathActive(item.path))

  useEffect(() => {
    Object.entries(navGroups).forEach(([group, items]) => {
      if (isGroupActive(items)) {
        setActiveGroup(group)
      }
    })
  }, [location])

  return (
    <nav
      className={`navigation ${isOpen ? "open" : "closed"} ${isMobile ? "mobile" : ""} ${isHidden ? "hidden" : ""}`}
      aria-hidden={!isOpen && isMobile}
    >
      <div className="nav-header">
        <div className="logo-container">
          <span className="material-icons logo-icon">local_cafe</span>
          {isOpen && <span className="logo-text">K-To-Drinks</span>}
        </div>
      </div>

      <div className="nav-content" ref={dropdownRef}>
        {/* Dashboard Item */}
        <NavLink
          to={dashboardItem.path}
          className={`nav-item ${isPathActive(dashboardItem.path) ? "active" : ""} ${!isOpen ? "collapsed" : ""}`}
          title={dashboardItem.label}
        >
          <span className="material-icons nav-icon">{dashboardItem.icon}</span>
          {isOpen && <span className="nav-label">{dashboardItem.label}</span>}
        </NavLink>

        {/* Navigation Groups */}
        {Object.entries(navGroups).map(([group, items]) => (
          <div 
            key={group} 
            className={`nav-group ${activeGroup === group ? 'active' : ''}`}
          >
            <div className="nav-group-header">
              {isOpen && <span className="group-title">{group}</span>}
            </div>
            <div className="nav-group-items">
              {items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`nav-item ${isPathActive(item.path) ? "active" : ""} ${!isOpen ? "collapsed" : ""}`}
                  title={item.label}
                >
                  <span className="material-icons nav-icon">{item.icon}</span>
                  {isOpen && <span className="nav-label">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>
    </nav>
  )
}

// Add PropTypes for props validation
NavBar.propTypes = {
  isOpen: PropTypes.bool.isRequired, // Validate isOpen as a required boolean
  isMobile: PropTypes.bool, // Optional boolean
  isHidden: PropTypes.bool, // Optional boolean
}

export default NavBar