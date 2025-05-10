import {useRef } from "react"
import { NavLink, useLocation } from "react-router-dom"
import PropTypes from "prop-types"
import "../css/nav.css"
import {
  Users,
  Store,
  Boxes,
  Package,
  Receipt,
  Truck,
  BarChart2,
  LayoutDashboard,
} from "lucide-react"

function NavBar({ isOpen, isMobile, isHidden }) {
  const location = useLocation()
  const dropdownRef = useRef(null)

  // All navigation items in a flat array
  const navItems = [
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/user", icon: Users, label: "Users" },
    { path: "/localstore", icon: Store, label: "Stores" },
    { path: "/products", icon: Package, label: "Products" },
    { path: "/inventory", icon: Boxes, label: "Inventory" },
    { path: "/order", icon: Receipt, label: "Orders" },
    { path: "/delivery", icon: Truck, label: "Delivery" },
    { path: "/reports", icon: BarChart2, label: "Reports" },
  ]

  const isPathActive = (path) => location.pathname === path

  return (
    <nav
      className={`navigation ${isOpen ? "open" : "closed"} ${isMobile ? "mobile" : ""} ${isHidden ? "hidden" : ""}`}
      aria-hidden={!isOpen && isMobile}
    >
      <div className="nav-header">
      </div>

      <div className="nav-content" ref={dropdownRef}>
        {/* Navigation Items */}
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={`nav-item ${isPathActive(item.path) ? "active" : ""} ${!isOpen ? "collapsed" : ""}`}
            title={item.label}
          >
            <item.icon className="nav-icon" />
            {isOpen && <span className="nav-label">{item.label}</span>}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

// Add PropTypes for props validation
NavBar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  isMobile: PropTypes.bool,
  isHidden: PropTypes.bool,
}

export default NavBar