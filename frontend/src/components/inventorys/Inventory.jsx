"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { toast } from "react-toastify"
import api, { ENDPOINTS } from "@/api/api_url"
import { Edit, Search, PackagePlus, Eye, Printer, RefreshCcw, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import jsPDF from "jspdf"
// Import shadcn components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { DataTable } from "@/components/ui/DataTable"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import "@/css/all.css" // Import your CSS file

export default function InventoryPage() {
  const [inventory, setInventory] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState(null)
  const [restockQuantity, setRestockQuantity] = useState(10)
  const [restockItem, setRestockItem] = useState(null)
  const [activeTab] = useState("all")
  const [editingItem, setEditingItem] = useState(null)
  const [newThreshold, setNewThreshold] = useState(0)
  const [viewItem, setViewItem] = useState(null)
  const inputRef = useRef(null)
  const [selectedItems, setSelectedItems] = useState([])
  const [showCheckboxes] = useState(false)


  const fetchInventory = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await api.get(ENDPOINTS.INVENTORY)

      const formattedData = response.data
        .filter((item) => item.product?.is_active !== false)
        .map((item) => ({
          id: item.id,
          product_id: item.product_id || item.product?.product_id || "N/A",
          product_name: item.product_name || item.product?.name || "Unnamed Product",
          size: item.size || item.product?.size || "N/A",
          stock: item.stock ?? 0,
          low_stock_threshold: item.low_stock_threshold ?? 10,
          is_low_stock: item.is_low_stock ?? item.stock <= (item.low_stock_threshold ?? 10),
          last_updated: item.last_updated || item.updated_at || new Date().toISOString(),
        }))

      setInventory(formattedData)
    } catch (error) {
      console.error("Error:", error)
      setError(error.message)
      toast.error("Failed to fetch inventory")
      setInventory([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInventory()
  }, [fetchInventory])

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      // Filter by tab selection
      if (activeTab === "low" && !item.is_low_stock) return false
      if (activeTab === "out" && item.stock > 0) return false

      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        return (
          item.product_name?.toLowerCase().includes(searchLower) || item.product_id?.toLowerCase().includes(searchLower)
        )
      }

      return true
    })
  }, [inventory, activeTab, searchTerm])

  const handleRestock = async (itemId) => {
    try {
      if (!itemId || restockQuantity <= 0) {
        throw new Error("Invalid restock parameters")
      }

      await api.post(`${ENDPOINTS.INVENTORY}/${itemId}/restock/`, {
        quantity: restockQuantity,
      })

      toast.success("Inventory restocked successfully")
      await fetchInventory()
      setRestockItem(null)
      setRestockQuantity(10)
    } catch (error) {
      console.error("Restock error:", error)
      const errorMessage = error.response?.data?.error || error.message || "Failed to restock inventory"
      toast.error(errorMessage)
    }
  }

  const handleUpdateThreshold = async () => {
    try {
      if (!editingItem || newThreshold < 0) {
        throw new Error("Invalid threshold value")
      }

      await api.patch(`${ENDPOINTS.INVENTORY}/${editingItem.id}`, {
        low_stock_threshold: newThreshold,
      })

      toast.success("Threshold updated successfully")
      await fetchInventory()
      setEditingItem(null)
    } catch (error) {
      console.error("Update error:", error)
      const errorMessage = error.response?.data?.error || error.message || "Failed to update threshold"
      toast.error(errorMessage)
    }
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleFocus = () => {
    if (inputRef.current) {
      inputRef.current.select()
    }
  }

  const generatePDF = (item) => {
    const doc = new jsPDF()

    doc.setFontSize(22)
    doc.setFont("helvetica", "bold")
    doc.text("K-TO-DRINKS TRADING", 105, 15, { align: "center" })

    doc.setFontSize(14)
    doc.setFont("helvetica", "italic")
    doc.text("Inventory Item Report", 105, 25, { align: "center" })

    doc.setLineWidth(0.5)
    doc.line(55, 30, 155, 30)

    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    const itemDetails = [
      { label: "ID", value: item.id },
      { label: "Product ID", value: item.product_id },
      { label: "Product Name", value: item.product_name },
      { label: "Size", value: item.size },
      { label: "Current Stock", value: item.stock },
      { label: "Low Stock Threshold", value: item.low_stock_threshold },
      { label: "Status", value: item.is_low_stock ? "Low Stock" : "In Stock" },
      {
        label: "Last Updated",
        value: item.last_updated ? new Date(item.last_updated).toLocaleDateString("en-US") : "N/A",
      },
    ]

    let yPosition = 40
    itemDetails.forEach((detail) => {
      doc.setFont("helvetica", "bold")
      doc.text(`${detail.label}:`, 60, yPosition)
      doc.setFont("helvetica", "normal")
      doc.text(`${detail.value}`, 100, yPosition)
      yPosition += 10
    })

    doc.setFontSize(10)
    doc.setFont("helvetica", "italic")
    doc.text("Generated by K-To-Drinks Inventory Management System", 105, 280, { align: "center" })

    window.open(doc.output("bloburl"), "_blank")
  }

  const columns = [
    {
      key: "product_id",
      header: "Product ID",
      sortable: true,
    },
    {
      key: "product_name",
      header: "Product",
      sortable: true,
      className: "font-medium",
    },
    {
      key: "size",
      header: "Size",
      sortable: true,
    },
    {
      key: "stock",
      header: "Stock",
      sortable: true,
      render: (item) => {
        // Determine stock status
        const isOutOfStock = item.stock === 0
        const isLowStock = item.is_low_stock && !isOutOfStock

        // Set badge styles based on stock status
        let badgeClass, statusClass, statusText, icon

        if (isOutOfStock) {
          badgeClass = "bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800"
          statusClass = "status-out-of-stock"
          statusText = "Out of Stock"
          icon = <XCircle className="h-3.5 w-3.5 status-indicator-icon" />
        } else if (isLowStock) {
          badgeClass =
            "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-800"
          statusClass = "status-low-stock"
          statusText = "Low Stock"
          icon = <AlertTriangle className="h-3.5 w-3.5 status-indicator-icon" />
        } else {
          badgeClass =
            "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800"
          statusClass = "status-in-stock"
          statusText = "In Stock"
          icon = <CheckCircle className="h-3.5 w-3.5 status-indicator-icon" />
        }

        return (
          <div className="flex flex-col items-start gap-2">
            <div className={`stock-badge ${badgeClass}`}>{item.stock} units</div>
            <div className={`status-indicator ${statusClass}`}>
              {icon}
              <span className="text-xs font-medium">{statusText}</span>
            </div>
          </div>
        )
      },
    },
    {
      key: "last_updated",
      header: "Last Updated",
      sortable: true,
      render: (item) => <span>{new Date(item.last_updated).toLocaleString()}</span>,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (item) => (
        <TooltipProvider>
          <div className="action-buttons-container">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="action-button edit-button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setEditingItem(item)
                    setNewThreshold(item.low_stock_threshold)
                  }}
                  disabled={isLoading}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit Threshold</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="action-button view-button"
                  variant="outline"
                  size="icon"
                  onClick={() => setViewItem(item)}
                  disabled={isLoading}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View Details</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className={`action-button restock-button ${item.stock === 0 ? "restock-urgent" : ""}`}
                  variant="outline"
                  size="icon"
                  onClick={() => setRestockItem(item)}
                  disabled={isLoading}
                >
                  <PackagePlus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Restock Item</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      ),
    },
  ]

  if (error) {
    return (
      <div className="p-4 text-center space-y-4">
        <h3 className="text-lg font-medium">Something went wrong</h3>
        <p className="text-red-500">{error}</p>
        <Button onClick={fetchInventory} className="mt-4" disabled={isLoading}>
          {isLoading ? "Retrying..." : "Try Again"}
        </Button>
      </div>
    )
  }

  return (
    <Card className="inventory-management-card">
      <CardHeader className="card-header">
        <div className="header-container">
          <div className="search-input-container">
            <Search className="search-icon" />
            <Input
              placeholder="Search by product name or ID..."
              value={searchTerm}
              onChange={handleSearch}
              onFocus={handleFocus}
              ref={inputRef}
              className="search-input w-full"
            />
          </div>
          <div className="button-group">
            <Button onClick={fetchInventory} size="sm" className="add-button" disabled={isLoading}>
              <RefreshCcw className={`icon ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="card-content">
        <DataTable
          columns={columns}
          data={filteredInventory}
          isLoading={isLoading}
          showCheckboxes={showCheckboxes}
          selectedItems={selectedItems}
          onSelectionChange={(selected) => {
            setSelectedItems(selected)
          }}
          emptyMessage={
            searchTerm
              ? "No products match your search"
              : activeTab !== "all"
                ? `No ${activeTab === "low" ? "low stock" : "out of stock"} items`
                : "No inventory items available"
          }
          loadingMessage="Loading inventory data..."
        />

        {/* Restock Modal */}
        {restockItem && (
          <div className="custom-modal-overlay">
            <div className="custom-modal">
              <h2 className="modal-title">Restock {restockItem.product_name}</h2>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleRestock(restockItem.id)
                }}
                className="user-form"
              >
                <div className="form-group">
                  <label htmlFor="product_id" className="form-label">
                    Product ID:
                  </label>
                  <input
                    id="product_id"
                    type="text"
                    value={restockItem.product_id}
                    readOnly
                    className="form-input bg-gray-100"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="current_stock" className="form-label">
                    Current Stock:
                  </label>
                  <input
                    id="current_stock"
                    type="text"
                    value={restockItem.stock}
                    readOnly
                    className="form-input bg-gray-100"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="current_threshold" className="form-label">
                    Current Threshold:
                  </label>
                  <input
                    id="current_threshold"
                    type="text"
                    value={restockItem.low_stock_threshold}
                    readOnly
                    className="form-input bg-gray-100"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="restock_quantity" className="form-label">
                    Quantity to Add:
                  </label>
                  <input
                    id="restock_quantity"
                    type="number"
                    min="1"
                    value={restockQuantity}
                    onChange={(e) => setRestockQuantity(Math.max(1, Number(e.target.value)))}
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="save-button" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <RefreshCcw className="h-4 w-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <PackagePlus className="h-4 w-4 mr-2" />
                        Confirm Restock
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRestockItem(null)
                      setRestockQuantity(10)
                    }}
                    className="cancel-button"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Threshold Edit Modal */}
        {editingItem && (
          <div className="custom-modal-overlay">
            <div className="custom-modal max-w-md w-full">
              <div className="modal-header flex justify-between items-start mb-6">
                <div>
                  <h2 className="modal-title text-2xl font-bold text-gray-900 dark:text-white">
                    Edit Low Stock Threshold
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {editingItem.product_name} (ID: {editingItem.product_id})
                  </p>
                </div>
                <button
                  className="close-button p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => setEditingItem(null)}
                  aria-label="Close"
                  title="Close"
                >
                  <span className="material-icons text-gray-500 dark:text-gray-400">close</span>
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Stock</p>
                    <p className="text-gray-900 dark:text-white font-medium">{editingItem.stock}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Threshold</p>
                    <p className="text-gray-900 dark:text-white font-medium">{editingItem.low_stock_threshold}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    New Threshold
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={newThreshold}
                    onChange={(e) => setNewThreshold(Math.max(0, Number(e.target.value)))}
                    className="w-full"
                    disabled={isLoading}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setEditingItem(null)} disabled={isLoading}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateThreshold}
                    disabled={isLoading}
                    className="bg-primary hover:bg-primary/90 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {isLoading ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Edit className="h-4 w-4" />}
                      <span>{isLoading ? "Processing..." : "Update Threshold"}</span>
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Item Modal */}
        {viewItem && (
          <div className="custom-modal-overlay">
            <div className="custom-modal max-w-md w-full">
              <div className="modal-header flex justify-between items-start mb-6">
                <div>
                  <h2 className="modal-title text-2xl font-bold text-gray-900 dark:text-white">Inventory Details</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Detailed information about this item</p>
                </div>
                <button
                  className="close-button p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => setViewItem(null)}
                  aria-label="Close"
                  title="Close"
                >
                  <span className="material-icons text-gray-500 dark:text-gray-400">close</span>
                </button>
              </div>

              <div className="item-details space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 font-bold">ID</p>
                    <p className="text-gray-900 dark:text-white">{viewItem.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 font-bold">Status</p>
                    <p className="text-gray-900 dark:text-white capitalize">
                      {viewItem.stock === 0 ? "Out of Stock" : viewItem.is_low_stock ? "Low Stock" : "In Stock"}
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 font-bold">Product ID</p>
                  <p className="text-gray-900 dark:text-white">{viewItem.product_id}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 font-bold">Product Name</p>
                  <p className="text-gray-900 dark:text-white">{viewItem.product_name}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 font-bold">Size</p>
                  <p className="text-gray-900 dark:text-white">{viewItem.size}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 font-bold">Current Stock</p>
                  <p className="text-gray-900 dark:text-white">{viewItem.stock}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 font-bold">Low Stock Threshold</p>
                  <p className="text-gray-900 dark:text-white">{viewItem.low_stock_threshold}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 font-bold">Last Updated</p>
                  <p className="text-gray-900 dark:text-white">
                    {viewItem.last_updated
                      ? new Date(viewItem.last_updated).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div className="modal-actions flex justify-end space-x-3 mt-6">
                <div className="button-group">
                  <Button onClick={() => generatePDF(viewItem)} variant="outline" size="sm" className="add-button">
                    <Printer className="icon" />
                    Export PDF
                  </Button>
                  <Button onClick={() => setViewItem(null)} size="sm" className="cancel-button">
                    Close Details
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
