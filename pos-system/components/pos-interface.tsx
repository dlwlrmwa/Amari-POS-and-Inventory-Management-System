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
import { Search, Plus, Minus, ShoppingCart, CreditCard, Trash2, X, Printer, Banknote } from "lucide-react"
import type { Product, CartItem, Sale } from "@/lib/supabase/client"
import { getProducts } from "@/lib/data/products"
import { createSale } from "@/lib/data/sales"
import { getStoreSettings } from "@/lib/data/settings"
import { useAuth } from "@/lib/auth"
import { formatDateManilaTime } from "@/lib/utils"

const categories = ["All", "Beverages", "Food", "Ice Cream"]

export function POSInterface() {
  const { user } = useAuth()
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

  // Cash payment state
  const [cashReceived, setCashReceived] = useState<string>("")
  const [change, setChange] = useState<number>(0)

  // Left-handed mode preference
  const [isLeftHanded, setIsLeftHanded] = useState(false)

  const receiptRef = useRef<HTMLDivElement>(null)

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
    // Load left-handed preference from localStorage
    const savedLeftHanded = localStorage.getItem("isLeftHanded") === "true"
    setIsLeftHanded(savedLeftHanded)
  }, [])

  // Calculate change when cash received changes
  useEffect(() => {
    const cash = parseFloat(cashReceived) || 0
    const total = getTotalAmount()
    setChange(cash - total)
  }, [cashReceived, cart])

  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const addToCart = async (product: Product) => {
    if (product.stock <= 0) {
      alert(`Sorry, "${product.name}" is out of stock!`)
      return
    }

    setCart((prev) => {
      const existingItem = prev.find((item) => item.id === product.id)
      if (existingItem) {
        const newQuantity = existingItem.quantity + 1
        if (newQuantity > product.stock) {
          alert(`Cannot add more "${product.name}". Only ${product.stock} available in stock!`)
          return prev
        }
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: newQuantity } : item
        )
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1, image: product.image }]
    })
  }

  const updateQuantity = async (id: number, change: number) => {
    const cartItem = cart.find(item => item.id === id)
    if (!cartItem) return

    const product = products.find(p => p.id === id)
    if (!product) return

    const newQuantity = cartItem.quantity + change

    if (newQuantity <= 0) {
      setCart(prev => prev.filter(item => item.id !== id))
      return
    }

    if (newQuantity > product.stock) {
      alert(`Cannot add more "${product.name}". Only ${product.stock} available in stock!`)
      return
    }

    setCart(prev =>
      prev.map(item =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    )
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

  const handleAddCashAmount = (amount: number) => {
    const currentCash = parseFloat(cashReceived) || 0
    const newCash = currentCash + amount
    setCashReceived(newCash.toString())
  }

  const handleCheckout = async () => {
    if (cart.length === 0) return

    // For cash payments, validate cash received
    if (paymentType === "Cash") {
      const cash = parseFloat(cashReceived) || 0
      const total = getTotalAmount()
      if (cash < total) {
        alert("Insufficient cash received!")
        return
      }
    }

    try {
      setIsProcessing(true)
      const saleData = await createSale(
        cart,
        paymentType,
        paymentType === "Cash" ? parseFloat(cashReceived) : undefined,
        paymentType === "E-Payment" ? ePaymentOption : undefined,
        user ? parseInt(user.id) : undefined
      )
      setReceipt(saleData)
      setIsReceiptModalOpen(true)
      clearCart()
      setCashReceived("")
      setChange(0)
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

  const handlePrintReceipt = () => {
    if (!receipt) {
      alert('Receipt data not found')
      return
    }

    const printWindow = window.open('', '', 'width=300,height=600')
    if (!printWindow) {
      alert('Cannot open print window. Please allow popups.')
      return
    }

    // Create receipt HTML content for 58mm thermal printer
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box border-width: 1px; }
          body { 
            font-family: 'Courier New', monospace; 
            font-size: 11px; 
            width: 58mm; 
            margin: 0 auto;
            padding: 0;
          }
          .receipt { 
            width: 58mm; 
            background: white; 
            color: black;
            padding: 5mm;
          }
          .text-center { text-align: center; }
          .mb-3 { margin-bottom: 8px; }
          .mb-2 { margin-bottom: 6px; }
          .mb-1 { margin-bottom: 4px; }
          .mt-2 { margin-top: 6px; }
          .mt-3 { margin-top: 8px; }
          .border-dashed { 
            border-top: 1px dashed #000; 
            margin: 6px 0;
          }
          .py-2 { padding: 6px 0; }
          .space-y-1 > * { margin-bottom: 3px; }
          .space-y-2 > * { margin-bottom: 5px; }
          .font-bold { font-weight: bold; }
          .font-semibold { font-weight: 600; }
          .text-lg { font-size: 12px; }
          .text-xl { font-size: 13px; font-weight: bold; }
          .text-xs { font-size: 9px; }
          .flex { display: flex; }
          .justify-between { justify-content: space-between; }
          .items-center { align-items: center; }
          p { margin: 0; line-height: 1.3; }
          .item-row { 
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
            word-wrap: break-word;
          }
          .item-name { flex: 1; }
          .item-price { text-align: right; margin-left: 4px; white-space: nowrap; }
          .item-detail { font-size: 9px; color: #666; }
          @media print {
            body { width: 58mm; margin: 0; padding: 0; }
            .receipt { width: 58mm; padding: 5mm; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <!-- Header -->
          <div class="text-center mb-3">
            <p class="text-xl mb-1">Amari's Scoops</p>
            <p class="text-xs mb-1">&amp; Savours</p>
            <p class="text-xs">221 R.Castillo St.</p>
            <p class="text-xs">Davao City 8000</p>
            <p class="text-xs font-semibold mt-2">Official Receipt</p>
          </div>

          <!-- Transaction Info -->
          <div class="border-dashed"></div>
          <div class="space-y-1 mb-3 text-xs">
            <div class="flex justify-between">
              <span>ID:</span>
              <span class="font-semibold">${receipt?.id}</span>
            </div>
            <div class="flex justify-between">
              <span>Date:</span>
              <span>${receipt?.date}</span>
            </div>
            <div class="flex justify-between">
              <span>Time:</span>
              <span>${receipt?.time}</span>
            </div>
            <div class="flex justify-between">
              <span>Payment:</span>
              <span>${receipt?.paymentMethod}${receipt?.paymentSubMethod ? ` (${receipt.paymentSubMethod})` : ''}</span>
            </div>
          </div>

          <!-- Items -->
          <div class="border-dashed"></div>
          <div class="py-2 space-y-2">
            ${receipt?.items?.map((item: any) => `
              <div class="item-row">
                <div class="item-name">${item.productName}</div>
                <div class="item-price">₱${item.subtotal.toFixed(2)}</div>
              </div>
              <div class="item-detail text-xs" style="text-align: right;">
                ${item.quantity}x @ ₱${item.unitPrice.toFixed(2)}
              </div>
            `).join('')}
          </div>

          <!-- Totals -->
          <div class="border-dashed"></div>
          <div class="space-y-1 text-xs mb-2">
            <div class="flex justify-between">
              <span>Subtotal:</span>
              <span>₱${getVatBreakdown(receipt?.totalAmount || 0).subtotal.toFixed(2)}</span>
            </div>
            <div class="flex justify-between">
              <span>VAT (12%):</span>
              <span>₱${getVatBreakdown(receipt?.totalAmount || 0).vatAmount.toFixed(2)}</span>
            </div>
            <div class="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>₱${receipt?.totalAmount.toFixed(2)}</span>
            </div>
            ${receipt?.paymentMethod === "Cash" && receipt?.cashReceived ? `
              <div class="border-dashed mt-2"></div>
              <div class="flex justify-between">
                <span>Cash:</span>
                <span>₱${receipt.cashReceived.toFixed(2)}</span>
              </div>
              <div class="flex justify-between font-semibold">
                <span>Change:</span>
                <span>₱${(receipt.change || 0).toFixed(2)}</span>
              </div>
            ` : ''}
          </div>

          <!-- Footer -->
          <div class="text-center mt-3">
            <p class="text-xs">Thank you for your</p>
            <p class="text-xs">purchase!</p>
          </div>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(receiptHTML)
    printWindow.document.close()

    setTimeout(() => {
      printWindow.print()
    }, 250)
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
          <div className="space-y-5">
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
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle>Complete Transaction</DialogTitle>
                  <DialogDescription>Review your order and select a payment method.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto p-2">
                  {/* Left Side - Receipt Preview */}
                  <div className="space-y-3 flex flex-col">
                    <h4 className="font-medium text-center">Receipt Preview</h4>
                    <div ref={receiptRef} className="p-8 text-sm bg-white text-black border rounded-lg shadow-sm">
                      <div className="text-center mb-4">
                        <h2 className="text-xl font-bold">Amari's Scoops & Savours</h2>
                        <p className="text-sm">221 R.Castillo Street, Davao City, Davao del Sur, 8000</p>
                        <p className="font-semibold mt-2">Official Receipt</p>
                      </div>
                      <div className="mb-4 space-y-1">
                        <p><strong>Date:</strong> {formatDateManilaTime()}</p>
                        <p><strong>Payment:</strong> {paymentType} {paymentType === 'E-Payment' ? `(${ePaymentOption})` : ''}</p>
                      </div>
                      <div className="border-y py-3 mb-4 space-y-2">
                        {cart.map((item: CartItem) => (
                          <div key={item.id} className="flex justify-between items-center">
                            <div className="flex items-center">
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-xs text-gray-600">({item.quantity} x ₱{item.price.toFixed(2)})</p>
                              </div>
                            </div>
                            <p className="font-semibold">₱{(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal:</span>
                          <span>₱{getVatBreakdown(getTotalAmount()).subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>VAT (12%):</span>
                          <span>₱{getVatBreakdown(getTotalAmount()).vatAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t">
                          <span>Total:</span>
                          <span>₱{getTotalAmount().toFixed(2)}</span>
                        </div>
                        {paymentType === "Cash" && cashReceived && (
                          <>
                            <div className="flex justify-between text-sm mt-2">
                              <span>Cash Received:</span>
                              <span>₱{parseFloat(cashReceived).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm font-semibold">
                              <span>Change:</span>
                              <span>₱{change.toFixed(2)}</span>
                            </div>
                          </>
                        )}
                      </div>
                      <p className="text-center mt-6 text-xs">Thank you for your purchase!</p>
                    </div>
                  </div>

                  {/* Right Side - Payment Method */}
                  <div className="space-y-4 flex flex-col">
                    <h4 className="font-medium text-lg">Payment Method</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant={paymentType === 'Cash' ? 'default' : 'outline'} onClick={() => setPaymentType('Cash')} size="lg">Cash</Button>
                      <Button variant={paymentType === 'E-Payment' ? 'default' : 'outline'} onClick={() => setPaymentType('E-Payment')} size="lg">E-Payment</Button>
                    </div>

                    {paymentType === 'Cash' && (
                      <div className="p-6 border rounded-lg space-y-4 bg-muted/30">
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium mb-2 block">Cash Received</label>
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                placeholder="Enter amount"
                                value={cashReceived}
                                onChange={(e) => setCashReceived(e.target.value)}
                                className="text-lg flex-1"
                              />
                              <Button
                                variant="destructive"
                                onClick={() => setCashReceived("")}
                                className="px-3"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setCashReceived(getTotalAmount().toString())}
                              className="h-12 col-span-3"
                            >
                              Exact Amount: ₱{getTotalAmount().toFixed(2)}
                            </Button>
                            {[50, 100, 150, 200, 500, 1000].map((amount) => (
                              <Button
                                key={amount}
                                variant="outline"
                                onClick={() => handleAddCashAmount(amount)}
                                className="h-12"
                              >
                                <Banknote className="h-4 w-4 mr-1" />
                                ₱{amount}
                              </Button>
                            ))}
                          </div>

                          {cashReceived && (
                            <div className="p-4 bg-background rounded-lg space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm">Total Amount:</span>
                                <span className="font-semibold">₱{getTotalAmount().toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm">Cash Received:</span>
                                <span className="font-semibold">₱{parseFloat(cashReceived).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center text-lg border-t pt-2">
                                <span className="font-bold">Change:</span>
                                <span className={`font-bold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  ₱{change.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {paymentType === 'E-Payment' && (
                      <div className="p-6 border rounded-lg space-y-4 bg-muted/30">
                        <div className="grid grid-cols-2 gap-3">
                          <Button size="default" variant={ePaymentOption === 'GCash' ? 'default' : 'outline'} onClick={() => setEPaymentOption('GCash')}>GCash</Button>
                          <Button size="default" variant={ePaymentOption === 'Maya' ? 'default' : 'outline'} onClick={() => setEPaymentOption('Maya')}>Maya</Button>
                        </div>
                        <div className="flex justify-center">
                          <div className="relative">
                            <img
                              src={ePaymentOption === 'GCash' ? qrCodeUrls.gcashQrUrl || '/gcash-qr.png' : qrCodeUrls.mayaQrUrl || '/maya-qr.png'}
                              alt={`${ePaymentOption} QR Code`}
                              className="w-64 h-64 rounded-lg bg-white p-2 shadow-md object-contain"
                              onError={(e) => {
                                const img = e.target as HTMLImageElement;
                                img.src = ePaymentOption === 'GCash' ? '/gcash-qr.png' : '/maya-qr.png';
                              }}
                            />
                          </div>
                        </div>
                        <p className="text-center text-sm text-muted-foreground">
                          Scan the QR code to complete payment
                        </p>
                      </div>
                    )}

                    <div className="flex-1"></div>

                    {/* Confirm button at bottom of right side */}
                    <div className="mt-auto pt-4 flex justify-center">
                      <Button
                        onClick={handleCheckout}
                        disabled={isProcessing || (paymentType === "Cash" && (!cashReceived || change < 0))}
                        className="w-auto px-8"
                        size="lg"
                      >
                        {isProcessing ? "Processing..." : (paymentType === 'Cash' ? 'Confirm Cash Payment' : 'Confirm Payment')}
                      </Button>
                    </div>
                  </div>
                </div>
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
        {receipt?.paymentMethod === "Cash" && receipt?.cashReceived && (
          <>
            <div className="flex justify-between mt-2">
              <span>Cash Received:</span>
              <span>₱{receipt.cashReceived.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Change:</span>
              <span>₱{(receipt.change || 0).toFixed(2)}</span>
            </div>
          </>
        )}
      </div>
      <p className="text-center mt-6 text-xs">Thank you for your purchase!</p>
    </div>
  )

  return (
    <div className={`flex flex-col lg:flex-row lg:h-screen bg-background ${isLeftHanded ? 'lg:flex-row-reverse' : ''}`}>
      {/* Product Grid Section */}
      <div className="flex-1 p-4 md:p-6 lg:p-8 flex flex-col min-w-0 h-full overflow-hidden">
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

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 pr-2">
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

      {/* Large screens: persistent cart sidebar */}

      <div className={`hidden lg:flex w-full lg:w-80 xl:w-96 bg-card flex-col h-screen max-h-screen ${isLeftHanded ? 'border-r border-border' : 'border-l border-border'}`}>
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
            <Button onClick={handlePrintReceipt}><Printer className="h-6 w-6 mr-3" /> Print Receipt</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}