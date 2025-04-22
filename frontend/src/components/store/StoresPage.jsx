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
    coordinates: [0, 0] // latitude, longitude
  })
  const [confirmationDialog, setConfirmationDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null
  })
  const [viewStore, setViewStore] = useState(null)

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
      key: "status",
      header: "Status",
      sortable: true,
      render: (store) => (
        <Badge variant={store.status === "Active" ? "success" : "secondary"}>
          {store.status}
        </Badge>
      )
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (store) => (
        <div className="flex justify-end gap-4">
          <button
            className="action-button"
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
            className="action-button"
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
            className="action-button"
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
        day: "Monday",
        hours: "",
        coordinates: [0, 0]
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
      status: store.status.toLowerCase()
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
      id: "",
      name: "",
      owner_name: "",
      contact: "",
      email: "",
      address: "",
      status: "Active",
      day: "Monday",
      hours: "",
      coordinates: [0, 0] // latitude, longitude
    })
    setIsStoreModalOpen(false)
  }

  // Handle bulk actions
  // Removed unused handleBulkAction function

  // Long press handler for mobile

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
                  Archived Stores
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
              <div className="form-group">
                <label htmlFor="name">Store Name:</label>
                <input
                  id="name"
                  value={storeForm.name}
                  onChange={(e) => setStoreForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              {/* Add other form fields */}
              <div className="form-actions">
                <button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save"}
                </button>
                <button type="button" onClick={handleCancel}>
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
          <div className="custom-modal">
            <h2 className="modal-title">Store Details</h2>
            <div className="store-details">
              {/* Display store details */}
            </div>
            <div className="modal-actions">
              <button onClick={() => setViewStore(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmationDialog.isOpen && (
        <div className="custom-modal-overlay">
          <div className="custom-modal confirmation-modal">
            <h3>{confirmationDialog.title}</h3>
            <p>{confirmationDialog.message}</p>
            <div className="confirmation-actions">
              <button onClick={() => setConfirmationDialog(prev => ({ ...prev, isOpen: false }))}>
                Cancel
              </button>
              <button onClick={confirmationDialog.onConfirm}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}