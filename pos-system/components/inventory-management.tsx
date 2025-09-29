"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Edit, Trash2, Package, AlertTriangle, TrendingUp } from "lucide-react"

interface Product {
  id: number
  name: string
  price: number
  category: string
  stock: number
  minStock: number
  sku: string
  image: string
}

// Mock inventory data
const initialProducts: Product[] = [
  {
    id: 1,
    name: "Coffee Beans Premium",
    price: 15.99,
    category: "Beverages",
    stock: 45,
    minStock: 20,
    sku: "CB001",
    image: "/pile-of-coffee-beans.png",
  },
  {
    id: 2,
    name: "Wireless Headphones",
    price: 99.99,
    category: "Electronics",
    stock: 23,
    minStock: 10,
    sku: "WH002",
    image: "/wireless-headphones.png",
  },
  {
    id: 3,
    name: "Organic Tea Set",
    price: 24.99,
    category: "Beverages",
    stock: 31,
    minStock: 15,
    sku: "TS003",
    image: "/tea-set.jpg",
  },
  {
    id: 4,
    name: "Notebook Premium",
    price: 12.99,
    category: "Stationery",
    stock: 67,
    minStock: 25,
    sku: "NB004",
    image: "/open-notebook-desk.png",
  },
  {
    id: 5,
    name: "Bluetooth Speaker",
    price: 79.99,
    category: "Electronics",
    stock: 18,
    minStock: 20,
    sku: "BS005",
    image: "/bluetooth-speaker.png",
  },
  {
    id: 6,
    name: "Green Tea Bags",
    price: 8.99,
    category: "Beverages",
    stock: 89,
    minStock: 50,
    sku: "GT006",
    image: "/green-tea-bags.jpg",
  },
  {
    id: 7,
    name: "Pen Set",
    price: 19.99,
    category: "Stationery",
    stock: 34,
    minStock: 15,
    sku: "PS007",
    image: "/elegant-pen-set.png",
  },
  {
    id: 8,
    name: "Smartphone Case",
    price: 29.99,
    category: "Electronics",
    stock: 56,
    minStock: 30,
    sku: "SC008",
    image: "/colorful-phone-case-display.png",
  },
  {
    id: 9,
    name: "Premium Water Bottle",
    price: 25.99,
    category: "Beverages",
    stock: 10,
    minStock: 3,
    sku: "WB009",
    image: "/reusable-water-bottle.png",
  },
]

const categories = ["All", "Beverages", "Electronics", "Stationery"]

export function InventoryManagement() {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: "",
    price: 0,
    category: "Beverages",
    stock: 0,
    minStock: 0,
    sku: "",
    image: "",
  })

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const lowStockProducts = products.filter((product) => product.stock <= product.minStock)

  const handleAddProduct = () => {
    if (newProduct.name && newProduct.price && newProduct.sku) {
      const product: Product = {
        id: Math.max(...products.map((p) => p.id)) + 1,
        name: newProduct.name,
        price: newProduct.price,
        category: newProduct.category || "Beverages",
        stock: newProduct.stock || 0,
        minStock: newProduct.minStock || 0,
        sku: newProduct.sku,
        image: newProduct.image || "/placeholder.svg",
      }
      setProducts([...products, product])
      setNewProduct({
        name: "",
        price: 0,
        category: "Beverages",
        stock: 0,
        minStock: 0,
        sku: "",
        image: "",
      })
      setIsAddDialogOpen(false)
    }
  }

  const handleEditProduct = () => {
    if (editingProduct) {
      setProducts(products.map((p) => (p.id === editingProduct.id ? editingProduct : p)))
      setEditingProduct(null)
    }
  }

  const handleDeleteProduct = (id: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      setProducts(products.filter((p) => p.id !== id))
    }
  }

  const handleRestock = (id: number, quantity: number) => {
    setProducts(products.map((p) => (p.id === id ? { ...p, stock: p.stock + quantity } : p)))
  }

  const getStockStatus = (product: Product) => {
    if (product.stock === 0) return { label: "Out of Stock", variant: "destructive" as const }
    if (product.stock <= product.minStock) return { label: "Low Stock", variant: "destructive" as const }
    return { label: "In Stock", variant: "default" as const }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventory Management</h1>
          <p className="text-muted-foreground">Manage your products and stock levels</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>Enter the details for the new product</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="Enter product name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={newProduct.sku}
                  onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                  placeholder="Enter SKU"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: Number.parseFloat(e.target.value) })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newProduct.category}
                    onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beverages">Beverages</SelectItem>
                      <SelectItem value="Electronics">Electronics</SelectItem>
                      <SelectItem value="Stationery">Stationery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stock">Initial Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: Number.parseInt(e.target.value) })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minStock">Min Stock</Label>
                  <Input
                    id="minStock"
                    type="number"
                    value={newProduct.minStock}
                    onChange={(e) => setNewProduct({ ...newProduct, minStock: Number.parseInt(e.target.value) })}
                    placeholder="0"
                  />
                </div>
              </div>
              <Button onClick={handleAddProduct} className="w-full">
                Add Product
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">Active products in inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{lowStockProducts.length}</div>
            <p className="text-xs text-muted-foreground">Products need restocking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              ${products.reduce((total, product) => total + product.price * product.stock, 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Current inventory value</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search products or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>Manage your product inventory and stock levels</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const status = getStockStatus(product)
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <img
                          src={product.image || "/placeholder.svg"}
                          alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover bg-muted"
                        />
                        <div>
                          <p className="font-medium">{product.name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell className="font-medium">${product.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{product.stock}</span>
                        <span className="text-muted-foreground text-sm">/ {product.minStock} min</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestock(product.id, 10)}
                          className="bg-transparent"
                        >
                          +10
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setEditingProduct({ ...product })}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Edit Product</DialogTitle>
                              <DialogDescription>Update product information</DialogDescription>
                            </DialogHeader>
                            {editingProduct && (
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="edit-name">Product Name</Label>
                                  <Input
                                    id="edit-name"
                                    value={editingProduct.name}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-price">Price</Label>
                                    <Input
                                      id="edit-price"
                                      type="number"
                                      step="0.01"
                                      value={editingProduct.price}
                                      onChange={(e) =>
                                        setEditingProduct({
                                          ...editingProduct,
                                          price: Number.parseFloat(e.target.value),
                                        })
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-stock">Stock</Label>
                                    <Input
                                      id="edit-stock"
                                      type="number"
                                      value={editingProduct.stock}
                                      onChange={(e) =>
                                        setEditingProduct({ ...editingProduct, stock: Number.parseInt(e.target.value) })
                                      }
                                    />
                                  </div>
                                </div>
                                <Button onClick={handleEditProduct} className="w-full">
                                  Update Product
                                </Button>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
