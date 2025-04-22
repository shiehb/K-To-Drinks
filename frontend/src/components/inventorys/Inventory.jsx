"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Search,
  Edit,
  Archive,
  Info,
  RefreshCcw,
  AlertCircle,
  Package,
  Eye
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "@/components/ui/DataTable"

const initialInventory = [
  {
    id: 1,
    name: "Cola",
    sku: "BEV-001",
    quantity: 150,
    price: 45.99,
    unit: "bottles",
    reorderPoint: 50,
    lastRestocked: "2024-04-08",
    description: "Classic cola beverage in 330ml bottles",
    image: "/placeholder.svg?height=100&width=100",
    status: "active",
  },
  {
    id: 2,
    name: "Lemon Juice",
    sku: "BEV-002",
    quantity: 30,
    price: 35.50,
    unit: "bottles",
    reorderPoint: 40,
    lastRestocked: "2024-04-07",
    description: "Fresh lemon juice in 500ml bottles",
    image: "/placeholder.svg?height=100&width=100",
    status: "active",
  },
  {
    id: 3,
    name: "Coffee Beans",
    sku: "BEV-003",
    quantity: 25,
    price: 1200.00,
    unit: "kg",
    reorderPoint: 30,
    lastRestocked: "2024-04-05",
    description: "Premium roasted coffee beans",
    image: "/placeholder.svg?height=100&width=100",
    status: "archived",
  },
]

export default function Inventory() {
  const [inventory, setInventory] = useState(initialInventory)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedItem, setSelectedItem] = useState(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("active")

  const filteredInventory = inventory.filter(
    (item) =>
      (activeTab === "archived" ? item.status === "archived" : item.status === "active") &&
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleViewItem = (item) => {
    setSelectedItem(item)
    setIsViewDialogOpen(true)
  }

  const getStatusBadge = (quantity, reorderPoint) => {
    if (quantity <= 0) {
      return <Badge variant="destructive">Out of Stock</Badge>
    } else if (quantity <= reorderPoint) {
      return <Badge variant="warning">Low Stock</Badge>
    } else {
      return <Badge variant="success">In Stock</Badge>
    }
  }

  const columns = [
    {
      key: "name",
      header: "Product Name",
      sortable: true
    },
    {
      key: "sku",
      header: "SKU",
      sortable: true
    },
    {
      key: "quantity",
      header: "Stock",
      sortable: true,
      render: (item) => (
        <Badge variant="outline">{item.quantity}</Badge>
      )
    },
    {
      key: "price",
      header: "Price",
      sortable: true,
      render: (item) => `₱${item.price.toFixed(2)}`
    },
    {
      key: "lastRestocked",
      header: "Date Added",
      sortable: true,
      render: (item) => new Date(item.lastRestocked).toLocaleDateString("en-US")
    },
    {
      key: "actions",
      header: "Actions",
      className: "actions-column",
      render: (item) => (
        <div className="actions-container">
          {item.status === "archived" ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewItem(item)}
                className="action-button"
              >
                <Eye className="action-icon" />
                <span className="sr-only">View</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => console.log("Restore item")}
                className="action-button"
              >
                <RefreshCcw className="action-icon" />
                <span className="sr-only">Restore</span>
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewItem(item)}
                className="action-button"
              >
                <Eye className="action-icon" />
                <span className="sr-only">View</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => console.log("Edit item")}
                className="action-button"
              >
                <Edit className="action-icon" />
                <span className="sr-only">Edit</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => console.log("Archive item")}
                className="action-button"
              >
                <Archive className="action-icon" />
                <span className="sr-only">Archive</span>
              </Button>
            </>
          )}
        </div>
      )
    }
  ]

  return (
    <Card className="inventory-management-card">
      <CardHeader className="card-header">
        <div className="header-container">
          <div className="search-input-container">
            <div className="search-wrapper">
              <Search className="search-icon" />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
          <div className="button-group">
            <Button size="sm" className="add-button">
              <Plus className="icon" />
              Add Item
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="card-content">
        <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
          <div className="filter-container">
            <TabsList className="tabs-list">
              <TabsTrigger value="active" className="tab">
                Active Items
              </TabsTrigger>
              <TabsTrigger value="archived" className="tab">
                Archived Items
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="active">
            <DataTable 
              columns={columns}
              data={filteredInventory}
              emptyMessage="No items found"
              loadingMessage="Loading inventory..."
            />
          </TabsContent>

          <TabsContent value="archived">
            <DataTable 
              columns={columns}
              data={filteredInventory}
              emptyMessage="No archived items found"
              loadingMessage="Loading inventory..."
            />
          </TabsContent>
        </Tabs>
      </CardContent>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Item Details</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="item-details">
              <div className="detail-row">
                <strong>Name:</strong> {selectedItem.name}
              </div>
              <div className="detail-row">
                <strong>SKU:</strong> {selectedItem.sku}
              </div>
              <div className="detail-row">
                <strong>Price:</strong> ₱{selectedItem.price.toFixed(2)}
              </div>
              <div className="detail-row">
                <strong>Stock:</strong> {selectedItem.quantity} {selectedItem.unit}
              </div>
              <div className="detail-row">
                <strong>Description:</strong> {selectedItem.description}
              </div>
              <div className="detail-row">
                <strong>Last Restocked:</strong>{" "}
                {new Date(selectedItem.lastRestocked).toLocaleDateString()}
              </div>
              {selectedItem.quantity <= selectedItem.reorderPoint && (
                <div className="warning-message">
                  <AlertCircle className="warning-icon" />
                  Stock is below reorder point
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}