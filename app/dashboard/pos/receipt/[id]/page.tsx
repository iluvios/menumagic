"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getOrderById } from "@/lib/actions/pos-actions"
import { Loader2, Printer, ArrowLeft, CheckCircle } from "lucide-react"

export default function ReceiptPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<any>(null)
  const [orderItems, setOrderItems] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const orderId = Number.parseInt(params.id)

  useEffect(() => {
    async function loadOrder() {
      setLoading(true)
      const result = await getOrderById(orderId)

      if (result.error) {
        setError(result.error)
      } else {
        setOrder(result.order)
        setOrderItems(result.orderItems)
        setPayments(result.payments)
      }

      setLoading(false)
    }

    loadOrder()
  }, [orderId])

  const handlePrint = () => {
    window.print()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)]">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => router.push("/dashboard/pos")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to POS
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Receipt</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/dashboard/pos")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to POS
          </Button>
          <Button onClick={handlePrint} className="print:hidden">
            <Printer className="h-4 w-4 mr-2" />
            Print Receipt
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Order #{order.id}</CardTitle>
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
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-neutral-500">Date</p>
                <p>{formatDate(order.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Payment Method</p>
                <p>
                  {order.payment_method
                    ? order.payment_method.charAt(0).toUpperCase() + order.payment_method.slice(1)
                    : "Not paid"}
                </p>
              </div>
              {order.customer_name && (
                <div>
                  <p className="text-sm text-neutral-500">Customer</p>
                  <p>{order.customer_name}</p>
                </div>
              )}
              {order.table_number && (
                <div>
                  <p className="text-sm text-neutral-500">Table</p>
                  <p>#{order.table_number}</p>
                </div>
              )}
            </div>

            {order.notes && (
              <div>
                <p className="text-sm text-neutral-500">Notes</p>
                <p>{order.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orderItems.map((item) => (
              <div key={item.id} className="flex justify-between border-b pb-2 last:border-0">
                <div>
                  <p className="font-medium">{item.dish_name}</p>
                  <p className="text-sm text-neutral-500">
                    {item.quantity} x ${item.price.toFixed(2)}
                    {item.notes && <span className="block italic">{item.notes}</span>}
                  </p>
                </div>
                <p className="font-medium">${(item.quantity * item.price).toFixed(2)}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (16%)</span>
              <span>${order.tax.toFixed(2)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-${order.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {payments.map((payment) => (
                <div key={payment.id} className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-neutral-500">Method</p>
                    <p>{payment.method.charAt(0).toUpperCase() + payment.method.slice(1)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">Amount</p>
                    <p>${payment.amount.toFixed(2)}</p>
                  </div>
                  {payment.reference_number && (
                    <div>
                      <p className="text-sm text-neutral-500">Reference Number</p>
                      <p>{payment.reference_number}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-neutral-500">Date</p>
                    <p>{formatDate(payment.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-center mt-8 mb-4 print:block hidden">
        <p className="text-sm text-neutral-500">Thank you for your business!</p>
      </div>
    </div>
  )
}
