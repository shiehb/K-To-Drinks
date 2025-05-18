"use client"

import { useState, useEffect } from "react"
import { ArrowUpRight, Calendar, Package, TrendingUp, Truck, AlertTriangle, XCircle } from "lucide-react"
import "../css/dashboard.css"
import "@/css/all.css"

// Import shadcn components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function Dashboard() {
  const [deliveryData, setDeliveryData] = useState([])
  const [stockAlerts, setStockAlerts] = useState([])

  // Mock sales data
  const mockSalesData = [
    {
      id: 1,
      title: "Today's Delivery",
      currentSales: 35,
      previousSales: 30,
      text: "Delivery",
      icon: <Truck className="h-5 w-5" />,
    },
    {
      id: 2,
      title: "Monthly Delivery",
      currentSales: 712,
      previousSales: 430,
      text: "Delivery",
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      id: 3,
      title: "Delivery Issues",
      currentSales: 1,
      previousSales: 4,
      text: "Report",
      icon: <Package className="h-5 w-5" />,
    },
    {
      id: 4,
      title: "Total Delivery",
      currentSales: 2532,
      previousSales: 1812,
      text: "Delivery",
      icon: <TrendingUp className="h-5 w-5" />,
    },
  ]

  // Mock recent orders
  const recentOrders = [
    {
      id: "ORD-001",
      customer: "John Smith",
      store: "Downtown Market",
      items: 3,
      total: "₱6856.00",
      status: "delivered",
    },
    {
      id: "ORD-002",
      customer: "Sarah Johnson",
      store: "Westside Shop",
      items: 5,
      total: "₱2637.50",
      status: "in-transit",
    },
    {
      id: "ORD-003",
      customer: "Michael Brown",
      store: "Central Store",
      items: 2,
      total: "₱5489.99",
      status: "pending",
    },
    {
      id: "ORD-004",
      customer: "Emily Davis",
      store: "Northside Market",
      items: 7,
      total: "₱3465.00",
      status: "delivered",
    },
    {
      id: "ORD-005",
      customer: "David Wilson",
      store: "Eastside Shop",
      items: 1,
      total: "₱4565.99",
      status: "in-transit",
    },
  ]

  // Mock stock alerts data
  const mockStockAlerts = [
    {
      id: "PROD-101",
      name: "Coca-Cola 1.5L",
      currentStock: 2,
      threshold: 10,
      status: "low"
    },
    {
      id: "PROD-205",
      name: "Pepsi 2L",
      currentStock: 0,
      threshold: 5,
      status: "out"
    },
    {
      id: "PROD-312",
      name: "Sprite 1L",
      currentStock: 3,
      threshold: 15,
      status: "low"
    },
    {
      id: "PROD-418",
      name: "Royal 500ml",
      currentStock: 0,
      threshold: 20,
      status: "out"
    }
  ]

  // Calculate delivery metrics
  useEffect(() => {
    // Update data with calculated values
    setDeliveryData(
      mockSalesData.map((item) => ({
        ...item,
        description: `This is the ${item.title.toLowerCase()}.`,
        value: item.currentSales.toLocaleString(),
        percentChange: (((item.currentSales - item.previousSales) / item.previousSales) * 100).toFixed(1),
      })),
    )
    
    // Set stock alerts
    setStockAlerts(mockStockAlerts)
  }, [])


  return (
    <div className="dashboard-container">
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsContent value="overview" className="space-y-4 tab-content">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {deliveryData.map((item) => (
              <Card key={item.id} className="card">
                <CardHeader className="card-header flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                  <div className="h-4 w-4 text-muted-foreground">{item.icon}</div>
                </CardHeader>
                <CardContent className="card-content">
                  <div className="text-2xl font-bold">{item.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {item.percentChange > 0 ? (
                      <span className="text-green-600">+{item.percentChange}%</span>
                    ) : (
                      <span className="text-red-600">{item.percentChange}%</span>
                    )}{" "}
                    from last period
                  </p>
                </CardContent>
              </Card>
            ))}
            
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4 card">
              <CardHeader className="card-header">
                <CardTitle className="card-title">Recent Orders</CardTitle>
                <CardDescription className="card-description">
                  You have {recentOrders.length} orders in the last 24 hours.
                </CardDescription>
              </CardHeader>
              <CardContent className="card-content p-0">
                <div className="table-container">
                  <Table className="table">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Store</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.id}</TableCell>
                          <TableCell>{order.customer}</TableCell>
                          <TableCell>{order.store}</TableCell>
                          <TableCell className="text-right">{order.total}</TableCell>
                          <TableCell className="text-right">
                            <Badge
                              className={`badge ${
                                order.status === "delivered"
                                  ? "badge-success"
                                  : order.status === "in-transit"
                                    ? "badge-default"
                                    : "badge-secondary"
                              }`}
                            >
                              {order.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <CardFooter className="card-footer">
              </CardFooter>
            </Card>
            <Card className="col-span-3 card">
              <CardHeader className="card-header">
                <CardTitle className="card-title">Stock Alerts</CardTitle>
                <CardDescription className="card-description">
                  Products that need immediate attention.
                </CardDescription>
              </CardHeader>
              <CardContent className="card-content">
                <div className="alerts-container">
                  {stockAlerts.length === 0 ? (
                    <div className="no-alerts">
                      <p>No stock alerts at this time.</p>
                    </div>
                  ) : (
                    <div className="alerts-list">
                      {stockAlerts.map((alert) => (
                        <div key={alert.id} className={`alert-item ${alert.status}`}>
                          <div className="alert-icon">
                            {alert.status === "out" ? (
                              <XCircle className="h-5 w-5 text-red-500" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-yellow-500" />
                            )}
                          </div>
                          <div className="alert-content">
                            <div className="alert-title">{alert.name}</div>
                            <div className="alert-details">
                              <span className="product-id">{alert.id}</span>
                              <span className="stock-info">
                                Stock: {alert.currentStock} (Threshold: {alert.threshold})
                              </span>
                            </div>
                          </div>
                          <div className="button-group">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="add-button"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                          </Button>
                        </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="card-footer">
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}