"use client"

import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import { Search, Truck, Calendar, Package, CheckCircle, XCircle, Clock, Map, Eye, ArrowRight, Check, X } from "lucide-react"
import "../css/delivery.css"
import api from "../api/api_url"
import LeafletMapPopup from "../components/LeafletMapPopup"
import { DataTable } from "@/components/ui/DataTable"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

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

  // Define columns configuration before the return statement
  const columns = [
    {
      key: "id",
      header: "ID",
      sortable: true
    },
    {
      key: "orderId",
      header: "Order ID",
      sortable: true
    },
    {
      key: "customer",
      header: "Customer",
      sortable: true
    },
    {
      key: "store",
      header: "Store",
      sortable: true
    },
    {
      key: "items",
      header: "Items",
      sortable: true
    },
    {
      key: "total",
      header: "Total",
      sortable: true,
      render: (delivery) => `₱${delivery.total.toFixed(2)}`
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (delivery) => getStatusBadge(delivery.status)
    },
    {
      key: "driver",
      header: "Driver",
      sortable: true
    },
    {
      key: "deliveryDate",
      header: "Delivery Date",
      sortable: true,
      render: (delivery) => `${new Date(delivery.deliveryDate).toLocaleDateString()} ${delivery.deliveryTime}`
    },
    {
      key: "actions",
      header: "Actions",
      className: "actions-cell",
      render: (delivery) => (
        <div className="actions-container">
          <button 
            className="action-button view-button" 
            onClick={() => handleViewDetails(delivery.id)}
            title="View Details"
          >
            <Eye size={16} className="action-icon" />
          </button>

          {delivery.status === "pending" && (
            <button
              className="action-button start-button"
              onClick={() => handleUpdateStatus(delivery.id, "in-transit")}
              title="Start Delivery"
            >
              <ArrowRight size={16} className="action-icon" />
            </button>
          )}

          {delivery.status === "in-transit" && (
            <button
              className="action-button complete-button"
              onClick={() => handleUpdateStatus(delivery.id, "delivered")}
              title="Complete Delivery"
            >
              <Check size={16} className="action-icon" />
            </button>
          )}
        </div>
      )
    }
  ]

  return (
    <div className="delivery-page">
      <Card className="delivery-management-card">
        <CardHeader className="card-header">
          <div className="header-content">
            <h2 className="page-title">Delivery Management</h2>
            <div className="controls-container">
              <div className="search-filters">
                <div className="search-wrapper">
                  <Search className="search-icon" />
                  <Input
                    type="text"
                    placeholder="Search deliveries..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                </div>
                <div className="filters">
                  <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="in-transit">In Transit</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  <select 
                    value={dateFilter} 
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Dates</option>
                    <option value="today">Today</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="past">Past</option>
                  </select>
                </div>
              </div>
              <Button 
                className="route-planning-btn" 
                onClick={openRouteMap}
                variant="default"
              >
                <Map size={16} className="btn-icon" />
                Route Planning
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="stats-grid">
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

          <div className="table-section">
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading deliveries...</p>
              </div>
            ) : filteredDeliveries.length === 0 ? (
              <div className="empty-state">
                <Package size={48} />
                <h3>No deliveries found</h3>
                <p>Try adjusting your search or filters</p>
              </div>
            ) : (
              <DataTable 
                columns={columns}
                data={filteredDeliveries}
                className="deliveries-table"
                emptyMessage="No deliveries found"
                loadingMessage="Loading deliveries..."
                isLoading={loading}
                showCheckboxes={false}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Route Planning Map Modal */}
      {showRouteMap && (
        <div className="modal-overlay">
          <div className="route-map-modal">
            <div className="modal-header">
              <h2>Route Planning</h2>
              <button className="close-btn" onClick={closeRouteMap}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-content">
              <div className="planning-controls">
                <div className="day-select">
                  <label>Delivery Day:</label>
                  <select value={routeDay} onChange={handleRouteDayChange}>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
                
                <div className="stores-info">
                  <Truck className="info-icon" />
                  <span>{loadingStores ? "Loading stores..." : `${storeLocations.length} stores on route`}</span>
                </div>
              </div>

              <div className="map-container">
                {loadingStores ? (
                  <div className="loading-state">
                    <div className="spinner" />
                    <p>Loading store locations...</p>
                  </div>
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
        </div>
      )}
    </div>
  )
}

