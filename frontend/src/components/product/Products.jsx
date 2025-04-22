"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import api, { ENDPOINTS } from "@/api/api_url";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Archive, Eye, RefreshCcw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/DataTable";
import "../../css/product.css";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("active");

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();

      if (activeTab === "archived") {
        params.append("is_active", "false");
      } else {
        params.append("is_active", "true");
      }

      if (searchTerm) {
        params.append("search", searchTerm.trim());
      }

      const response = await api.get(`${ENDPOINTS.PRODUCTS}`, {
        params,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      }).catch(error => {
        // Handle specific backend errors
        if (error.response?.data?.detail?.includes('no such table')) {
          toast.error("Database configuration error - please contact admin");
        }
        throw error;
      });

      // Handle different response formats
      if (response.data?.results) {
        setProducts(response.data.results);
      } else if (Array.isArray(response.data)) {
        setProducts(response.data);
      } else if (typeof response.data === 'object') {
        const productsArray = Object.values(response.data)
          .filter(item => typeof item !== 'string');
        setProducts(productsArray);
      } else {
        console.error("Unexpected response format:", response.data);
        setProducts([]);
      }
    } catch (error) {
      console.error("Error fetching products:", error?.response?.data || error);
      // Don't show toast if it's a 401 - the interceptor will handle it
      if (error.response?.status !== 401) {
        toast.error("Failed to fetch products");
      }
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, searchTerm]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, searchTerm ? 300 : 0);

    return () => clearTimeout(timer);
  }, [fetchProducts, searchTerm]);

  const handleArchiveProduct = async (product) => {
    try {
      await api.patch(`${ENDPOINTS.PRODUCTS}${product.id}/`, {
        is_active: !product.is_active,
      });

      toast.success(`Product ${product.is_active ? "archived" : "restored"} successfully`);
      fetchProducts();
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product");
    }
  };

  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setIsViewDialogOpen(true);
  };

  const handleEditProduct = (product) => {
    console.log("Edit product", product);
  };

  const columns = [
    {
      key: "name",
      header: "Product Name",
      sortable: true,
    },
    {
      key: "product_id",
      header: "SKU",
      sortable: true,
    },
    {
      key: "stock_quantity",
      header: "Stock",
      sortable: true,
      render: (product) => (
        <Badge variant={product.stock_quantity <= product.reorder_level ? "destructive" : "outline"}>
          {product.stock_quantity}
        </Badge>
      ),
    },
    {
      key: "price",
      header: "Price",
      sortable: true,
      render: (product) => `₱${parseFloat(product.price).toFixed(2)}`,
    },
    {
      key: "created_at",
      header: "Date Added",
      sortable: true,
      render: (product) => new Date(product.created_at).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "Actions",
      className: "actions-column",
      render: (product) => (
        <div className="actions-container">
          {!product.is_active ? (
            <>
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
                onClick={() => handleArchiveProduct(product)}
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
                onClick={() => handleViewProduct(product)}
                className="action-button"
              >
                <Eye className="action-icon" />
                <span className="sr-only">View</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditProduct(product)}
                className="action-button"
              >
                <Edit className="action-icon" />
                <span className="sr-only">Edit</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleArchiveProduct(product)}
                className="action-button"
              >
                <Archive className="action-icon" />
                <span className="sr-only">Archive</span>
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

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

          <TabsContent value="active" className="tab-content">
            <DataTable
              columns={columns}
              data={products}
              emptyMessage="No products found"
              loadingMessage="Loading products..."
              showCheckboxes={false}
            />
          </TabsContent>

          <TabsContent value="archived" className="tab-content">
            <DataTable
              columns={columns}
              data={products}
              emptyMessage="No archived products found"
              loadingMessage="Loading products..."
              showCheckboxes={false}
            />
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
                <p>
                  <strong>SKU:</strong> {selectedProduct.product_id}
                </p>
                <p>
                  <strong>Price:</strong> ₱{parseFloat(selectedProduct.price).toFixed(2)}
                </p>
                <p>
                  <strong>Stock:</strong> {selectedProduct.stock_quantity}
                </p>
                <p>
                  <strong>Description:</strong> {selectedProduct.description}
                </p>
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