"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import api from "../api/api_url"
import "../css/localstore.css"
import LeafletMapPopup from "../components/LeafletMapPopup"
import { toast } from "react-toastify"
import {
  Search,
  Plus,
  Archive,
  Edit,
  MapPin,
  ExternalLink,
  Save,
  X,
  ArrowUp,
  ArrowDown,
  Navigation,
  AlertTriangle,
} from "lucide-react"
import axios from "axios";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const DEFAULT_LAT = 16.63614047965268
const DEFAULT_LNG = 120.31339285476308

const toastConfig = {
  position: "top-right",
  autoClose: 5000,
  hideProgressBar: false,
  pauseOnHover: true,
  draggable: true,
  style: {
    backgroundColor: "var(--background-color)",
    color: "var(--text-color)",
  },
}

const saveStore = async (storeData) => {
  try {
    const token = localStorage.getItem("access_token");
    const response = await axios.post("/stores/",
      storeData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log("Store saved successfully:", response.data);
  } catch (error) {
    console.error("Save failed:", error);
  }
};

export default function LocalStore() {
  // State declarations
  const [selectedItem, setSelectedItem] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [externalLocation, setExternalLocation] = useState(null)
  const [markerPosition, setMarkerPosition] = useState({
    lat: DEFAULT_LAT,
    lng: DEFAULT_LNG,
  })
  const [isCreateMode, setIsCreateMode] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [data, setData] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    lat: DEFAULT_LAT,
    lng: DEFAULT_LNG,
    owner_name: "",
    email: "",
    number: "",
    day: days[0],
  })
  const [selectedDay, setSelectedDay] = useState(days[0])
  const [routeOrder, setRouteOrder] = useState([])
  const [showReorderButtons, setShowReorderButtons] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showRouteView, setShowRouteView] = useState(false)
  const tableRef = useRef(null)
  // Add a function to handle traffic simulation toggle
  const [showTraffic, setShowTraffic] = useState(false)

  const handleToggleTraffic = () => {
    if (!selectedItem) return
    setShowTraffic(!showTraffic)
  }

  // Fetch stores from API
  const fetchStores = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/stores/"); // Ensure this matches the backend URL
      setData(response.data || []); // Ensure data is an array
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error(`Failed to load stores: ${err.response?.data?.message || err.message}`, toastConfig);
      setData([]); // Fallback to an empty array
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize user location
  useEffect(() => {
    const initUserLocation = async () => {
      try {
        if (navigator.geolocation) {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 10000,
              maximumAge: 60000,
            })
          })

          const { latitude, longitude } = position.coords
          const lat = latitude && !isNaN(latitude) ? latitude : DEFAULT_LAT
          const lng = longitude && !isNaN(longitude) ? longitude : DEFAULT_LNG

          setMarkerPosition({ lat, lng })
          setFormData((prev) => ({ ...prev, lat, lng }))
        }
      } catch (err) {
        console.error("Location error:", err)
        toast.error("Using default location", toastConfig)
      }
    }

    initUserLocation()
  }, [])

  // Filter and sort data
  useEffect(() => {
    const filtered = data.filter(
      (item) =>
        item.day === selectedDay &&
        (item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.owner_name.toLowerCase().includes(searchQuery.toLowerCase())),
    )
    setRouteOrder(filtered.map((_, index) => index))
  }, [selectedDay, searchQuery, data])

  // Debounced search function
  const debouncedSearch = useMemo(() => {
    const debounce = (func, delay) => {
      let timeoutId
      return function (...args) {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => func.apply(this, args), delay)
      }
    }

    return debounce((query) => {
      setSearchQuery(query)
      if (!query) {
        setSelectedItem(null)
        setExternalLocation(null)
        return
      }

      const foundItem = data.find(
        (item) =>
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.location.toLowerCase().includes(query.toLowerCase()) ||
          item.owner_name.toLowerCase().includes(query.toLowerCase()),
      )

      if (foundItem) {
        setSelectedItem(foundItem)
        setExternalLocation(null)
        setMarkerPosition({ lat: foundItem.lat, lng: foundItem.lng })
        return
      }

      // External location search
      setIsLoading(true)
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
        .then((response) => response.json())
        .then((results) => {
          if (results.length > 0) {
            const firstResult = results[0]
            setExternalLocation({
              name: firstResult.display_name,
              lat: Number.parseFloat(firstResult.lat),
              lng: Number.parseFloat(firstResult.lon),
            })
            setMarkerPosition({
              lat: Number.parseFloat(firstResult.lat),
              lng: Number.parseFloat(firstResult.lon),
            })
          }
        })
        .catch((err) => console.error("Search error:", err))
        .finally(() => setIsLoading(false))
    }, 500)
  }, [data])

  // Event handlers
  const handleSearchInput = (e) => {
    const query = e.target.value
    setSearchInput(query)
    debouncedSearch(query)
  }

  const handleMarkerPositionChange = (lat, lng) => {
    if (isCreateMode || isEditMode) {
      const newLat = lat || DEFAULT_LAT
      const newLng = lng || DEFAULT_LNG
      setMarkerPosition({ lat: newLat, lng: newLng })
      setFormData((prev) => ({ ...prev, lat: newLat, lng: newLng }))
    }
  }

  const handleRowClick = (item) => {
    setSelectedItem(item)
    setMarkerPosition({ lat: item.lat, lng: item.lng })
    setIsCreateMode(false)
    setIsEditMode(false)
    setShowRouteView(false)
  }

  const handleClosePopup = () => {
    setSelectedItem(null)
    setExternalLocation(null)
    setIsCreateMode(false)
    setIsEditMode(false)
    setShowRouteView(false)
    setFormData({
      name: "",
      location: "",
      lat: markerPosition.lat,
      lng: markerPosition.lng,
      owner_name: "",
      email: "",
      number: "",
      day: selectedDay,
    })
  }

  const handleCreateNewData = () => {
    setIsCreateMode(true)
    setIsEditMode(false)
    setSelectedItem(null)
    setExternalLocation(null)
    setShowRouteView(false)
    setFormData({
      name: "",
      location: "",
      lat: markerPosition.lat,
      lng: markerPosition.lng,
      owner_name: "",
      email: "",
      number: "",
      day: selectedDay,
    })
  }

  const handleEditLocation = (item) => {
    setIsEditMode(true)
    setIsCreateMode(false)
    setSelectedItem(item)
    setShowRouteView(false)
    setFormData({
      name: item.name,
      location: item.location,
      lat: item.lat,
      lng: item.lng,
      owner_name: item.owner_name,
      email: item.email,
      number: item.number,
      day: item.day,
    })
  }

  const handleFormInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Add a function to get current location and update the map
  const handleGetCurrentLocation = async () => {
    try {
      setIsLoading(true)

      if (!navigator.geolocation) {
        toast.error("Geolocation is not supported by your browser", toastConfig)
        setIsLoading(false)
        return
      }

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        })
      })

      const { latitude, longitude } = position.coords

      // Update marker position
      setMarkerPosition({ lat: latitude, lng: longitude })

      // If in create/edit mode, update form data
      if (isCreateMode || isEditMode) {
        setFormData((prev) => ({ ...prev, lat: latitude, lng: longitude }))
      }

      // Try to get address from coordinates
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      )

      if (response.ok) {
        const data = await response.json()
        if (data.display_name && (isCreateMode || isEditMode)) {
          setFormData((prev) => ({
            ...prev,
            location: data.display_name,
          }))
        }
      }

      toast.success("Current location detected successfully!", toastConfig)
    } catch (error) {
      console.error("Location error:", error)
      toast.error(`Failed to get location: ${error.message}`, toastConfig)
    } finally {
      setIsLoading(false)
    }
  }

  // Toggle route view
  const handleToggleRouteView = () => {
    if (!selectedItem) return

    setShowRouteView(!showRouteView)
  }

  // Form validation
  const validateForm = () => {
    const requiredFields = ["name", "location", "owner_name", "number"]
    const missingFields = requiredFields.filter((field) => !formData[field])

    if (missingFields.length > 0) {
      toast.error(`Missing required fields: ${missingFields.join(", ")}`, toastConfig)
      return false
    }

    if (isNaN(formData.lat) || isNaN(formData.lng)) {
      toast.error("Coordinates must be valid numbers", toastConfig)
      return false
    }

    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      toast.error("Please enter a valid email address", toastConfig)
      return false
    }

    if (!/^[0-9+]+$/.test(formData.number)) {
      toast.error("Contact number should contain only numbers and + sign", toastConfig)
      return false
    }

    return true
  }

  // Save store data
  const handleSaveNewData = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      let response;

      if (isEditMode) {
        response = await api.put(`/stores/${selectedItem.id}/`, formData);
      } else {
        response = await api.post("/stores/", formData); // Ensure this matches the backend URL
      }

      await fetchStores();
      toast.success(`Store ${isEditMode ? "updated" : "created"} successfully!`, toastConfig);
      handleClosePopup();
    } catch (err) {
      console.error("Save failed:", err);
      toast.error(`Save failed: ${err.response?.data?.message || err.message}`, { ...toastConfig, autoClose: 10000 });
    } finally {
      setIsLoading(false);
    }
  };

  // Save external location
  const handleSaveExternalLocation = () => {
    if (!externalLocation) return

    setIsCreateMode(true)
    setFormData({
      name: externalLocation.name.split(",")[0],
      location: externalLocation.name,
      lat: externalLocation.lat,
      lng: externalLocation.lng,
      owner_name: "",
      email: "",
      number: "",
      day: selectedDay,
    })
    setExternalLocation(null)
  }

  // Archive/unarchive store
  const handleArchiveStore = async (id) => {
    const action = showArchived ? "unarchive" : "archive"
    if (!window.confirm(`Are you sure you want to ${action} this store?`)) return

    try {
      setIsLoading(true)
      await api.patch(`/stores/${id}/archive/`, { archive: !showArchived })
      await fetchStores()
      toast.success(`Store ${action}d successfully!`, toastConfig)
      handleClosePopup()
    } catch (err) {
      console.error("Archive error:", err)
      toast.error(`Failed to ${action} store: ${err.response?.data?.message || err.message}`, toastConfig)
    } finally {
      setIsLoading(false)
    }
  }

  // Route ordering functions
  const moveRouteUp = (index) => {
    if (index > 0) {
      const newOrder = [...routeOrder]
      ;[newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]]
      setRouteOrder(newOrder)
    }
  }

  const moveRouteDown = (index) => {
    if (index < routeOrder.length - 1) {
      const newOrder = [...routeOrder]
      ;[newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]]
      setRouteOrder(newOrder)
    }
  }

  const toggleReorderButtons = () => {
    setShowReorderButtons(!showReorderButtons)
  }

  // Prepare route destinations for the map
  const filteredDataByDay = useMemo(() => Array.isArray(data) ? data.filter((item) => item.day === selectedDay) : [], [data, selectedDay]);

  const filteredDataBySearch = useMemo(
    () =>
      filteredDataByDay.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.owner_name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [filteredDataByDay, searchQuery],
  )

  const routeDestinations = useMemo(() => {
    if (!showRouteView || !selectedItem) return []

    // Get all stores for the selected day in the current route order
    return routeOrder
      .map((index) => filteredDataBySearch[index])
      .filter((item) => item && item.id !== selectedItem.id)
      .map((item) => ({
        lat: item.lat,
        lng: item.lng,
        name: item.name,
        address: item.location,
      }))
  }, [showRouteView, selectedItem, routeOrder, filteredDataBySearch])

  // Filtered data

  return (
    <div className="local-store-page">
      {/* Header with search and controls */}
      <div className="header-section">
        <div className="search-controls">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search by name, location or owner..."
              value={searchInput}
              onChange={handleSearchInput}
              disabled={isLoading}
              className="search-input"
            />
            {searchInput && (
              <button
                className="clear-search-btn"
                onClick={() => {
                  setSearchInput("")
                  setSearchQuery("")
                  setSelectedItem(null)
                  setExternalLocation(null)
                }}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <div className="button-group">
            <button onClick={handleCreateNewData} disabled={isLoading} className="create-button">
              <Plus size={16} />
              Create New Store
            </button>
            <button onClick={() => setShowArchived(!showArchived)} disabled={isLoading} className="archive-button">
              <Archive size={16} />
              {showArchived ? "Hide Archived" : "Show Archived"}
            </button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="main-content-container">
        <div
          className={`main-local-content ${
            selectedItem || externalLocation ? "view-mode" : isCreateMode || isEditMode ? "form-mode" : ""
          }`}
        >
          {/* Table section */}
          <div className="table-section">
            <div className="table-controls">
              <div className="day-filter">
                <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} className="day-select">
                  {days.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
              {!showArchived && (
                <button onClick={toggleReorderButtons} className="reorder-toggle-btn">
                  {showReorderButtons ? "Hide Arrange" : "Arrange Route"}
                </button>
              )}
            </div>

            <div className="table-wrapper" ref={tableRef}>
              <table className="store-table">
                <thead>
                  <tr>
                    <th className="id-column">#</th>
                    <th className="name-column">Store Name</th>
                    <th className="location-column">Location</th>
                    <th className="status-column">Status</th>
                    {showReorderButtons && !showArchived && <th className="route-column">Route Arrange</th>}
                    <th className="actions-column">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDataBySearch.length > 0 ? (
                    routeOrder.map((orderIndex, index) => {
                      const item = filteredDataBySearch[orderIndex]
                      if (!item) return null

                      return (
                        <tr
                          key={item.id}
                          onClick={() => handleRowClick(item)}
                          className={`${selectedItem?.id === item.id ? "selected-row" : ""} ${
                            item.is_archived ? "archived-row" : ""
                          }`}
                        >
                          <td>{index + 1}</td>
                          <td>{item.name}</td>
                          <td>{item.location}</td>
                          <td>
                            {item.is_archived ? (
                              <span className="archived-badge">Archived</span>
                            ) : (
                              <span className="active-badge">Active</span>
                            )}
                          </td>
                          {showReorderButtons && !showArchived && !item.is_archived && (
                            <td className="reorder-buttons">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  moveRouteUp(index)
                                }}
                                disabled={index === 0}
                                className="up-btn"
                                aria-label="Move up"
                              >
                                <ArrowUp size={16} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  moveRouteDown(index)
                                }}
                                disabled={index === routeOrder.length - 1}
                                className="down-btn"
                                aria-label="Move down"
                              >
                                <ArrowDown size={16} />
                              </button>
                            </td>
                          )}
                          <td className="actions-cell">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditLocation(item)
                              }}
                              disabled={isLoading || item.is_archived}
                              className="edit-btn"
                            >
                              <Edit size={16} />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleArchiveStore(item.id)
                              }}
                              disabled={isLoading}
                              className="archive-btn"
                            >
                              <Archive size={16} />
                              <span>{item.is_archived ? "Unarchive" : "Archive"}</span>
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={showReorderButtons && !showArchived ? 6 : 5} className="no-data">
                        No stores found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Details section */}
          {(selectedItem || externalLocation || isCreateMode || isEditMode) && (
            <div className="details-section">
              <div className={`details-card ${isCreateMode || isEditMode ? "form-mode" : ""}`}>
                <button className="close-btn" onClick={handleClosePopup} aria-label="Close">
                  <X size={18} />
                </button>

                {selectedItem && !isEditMode ? (
                  <>
                    <h2 className="store-title">{selectedItem.name}</h2>
                    <div className="store-details">
                      <div className="detail-item">
                        <span className="detail-label">Location:</span>
                        <span className="detail-value">{selectedItem.location}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Owner:</span>
                        <span className="detail-value">{selectedItem.owner_name}</span>
                      </div>

                      <div className="contact-grid">
                        <div className="detail-item">
                          <span className="detail-label">Contact:</span>
                          <span className="detail-value">{selectedItem.number}</span>
                        </div>
                        {selectedItem.email && (
                          <div className="detail-item">
                            <span className="detail-label">Email:</span>
                            <span className="detail-value email-value">{selectedItem.email}</span>
                          </div>
                        )}
                      </div>

                      <div className="detail-item">
                        <span className="detail-label">Day:</span>
                        <span className="detail-value">{selectedItem.day}</span>
                      </div>
                      {selectedItem.is_archived && <div className="archived-notice">This store is archived</div>}
                    </div>
                    <div className="map-container">
                      <LeafletMapPopup
                        lat={selectedItem.lat}
                        lng={selectedItem.lng}
                        markerLabel={selectedItem.name}
                        markerAddress={selectedItem.location}
                        showRoutes={showRouteView}
                        showTraffic={showTraffic}
                        routeDestinations={routeDestinations}
                      />
                    </div>
                    <div className="action-buttons">
                      <button
                        onClick={() =>
                          window.open(`https://www.google.com/maps?q=${selectedItem.lat},${selectedItem.lng}`, "_blank")
                        }
                        className="map-btn"
                      >
                        <MapPin size={16} />
                        Open in Maps
                      </button>
                      <button onClick={handleToggleRouteView} className={`route-btn ${showRouteView ? "active" : ""}`}>
                        <Navigation size={16} />
                        {showRouteView ? "Hide Route" : "Show Route"}
                      </button>
                      <button
                        onClick={handleToggleTraffic}
                        className={`traffic-btn ${showTraffic ? "active" : ""}`}
                        disabled={!showRouteView}
                      >
                        <AlertTriangle size={16} />
                        {showTraffic ? "Hide Traffic" : "Show Traffic"}
                      </button>
                      <button
                        onClick={() => handleEditLocation(selectedItem)}
                        disabled={isLoading || selectedItem.is_archived}
                        className="edit-store-btn"
                      >
                        <Edit size={16} />
                        Edit Store
                      </button>
                      <button
                        onClick={() => handleArchiveStore(selectedItem.id)}
                        disabled={isLoading}
                        className="archive-store-btn"
                      >
                        <Archive size={16} />
                        {selectedItem.is_archived ? "Unarchive" : "Archive"}
                      </button>
                    </div>
                  </>
                ) : isCreateMode || isEditMode ? (
                  <>
                    <h2 className="form-title">{isEditMode ? "Edit Store" : "Create New Store"}</h2>
                    <div className="form-container">
                      <div className="form-column">
                        <div className="form-group">
                          <label htmlFor="name">Store Name *</label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleFormInputChange}
                            required
                            placeholder="Enter store name"
                          />
                        </div>
                        <div className="form-group location-group">
                          <label htmlFor="location">Location *</label>
                          <div className="location-input-wrapper">
                            <input
                              type="text"
                              id="location"
                              name="location"
                              value={formData.location}
                              onChange={handleFormInputChange}
                              required
                              placeholder="Enter store location"
                            />
                            <button
                              type="button"
                              onClick={handleGetCurrentLocation}
                              className="get-location-btn"
                              title="Get my current location"
                            >
                              <MapPin size={16} />
                            </button>
                          </div>
                        </div>
                        <div className="form-group">
                          <label htmlFor="owner_name">Owner Name *</label>
                          <input
                            type="text"
                            id="owner_name"
                            name="owner_name"
                            value={formData.owner_name}
                            onChange={handleFormInputChange}
                            required
                            placeholder="Enter owner name"
                          />
                        </div>

                        <div className="contact-grid-form">
                          <div className="form-group">
                            <label htmlFor="number">Contact Number *</label>
                            <input
                              type="tel"
                              id="number"
                              name="number"
                              value={formData.number}
                              onChange={handleFormInputChange}
                              required
                              placeholder="Enter contact number"
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                              type="email"
                              id="email"
                              name="email"
                              value={formData.email}
                              onChange={handleFormInputChange}
                              placeholder="Enter email address (optional)"
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label htmlFor="day">Day *</label>
                          <select id="day" name="day" value={formData.day} onChange={handleFormInputChange} required>
                            {days.map((day) => (
                              <option key={day} value={day}>
                                {day}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="map-column">
                        <div className="map-container">
                          <LeafletMapPopup
                            lat={markerPosition.lat}
                            lng={markerPosition.lng}
                            onMarkerPositionChange={handleMarkerPositionChange}
                            isDraggable={isCreateMode || isEditMode}
                            markerLabel={formData.name || "New Store"}
                            markerAddress={formData.location || ""}
                          />
                        </div>
                        <div className="coordinates">
                          <div className="coordinate-item">
                            <span className="coordinate-label">Latitude:</span>
                            <span className="coordinate-value">{markerPosition.lat.toFixed(6)}</span>
                          </div>
                          <div className="coordinate-item">
                            <span className="coordinate-label">Longitude:</span>
                            <span className="coordinate-value">{markerPosition.lng.toFixed(6)}</span>
                          </div>
                          <button
                            onClick={() =>
                              window.open(
                                `https://www.google.com/maps?q=${markerPosition.lat},${markerPosition.lng}`,
                                "_blank",
                              )
                            }
                            className="preview-map-btn"
                          >
                            <ExternalLink size={16} />
                            Preview in Maps
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="form-actions">
                      <button onClick={handleSaveNewData} disabled={isLoading} className="save-btn">
                        {isLoading ? "Saving..." : "Save"}
                      </button>
                      <button onClick={handleClosePopup} disabled={isLoading} className="cancel-btn">
                        Cancel
                      </button>
                    </div>
                  </>
                ) : externalLocation ? (
                  <>
                    <h2 className="external-title">{externalLocation.name}</h2>
                    <p className="external-location">External location found</p>
                    <div className="map-container">
                      <LeafletMapPopup
                        lat={externalLocation.lat}
                        lng={externalLocation.lng}
                        markerLabel={externalLocation.name.split(",")[0]}
                        markerAddress={externalLocation.name}
                      />
                    </div>
                    <div className="action-buttons">
                      <button
                        onClick={() =>
                          window.open(
                            `https://www.google.com/maps?q=${externalLocation.lat},${externalLocation.lng}`,
                            "_blank",
                          )
                        }
                        className="map-btn"
                      >
                        <MapPin size={16} />
                        Open in Maps
                      </button>
                      <button onClick={handleSaveExternalLocation} className="save-location-btn">
                        <Save size={16} />
                        Save This Location
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}
    </div>
  )
}

