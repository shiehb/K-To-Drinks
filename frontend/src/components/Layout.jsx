"use client"

import { useState, useEffect } from "react"
import { Outlet, useLocation } from "react-router-dom"
import Header from "./Header"
import NavBar from "./NavBar"
import "../css/layout.css"

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarHidden, setSidebarHidden] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const location = useLocation()

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
        setIsMobile(true)
      } else {
        setSidebarOpen(true)
        setIsMobile(false)
      }
    }

    // Initial check
    handleResize()

    // Add event listener
    window.addEventListener("resize", handleResize)

    // Cleanup
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Log the current route for debugging
  useEffect(() => {
    console.log("Current route:", location.pathname)
  }, [location])

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const toggleSidebarVisibility = () => {
    setSidebarHidden(!sidebarHidden)
  }

  return (
    <div className="app-container">
      <Header
        toggleSidebar={toggleSidebar}
        sidebarOpen={sidebarOpen}
        toggleSidebarVisibility={toggleSidebarVisibility}
        sidebarHidden={sidebarHidden}
      />
      <div className="content-wrapper">
        <NavBar isOpen={sidebarOpen} isMobile={isMobile} isHidden={sidebarHidden} />
        <main className={`main-content ${!sidebarOpen ? "expanded" : ""} ${sidebarHidden ? "full-width" : ""}`}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

