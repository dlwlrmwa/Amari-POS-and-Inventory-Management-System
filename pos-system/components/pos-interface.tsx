"use client"

import { useState, useEffect, useRef } from "react"
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
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Search, Plus, Minus, ShoppingCart, CreditCard, Trash2, X, Printer } from "lucide-react"
import type { Product, CartItem, Sale } from "@/lib/supabase/client"
import { getProducts } from "@/lib/data/products"
import { createSale } from "@/lib/data/sales"
import { getStoreSettings } from "@/lib/data/settings"
import { useReactToPrint } from "react-to-print"

const categories = ["All", "Beverages", "Food", "Ice Cream"]

export function POSInterface() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [cart, setCart] = useState<CartItem[]>([])

  // Checkout and Receipt State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isCartSheetOpen, setIsCartSheetOpen] = useState(false)
  const [receipt, setReceipt] = useState<Sale | null>(null)
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)

  // Payment State
  const [paymentType, setPaymentType] = useState<"Cash" | "E-Payment">("Cash")
  const [ePaymentOption, setEPaymentOption] = useState<"GCash" | "Maya">("GCash")
  const [qrCodeUrls, setQrCodeUrls] = useState({ gcashQrUrl: "", mayaQrUrl: "" })

  const receiptRef = useRef(null)

  const loadProducts = async () => {
    try {
      setLoading(true)
      const [productData, settingsData] = await Promise.all([
        getProducts(),
        getStoreSettings(),
      ])
      setProducts(productData)
      setQrCodeUrls(settingsData)
    } catch (error) {
      console.error("Error loading initial data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const addToCart = (product: Product) => {
    // Check if product is out of stock
    if (product.stock <= 0) {
      alert(`Sorry, "${product.name}" is out of stock!`)
      return
    }

    setCart((prev: CartItem[]) => {
      const existingItem = prev.find((item: CartItem) => item.id === product.id)

      // Check if adding would exceed stock
      if (existingItem) {
        const newQuantity = existingItem.quantity + 1
        if (newQuantity > product.stock) {
          alert(`Cannot add more "${product.name}". Only ${product.stock} available in stock!`)
          return prev // Return unchanged cart
        }
        return prev.map((item: CartItem) =>
          item.id === product.id ? { ...item, quantity: newQuantity } : item
        )
      }

      // First time adding - check if stock is available
      if (product.stock < 1) {
        alert(`Sorry, "${product.name}" is out of stock!`)
        return prev
      }

      return [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1, image: product.image }]
    })
  }

  const updateQuantity = (id: number, change: number) => {
    setCart((prev: CartItem[]) => {
      const item = prev.find((item: CartItem) => item.id === id)
      if (!item) return prev

      const newQuantity = item.quantity + change

      // Find the product to check stock
      const product = products.find((p: Product) => p.id === id)

      if (change > 0 && product) {
        // Increasing quantity - check stock
        if (newQuantity > product.stock) {
          alert(`Cannot add more "${item.name}". Only ${product.stock} available in stock!`)
          return prev // Return unchanged cart
        }
      }

      return prev
        .map((item: CartItem) =>
          item.id === id ? { ...item, quantity: Math.max(0, newQuantity) } : item
        )
        .filter((item: CartItem) => item.quantity > 0)
    })
  }

  const removeFromCart = (id: number) => {
    setCart((prev: CartItem[]) => prev.filter((item: CartItem) => item.id !== id))
  }

  const clearCart = () => setCart([])

  const getTotalAmount = () => cart.reduce((total: number, item: CartItem) => total + item.price * item.quantity, 0)
  const VAT_RATE = 0.12
  const VAT_INCLUSIVE_MULTIPLIER = 1 / (1 + VAT_RATE)
  const getVatBreakdown = (total: number) => {
    const subtotal = total * VAT_INCLUSIVE_MULTIPLIER
    const vatAmount = total - subtotal
    return { subtotal, vatAmount }
  }
  const getTotalItems = () => cart.reduce((total: number, item: CartItem) => total + item.quantity, 0)

  const handleCheckout = async () => {
    if (cart.length === 0) return
    try {
      setIsProcessing(true)
      const saleData = await createSale(
        cart,
        paymentType,
        paymentType === "E-Payment" ? ePaymentOption : undefined
      )
      setReceipt(saleData)
      setIsReceiptModalOpen(true)
      clearCart()
      setIsCheckoutOpen(false)
      setIsCartSheetOpen(false)
      await loadProducts()
    } catch (error) {
      console.error("Error processing checkout:", error)
      alert("Failed to process transaction. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePrintReceipt = useReactToPrint({
    content: () => receiptRef.current,
  } as any)

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

  const CartContent = () => (
    <>
      <div className="flex-1 overflow-auto space-y-3 p-6">
        {cart.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Your cart is empty</p>
          </div>
        ) : (
          cart.map((item: CartItem) => (
            <Card key={item.id}>
              <CardContent className="p-3 flex items-center space-x-3">
                <img src={item.image || "/placeholder.svg"} alt={item.name} className="w-12 h-12 rounded-md object-cover bg-muted" />
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-medium text-sm leading-tight">{item.name}</h4>
                    <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.id)} className="h-6 w-6 p-0">
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => updateQuantity(item.id, -1)} className="h-6 w-6 p-0">
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                      <Button variant="outline" size="sm" onClick={() => updateQuantity(item.id, 1)} className="h-6 w-6 p-0">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="font-bold text-primary text-sm">₱{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {cart.length > 0 && (
        <div className="p-6 border-t">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center text-lg font-bold mb-2">
                <span>Total</span>
                <span className="text-primary">₱{getTotalAmount().toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>VAT-Exempt</span>
                <span>₱{getVatBreakdown(getTotalAmount()).subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>VAT (12%)</span>
                <span>₱{getVatBreakdown(getTotalAmount()).vatAmount.toFixed(2)}</span>
              </div>
            </div>

            <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
              <DialogTrigger asChild>
                <Button className="w-full" size="lg" disabled={isProcessing}>
                  <CreditCard className="h-4 w-4 mr-2" /> Checkout
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Complete Transaction</DialogTitle>
                  <DialogDescription>Review your order and select a payment method.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Order Summary */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Order Summary</h4>
                    <div className="bg-muted p-3 rounded-lg max-h-60 overflow-y-auto space-y-2">
                      {cart.map((item: CartItem) => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2">
                            <img src={item.image || "/placeholder.svg"} alt={item.name} className="w-8 h-8 rounded-md object-cover bg-background" />
                            <span>{item.name} x{item.quantity}</span>
                          </div>
                          <span>₱{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t mt-2 pt-2 font-bold flex justify-between">
                      <span>Total:</span>
                      <span>₱{getTotalAmount().toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Payment Method</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant={paymentType === 'Cash' ? 'default' : 'outline'} onClick={() => setPaymentType('Cash')}>Cash</Button>
                      <Button variant={paymentType === 'E-Payment' ? 'default' : 'outline'} onClick={() => setPaymentType('E-Payment')}>E-Payment</Button>
                    </div>

                    {paymentType === 'E-Payment' && (
                      <div className="p-4 border rounded-lg space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                          <Button size="sm" variant={ePaymentOption === 'GCash' ? 'default' : 'outline'} onClick={() => setEPaymentOption('GCash')}>GCash</Button>
                          <Button size="sm" variant={ePaymentOption === 'Maya' ? 'default' : 'outline'} onClick={() => setEPaymentOption('Maya')}>Maya</Button>
                        </div>
                        <div className="flex justify-center">
                          <img
                            src={ePaymentOption === 'GCash' ? qrCodeUrls.gcashQrUrl : qrCodeUrls.mayaQrUrl}
                            alt={`${ePaymentOption} QR Code`}
                            className="w-40 h-40 rounded-lg bg-white p-1"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button onClick={handleCheckout} disabled={isProcessing} className="w-full">
                    {isProcessing ? "Processing..." : (paymentType === 'Cash' ? 'Confirm Cash Payment' : 'Confirm Payment')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}
    </>
  )

  const ReceiptContent = () => (
    <div ref={receiptRef} className="p-6 text-sm bg-white text-black">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold">Amari's Scoops & Savours</h2>
        <p>221 R.Castillo Street, Davao City, Davao del Sur, 8000</p>
        <p>Official Receipt</p>
      </div>
      <div className="mb-4">
        <p><strong>Transaction ID:</strong> {receipt?.id}</p>
        <p><strong>Date:</strong> {receipt?.date} {receipt?.time}</p>
        <p><strong>Payment:</strong> {receipt?.paymentMethod} {receipt?.paymentSubMethod ? `(${receipt.paymentSubMethod})` : ''}</p>
      </div>
      <div className="border-y py-2 mb-4">
        {receipt?.items?.map((item: any) => (
          <div key={item.productId} className="flex justify-between items-center my-1">
            <div className="flex items-center">
              <div>
                <p>{item.productName}</p>
                <p className="text-xs">({item.quantity} x ₱{item.unitPrice.toFixed(2)})</p>
              </div>
            </div>
            <p>₱{item.subtotal.toFixed(2)}</p>
          </div>
        ))}
      </div>
      <div>
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>₱{getVatBreakdown(receipt?.totalAmount || 0).subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>VAT (12%):</span>
          <span>₱{getVatBreakdown(receipt?.totalAmount || 0).vatAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-base mt-2">
          <span>Total:</span>
          <span>₱{receipt?.totalAmount.toFixed(2)}</span>
        </div>
      </div>
      <p className="text-center mt-6 text-xs">Thank you for your purchase!</p>
    </div>
  )

  return (
    <div className="flex flex-col lg:flex-row lg:h-screen bg-background">
      {/* Product Grid Section */}
      <div className="flex-1 p-4 md:p-6 lg:p-8 flex flex-col min-w-0">
        <div className="mb-4 md:mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">Point of Sale</h1>
          <p className="text-muted-foreground text-sm md:text-base">Select products to add to cart</p>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2 justify-start">
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

        <div className="flex-1 overflow-auto pb-24 lg:pb-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {filteredProducts.map((product: Product) => (
              <Card
                key={product.id}
                className={`cursor-pointer hover:shadow-md transition-shadow h-full ${product.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                onClick={() => product.stock > 0 && addToCart(product)}
              >
                <CardContent className="p-3 md:p-4 flex flex-col h-full relative">
                  <div className="aspect-square w-full mb-3 bg-muted rounded-lg overflow-hidden">
                    <img
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-medium text-sm md:text-sm mb-2 text-center line-clamp-2">
                    {product.name}
                  </h3>
                  <div className="flex-grow" />
                  <div className="flex flex-col items-center mt-auto mb-1">
                    <span className="text-base md:text-lg font-bold text-primary mb-1">
                      ₱{product.price.toFixed(2)}
                    </span>
                    <Badge
                      variant={product.stock > 0 ? "outline" : "destructive"}
                      className="text-xs px-2 py-0.5"
                    >
                      {product.stock > 0 ? `${product.stock} left` : "Out"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile + small tablet: floating sheet button */}
      <div className="lg:hidden">
        {cart.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 p-2 bg-card border-t border-border shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
            <Sheet open={isCartSheetOpen} onOpenChange={setIsCartSheetOpen}>
              <SheetTrigger asChild>
                <Button className="w-full h-16 flex justify-between items-center bg-primary text-primary-foreground hover:bg-primary/90 px-4">
                  <div className="flex items-center space-x-3 flex-1">
                    <Badge className="h-7 w-7 text-sm flex items-center justify-center bg-primary-foreground text-primary font-bold">
                      {getTotalItems()}
                    </Badge>
                    <div className="flex flex-1 justify-center">
                      <span className="text-primary-foreground font-medium text-base">View your cart</span>
                    </div>
                  </div>
                  <span className="font-semibold text-lg text-primary-foreground">
                    ₱{getTotalAmount().toFixed(2)}
                  </span>
                </Button>
              </SheetTrigger>
              <SheetContent className="flex flex-col p-0">
                <SheetHeader className="p-6 pb-4">
                  <SheetTitle>Cart</SheetTitle>
                </SheetHeader>
                <CartContent />
              </SheetContent>
            </Sheet>
          </div>
        )}
      </div>

      {/* large tablet & desktop: visible cart */}
      <div className="hidden lg:flex w-full lg:w-80 xl:w-96 bg-card border-l border-border flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">Cart</h2>
          {cart.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearCart}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CartContent />
      </div>

      {/* Receipt Modal */}
      <Dialog open={isReceiptModalOpen} onOpenChange={setIsReceiptModalOpen}>
        <DialogContent className="max-w-sm p-0">
          <ReceiptContent />
          <DialogFooter className="p-4 bg-muted sm:justify-between">
            <Button variant="outline" onClick={() => setIsReceiptModalOpen(false)}>Close</Button>
            <Button onClick={handlePrintReceipt}><Printer className="h-4 w-4 mr-2" /> Print Receipt</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}