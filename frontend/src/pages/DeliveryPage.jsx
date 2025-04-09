"use client"

import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import { Search, Truck, Calendar, Package, CheckCircle, XCircle, Clock, Map } from "lucide-react"
import "../css/delivery.css"
import api from "../api/api_url"
import LeafletMapPopup from "../components/LeafletMapPopup"

export default function DeliveryPage() {
  // State for deliveries
  const [deliveries, setDeliveries] = useState([])
  const [filteredDeliveries, setFilteredDeliveries] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")

  // State for route planning
  const [showRouteMap, setShowRouteMap] = useState(false)
  const [routeDay, setRouteDay] = useState("Monday")
  const [storeLocations, setStoreLocations] = useState([])
  const [loadingStores, setLoadingStores] = useState(false)
  const [centerLocation, setCenterLocation] = useState({
    lat: 16.63614047965268,
    lng: 120.31339285476308,
  })

  // Fetch deliveries on component mount
  useEffect(() => {
    fetchDeliveries()
  }, [])

  // Filter deliveries when search or filters change
  useEffect(() => {
    filterDeliveries()
  }, [searchQuery, statusFilter, dateFilter, deliveries])

  // Mock function to fetch deliveries
  const fetchDeliveries = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Mock data
      const mockDeliveries = [
        {
          id: "DEL-001",
          orderId: "ORD-001",
          customer: "John Smith",
          store: "Downtown Market",
          address: "123 Main St, Cityville",
          items: 3,
          total: 6856.0,
          status: "delivered",
          driver: "Jericho Urbano",
          deliveryDate: "2025-03-28",
          deliveryTime: "14:30",
          notes: "Leave at front door",
        },
        {
          id: "DEL-002",
          orderId: "ORD-002",
          customer: "Sarah Johnson",
          store: "Westside Shop",
          address: "456 Oak Ave, Townsville",
          items: 5,
          total: 2637.5,
          status: "in-transit",
          driver: "Harry Zabate",
          deliveryDate: "2025-04-01",
          deliveryTime: "10:15",
          notes: "Call upon arrival",
        },
        {
          id: "DEL-003",
          orderId: "ORD-003",
          customer: "Michael Brown",
          store: "Central Store",
          address: "789 Pine Rd, Villagetown",
          items: 2,
          total: 5489.99,
          status: "pending",
          driver: "Unassigned",
          deliveryDate: "2025-04-02",
          deliveryTime: "09:00",
          notes: "",
        },
        {
          id: "DEL-004",
          orderId: "ORD-004",
          customer: "Emily Davis",
          store: "Northside Market",
          address: "101 Maple Dr, Hamletville",
          items: 7,
          total: 3465.0,
          status: "delivered",
          driver: "Jericho Urbano",
          deliveryDate: "2025-03-27",
          deliveryTime: "16:45",
          notes: "Signature required",
        },
        {
          id: "DEL-005",
          orderId: "ORD-005",
          customer: "David Wilson",
          store: "Eastside Shop",
          address: "202 Cedar Ln, Boroughtown",
          items: 1,
          total: 4565.99,
          status: "cancelled",
          driver: "Harry Zabate",
          deliveryDate: "2025-03-29",
          deliveryTime: "11:30",
          notes: "Customer cancelled order",
        },
      ]

      setDeliveries(mockDeliveries)
      setFilteredDeliveries(mockDeliveries)
    } catch (error) {
      console.error("Error fetching deliveries:", error)
      toast.error("Failed to load deliveries")
    } finally {
      setLoading(false)
    }
  }

  // Filter deliveries based on search and filters
  const filterDeliveries = () => {
    let filtered = [...deliveries]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (delivery) =>
          delivery.id.toLowerCase().includes(query) ||
          delivery.orderId.toLowerCase().includes(query) ||
          delivery.customer.toLowerCase().includes(query) ||
          delivery.store.toLowerCase().includes(query) ||
          delivery.address.toLowerCase().includes(query) ||
          delivery.driver.toLowerCase().includes(query),
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((delivery) => delivery.status === statusFilter)
    }

    // Apply date filter
    if (dateFilter !== "all") {
      const today = new Date()
      const todayStr = today.toISOString().split("T")[0]

      if (dateFilter === "today") {
        filtered = filtered.filter((delivery) => delivery.deliveryDate === todayStr)
      } else if (dateFilter === "upcoming") {
        filtered = filtered.filter((delivery) => delivery.deliveryDate > todayStr)
      } else if (dateFilter === "past") {
        filtered = filtered.filter((delivery) => delivery.deliveryDate < todayStr)
      }
    }

    setFilteredDeliveries(filtered)
  }

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "delivered":
        return (
          <span className="status-badge delivered">
            <CheckCircle size={14} /> Delivered
          </span>
        )
      case "in-transit":
        return (
          <span className="status-badge in-transit">
            <Truck size={14} /> In Transit
          </span>
        )
      case "pending":
        return (
          <span className="status-badge pending">
            <Clock size={14} /> Pending
          </span>
        )
      case "cancelled":
        return (
          <span className="status-badge cancelled">
            <XCircle size={14} /> Cancelled
          </span>
        )
      default:
        return <span className="status-badge">{status}</span>
    }
  }

  // Handle delivery actions
  const handleUpdateStatus = (id, newStatus) => {
    const updatedDeliveries = deliveries.map((delivery) =>
      delivery.id === id ? { ...delivery, status: newStatus } : delivery,
    )

    setDeliveries(updatedDeliveries)
    toast.success(`Delivery ${id} status updated to ${newStatus}`)
  }

  const handleViewDetails = (id) => {
    // In a real app, this would navigate to a details page or open a modal
    toast.info(`Viewing details for delivery ${id}`)
  }

  // Fetch store locations for route planning
  const fetchStoreLocations = async (day) => {
    setLoadingStores(true)
    try {
      // Get store locations from the API
      const response = await api.get(`/stores/?archived=false`)

      // Filter stores by the selected day
      const filteredStores = response.data.filter((store) => store.day === day)

      setStoreLocations(
        filteredStores.map((store) => ({
          lat: store.lat,
          lng: store.lng,
          name: store.name,
          address: store.location,
        })),
      )

      // Set center location to the first store or default
      if (filteredStores.length > 0) {
        setCenterLocation({
          lat: filteredStores[0].lat,
          lng: filteredStores[0].lng,
        })
      }

      toast.success(`Loaded ${filteredStores.length} stores for ${day}`)
    } catch (error) {
      console.error("Error fetching store locations:", error)
      toast.error("Failed to load store locations")

      // Fallback to mock data if API fails
      const mockStores = [
        { lat: 16.636, lng: 120.313, name: "Downtown Store", address: "123 Main St" },
        { lat: 16.64, lng: 120.32, name: "Uptown Store", address: "456 High St" },
        { lat: 16.632, lng: 120.305, name: "Westside Store", address: "789 West Ave" },
      ]
      setStoreLocations(mockStores)
    } finally {
      setLoadingStores(false)
    }
  }

  // Open route planning map
  const openRouteMap = () => {
    setShowRouteMap(true)
    fetchStoreLocations(routeDay)
  }

  // Handle day change in route planning
  const handleRouteDayChange = (e) => {
    const newDay = e.target.value
    setRouteDay(newDay)
    fetchStoreLocations(newDay)
  }

  // Close route planning map
  const closeRouteMap = () => {
    setShowRouteMap(false)
  }

  return (
    <div className="delivery-page">
      <div className="delivery-header">
        <h1>Delivery Management</h1>
        <p>Track and manage all deliveries</p>
      </div>

      <div className="delivery-filters">
        <div className="search-bar">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search deliveries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <div className="filter-group">
            <label>Status:</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in-transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Date:</label>
            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>
          </div>

          <button className="route-planning-btn" onClick={openRouteMap}>
            <Map size={16} />
            Route Planning
          </button>
        </div>
      </div>

      <div className="delivery-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <Truck />
          </div>
          <div className="stat-content">
            <h3>Total Deliveries</h3>
            <p>{deliveries.length}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <CheckCircle />
          </div>
          <div className="stat-content">
            <h3>Completed</h3>
            <p>{deliveries.filter((d) => d.status === "delivered").length}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Clock />
          </div>
          <div className="stat-content">
            <h3>Pending</h3>
            <p>{deliveries.filter((d) => d.status === "pending").length}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Calendar />
          </div>
          <div className="stat-content">
            <h3>Today's Deliveries</h3>
            <p>{deliveries.filter((d) => d.deliveryDate === new Date().toISOString().split("T")[0]).length}</p>
          </div>
        </div>
      </div>

      <div className="delivery-table-container">
        {loading ? (
          <div className="loading-indicator">Loading deliveries...</div>
        ) : filteredDeliveries.length === 0 ? (
          <div className="empty-state">
            <Package size={48} />
            <h3>No deliveries found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        ) : (
          <table className="delivery-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Store</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Driver</th>
                <th>Delivery Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeliveries.map((delivery) => (
                <tr key={delivery.id}>
                  <td>{delivery.id}</td>
                  <td>{delivery.orderId}</td>
                  <td>{delivery.customer}</td>
                  <td>{delivery.store}</td>
                  <td>{delivery.items}</td>
                  <td>₱{delivery.total.toFixed(2)}</td>
                  <td>{getStatusBadge(delivery.status)}</td>
                  <td>{delivery.driver}</td>
                  <td>
                    {new Date(delivery.deliveryDate).toLocaleDateString()} {delivery.deliveryTime}
                  </td>
                  <td className="actions-cell">
                    <button className="action-button view-button" onClick={() => handleViewDetails(delivery.id)}>
                      View
                    </button>

                    {delivery.status === "pending" && (
                      <button
                        className="action-button start-button"
                        onClick={() => handleUpdateStatus(delivery.id, "in-transit")}
                      >
                        Start
                      </button>
                    )}

                    {delivery.status === "in-transit" && (
                      <button
                        className="action-button complete-button"
                        onClick={() => handleUpdateStatus(delivery.id, "delivered")}
                      >
                        Complete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Route Planning Map Modal */}
      {showRouteMap && (
        <div className="route-map-modal">
          <div className="route-map-content">
            <div className="route-map-header">
              <h2>Route Planning</h2>
              <button className="close-btn" onClick={closeRouteMap}>
                ×
              </button>
            </div>
            <div className="route-planning-controls">
              <div className="day-selector">
                <label>Select Day:</label>
                <select value={routeDay} onChange={handleRouteDayChange}>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                  <option value="Sunday">Sunday</option>
                </select>
              </div>
              <div className="store-count">
                {loadingStores ? "Loading stores..." : `${storeLocations.length} stores found`}
              </div>
            </div>

            <div className="route-map-container">
              {loadingStores ? (
                <div className="loading-map">Loading store locations...</div>
              ) : (
                <LeafletMapPopup
                  lat={centerLocation.lat}
                  lng={centerLocation.lng}
                  markerLabel="Distribution Center"
                  additionalMarkers={storeLocations}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

