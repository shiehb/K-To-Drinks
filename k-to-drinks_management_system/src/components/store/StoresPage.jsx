import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "@/components/ui/DataTable"
import { toast } from "react-toastify"
import { Search, Store, Edit, Archive, ArchiveRestore, Eye, Map } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import api, { ENDPOINTS } from "@/api/api_url"
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'

import "@/css/all.css"

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function StoresPage() {
  const [stores, setStores] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("active")
  const [statusFilter] = useState("all")
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false)
  const [selectedStores, setSelectedStores] = useState([])
  const [showCheckboxes] = useState(false)
  const [storeForm, setStoreForm] = useState({
    id: "",
    name: "",
    owner_name: "",
    contact: "",
    email: "",
    address: "",
    status: "Active",
    day: "Monday",
    hours: "",
    coordinates: [16.6366, 120.3131] // Default coordinates (SLC)
  })

  const handleAddressSearch = () => {
    // Geocoding is disabled
    toast.warning("Address search is currently unavailable.");
  };

  const [confirmationDialog, setConfirmationDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null
  })
  const [viewStore, setViewStore] = useState(null)

  // Location Marker Component
  function LocationMarker({ position, setPosition, label }) {
    const map = useMapEvents({
      click(e) {
        setPosition([e.latlng.lat, e.latlng.lng]);
      },
    });
  
    // Custom icon
    const customIcon = new L.Icon({
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      shadowSize: [41, 41]
    });
  
    return position === null ? null : (
      <Marker position={position} icon={customIcon}>
        <Popup>
          <div className="p-2">
            <strong>Store Location</strong>
            <div className="text-sm">{label || "No address provided"}</div>
            <div className="text-xs mt-1">
              Lat: {position[0].toFixed(6)}, Lng: {position[1].toFixed(6)}
            </div>
          </div>
        </Popup>
      </Marker>
    );
  }
  

  const columns = [
    {
      key: "name",
      header: "Store Name",
      sortable: true,
      className: "font-medium"
    },
    {
      key: "owner_name",
      header: "Owner",
      sortable: true
    },
    {
      key: "contact",
      header: "Contact",
      sortable: true
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
      render: (store) => store.email || "N/A"
    },
    {
      key: "address",
      header: "Address",
      sortable: true,
      render: (store) => store.address
    },
    // {
    //   key: "status",
    //   header: "Status",
    //   sortable: true,
    //   render: (store) => (
    //     <Badge variant={store.status === "Active" ? "success" : "secondary"}>
    //       {store.status}
    //     </Badge>
    //   )
    // },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (store) => (
        <div className="action-buttons-container">
          <button
            className="action-button edit-button"
            onClick={(e) => {
              e.stopPropagation()
              handleEditStore(store)
            }}
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            className="action-button"
            onClick={(e) => {
              e.stopPropagation()
              handleViewMap(store)
            }}
            title="View Map"
          >
            <Map className="h-4 w-4" />
          </button>
          <button
            className="action-button archive-button"
            onClick={(e) => {
              e.stopPropagation()
              handleArchiveStore(store)
            }}
            title={store.is_archived ? "Restore" : "Archive"}
          >
            {store.is_archived ? (
              <ArchiveRestore className="h-4 w-4" />
            ) : (
              <Archive className="h-4 w-4" />
            )}
          </button>
          <button
            className="action-button view-button"
            onClick={(e) => {
              e.stopPropagation()
              handleViewStore(store)
            }}
            title="View"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ]

  // Fetch stores
  const fetchStores = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      
      if (activeTab === 'archived') {
        params.append('is_archived', 'true');
      } else {
        params.append('is_archived', 'false');
      }

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await api.get(ENDPOINTS.STORES, { params });
      
      if (Array.isArray(response.data)) {
        setStores(response.data);
      } else if (Array.isArray(response.data.results)) {
        // Handle paginated response
        setStores(response.data.results);
      } else {
        console.error('Unexpected response format:', response.data);
        setStores([]);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
      toast.error('Failed to fetch stores');
      setStores([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, searchTerm]);

  useEffect(() => {
    fetchStores()
  }, [fetchStores])

  useEffect(() => {
    // Add debounce for search term
    const timer = setTimeout(() => {
      fetchStores()
    }, searchTerm ? 300 : 0) // Debounce search for 300ms

    return () => clearTimeout(timer)
  }, [fetchStores, searchTerm])

  // Filter stores with safety check
  const filteredStores = (Array.isArray(stores) ? stores : []).filter(store => {
    const matchesSearch = searchTerm === "" || 
      Object.values(store).some(value => 
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    
    const matchesTab = activeTab === "active" ? !store.is_archived : store.is_archived
    const matchesStatus = statusFilter === "all" || store.status.toLowerCase() === statusFilter

    return matchesSearch && matchesTab && matchesStatus
  })

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  // Handle store form submission
  const handleStoreFormSubmit = async (e) => {
    e.preventDefault()
    try {
      setIsLoading(true)
      const formData = {
        ...storeForm,
        status: storeForm.status.charAt(0).toUpperCase() + storeForm.status.slice(1)
      }

      if (storeForm.id) {
        await api.put(`/stores/${storeForm.id}/`, formData)
        toast.success("Store updated successfully")
      } else {
        await api.post("/stores/", formData)
        toast.success("Store added successfully")
      }
      
      setIsStoreModalOpen(false)
      setStoreForm({
        id: "",
        name: "",
        owner_name: "",
        contact: "",
        email: "",
        address: "",
        status: "Active",
        coordinates: [51.505, -0.09]
      })
      fetchStores()
    } catch (error) {
      console.error('Store operation failed:', error)
      toast.error(error.response?.data?.detail || "Operation failed")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle store edit
  const handleEditStore = (store) => {
    setStoreForm({
      id: store.id,
      name: store.name,
      owner_name: store.owner_name,
      contact: store.contact,
      email: store.email,
      address: store.address,
      status: store.status.toLowerCase(),
      coordinates: store.coordinates || [51.505, -0.09]
    })
    setIsStoreModalOpen(true)
  }

  // Handle store archive/restore
  const handleArchiveStore = (store) => {
    setConfirmationDialog({
      isOpen: true,
      title: store.is_archived ? "Restore Store" : "Archive Store",
      message: `Are you sure you want to ${store.is_archived ? "restore" : "archive"} ${store.name}?`,
      onConfirm: async () => {
        try {
          await api.patch(`/stores/${store.id}/`, {
            is_archived: !store.is_archived
          })
          toast.success(`Store ${store.is_archived ? "restored" : "archived"} successfully`)
          fetchStores()
        } catch {
          toast.error("Operation failed")
        } finally {
          setConfirmationDialog(prev => ({ ...prev, isOpen: false }))
        }
      }
    })
  }

  // Handle store view
  const handleViewStore = (store) => {
    setViewStore(store)
  }

  const handleViewMap = (store) => {
    if (store.coordinates && store.coordinates.length === 2) {
      const [latitude, longitude] = store.coordinates;
      const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
      window.open(mapUrl, "_blank");
    } else {
      toast.error("Invalid coordinates for this store");
    }
  }

  // Handle form cancel
  const handleCancel = () => {
    setStoreForm({
      id:"",
      name: "",
      owner_name: "",
      contact: "",
      email: "",
      address: "",
      status: "Active",
      coordinates: [51.505, -0.09]
    })
    setIsStoreModalOpen(false)
  }

  const handleViewAllMaps = useCallback(() => {
    try {
      if (!stores.length) {
        toast.warning('No stores available to view on map');
        return;
      }

      const storeLocations = stores
        .filter(store => {
          const hasValidCoordinates = store.coordinates && 
            Array.isArray(store.coordinates) && 
            store.coordinates.length === 2 &&
            !isNaN(store.coordinates[0]) && 
            !isNaN(store.coordinates[1]);
          
          if (!hasValidCoordinates) {
            console.warn(`Store ${store.name} has invalid coordinates:`, store.coordinates);
          }
          return hasValidCoordinates;
        })
        .map(store => ({
          id: store.id,
          name: store.name,
          coordinates: store.coordinates,
          address: store.address
        }));

      if (!storeLocations.length) {
        toast.error('No stores have valid coordinates to display on map');
        return;
      }

      const queryParams = new URLSearchParams({
        data: JSON.stringify(storeLocations)
      });

      window.location.href = `/store-maps?${queryParams.toString()}`;
    } catch (error) {
      console.error('Error navigating to maps:', error);
      toast.error('Failed to open maps view');
    }
  }, [stores]);

  return (
    <Card className="stores-management-card">
      <CardHeader className="card-header">
        <div className="header-container">
          <div className="search-input-container">
            <Search className="search-icon" />
            <Input 
              placeholder="Search stores..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
          </div>
          <div className="button-group">
            <Button 
              onClick={handleViewAllMaps} 
              size="sm"
              width="fixed"
              className="add-button" 
              disabled={isLoading || stores.length === 0}
            >
              <Map className="icon" />
              View Maps
            </Button>
            <Button 
              onClick={() => setIsStoreModalOpen(true)} 
              size="sm"
              className="add-button"
            >
              <Store className="icon" />
              Add Store
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="card-content">
        <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab} className="tabs-container">
          <div className="filter-container">
            <div className="flex justify-between items-center w-full">
              <TabsList className="tabs-list">
                <TabsTrigger value="active" className="tab">
                  Active Stores
                </TabsTrigger>
                <TabsTrigger value="archived" className="tab">
                  Inactive Stores
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <div className="table-wrapper">
            <DataTable
              columns={columns}
              data={filteredStores}
              isLoading={isLoading}
              showCheckboxes={showCheckboxes}
              selectedItems={selectedStores}
              onSelectionChange={setSelectedStores}
              emptyMessage={
                searchTerm || statusFilter !== "all"
                  ? "No stores match the current filters"
                  : "No stores found"
              }
              loadingMessage="Loading stores..."
            />
          </div>
        </Tabs>
      </CardContent>

      {/* Add Store Modal */}
      {isStoreModalOpen && (
        <div className="custom-modal-overlay">
          <div className="custom-modal">
            <h2 className="modal-title">{storeForm.id ? "Edit Store" : "Add Store"}</h2>
            <form onSubmit={handleStoreFormSubmit} className="store-form">
              <div className="form-grid">
                {/* First Column */}
                <div className="form-group">
                  <label htmlFor="name">Store Name:</label>
                  <input
                    id="name"
                    value={storeForm.name}
                    onChange={(e) => setStoreForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="owner_name">Owner Name:</label>
                  <input
                    id="owner_name"
                    value={storeForm.owner_name}
                    onChange={(e) => setStoreForm(prev => ({ ...prev, owner_name: e.target.value }))}
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contact">Contact:</label>
                  <input
                    id="contact"
                    value={storeForm.contact}
                    onChange={(e) => setStoreForm(prev => ({ ...prev, contact: e.target.value }))}
                    required
                    className="form-input"
                  />
                </div>

                {/* Second Column */}
                <div className="form-group">
                  <label htmlFor="email">Email:</label>
                  <input
                    id="email"
                    type="email"
                    value={storeForm.email}
                    onChange={(e) => setStoreForm(prev => ({ ...prev, email: e.target.value }))}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="status">Status:</label>
                  <select
                    id="status"
                    value={storeForm.status}
                    onChange={(e) => setStoreForm(prev => ({ ...prev, status: e.target.value }))}
                    className="form-select"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                {/* Full width fields */}
                <div className="form-group span-2">
                  <label htmlFor="address">Address:</label>
                  <div className="address-input-container">
                    <input
                      id="address"
                      type="text"
                      value={storeForm.address}
                      onChange={(e) => setStoreForm(prev => ({ ...prev, address: e.target.value }))}
                      required
                      className="form-input"
                      placeholder="Enter address and click search icon"
                    />
                    <button
                      type="button"
                      onClick={handleAddressSearch}
                      className="address-search-button"
                      title="Search location on map"
                      disabled={!storeForm.address}
                    >
                      <Map className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="form-group span-2">
                  <label htmlFor="map">Location:</label>
                  <div className="map-container">
                    <MapContainer
                      center={storeForm.coordinates}
                      zoom={15}  // Increased zoom for better precision
                      style={{ height: '100%', width: '100%' }}
                      className="map-display"
                    >
                      <TileLayer
                         url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                         attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                         maxZoom={19}
                      />
                      <LocationMarker 
                        position={storeForm.coordinates}
                        setPosition={(coords) => setStoreForm(prev => ({ ...prev, coordinates: coords }))}
                        label={storeForm.address}
                      />
                    </MapContainer>
                  </div>
                  <div className="map-coordinates">
                    <span>Click on the map to set the store location</span>
                    <span>
                      Latitude: {storeForm.coordinates[0].toFixed(6)}, Longitude: {storeForm.coordinates[1].toFixed(6)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-button" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save"}
                </button>
                <button type="button" className="cancel-button" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Store Modal */}
      {viewStore && (
        <div className="custom-modal-overlay">
          <div className="custom-modal max-w-md w-full">
            <div className="modal-header flex justify-between items-start mb-6">
              <div>
                <h2 className="modal-title text-2xl font-bold text-gray-900 dark:text-white">
                  Store Details
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Detailed information about this store
                </p>
              </div>
              <button
                className="close-button p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => setViewStore(null)}
                aria-label="Close"
                title="Close"
              >
                <span className="material-icons text-gray-500 dark:text-gray-400">close</span>
              </button>
            </div>
            
            <div className="user-details grid grid-cols-2 gap-4 mb-6">
              <div className="col-span-2 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 font-bold">ID</p>
                  <p className="text-gray-900 dark:text-white">{viewStore.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 font-bold">Status</p>
                  <Badge variant={viewStore.status === "Active" ? "success" : "secondary"}>
                    {viewStore.status}
                  </Badge>
                </div>
              </div>

              <div className="col-span-2">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 font-bold">Store Name</p>
                <p className="text-gray-900 dark:text-white">{viewStore.name}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 font-bold">Owner</p>
                <p className="text-gray-900 dark:text-white">{viewStore.owner_name}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 font-bold">Contact</p>
                <p className="text-gray-900 dark:text-white">{viewStore.contact}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 font-bold">Email</p>
                <p className="text-gray-900 dark:text-white">{viewStore.email || "No email added"}</p>
              </div>

              <div className="col-span-2">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 font-bold">Address</p>
                <p className="text-gray-900 dark:text-white">{viewStore.address || "N/A"}</p>
              </div>

              {viewStore.coordinates && viewStore.coordinates.length === 2 && (
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 font-bold">Coordinates</p>
                  <p className="text-gray-900 dark:text-white">
                    Latitude: {viewStore.coordinates[0]}, Longitude: {viewStore.coordinates[1]}
                  </p>
                </div>
              )}
            </div>
            
            <div className="modal-actions flex justify-end space-x-3 mt-6">
              <div className="button-group">
                <Button 
                  onClick={() => handleViewMap(viewStore)}
                  variant="outline"
                  size="sm"
                  className="add-button"
                >
                  <Map className="icon" />
                  View Map
                </Button>
                <Button 
                  onClick={() => setViewStore(null)}
                  size="sm"
                  className="cancel-button"
                >
                  Close Details
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmationDialog.isOpen && (
        <div className="custom-modal-overlay">
          <div className="confirmation-modal">
            <div className="confirmation-icon">
              <span className="material-icons">warning</span>
            </div>
            <h3 className="confirmation-title">{confirmationDialog.title}</h3>
            <p className="confirmation-message">{confirmationDialog.message}</p>
            <div className="confirmation-actions">
              <button onClick={() => setConfirmationDialog(prev => ({ ...prev, isOpen: false }))}  
                className="cancel-button">
                Cancel
              </button>
              <button onClick={confirmationDialog.onConfirm}
                className="confirm-button">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}