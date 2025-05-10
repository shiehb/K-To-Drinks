"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { toast } from "react-toastify"
import api, { ENDPOINTS } from "@/api/api_url"
import { Archive, Edit, Search, Plus, Eye, ArchiveRestore, Printer, ImageIcon, X } from "lucide-react"
import jsPDF from "jspdf"
import { useLongPress } from "@/hooks/useLongPress"

// Import shadcn components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "@/components/ui/DataTable"

import "@/css/all.css"

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState(null)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("active")
  const inputRef = useRef(null)
  const [productForm, setProductForm] = useState({
    id: null,
    product_id: "",
    name: "",
    description: "",
    price: "",
    size: "",
    is_active: true,
    image: null,
    imagePreview: null,
    existingImage: null,
  })
  const [confirmationDialog, setConfirmationDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  })
  const [selectedProducts, setSelectedProducts] = useState([])
  const [showCheckboxes, setShowCheckboxes] = useState(false)
  const [viewProduct, setViewProduct] = useState(null)
  const [hoverInfo, setHoverInfo] = useState({
    visible: false,
    product: null,
    position: { x: 0, y: 0 },
  })

  const handleClickOutside = useCallback(
    (event) => {
      const tableElement = document.querySelector(".table-container")
      if (tableElement && !tableElement.contains(event.target)) {
        if (selectedProducts.length === 0) {
          setShowCheckboxes(false)
        }
      }
    },
    [showCheckboxes, selectedProducts],
  )

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [handleClickOutside])

  const handleRowMouseEnter = (product, event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setHoverInfo({
      visible: true,
      product,
      position: {
        x: event.clientX,
        y: rect.top - 10, // Position slightly above the row
      },
    })
  }

  const handleRowMouseLeave = () => {
    setHoverInfo((prev) => ({ ...prev, visible: false }))
  }

  const handleRowMouseMove = (event) => {
    if (hoverInfo.visible) {
      setHoverInfo((prev) => ({
        ...prev,
        position: {
          x: event.clientX,
          y: event.clientY - 100, // Offset to keep popup above cursor
        },
      }))
    }
  }

  const longPressProps = useLongPress(() => {
    if (!showCheckboxes) {
      setShowCheckboxes(true)
      toast.info("Selection mode activated", {
        autoClose: 2000,
        position: "bottom-center",
      })
    }
  }, 500)

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const params = new URLSearchParams()

      params.append("is_archived", activeTab === "archived")

      if (searchTerm) {
        params.append("search", searchTerm)
      }

      const response = await api.get(`${ENDPOINTS.PRODUCTS}?${params.toString()}`)

      if (!response.data) {
        throw new Error("No data received from server")
      }

      setProducts(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error("Error fetching products:", error)
      setError(error.message || "Failed to fetch products")
      toast.error(error.message || "Failed to fetch products")
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }, [activeTab, searchTerm])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    const timer = setTimeout(
      () => {
        fetchProducts()
      },
      searchTerm ? 300 : 0,
    )

    return () => clearTimeout(timer)
  }, [fetchProducts, searchTerm])

  const filteredProducts = useMemo(() => {
    if (!products || products.length === 0) return []

    return products.filter((product) => {
      // First filter by active/archived status
      const statusMatch =
        (activeTab === "archived" && !product.is_active) || (activeTab === "active" && product.is_active)

      if (!statusMatch) return false

      // Then filter by search term if provided
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        return (
          product.name?.toLowerCase().includes(searchLower) ||
          product.product_id?.toLowerCase().includes(searchLower) ||
          product.description?.toLowerCase().includes(searchLower)
        )
      }

      return true
    })
  }, [products, activeTab, searchTerm])

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setProductForm({
        ...productForm,
        image: file,
        imagePreview: URL.createObjectURL(file),
        existingImage: null,
      })
    }
  }

  const removeImage = () => {
    setProductForm({
      ...productForm,
      image: null,
      imagePreview: null,
      existingImage: null,
    })
  }

  const handleProductFormSubmit = async (e) => {
    e.preventDefault()

    // Validate required fields
    if (!productForm.product_id || !productForm.name || !productForm.price) {
      toast.error("Please fill in all required fields")
      return
    }

    showConfirmationDialog(
      "Save Changes",
      `Are you sure you want to ${productForm.id ? "update" : "add"} this product?`,
      async () => {
        setIsLoading(true)

        try {
          const formData = new FormData()
          formData.append("product_id", productForm.product_id)
          formData.append("name", productForm.name)
          formData.append("description", productForm.description || "")
          formData.append("price", Number.parseFloat(productForm.price))
          formData.append("size", productForm.size || "")
          formData.append("is_active", productForm.is_active)

          if (productForm.image) {
            formData.append("image", productForm.image)
          }

          // Only clear image if explicitly removed
          if (productForm.existingImage === null && !productForm.image && productForm.id) {
            formData.append("image-clear", "true")
          }

          const url = productForm.id ? `${ENDPOINTS.PRODUCTS}${productForm.id}/` : ENDPOINTS.PRODUCTS

          const method = productForm.id ? "put" : "post"

          const response = await api({
            url,
            method,
            data: formData,
            headers: {
              "Content-Type": "multipart/form-data",
            },
          })

          if (!response.data) {
            throw new Error("No data received from server")
          }

          const data = response.data
          if (productForm.id) {
            setProducts(products.map((product) => (product.id === productForm.id ? data : product)))
          } else {
            setProducts([data, ...products])
          }

          toast.success(`Product ${productForm.id ? "updated" : "added"} successfully!`)
          setIsProductModalOpen(false)
          resetProductForm()
          fetchProducts() // Refresh the list
        } catch (error) {
          console.error("Product save error:", error)
          const errorMessage =
            error.response?.data?.message || error.response?.data?.detail || error.message || "Failed to save product"
          toast.error(errorMessage)
        } finally {
          setIsLoading(false)
        }
      },
    )
  }

  const resetProductForm = () => {
    setProductForm({
      id: null,
      product_id: "",
      name: "",
      description: "",
      price: "",
      size: "",
      is_active: true,
      image: null,
      imagePreview: null,
      existingImage: null,
    })
  }

  const showConfirmationDialog = (title, message, onConfirm) => {
    setConfirmationDialog({
      isOpen: true,
      title,
      message,
      onConfirm,
    })
  }

  const handleArchiveProduct = (id) => {
    showConfirmationDialog("Archive Product", "Are you sure you want to archive this product?", () =>
      confirmArchive(id),
    )
  }

  const confirmArchive = async (id) => {
    try {
      setIsLoading(true)
      const response = await api.patch(`${ENDPOINTS.PRODUCTS}${id}/`, {
        is_active: false,
      })

      if (!response.data) {
        throw new Error("No data received from server")
      }

      const updatedProduct = response.data
      setProducts(products.map((product) => (product.id === id ? updatedProduct : product)))
      toast.success("Product archived successfully!")
      fetchProducts() // Refresh the list
    } catch (error) {
      console.error("Archive error:", error)
      const errorMsg =
        error.response?.data?.message || error.response?.data?.detail || error.message || "Failed to archive product"
      toast.error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnarchiveProduct = (id) => {
    showConfirmationDialog("Unarchive Product", "Are you sure you want to unarchive this product?", () =>
      confirmUnarchive(id),
    )
  }

  const confirmUnarchive = async (id) => {
    try {
      setIsLoading(true)
      const response = await api.patch(`${ENDPOINTS.PRODUCTS}${id}/`, {
        is_active: true,
      })

      if (!response.data) {
        throw new Error("No data received from server")
      }

      const updatedProduct = response.data
      setProducts(products.map((product) => (product.id === id ? updatedProduct : product)))
      toast.success("Product unarchived successfully!")
      fetchProducts() // Refresh the list
    } catch (error) {
      console.error("Unarchive error:", error)
      const errorMsg =
        error.response?.data?.message || error.response?.data?.detail || error.message || "Failed to unarchive product"
      toast.error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const generatePDF = (product) => {
    const doc = new jsPDF()

    doc.setFontSize(22)
    doc.setFont("helvetica", "bold")
    doc.text("K-TO-DRINKS TRADING", 105, 15, { align: "center" })

    doc.setFontSize(14)
    doc.setFont("helvetica", "italic")
    doc.text("Product Information Report", 105, 25, { align: "center" })

    doc.setLineWidth(0.5)
    doc.line(55, 30, 155, 30)

    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    const productDetails = [
      { label: "ID", value: product.id },
      { label: "Product ID", value: product.product_id },
      { label: "Name", value: product.name },
      { label: "Description", value: product.description || "No description" },
      { label: "Price", value: `₱${Number.parseFloat(product.price).toFixed(2)}` },
      { label: "Size", value: product.size || "N/A" },
      { label: "Status", value: product.is_active ? "Active" : "Archived" },
      {
        label: "Date Created",
        value: product.created_at ? new Date(product.created_at).toLocaleDateString("en-US") : "N/A",
      },
    ]

    let yPosition = 40
    productDetails.forEach((detail) => {
      doc.setFont("helvetica", "bold")
      doc.text(`${detail.label}:`, 60, yPosition)
      doc.setFont("helvetica", "normal")
      doc.text(`${detail.value}`, 100, yPosition)
      yPosition += 10
    })

    doc.setFontSize(10)
    doc.setFont("helvetica", "italic")
    doc.text("Generated by K-To-Drinks Product Management System", 105, 280, { align: "center" })

    window.open(doc.output("bloburl"), "_blank")
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleFocus = () => {
    if (inputRef.current) {
      inputRef.current.select()
    }
  }

  const openProductModal = (product = null) => {
    resetProductForm() // Always reset first
    if (product) {
      setProductForm({
        ...product,
        price: product.price.toString(),
        image: null,
        imagePreview: product.image || null,
        existingImage: product.image || null,
        is_active: product.is_active,
      })
    }
    setIsProductModalOpen(true)
  }

  const handleCancel = () => {
    if (Object.values(productForm).some((val) => val !== null && val !== "")) {
      showConfirmationDialog("Cancel Changes", "Are you sure you want to cancel? Unsaved changes will be lost.", () => {
        setIsProductModalOpen(false)
        resetProductForm()
      })
    } else {
      setIsProductModalOpen(false)
      resetProductForm()
    }
  }

  const columns = [
    {
      key: "image",
      header: "",
      className: "product-image-cell",
      render: (product) => (
        <div className="product-image-container">
          {product.image ? (
            <img
              src={product.image || "/placeholder.svg"}
              alt={product.name}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-gray-400" />
            </div>
          )}
        </div>
      ),
    },
    {
      key: "product_id",
      header: "Product ID",
      sortable: true,
      className: "font-medium",
    },
    {
      key: "name",
      header: "Name",
      sortable: true,
    },
    {
      key: "size",
      header: "Size",
      sortable: true,
      render: (product) => product.size || "N/A",
    },
    {
      key: "price",
      header: "Price",
      sortable: true,
      render: (product) => `₱${Number.parseFloat(product.price).toFixed(2)}`,
    },
    {
      key: "actions",
      header: "",
      className: "text-center",
      render: (product) => (
        <div className="action-buttons-container">
          <button
            className="action-button edit-button"
            onClick={(e) => {
              e.stopPropagation()
              openProductModal(product)
            }}
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            className="action-button archive-button"
            onClick={(e) => {
              e.stopPropagation()
              if (product.is_active) {
                handleArchiveProduct(product.id)
              } else {
                handleUnarchiveProduct(product.id)
              }
            }}
            title={product.is_active ? "Archive" : "Restore"}
          >
            {product.is_active ? <Archive className="h-4 w-4" /> : <ArchiveRestore className="h-4 w-4" />}
          </button>
          <button
            className="action-button view-button"
            onClick={(e) => {
              e.stopPropagation()
              setViewProduct(product)
            }}
            title="View"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  if (error) {
    return (
      <div className="error-container">
        <h3>Something went wrong</h3>
        <p>{error}</p>
        <Button onClick={() => fetchProducts()}>Try Again</Button>
      </div>
    )
  }

  return (
    <Card className="product-management-card">
      <CardHeader className="card-header">
        <div className="header-container">
          <div className="search-input-container">
            <Search className="search-icon" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={handleSearch}
              onFocus={handleFocus}
              ref={inputRef}
              className="search-input w-full"
            />
          </div>
          <div className="button-group">
            <Button onClick={() => openProductModal()} size="sm" className="add-button">
              <Plus className="icon" />
              Add Product
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="card-content">
        <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab} className="tabs-container">
          <div className="filter-container">
            <div className="flex justify-between items-center w-full gap-4">
              <TabsList className="tabs-list">
                <TabsTrigger value="active" className="tab">
                  Active Products
                </TabsTrigger>
                <TabsTrigger value="archived" className="tab">
                  Inactive Products
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <div
            {...longPressProps}
            onTouchStart={longPressProps.onTouchStart}
            onTouchEnd={longPressProps.onTouchEnd}
            className="table-wrapper"
          >
            <DataTable
              columns={columns}
              data={filteredProducts}
              isLoading={isLoading}
              showCheckboxes={showCheckboxes}
              selectedItems={selectedProducts}
              onSelectionChange={(selected) => {
                setSelectedProducts(selected)
              }}
              emptyMessage={searchTerm ? "No products match the current filters" : "No products found"}
              loadingMessage="Loading products..."
              className="compact-table"
              onRowMouseEnter={handleRowMouseEnter}
              onRowMouseLeave={handleRowMouseLeave}
              onRowMouseMove={handleRowMouseMove}
            />
          </div>
        </Tabs>

        {isProductModalOpen && (
          <div className="custom-modal-overlay">
            <div className="custom-modal">
              <h2 className="modal-title">{productForm.id ? "Edit Product" : "Add Product"}</h2>

              <form onSubmit={handleProductFormSubmit} className="user-form">
                <div className="form-group">
                  <label htmlFor="product_id" className="form-label">
                    Product ID: <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="product_id"
                    type="text"
                    value={productForm.product_id}
                    onChange={(e) => setProductForm({ ...productForm, product_id: e.target.value })}
                    placeholder="Enter product ID"
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="name" className="form-label">
                    Name: <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="Enter product name"
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="price" className="form-label">
                    Price: <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="Enter price"
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="size" className="form-label">
                    Size:
                  </label>
                  <div className="flex flex-col gap-2">
                    <select
                      id="size"
                      value={productForm.size?.startsWith("") ? "custom" : productForm.size || ""}
                      onChange={(e) => {
                        if (e.target.value === "custom") {
                          setProductForm({ ...productForm, size: "custom:" })
                        } else {
                          setProductForm({ ...productForm, size: e.target.value })
                        }
                      }}
                      className="form-input"
                    >
                      <option value="">Select size</option>
                      <option value="250ml">250ml</option>
                      <option value="330ml">330ml</option>
                      <option value="500ml">500ml</option>
                      <option value="1L">1L</option>
                      <option value="1.5L">1.5L</option>
                      <option value="2L">2L</option>
                      <option value="custom">Custom Size</option>
                    </select>

                    {productForm.size?.startsWith("custom:") && (
                      <input
                        type="text"
                        value={productForm.size.replace("custom:", "")}
                        onChange={(e) => setProductForm({ ...productForm, size: `custom:${e.target.value}` })}
                        placeholder="Enter custom size"
                        className="form-input"
                      />
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="description" className="form-label">
                    Description:
                  </label>
                  <textarea
                    id="description"
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    placeholder="Enter description (optional)"
                    className="form-input"
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="image" className="form-label">
                    Product Image:
                  </label>
                  <div className="image-upload-container">
                    {productForm.imagePreview || productForm.existingImage ? (
                      <div className="relative group">
                        <img
                          src={productForm.imagePreview || productForm.existingImage}
                          alt="Product preview"
                          className="w-full max-h-32 object-contain rounded-md border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
                        <label className="cursor-pointer">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <ImageIcon className="w-8 h-8 text-gray-400" />
                            <span className="text-sm text-gray-500">Click to upload an image</span>
                            <input
                              id="image"
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              className="hidden"
                            />
                          </div>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="save-button"
                    disabled={isLoading || !productForm.product_id || !productForm.name || !productForm.price}
                  >
                    {isLoading ? "Saving..." : productForm.id ? "Save" : "Add Product"}
                  </button>

                  <button type="button" onClick={handleCancel} className="cancel-button">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {viewProduct && (
          <div className="custom-modal-overlay">
            <div className="custom-modal max-w-md w-full">
              <div className="modal-header flex justify-between items-center mb-4 border-b pb-3">
                <div>
                  <h2 className="modal-title text-2xl font-bold text-gray-900 dark:text-white">Product Details</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Detailed information about this product</p>
                </div>
                <button
                  className="close-button p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => setViewProduct(null)}
                  aria-label="Close"
                  title="Close"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <div className="product-details-grid">
                <div className="product-image-area">
                  {viewProduct.image ? (
                    <div className="product-image-wrapper">
                      <img
                        src={viewProduct.image || "/placeholder.svg"}
                        alt={viewProduct.name}
                        className="product-detail-image"
                      />
                    </div>
                  ) : (
                    <div className="product-image-placeholder">
                      <ImageIcon className="w-12 h-12 text-gray-300" />
                      <p className="text-sm text-gray-400">No image available</p>
                    </div>
                  )}
                </div>

                <div className="product-main-info">
                  <div className="product-name-price">
                    <h3 className="product-name">{viewProduct.name}</h3>
                    <p className="product-price">₱{Number.parseFloat(viewProduct.price).toFixed(2)}</p>
                  </div>

                  <div className="product-id-size">
                    <div className="info-item">
                      <span className="info-label">Product ID</span>
                      <span className="info-value">{viewProduct.product_id}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Size</span>
                      <span className="info-value">{viewProduct.size || "N/A"}</span>
                    </div>
                  </div>
                </div>

                <div className="product-status-area">
                  <div className="info-item">
                    <span className="info-label">Status</span>
                    <span className={`status-badge ${viewProduct.is_active ? "status-active" : "status-archived"}`}>
                      {viewProduct.is_active ? "Active" : "Archived"}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">ID</span>
                    <span className="info-value">{viewProduct.id}</span>
                  </div>
                </div>

                <div className="product-description-area">
                  <span className="info-label">Description</span>
                  <p className="description-content">
                    {viewProduct.description || "No description available for this product."}
                  </p>
                </div>

                <div className="product-date-area">
                  <span className="info-label">Date Created: </span>
                  <span className="info-value">
                    {viewProduct.created_at
                      ? new Date(viewProduct.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "N/A"}
                  </span>
                </div>

                <div className="button-group">
                  <Button
                    onClick={() => generatePDF(viewProduct)}
                    variant="outline"
                    size="sm"
                    className="export-button"
                  >
                    <Printer className="icon" />
                    Export PDF
                  </Button>
                  <Button onClick={() => setViewProduct(null)} size="sm" className="cancel-button">
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {confirmationDialog.isOpen && (
          <div className="custom-modal-overlay">
            <div className="confirmation-modal">
              <div className="confirmation-icon">
                <span className="material-icons">warning</span>
              </div>
              <h3 className="confirmation-title">{confirmationDialog.title}</h3>
              <p className="confirmation-message">{confirmationDialog.message}</p>
              <div className="confirmation-actions">
                <button
                  onClick={() => setConfirmationDialog((prev) => ({ ...prev, isOpen: false }))}
                  className="cancel-button"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    confirmationDialog.onConfirm()
                    setConfirmationDialog((prev) => ({ ...prev, isOpen: false }))
                  }}
                  className="confirm-button"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Product Hover Popup */}
          {hoverInfo.visible && hoverInfo.product && (
            <div
              className="product-hover-popup"
              style={{
                left: `${hoverInfo.position.x}px`,
                top: `${hoverInfo.position.y}px`,
              }}
            >
              <div className="popup-image-container">
                {hoverInfo.product.image ? (
                  <img
                    src={hoverInfo.product.image || "/placeholder.svg"}
                    alt={hoverInfo.product.name}
                    className="popup-image"
                  />
                ) : (
                  <div className="popup-image-placeholder">
                    <ImageIcon className="w-10 h-10 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="popup-info">
                <div className="popup-product-name">
                  <span className="popup-label">Product:</span> 
                  <span className="font-medium">{hoverInfo.product.name}</span>
                </div>
                <div className="popup-product-id">
                  <span className="popup-label">ID:</span> {hoverInfo.product.product_id}
                </div>
                <div className="popup-product-size">
                  <span className="popup-label">Size:</span> {hoverInfo.product.size || "N/A"}
                </div>
              </div>
            </div>
          )}
      </CardContent>
    </Card>
  )
}
