"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Search, Plus, Minus, ShoppingCart, CreditCard, Trash2, X } from "lucide-react"
import type { Product, CartItem } from "@/lib/supabase/client"
import { getProducts } from "@/lib/data/products"
import { createSale } from "@/lib/data/sales"

const categories = ["All", "Beverages", "Food", "Ice Cream"]

export function POSInterface() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await getProducts()
      setProducts(data)
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existingItem = prev.find((item) => item.id === product.id)
      if (existingItem) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1
      }]
    })
  }

  const updateQuantity = (id: number, change: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(0, item.quantity + change) }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id))
  }

  const clearCart = () => {
    setCart([])
  }

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const handleCheckout = async (paymentMethod: 'Cash' | 'Card') => {
    if (cart.length === 0) return

    try {
      setIsProcessing(true)

      // Create sale in database
      await createSale(cart, paymentMethod)

      // Show success message
      const total = getTotalAmount() * 1.085
      alert(`Transaction completed!\nTotal: ₱${total.toFixed(2)}\nPayment: ${paymentMethod}`)

      // Clear cart and close dialog
      clearCart()
      setIsCheckoutOpen(false)

      // Reload products to update stock
      await loadProducts()
    } catch (error) {
      console.error('Error processing checkout:', error)
      alert('Failed to process transaction. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading products...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Product Grid Section */}
      <div className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Point of Sale</h1>
          <p className="text-muted-foreground">Select products to add to cart</p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                size="sm"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="aspect-square mb-3 bg-muted rounded-lg overflow-hidden">
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-medium text-sm mb-1 line-clamp-2">{product.name}</h3>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-primary">₱{product.price.toFixed(2)}</span>
                  <Badge variant="outline" className="text-xs">
                    {product.stock} left
                  </Badge>
                </div>
                <Button
                  onClick={() => addToCart(product)}
                  className="w-full"
                  size="sm"
                  disabled={product.stock === 0}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add to Cart
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Cart Section */}
      <div className="w-80 bg-card border-l border-border p-6 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Cart</h2>
          {cart.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearCart}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-auto space-y-3 mb-6">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Your cart is empty</p>
            </div>
          ) : (
            cart.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{item.name}</h4>
                    <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.id)} className="h-6 w-6 p-0">
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, -1)}
                        className="h-6 w-6 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="h-6 w-6 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="font-bold text-primary">₱{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Cart Summary */}
        {cart.length > 0 && (
          <div className="space-y-4">
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Items ({getTotalItems()})</span>
                <span className="font-medium">₱{getTotalAmount().toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Tax (8.5%)</span>
                <span className="font-medium">₱{(getTotalAmount() * 0.085).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                <span>Total</span>
                <span className="text-primary">₱{(getTotalAmount() * 1.085).toFixed(2)}</span>
              </div>
            </div>

            <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
              <DialogTrigger asChild>
                <Button className="w-full" size="lg" disabled={isProcessing}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Checkout
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Complete Transaction</DialogTitle>
                  <DialogDescription>Review your order and complete the payment</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Order Summary</h4>
                    {cart.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>
                          {item.name} x{item.quantity}
                        </span>
                        <span>₱{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="border-t mt-2 pt-2 font-bold">
                      Total: ₱{(getTotalAmount() * 1.085).toFixed(2)}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleCheckout('Cash')}
                      className="flex-1"
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Processing...' : 'Cash Payment'}
                    </Button>
                    <Button
                      onClick={() => handleCheckout('Card')}
                      variant="outline"
                      className="flex-1 bg-transparent"
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Processing...' : 'Card Payment'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  )
}