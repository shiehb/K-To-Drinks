"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Archive, Eye, RefreshCcw } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("active");
  const tableRef = useRef(null);

  const filteredProducts = products.filter(
    (product) =>
      (activeTab === "archived" ? product.status === "archived" : product.status === "active") &&
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setIsViewDialogOpen(true);
  };

  return (
    <Card className="product-management-card">
      <CardHeader className="card-header">
        <div className="header-container">
          <div className="search-input-container">
            <div className="search-wrapper">
              <Search className="search-icon" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
          <div className="button-group">
            <Button size="sm" className="add-button">
              <Plus className="icon" />
              Add Product
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="card-content">
        <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab} className="tabs-container">
          <div className="filter-container">
            <TabsList className="tabs-list">
              <TabsTrigger value="active" className="tab">
                Active Products
              </TabsTrigger>
              <TabsTrigger value="archived" className="tab">
                Archived Products
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="status-container">
            <div className="status-content">
              <div className="status-text">
                Showing <strong>{filteredProducts.length}</strong> of{" "}
                <strong>
                  {products.filter((product) =>
                    activeTab === "archived" ? product.status === "archived" : product.status === "active"
                  ).length}
                </strong>{" "}
                {activeTab} products
              </div>
            </div>
          </div>

          <TabsContent value="active" className="tab-content">
            <div className="table-container">
              <Table className="product-table" ref={tableRef}>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">Product Name</TableHead>
                    <TableHead className="text-center">SKU</TableHead>
                    <TableHead className="text-center">Stock</TableHead>
                    <TableHead className="text-center">Price</TableHead>
                    <TableHead className="text-center">Date Added</TableHead>
                    <TableHead className="actions-column text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        No products found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="text-center">{product.name}</TableCell>
                        <TableCell className="text-center">{product.sku}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{product.stock}</Badge>
                        </TableCell>
                        <TableCell className="text-center">₱{product.price.toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                          {new Date().toLocaleDateString("en-US")}
                        </TableCell>
                        <TableCell className="actions-cell text-center">
                          <div className="actions-container">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewProduct(product)}
                              className="action-button"
                            >
                              <Eye className="action-icon" />
                              <span className="sr-only">View</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => console.log("Edit product")}
                              className="action-button"
                            >
                              <Edit className="action-icon" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => console.log("Archive product")}
                              className="action-button"
                            >
                              <Archive className="action-icon" />
                              <span className="sr-only">Archive</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="archived" className="tab-content">
            {/* Similar table structure for archived products */}
          </TabsContent>
        </Tabs>

        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="dialog-content">
            <DialogHeader>
              <DialogTitle>Product Details</DialogTitle>
            </DialogHeader>
            {selectedProduct && (
              <div className="product-details">
                <h3>{selectedProduct.name}</h3>
                <p><strong>SKU:</strong> {selectedProduct.sku}</p>
                <p><strong>Price:</strong> ₱{selectedProduct.price.toFixed(2)}</p>
                <p><strong>Stock:</strong> {selectedProduct.stock}</p>
                <p><strong>Description:</strong> {selectedProduct.description}</p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}