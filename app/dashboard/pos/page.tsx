"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { addSampleDishes, createOrder, getDishesForPOS, processPayment } from "@/lib/actions/pos-actions"
import { Loader2, Plus, Minus, Trash2, Receipt, CreditCard, Banknote, PlusCircle } from "lucide-react"

interface Dish {
  id: number
  name: string
  description: string
  price: number
  image_url: string | null
}

interface CartItem {
  dish_id: number
  name: string
  price: number
  quantity: number
  notes: string
}

export default function POSPage() {
  const [dishes, setDishes] = useState<Dish[]>([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState("")
  const [tableNumber, setTableNumber] = useState("")
  const [orderNotes, setOrderNotes] = useState("")
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash")
  const [referenceNumber, setReferenceNumber] = useState("")
  const [processingOrder, setProcessingOrder] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [currentOrder, setCurrentOrder] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [addingSampleDishes, setAddingSampleDishes] = useState(false)

  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    async function loadDishes() {
      setLoading(true)
      const result = await getDishesForPOS()
      if (result.dishes) {
        setDishes(result.dishes)
      }
      setLoading(false)
    }

    loadDishes()
  }, [])

  const handleAddSampleDishes = async () => {
    setAddingSampleDishes(true)
    const result = await addSampleDishes()
    setAddingSampleDishes(false)

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: result.message,
      })
      // Reload dishes
      const dishesResult = await getDishesForPOS()
      if (dishesResult.dishes) {
        setDishes(dishesResult.dishes)
      }
    }
  }

  const addToCart = (dish: Dish) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.dish_id === dish.id)

      if (existingItem) {
        return prevCart.map((item) => (item.dish_id === dish.id ? { ...item, quantity: item.quantity + 1 } : item))
      } else {
        return [
          ...prevCart,
          {
            dish_id: dish.id,
            name: dish.name,
            price: dish.price,
            quantity: 1,
            notes: "",
          },
        ]
      }
    })
  }

  const updateQuantity = (dishId: number, change: number) => {
    setCart((prevCart) => {
      return prevCart.map((item) => {
        if (item.dish_id === dishId) {
          const newQuantity = Math.max(1, item.quantity + change)
          return { ...item, quantity: newQuantity }
        }
        return item
      })
    })
  }

  const updateNotes = (dishId: number, notes: string) => {
    setCart((prevCart) => {
      return prevCart.map((item) => {
        if (item.dish_id === dishId) {
          return { ...item, notes }
        }
        return item
      })
    })
  }

  const removeFromCart = (dishId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.dish_id !== dishId))
  }

  const clearCart = () => {
    setCart([])
    setCustomerName("")
    setTableNumber("")
    setOrderNotes("")
  }

  const handleCreateOrder = async () => {
    if (cart.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your order",
        variant: "destructive",
      })
      return
    }

    setProcessingOrder(true)

    const orderData = {
      customer_name: customerName || undefined,
      table_number: tableNumber || undefined,
      notes: orderNotes || undefined,
      items: cart.map((item) => ({
        dish_id: item.dish_id,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes || undefined,
      })),
    }

    const result = await createOrder(orderData)

    setProcessingOrder(false)

    if (result.error) {
      toast({
        title: "Error creating order",
        description: result.error,
        variant: "destructive",
      })
    } else {
      setCurrentOrder(result.order)
      setPaymentDialogOpen(true)
      toast({
        title: "Order created",
        description: `Order #${result.order.id} created successfully`,
      })
    }
  }

  const handleProcessPayment = async () => {
    if (!currentOrder) return

    setProcessingPayment(true)

    const paymentData = {
      amount: currentOrder.total,
      method: paymentMethod,
      reference_number: referenceNumber || undefined,
    }

    const result = await processPayment(currentOrder.id, paymentData)

    setProcessingPayment(false)

    if (result.error) {
      toast({
        title: "Error processing payment",
        description: result.error,
        variant: "destructive",
      })
    } else {
      setPaymentDialogOpen(false)
      toast({
        title: "Payment processed",
        description: `Payment for Order #${currentOrder.id} processed successfully`,
      })

      // Clear cart and reset form
      clearCart()

      // Navigate to receipt page
      router.push(`/dashboard/pos/receipt/${currentOrder.id}`)
    }
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = subtotal * 0.16 // 16% tax
  const total = subtotal + tax

  const filteredDishes = dishes.filter((dish) => {
    return (
      searchQuery === "" ||
      dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dish.description && dish.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  })

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">POS System</h1>
        <div className="flex gap-2">
          <Input
            placeholder="Search dishes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
          {dishes.length === 0 && !loading && (
            <Button onClick={handleAddSampleDishes} disabled={addingSampleDishes} className="whitespace-nowrap">
              {addingSampleDishes ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <PlusCircle className="h-4 w-4 mr-2" />
              )}
              Add Sample Dishes
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-1 gap-4 h-full overflow-hidden">
        {/* Left side - Menu items */}
        <div className="w-2/3 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
              </div>
            ) : dishes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <p className="text-neutral-500 mb-4">No dishes found. Add some dishes to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredDishes.map((dish) => (
                  <Card
                    key={dish.id}
                    className="cursor-pointer hover:border-warm-500 transition-all"
                    onClick={() => addToCart(dish)}
                  >
                    <CardContent className="p-4 flex flex-col">
                      <div className="h-24 bg-neutral-100 rounded-md mb-2 flex items-center justify-center overflow-hidden">
                        {dish.image_url ? (
                          <img
                            src={dish.image_url || "/placeholder.svg"}
                            alt={dish.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="text-neutral-400 text-xs text-center">No image</div>
                        )}
                      </div>
                      <h3 className="font-medium line-clamp-1">{dish.name}</h3>
                      <p className="text-sm text-neutral-500 line-clamp-2 mb-2">{dish.description}</p>
                      <p className="font-bold text-warm-600">${dish.price.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right side - Order summary */}
        <div className="w-1/3 flex flex-col bg-white rounded-lg border shadow-sm overflow-hidden">
          <div className="p-4 bg-neutral-50 border-b">
            <h2 className="text-xl font-bold">Current Order</h2>
          </div>

          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer name"
                />
              </div>
              <div>
                <Label htmlFor="tableNumber">Table Number</Label>
                <Input
                  id="tableNumber"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Table #"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="orderNotes">Order Notes</Label>
              <Textarea
                id="orderNotes"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Special instructions..."
                rows={2}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 border-t border-b">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">No items in cart</div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.dish_id} className="flex flex-col p-3 bg-neutral-50 rounded-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-neutral-500">${item.price.toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.dish_id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.dish_id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500"
                          onClick={() => removeFromCart(item.dish_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Input
                        placeholder="Item notes..."
                        value={item.notes}
                        onChange={(e) => updateNotes(item.dish_id, e.target.value)}
                        className="text-xs h-7"
                      />
                    </div>
                    <div className="text-right mt-2 font-medium">${(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (16%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={clearCart}
                disabled={cart.length === 0 || processingOrder}
              >
                Clear
              </Button>
              <Button
                className="flex-1 bg-warm-500 hover:bg-warm-600"
                onClick={handleCreateOrder}
                disabled={cart.length === 0 || processingOrder}
              >
                {processingOrder ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Receipt className="h-4 w-4 mr-2" />
                )}
                Place Order
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex justify-between text-lg">
              <span>Total Amount:</span>
              <span className="font-bold">${currentOrder?.total.toFixed(2)}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={paymentMethod === "cash" ? "default" : "outline"}
                className={paymentMethod === "cash" ? "bg-warm-500 hover:bg-warm-600" : ""}
                onClick={() => setPaymentMethod("cash")}
              >
                <Banknote className="h-4 w-4 mr-2" />
                Cash
              </Button>
              <Button
                variant={paymentMethod === "card" ? "default" : "outline"}
                className={paymentMethod === "card" ? "bg-warm-500 hover:bg-warm-600" : ""}
                onClick={() => setPaymentMethod("card")}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Card
              </Button>
            </div>

            {paymentMethod === "card" && (
              <div>
                <Label htmlFor="referenceNumber">Reference Number</Label>
                <Input
                  id="referenceNumber"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="Card transaction reference"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleProcessPayment}
              disabled={processingPayment || (paymentMethod === "card" && !referenceNumber)}
              className="bg-warm-500 hover:bg-warm-600"
            >
              {processingPayment ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              Complete Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
