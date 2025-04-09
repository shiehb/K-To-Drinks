"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  Package
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const initialInventory = [
  {
    id: 1,
    name: "Cola",
    quantity: 150,
    unit: "bottles",
    reorderPoint: 50,
    lastRestocked: "2024-04-08",
    status: "active",
  },
  {
    id: 2,
    name: "Lemon Juice",
    quantity: 30,
    unit: "bottles",
    reorderPoint: 40,
    lastRestocked: "2024-04-07",
    status: "active",
  },
  {
    id: 3,
    name: "Coffee Beans",
    quantity: 25,
    unit: "kg",
    reorderPoint: 30,
    lastRestocked: "2024-04-05",
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

  const renderActionButtons = (item) => (
    <TableCell className="actions-cell">
      <div className="actions-container">
        {item.status === "archived" ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleViewItem(item)}
              className="action-button"
            >
              <Info className="action-icon" />
              <span className="sr-only">View</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => console.log("Restore item")}
              className="restore-button"
            >
              <RefreshCcw className="action-icon" />
              Restore
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
              <Info className="action-icon" />
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
    </TableCell>
  )

  return (
    <Card className="inventory-management-card">
      <CardHeader className="card-header">
        <div className="header-container">
          <CardTitle className="card-title">
            <Package className="title-icon" />
            Inventory Management
          </CardTitle>
          <Button size="sm" className="add-button">
            <Plus className="icon" />
            Add Item
          </Button>
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
            <div className="search-container">
              <div className="search-input-container">
                <Search className="search-icon" />
                <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
          </div>

          <TabsContent value="active">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Restocked</TableHead>
                  <TableHead className="actions-column">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="empty-cell">
                      No items found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInventory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>
                        {getStatusBadge(item.quantity, item.reorderPoint)}
                      </TableCell>
                      <TableCell>{new Date(item.lastRestocked).toLocaleDateString()}</TableCell>
                      {renderActionButtons(item)}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="archived">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Restocked</TableHead>
                  <TableHead className="actions-column">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="empty-cell">
                      No archived items found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInventory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>
                        {getStatusBadge(item.quantity, item.reorderPoint)}
                      </TableCell>
                      <TableCell>{new Date(item.lastRestocked).toLocaleDateString()}</TableCell>
                      {renderActionButtons(item)}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
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
                <strong>Quantity:</strong> {selectedItem.quantity} {selectedItem.unit}
              </div>
              <div className="detail-row">
                <strong>Reorder Point:</strong> {selectedItem.reorderPoint} {selectedItem.unit}
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