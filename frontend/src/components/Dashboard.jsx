"use client"

import { useState, useEffect } from "react"
import { ArrowUpRight, Calendar, Package, TrendingUp, Truck, Users } from "lucide-react"
import "../css/dashboard.css"

// Import shadcn components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function Dashboard() {
  const [selectedItem, setSelectedItem] = useState(null)
  const [deliveryData, setDeliveryData] = useState([]) // State to hold delivery data

  // Mock sales data (replace this with actual API calls or dynamic data)
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
  }, [])

  const handleViewDetails = (item) => {
    setSelectedItem(item)
  }

  return (
    <div className="dashboard-container">
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="tabs-list">
          <TabsTrigger value="overview" className="tab">
            Overview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="tab">
            Analytics
          </TabsTrigger>
          <TabsTrigger value="reports" className="tab">
            Reports
          </TabsTrigger>
        </TabsList>
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
                <Button variant="outline" className="button button-outline button-sm">
                  Previous
                </Button>
                <Button className="button button-primary button-sm">View All Orders</Button>
              </CardFooter>
            </Card>
            <Card className="col-span-3 card">
              <CardHeader className="card-header">
                <CardTitle className="card-title">Delivery Performance</CardTitle>
                <CardDescription className="card-description">
                  Delivery efficiency metrics for the current month.
                </CardDescription>
              </CardHeader>
              <CardContent className="card-content">
                <div className="metrics-container">
                  <div className="metric-item">
                    <div className="metric-indicator">
                      <div className="metric-dot bg-primary"></div>
                      <span className="metric-label">On-time Delivery</span>
                    </div>
                    <div className="metric-value">94%</div>
                  </div>
                  <div className="metric-item">
                    <div className="metric-indicator">
                      <div className="metric-dot bg-orange-500"></div>
                      <span className="metric-label">Delayed Delivery</span>
                    </div>
                    <div className="metric-value">5%</div>
                  </div>
                  <div className="metric-item">
                    <div className="metric-indicator">
                      <div className="metric-dot bg-red-500"></div>
                      <span className="metric-label">Failed Delivery</span>
                    </div>
                    <div className="metric-value">1%</div>
                  </div>

                  <div className="driver-container">
                    <h4 className="driver-title">Top Performing Drivers</h4>
                    <div className="driver-list">
                      <div className="driver-item">
                        <div className="driver-avatar">
                          <Users className="h-4 w-4" />
                        </div>
                        <div className="driver-info">
                          <p className="driver-name">Jericho Urbano</p>
                          <p className="driver-stat">98% on-time rate</p>
                        </div>
                        <Button variant="ghost" size="icon" className="button button-ghost button-icon ml-auto">
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="driver-item">
                        <div className="driver-avatar">
                          <Users className="h-4 w-4" />
                        </div>
                        <div className="driver-info">
                          <p className="driver-name">Harry Justine Zabate</p>
                          <p className="driver-stat">97% on-time rate</p>
                        </div>
                        <Button variant="ghost" size="icon" className="button button-ghost button-icon ml-auto">
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="card-footer">
                <Button variant="outline" className="button button-outline w-full button-sm">
                  View Detailed Report
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4 tab-content">
          <Card className="card">
            <CardHeader className="card-header">
              <CardTitle className="card-title">Analytics</CardTitle>
              <CardDescription className="card-description">
                View detailed analytics about your delivery operations.
              </CardDescription>
            </CardHeader>
            <CardContent className="card-content">
              <div className="placeholder">Analytics content will appear here</div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reports" className="space-y-4 tab-content">
          <Card className="card">
            <CardHeader className="card-header">
              <CardTitle className="card-title">Reports</CardTitle>
              <CardDescription className="card-description">
                Access and download reports for your business.
              </CardDescription>
            </CardHeader>
            <CardContent className="card-content">
              <div className="placeholder">Reports content will appear here</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

