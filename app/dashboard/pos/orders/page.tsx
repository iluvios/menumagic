"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getOrders, updateOrderStatus } from "@/lib/actions/pos-actions"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Search, Receipt, CheckCircle, XCircle, Clock } from "lucide-react"

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<{ total: number; pages: number; current: number }>({
    total: 0,
    pages: 0,
    current: 1,
  })
  const [activeTab, setActiveTab] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null)

  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    loadOrders()
  }, [pagination.current, activeTab])

  async function loadOrders() {
    setLoading(true)
    const status = activeTab !== "all" ? activeTab : undefined
    const result = await getOrders(pagination.current, 20, status)

    if (result.error) {
      toast({
        title: "Error loading orders",
        description: result.error,
        variant: "destructive",
      })
    } else {
      setOrders(result.orders)
      setPagination(result.pagination)
    }

    setLoading(false)
  }

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    setUpdatingOrderId(orderId)

    const result = await updateOrderStatus(orderId, newStatus)

    if (result.error) {
      toast({
        title: "Error updating order",
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Order updated",
        description: `Order #${orderId} status changed to ${newStatus}`,
      })

      // Refresh orders
      loadOrders()
    }

    setUpdatingOrderId(null)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const filteredOrders = searchQuery
    ? orders.filter(
        (order) =>
          order.id.toString().includes(searchQuery) ||
          (order.customer_name && order.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (order.table_number && order.table_number.includes(searchQuery)),
      )
    : orders

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Orders History</h1>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
            <Input
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-64"
            />
          </div>
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64">
                <p className="text-neutral-500">No orders found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      <div className="flex-1 p-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-bold">Order #{order.id}</h3>
                            <p className="text-sm text-neutral-500">{formatDate(order.created_at)}</p>
                          </div>
                          <div className="flex items-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                order.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : order.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                              }`}
                            >
                              {order.status === "completed" && <CheckCircle className="h-3 w-3 mr-1" />}
                              {order.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                              {order.status === "cancelled" && <XCircle className="h-3 w-3 mr-1" />}
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div>
                            <p className="text-xs text-neutral-500">Customer</p>
                            <p>{order.customer_name || "—"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-500">Table</p>
                            <p>{order.table_number || "—"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-500">Payment</p>
                            <p>
                              {order.payment_method
                                ? order.payment_method.charAt(0).toUpperCase() + order.payment_method.slice(1)
                                : "Not paid"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-500">Total</p>
                            <p className="font-bold">${order.total.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-neutral-50 p-4 flex flex-row md:flex-col justify-between items-center md:items-stretch gap-2 border-t md:border-t-0 md:border-l">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboard/pos/receipt/${order.id}`)}
                        >
                          <Receipt className="h-4 w-4 mr-2" />
                          View
                        </Button>

                        {order.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleStatusChange(order.id, "completed")}
                              disabled={updatingOrderId === order.id}
                            >
                              {updatingOrderId === order.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4 mr-2" />
                              )}
                              Complete
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => handleStatusChange(order.id, "cancelled")}
                              disabled={updatingOrderId === order.id}
                            >
                              {updatingOrderId === order.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <XCircle className="h-4 w-4 mr-2" />
                              )}
                              Cancel
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center mt-6">
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination((prev) => ({ ...prev, current: prev.current - 1 }))}
                  disabled={pagination.current === 1 || loading}
                >
                  Previous
                </Button>

                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={pagination.current === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPagination((prev) => ({ ...prev, current: page }))}
                    disabled={loading}
                    className={pagination.current === page ? "bg-warm-500 hover:bg-warm-600" : ""}
                  >
                    {page}
                  </Button>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination((prev) => ({ ...prev, current: prev.current + 1 }))}
                  disabled={pagination.current === pagination.pages || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
