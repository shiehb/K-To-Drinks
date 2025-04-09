"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Archive, Info, RefreshCcw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import "../../css/product.css";

const initialProducts = [
  {
    id: 1,
    name: "Organic Apples",
    sku: "FRUIT-001",
    stock: 120,
    price: 2.99,
    description: "Fresh, organic apples sourced from local farms.",
    image: "/placeholder.svg?height=100&width=100",
    status: "active",
  },
  {
    id: 2,
    name: "Whole Grain Bread",
    sku: "BAKERY-001",
    stock: 45,
    price: 3.49,
    description: "Freshly baked whole grain bread made with organic flour.",
    image: "/placeholder.svg?height=100&width=100",
    status: "active",
  },
  {
    id: 3,
    name: "Milk (1 Gallon)",
    sku: "DAIRY-001",
    stock: 78,
    price: 4.29,
    description: "Farm-fresh whole milk, pasteurized and homogenized.",
    image: "/placeholder.svg?height=100&width=100",
    status: "archived",
  },
];

export default function ProductsPage() {
  const [products, setProducts] = useState(initialProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("active"); // State to track active tab

  const filteredProducts = products.filter(
    (product) =>
      (activeTab === "archived" ? product.status === "archived" : product.status === "active") &&
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setIsViewDialogOpen(true);
  };

  const renderActionButtons = (product) => (
    <TableCell className="actions-cell">
      <div className="actions-container">
        {product.status === "archived" ? (
          // Buttons for archived products
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleViewProduct(product)}
              className="action-button"
            >
              <Info className="action-icon" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => console.log("Restore product")}
              className="restore-button"
            >
              <RefreshCcw className="action-icon" />
              Restore
            </Button>
          </>
        ) : (
          // Buttons for active products
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleViewProduct(product)}
              className="action-button"
            >
              <Info className="action-icon" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => console.log("Edit product")}
              className="action-button"
            >
              <Edit className="action-icon" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => console.log("Archive product")}
              className="action-button"
            >
              <Archive className="action-icon" />
            </Button>
          </>
        )}
      </div>
    </TableCell>
  );

  return (
    <Card className="product-management-card">
      <CardHeader className="card-header">
        <div className="header-container">
          <CardTitle className="card-title">Product Management</CardTitle>
          <Button size="sm" className="add-button">
            <Plus className="icon" />
            Add Product
          </Button>
        </div>
      </CardHeader>
      <CardContent className="card-content">
        <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab} className="tabs-container">
          <div className="tabs-header">
            <TabsList className="tabs-list">
              <TabsTrigger value="active" className="tab">
                Active Products
              </TabsTrigger>
              <TabsTrigger value="archived" className="tab">
                Archived Products
              </TabsTrigger>
            </TabsList>
            <div className="search-container">
              <Search className="search-icon" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <TabsContent value="active" className="tab-content">
            <Table className="product-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="empty-cell">
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.sku}</TableCell>
                      <TableCell>
                        <Badge>{product.stock}</Badge>
                      </TableCell>
                      <TableCell>₱{product.price.toFixed(2)}</TableCell>
                      {renderActionButtons(product)}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="archived" className="tab-content">
            <Table className="product-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="empty-cell">
                      <div className="loading-indicator">
                        No archived products found
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.sku}</TableCell>
                      <TableCell>
                        <Badge>{product.stock}</Badge>
                      </TableCell>
                      <TableCell>₱{product.price.toFixed(2)}</TableCell>
                      <TableCell className="actions-cell">
                        <div className="actions-container">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewProduct(product)}
                            className="action-button"
                          >
                            <Info className="action-icon" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => console.log("Restore product")}
                            className="restore-button"
                          >
                            <RefreshCcw className="action-icon" />
                            Restore
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* View Product Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div>
              <h3>{selectedProduct.name}</h3>
              <p>SKU: {selectedProduct.sku}</p>
              <p>Price: ₱{selectedProduct.price.toFixed(2)}</p>
              <p>Stock: {selectedProduct.stock}</p>
              <p>{selectedProduct.description}</p>
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
  );
}