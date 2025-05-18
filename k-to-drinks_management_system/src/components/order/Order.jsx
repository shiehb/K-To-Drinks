"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { toast } from "react-toastify"
import api, { ENDPOINTS } from "@/api/api_url"
import { Search, Plus, Printer, Eye, RefreshCcw, Check, X } from "lucide-react"
import jsPDF from "jspdf"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { DataTable } from "@/components/ui/DataTable"
import "@/css/all.css"

export default function OrderList() {
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState(null)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [viewOrder, setViewOrder] = useState(null)
  const inputRef = useRef(null)


  // Order form state
  const [orderForm, setOrderForm] = useState({
    customer_name: "",
    contact_number: "",
    delivery_address: "",
    notes: "",
    products: [],
    status: "pending"
  })

  // Product selection state
  const [availableProducts, setAvailableProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const params = new URLSearchParams()

      if (searchTerm) {
        params.append("search", searchTerm)
      }

      const response = await api.get(`${ENDPOINTS.ORDERS}?${params.toString()}`)

      if (!response.data) {
        throw new Error("No data received from server")
      }

      setOrders(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error("Error fetching orders:", error)
      setError(error.message || "Failed to fetch orders")
      toast.error(error.message || "Failed to fetch orders")
      setOrders([])
    } finally {
      setIsLoading(false)
    }
  }, [searchTerm])

  const fetchAvailableProducts = useCallback(async () => {
    try {
      const response = await api.get(ENDPOINTS.PRODUCTS)
      setAvailableProducts(response.data || [])
    } catch (error) {
      console.error("Error fetching products:", error)
      toast.error("Failed to fetch available products")
    }
  }, [])

  useEffect(() => {
    fetchOrders()
    fetchAvailableProducts()
  }, [fetchOrders, fetchAvailableProducts])

  const filteredOrders = useMemo(() => {
    if (!orders || orders.length === 0) return []

    return orders.filter((order) => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        return (
          order.customer_name?.toLowerCase().includes(searchLower) ||
          order.order_id?.toLowerCase().includes(searchLower) ||
          order.contact_number?.toLowerCase().includes(searchLower)
        )
      }
      return true
    })
  }, [orders, searchTerm])

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleFocus = () => {
    if (inputRef.current) {
      inputRef.current.select()
    }
  }

  const openOrderModal = () => {
    setOrderForm({
      customer_name: "",
      contact_number: "",
      delivery_address: "",
      notes: "",
      products: [],
      status: "pending"
    })
    setIsOrderModalOpen(true)
  }

  const addProductToOrder = () => {
    if (!selectedProduct || quantity < 1) {
      toast.error("Please select a product and valid quantity")
      return
    }

    // Check inventory
    const inventoryItem = availableProducts.find(p => p.id === selectedProduct.id)
    if (inventoryItem.stock < quantity) {
      toast.error(`Not enough stock available (${inventoryItem.stock} remaining)`)
      return
    }

    // Check if product already exists in order
    const existingProductIndex = orderForm.products.findIndex(p => p.product_id === selectedProduct.id)

    if (existingProductIndex >= 0) {
      // Update quantity if product already exists
      const updatedProducts = [...orderForm.products]
      updatedProducts[existingProductIndex].quantity += quantity
      setOrderForm({...orderForm, products: updatedProducts})
    } else {
      // Add new product to order
      setOrderForm({
        ...orderForm,
        products: [
          ...orderForm.products,
          {
            product_id: selectedProduct.id,
            name: selectedProduct.name,
            price: selectedProduct.price,
            size: selectedProduct.size,
            quantity: quantity
          }
        ]
      })
    }

    // Reset selection
    setSelectedProduct(null)
    setQuantity(1)
  }

  const removeProductFromOrder = (productId) => {
    setOrderForm({
      ...orderForm,
      products: orderForm.products.filter(p => p.product_id !== productId)
    })
  }

  const handleOrderSubmit = async (e) => {
    e.preventDefault()

    if (!orderForm.customer_name || orderForm.products.length === 0) {
      toast.error("Please fill in customer name and add at least one product")
      return
    }

    try {
      setIsLoading(true)
      const response = await api.post(ENDPOINTS.ORDERS, orderForm)

      if (!response.data) {
        throw new Error("No data received from server")
      }

      toast.success("Order created successfully!")
      setIsOrderModalOpen(false)
      fetchOrders()
      fetchAvailableProducts() // Refresh product inventory
    } catch (error) {
      console.error("Order creation error:", error)
      const errorMessage = error.response?.data?.message || error.response?.data?.detail || error.message || "Failed to create order"
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const generatePDF = (order) => {
    const doc = new jsPDF()

    doc.setFontSize(22)
    doc.setFont("helvetica", "bold")
    doc.text("K-TO-DRINKS TRADING", 105, 15, { align: "center" })

    doc.setFontSize(14)
    doc.setFont("helvetica", "italic")
    doc.text("Order Receipt", 105, 25, { align: "center" })

    doc.setLineWidth(0.5)
    doc.line(55, 30, 155, 30)

    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    
    // Order details
    let yPosition = 40
    doc.text(`Order ID: ${order.id}`, 20, yPosition)
    yPosition += 10
    doc.text(`Customer: ${order.customer_name}`, 20, yPosition)
    yPosition += 10
    doc.text(`Contact: ${order.contact_number || "N/A"}`, 20, yPosition)
    yPosition += 10
    doc.text(`Delivery Address: ${order.delivery_address || "N/A"}`, 20, yPosition)
    yPosition += 10
    doc.text(`Status: ${order.status}`, 20, yPosition)
    yPosition += 10
    doc.text(`Date: ${new Date(order.created_at).toLocaleString()}`, 20, yPosition)
    yPosition += 15

    // Products table header
    doc.setFont("helvetica", "bold")
    doc.text("Product", 20, yPosition)
    doc.text("Price", 120, yPosition)
    doc.text("Qty", 150, yPosition)
    doc.text("Total", 170, yPosition)
    yPosition += 10
    doc.line(20, yPosition, 190, yPosition)
    yPosition += 5

    // Products list
    doc.setFont("helvetica", "normal")
    let subtotal = 0
    order.products.forEach(product => {
      const productTotal = product.price * product.quantity
      subtotal += productTotal
      
      doc.text(product.name, 20, yPosition)
      doc.text(`₱${product.price.toFixed(2)}`, 120, yPosition)
      doc.text(`${product.quantity}`, 150, yPosition)
      doc.text(`₱${productTotal.toFixed(2)}`, 170, yPosition)
      yPosition += 10
    })

    // Total
    yPosition += 10
    doc.line(20, yPosition, 190, yPosition)
    yPosition += 10
    doc.setFont("helvetica", "bold")
    doc.text("Subtotal:", 150, yPosition)
    doc.text(`₱${subtotal.toFixed(2)}`, 170, yPosition)
    yPosition += 10

    doc.setFontSize(10)
    doc.setFont("helvetica", "italic")
    doc.text("Generated by K-To-Drinks Order Management System", 105, 280, { align: "center" })

    window.open(doc.output("bloburl"), "_blank")
  }

  const columns = [
    {
      key: "id",
      header: "Order ID",
      sortable: true,
      className: "font-medium",
    },
    {
      key: "customer_name",
      header: "Customer",
      sortable: true,
    },
    {
      key: "contact_number",
      header: "Contact",
      sortable: true,
      render: (order) => order.contact_number || "N/A",
    },
    {
      key: "products",
      header: "Items",
      render: (order) => (
        <div className="flex flex-wrap gap-1">
          {order.products.map((product, index) => (
            <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
              {product.name} ({product.quantity})
            </span>
          ))}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (order) => (
        <span className={`status-badge ${
          order.status === "completed" ? "bg-green-100 text-green-800" :
          order.status === "cancelled" ? "bg-red-100 text-red-800" :
          "bg-yellow-100 text-yellow-800"
        } px-2 py-1 rounded-full text-xs`}>
          {order.status}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Date",
      sortable: true,
      render: (order) => new Date(order.created_at).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (order) => (
        <div className="action-buttons-container">
          <button
            className="action-button"
            onClick={() => setViewOrder(order)}
            title="View"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            className="action-button"
            onClick={() => generatePDF(order)}
            title="Print"
          >
            <Printer className="h-4 w-4" />
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
        <Button onClick={() => fetchOrders()}>Try Again</Button>
      </div>
    )
  }

  return (
    <Card className="order-management-card">
      <CardHeader className="card-header">
        <div className="header-container">
          <div className="search-input-container">
            <Search className="search-icon" />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={handleSearch}
              onFocus={handleFocus}
              ref={inputRef}
              className="search-input w-full"
            />
          </div>
          <div className="button-group">
            <Button onClick={openOrderModal} size="sm" className="add-button">
              <Plus className="icon" />
              New Order
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="card-content">
        <DataTable
          columns={columns}
          data={filteredOrders}
          isLoading={isLoading}
          emptyMessage={searchTerm ? "No orders match your search" : "No orders found"}
          loadingMessage="Loading orders..."
        />

        {/* Order Creation Modal */}
        {isOrderModalOpen && (
          <div className="custom-modal-overlay">
            <div className="custom-modal">
              <h2 className="modal-title">Create New Order</h2>

              <form onSubmit={handleOrderSubmit} className="user-form">
                <div className="form-group">
                  <label htmlFor="customer_name" className="form-label">
                    Customer Name: <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="customer_name"
                    type="text"
                    value={orderForm.customer_name}
                    onChange={(e) => setOrderForm({...orderForm, customer_name: e.target.value})}
                    placeholder="Enter customer name"
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contact_number" className="form-label">
                    Contact Number:
                  </label>
                  <input
                    id="contact_number"
                    type="text"
                    value={orderForm.contact_number}
                    onChange={(e) => setOrderForm({...orderForm, contact_number: e.target.value})}
                    placeholder="Enter contact number"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="delivery_address" className="form-label">
                    Delivery Address:
                  </label>
                  <textarea
                    id="delivery_address"
                    value={orderForm.delivery_address}
                    onChange={(e) => setOrderForm({...orderForm, delivery_address: e.target.value})}
                    placeholder="Enter delivery address"
                    className="form-input"
                    rows={2}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="notes" className="form-label">
                    Notes:
                  </label>
                  <textarea
                    id="notes"
                    value={orderForm.notes}
                    onChange={(e) => setOrderForm({...orderForm, notes: e.target.value})}
                    placeholder="Enter order notes"
                    className="form-input"
                    rows={2}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Add Products:</label>
                  <div className="flex gap-2">
                    <select
                      value={selectedProduct?.id || ""}
                      onChange={(e) => {
                        const product = availableProducts.find(p => p.id === e.target.value)
                        setSelectedProduct(product || null)
                      }}
                      className="form-input flex-1"
                    >
                      <option value="">Select a product</option>
                      {availableProducts.map(product => (
                        <option 
                          key={product.id} 
                          value={product.id}
                          disabled={product.stock <= 0}
                        >
                          {product.name} ({product.size}) - ₱{product.price} ({product.stock} available)
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      max={selectedProduct?.stock || 1}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Math.min(selectedProduct?.stock || 1, parseInt(e.target.value) || 1)))}
                      className="form-input w-20"
                    />
                    <button
                      type="button"
                      onClick={addProductToOrder}
                      disabled={!selectedProduct}
                      className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Selected Products:</label>
                  {orderForm.products.length === 0 ? (
                    <p className="text-gray-500">No products added yet</p>
                  ) : (
                    <div className="border rounded divide-y">
                      {orderForm.products.map((product, index) => (
                        <div key={index} className="p-2 flex justify-between items-center">
                          <div>
                            <span className="font-medium">{product.name}</span>
                            <span className="text-sm text-gray-500 ml-2">({product.size})</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span>₱{product.price} × {product.quantity} = ₱{(product.price * product.quantity).toFixed(2)}</span>
                            <button
                              type="button"
                              onClick={() => removeProductFromOrder(product.product_id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="save-button"
                    disabled={isLoading || !orderForm.customer_name || orderForm.products.length === 0}
                  >
                    {isLoading ? "Processing..." : "Create Order"}
                  </button>

                  <button 
                    type="button" 
                    onClick={() => setIsOrderModalOpen(false)}
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

        {/* Order View Modal */}
        {viewOrder && (
          <div className="custom-modal-overlay">
            <div className="custom-modal max-w-2xl w-full">
              <div className="modal-header flex justify-between items-center mb-4 border-b pb-3">
                <div>
                  <h2 className="modal-title text-2xl font-bold text-gray-900 dark:text-white">Order Details</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Order ID: {viewOrder.id}</p>
                </div>
                <button
                  className="close-button p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => setViewOrder(null)}
                  aria-label="Close"
                  title="Close"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Customer Information</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Name:</span> {viewOrder.customer_name}</p>
                    <p><span className="font-medium">Contact:</span> {viewOrder.contact_number || "N/A"}</p>
                    <p><span className="font-medium">Delivery Address:</span> {viewOrder.delivery_address || "N/A"}</p>
                    <p><span className="font-medium">Status:</span> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                        viewOrder.status === "completed" ? "bg-green-100 text-green-800" :
                        viewOrder.status === "cancelled" ? "bg-red-100 text-red-800" :
                        "bg-yellow-100 text-yellow-800"
                      }`}>
                        {viewOrder.status}
                      </span>
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Order Information</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Order Date:</span> {new Date(viewOrder.created_at).toLocaleString()}</p>
                    <p><span className="font-medium">Notes:</span> {viewOrder.notes || "N/A"}</p>
                  </div>
                </div>
              </div>

              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Products</h3>
              <div className="border rounded divide-y mb-6">
                {viewOrder.products.map((product, index) => (
                  <div key={index} className="p-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.size}</p>
                    </div>
                    <div className="text-right">
                      <p>₱{product.price.toFixed(2)} × {product.quantity}</p>
                      <p className="font-medium">₱{(product.price * product.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center border-t pt-4">
                <div className="text-lg font-medium">
                  Total: ₱{viewOrder.products.reduce((sum, product) => sum + (product.price * product.quantity), 0).toFixed(2)}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => generatePDF(viewOrder)}
                    variant="outline"
                    size="sm"
                    className="export-button"
                  >
                    <Printer className="icon" />
                    Print Receipt
                  </Button>
                  <Button onClick={() => setViewOrder(null)} size="sm" className="cancel-button">
                    Close
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