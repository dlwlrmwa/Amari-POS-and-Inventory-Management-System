"use client"

import { useState, useEffect } from "react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Edit, Trash2, Package, AlertTriangle, TrendingUp, Download, ImagePlus } from "lucide-react"
import type { Product, Ingredient } from "@/lib/supabase/client"
import {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  updateStock,
} from "@/lib/data/products"
import {
  getIngredients,
  addIngredient,
  updateIngredient,
  deleteIngredient,
  updateIngredientStock,
} from "@/lib/data/ingredients"
import { exportProductsToExcel, exportIngredientsToExcel } from "@/lib/utils/export"
import { supabase } from "@/lib/supabase/client"

const categories = ["All", "Beverages", "Food", "Ice Cream"]

export function InventoryManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [ingredientSearchTerm, setIngredientSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [activeTab, setActiveTab] = useState("products")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isAddIngredientDialogOpen, setIsAddIngredientDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null)
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: "",
    price: 0,
    category: "",
    stock: 0,
    minStock: 0,
    sku: "",
    image: "",
  })
  const [newIngredient, setNewIngredient] = useState<Partial<Ingredient>>({
    name: "",
    unit: "",
    current_stock: 0,
    minimum_stock: 0,
    added_date: "",
    updated_date: "",
  })
  const [newImageFile, setNewImageFile] = useState<File | null>(null)
  const [editImageFile, setEditImageFile] = useState<File | null>(null)

  useEffect(() => {
    loadProducts()
    loadIngredients()
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

  const loadIngredients = async () => {
    try {
      setLoading(true)
      const data = await getIngredients()
      setIngredients(data)
    } catch (error) {
      console.error('Error loading ingredients:', error)
    } finally {
      setLoading(false)
    }
  }

  const uploadImage = async (file: File): Promise<string> => {
    try {
      if (!file) throw new Error("No file provided")

      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName)

      if (!publicUrlData.publicUrl) {
        throw new Error("Failed to get public URL")
      }

      return publicUrlData.publicUrl
    } catch (error) {
      console.error("Image upload error:", error)
      throw new Error("Failed to upload image")
    }
  }

  const handleAddProduct = async () => {
    try {
      if (!newProduct.name?.trim()) {
        throw new Error("Product name is required")
      }
      if (!newProduct.price || newProduct.price <= 0) {
        throw new Error("Valid price is required")
      }
      if (!newProduct.sku?.trim()) {
        throw new Error("SKU is required")
      }

      let imageUrl = "/placeholder.svg"
      if (newImageFile) {
        imageUrl = await uploadImage(newImageFile)
      }

      const productToAdd = {
        name: newProduct.name.trim(),
        price: Number(newProduct.price),
        category: newProduct.category || "",
        stock: Number(newProduct.stock) || 0,
        minStock: Number(newProduct.minStock) || 0,
        sku: newProduct.sku.trim(),
        image: imageUrl,
      }

      await addProduct(productToAdd)

      setNewProduct({
        name: "",
        price: 0,
        category: "",
        stock: 0,
        minStock: 0,
        sku: "",
        image: "",
      })
      setNewImageFile(null)
      setIsAddDialogOpen(false)
      await loadProducts()
    } catch (error) {
      console.error('Error adding product:', error)
      alert(error instanceof Error ? error.message : 'Failed to add product')
    }
  }

  const handleAddIngredient = async () => {
    try {
      if (!newIngredient.name?.trim()) {
        throw new Error("Ingredient name is required")
      }
      if (!newIngredient.unit?.trim()) {
        throw new Error("Unit is required")
      }

      const ingredientToAdd = {
        name: newIngredient.name.trim(),
        unit: newIngredient.unit.trim(),
        current_stock: Number(newIngredient.current_stock) || 0,
        minimum_stock: Number(newIngredient.minimum_stock) || 0,
        added_date: newIngredient.added_date || undefined,
        updated_date: newIngredient.updated_date || undefined,
      }

      await addIngredient(ingredientToAdd as Omit<Ingredient, "id">)

      setNewIngredient({
        name: "",
        unit: "",
        current_stock: 0,
        minimum_stock: 0,
        added_date: "",
        updated_date: "",
      })
      setIsAddIngredientDialogOpen(false)
      await loadIngredients()
    } catch (error) {
      console.error('Error adding ingredient:', error)
      alert(error instanceof Error ? error.message : 'Failed to add ingredient')
    }
  }

  const handleEditProduct = async () => {
    if (editingProduct) {
      try {
        let imageUrl = editingProduct.image
        if (editImageFile) {
          imageUrl = await uploadImage(editImageFile)
        }

        await updateProduct(editingProduct.id, { ...editingProduct, image: imageUrl })
        setEditingProduct(null)
        setEditImageFile(null)
        await loadProducts()
      } catch (error) {
        console.error('Error updating product:', error)
        alert('Failed to update product')
      }
    }
  }

  const handleEditIngredient = async () => {
    if (editingIngredient) {
      try {
        await updateIngredient(editingIngredient.id, editingIngredient)
        setEditingIngredient(null)
        await loadIngredients()
      } catch (error) {
        console.error('Error updating ingredient:', error)
        alert('Failed to update ingredient')
      }
    }
  }

  const handleDeleteProduct = async (id: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        // Delete the product only, keep sales history intact
        await deleteProduct(id)
        await loadProducts()
        alert("Product deleted successfully!")
      } catch (error: any) {
        console.error('Error deleting product:', error)
        alert('Failed to delete product')
      }
    }
  }

  const handleDeleteIngredient = async (id: number) => {
    if (confirm("Are you sure you want to delete this ingredient?")) {
      try {
        await deleteIngredient(id)
        await loadIngredients()
        alert("Ingredient deleted successfully!")
      } catch (error: any) {
        console.error('Error deleting ingredient:', error)
        alert('Failed to delete ingredient')
      }
    }
  }

  const handleRestock = async (id: number, quantity: number) => {
    try {
      await updateStock(id, quantity)
      await loadProducts()
    } catch (error) {
      console.error('Error restocking:', error)
      alert('Failed to update stock')
    }
  }

  const handleRestockIngredient = async (id: number, quantity: number) => {
    try {
      await updateIngredientStock(id, quantity)
      await loadIngredients()
    } catch (error) {
      console.error('Error restocking ingredient:', error)
      alert('Failed to update stock')
    }
  }

  const handleExport = () => {
    if (activeTab === 'products') {
      exportProductsToExcel(products, 'inventory-report')
    } else if (activeTab === 'ingredients') {
      exportIngredientsToExcel(ingredients, 'ingredients-report')
    } else {
      alert("Export not available for this tab.")
    }
  }

  const getStockStatus = (item: Product | Ingredient) => {
    const stock = 'stock' in item ? item.stock : item.current_stock;
    const minStock = 'minStock' in item ? item.minStock : item.minimum_stock;

    if (stock === 0) return { label: "Out of Stock", variant: "destructive" as const }
    if (stock <= minStock) return { label: "Low Stock", variant: "destructive" as const }
    return { label: "In Stock", variant: "default" as const }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    const formattedDate = date.toLocaleDateString("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    const formattedTime = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    return `${formattedDate} / ${formattedTime}`
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading inventory...</p>
        </div>
      </div>
    )
  }


  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-end gap-4">
        <div className="flex gap-2 md:ml-auto">
          <Button variant="outline" onClick={handleExport} className="bg-transparent">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {activeTab === 'products' && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                  <DialogDescription>Enter the details for the new product</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 p-1">
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
                        step="1"
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
                          {categories.slice(1).map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
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
                        placeholder=""
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minStock">Min Stock</Label>
                      <Input
                        id="minStock"
                        type="number"
                        value={newProduct.minStock}
                        onChange={(e) => setNewProduct({ ...newProduct, minStock: Number.parseInt(e.target.value) })}
                        placeholder=""
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image">Product Image</Label>
                    <Input id="image" type="file" accept="image/*" onChange={(e) => setNewImageFile(e.target.files?.[0] || null)} />
                  </div>
                  <Button onClick={handleAddProduct} className="w-full">
                    Add Product
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
          {activeTab === 'ingredients' && (
            <Dialog open={isAddIngredientDialogOpen} onOpenChange={setIsAddIngredientDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Ingredient
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Ingredient</DialogTitle>
                  <DialogDescription>Enter the details for the new ingredient or raw materials.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 p-1">
                  {/* Ingredient Name */}

                  <div className="space-y-2">
                    <Label htmlFor="ingredient-name">Ingredient Name</Label>
                    <Input
                      id="ingredient-name"
                      value={newIngredient.name}
                      onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                      placeholder="e.g., Flour, Sugar"
                    />









                  </div>

                  {/* Unit + Stock */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Unit (Dropdown) */}
                    <div className="space-y-2">
                      <Label htmlFor="ingredient-unit">Unit</Label>
                      <Select
                        value={newIngredient.unit}
                        onValueChange={(value) => setNewIngredient({ ...newIngredient, unit: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {["pcs", "g", "kg", "ml", "L", "pack"].map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Current Stock */}
                    <div className="space-y-2">
                      <Label htmlFor="ingredient-stock">Current Stock</Label>
                      <Input
                        id="ingredient-stock"
                        type="number"
                        value={newIngredient.current_stock}
                        onChange={(e) =>
                          setNewIngredient({
                            ...newIngredient,
                            current_stock: Number.parseInt(e.target.value),
                          })
                        }
                        placeholder=""
                      />
                    </div>
                  </div>

                  {/* Minimum Stock */}
                  <div className="space-y-2">
                    <Label htmlFor="ingredient-min-stock">Min Stock</Label>
                    <Input
                      id="ingredient-min-stock"
                      type="number"
                      value={newIngredient.minimum_stock}
                      onChange={(e) =>
                        setNewIngredient({
                          ...newIngredient,
                          minimum_stock: Number.parseInt(e.target.value),
                        })
                      }
                      placeholder=""
                    />
                  </div>


                  {/* added date */}
                  <div className="space-y-2">
                    <Label htmlFor="ingredient-added">Date Added</Label>
                    <Input
                      id="ingredient-added"
                      type="datetime-local"
                      value={newIngredient.added_date}
                      onChange={(e) =>
                        setNewIngredient({
                          ...newIngredient,
                          added_date: e.target.value,
                        })
                      }
                    />
                  </div>


                  {/* Submit Button */}
                  <Button onClick={handleAddIngredient} className="w-full">
                    Add Ingredient
                  </Button>










                </div>
              </DialogContent>
            </Dialog>
          )}








        </div>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="products" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Products</TabsTrigger>
          <TabsTrigger value="ingredients" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Ingredients</TabsTrigger>
        </TabsList>
        <TabsContent value="products">
          <Card>
            <div className="flex flex-col md:flex-row gap-3 px-4 pb-2">
              {/* Search */}
              <div className="relative w-full md:w-1/2">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="w-full rounded-lg bg-background pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <CardContent>
              <div className="relative w-full overflow-auto">

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
                    {products
                      // 🔍 Search filter
                      .filter((p) =>
                        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      // 🏷 Category filter
                      .filter((p) =>
                        selectedCategory === "All" ? true : p.category === selectedCategory
                      )
                      // 🔢 Sort by SKU
                      .sort((a, b) => a.sku.localeCompare(b.sku))
                      .map((product) => {
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
                            <TableCell>₱{product.price.toFixed(2)}</TableCell>

                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{product.stock}</span>
                                <span className="text-muted-foreground text-sm">/ {product.minStock} min</span>
                              </div>
                            </TableCell>

                            <TableCell>
                              <Badge variant={status.variant}>{status.label}</Badge>
                            </TableCell>

                            {/* Actions */}
                            <TableCell>
                              <div className="flex items-center space-x-2">

                                {/* Edit Product */}
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => setEditingProduct({ ...product })}>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>

                                  <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                      <DialogTitle>Edit Product</DialogTitle>
                                      <DialogDescription>Update product information</DialogDescription>
                                    </DialogHeader>

                                    {editingProduct && (
                                      <div className="space-y-4 p-1">
                                        <div className="space-y-2">
                                          <Label>Product Name</Label>
                                          <Input
                                            value={editingProduct.name}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                          />
                                        </div>

                                        <div className="space-y-2">
                                          <Label>Price</Label>
                                          <Input
                                            type="number"
                                            value={editingProduct.price}
                                            onChange={(e) =>
                                              setEditingProduct({
                                                ...editingProduct,
                                                price: Number(e.target.value),
                                              })
                                            }
                                          />
                                        </div>

                                        <div className="space-y-2">
                                          <Label>Stock</Label>
                                          <Input
                                            type="number"
                                            value={editingProduct.stock}
                                            onChange={(e) =>
                                              setEditingProduct({
                                                ...editingProduct,
                                                stock: Number(e.target.value),
                                              })
                                            }
                                          />
                                        </div>

                                        <Button onClick={handleEditProduct} className="w-full">
                                          Update Product
                                        </Button>
                                      </div>
                                    )}
                                  </DialogContent>
                                </Dialog>

                                {/* Delete Product */}
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

              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="ingredients">
          <Card>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search ingredients..."
                  className="w-full rounded-lg bg-background pl-8"
                  value={ingredientSearchTerm}
                  onChange={(e) => setIngredientSearchTerm(e.target.value)}
                />
              </div>
              <div className="relative w-full overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ingredient</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date Added / Time</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ingredients
                      .filter((ingredient) =>
                        ingredient.name.toLowerCase().includes(ingredientSearchTerm.toLowerCase())
                      )
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((ingredient) => {
                        const status = getStockStatus(ingredient)
                        return (
                          <TableRow key={ingredient.id}>
                            <TableCell className="font-medium">{ingredient.name}</TableCell>
                            <TableCell>{ingredient.unit}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{ingredient.current_stock}</span>
                                <span className="text-muted-foreground text-sm">/ {ingredient.minimum_stock} min</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={status.variant}>{status.label}</Badge>
                            </TableCell>
                            <TableCell>{formatDate(ingredient.added_date || null)}</TableCell>
                            <TableCell>{formatDate(ingredient.updated_date || null)}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => setEditingIngredient({ ...ingredient })}>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                      <DialogTitle>Edit Ingredient</DialogTitle>
                                      <DialogDescription>Update ingredient information</DialogDescription>
                                    </DialogHeader>
                                    {editingIngredient && (
                                      <div className="space-y-4 p-1">
                                        <div className="space-y-2">
                                          <Label htmlFor="edit-ingredient-name">Ingredient Name</Label>
                                          <Input
                                            id="edit-ingredient-name"
                                            value={editingIngredient.name}
                                            onChange={(e) => setEditingIngredient({ ...editingIngredient, name: e.target.value })}
                                          />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                          <div className="space-y-2">
                                            <Label htmlFor="edit-ingredient-unit">Unit</Label>
                                            <Input
                                              id="edit-ingredient-unit"
                                              value={editingIngredient.unit}
                                              onChange={(e) => setEditingIngredient({ ...editingIngredient, unit: e.target.value })}
                                            />
                                          </div>
                                          <div className="space-y-2">
                                            <Label htmlFor="edit-ingredient-stock">Stock</Label>
                                            <Input
                                              id="edit-ingredient-stock"
                                              type="number"
                                              value={editingIngredient.current_stock}
                                              onChange={(e) => setEditingIngredient({ ...editingIngredient, current_stock: Number.parseInt(e.target.value) })}
                                            />
                                          </div>
                                        </div>
                                        <Button onClick={handleEditIngredient} className="w-full">
                                          Update Ingredient
                                        </Button>
                                      </div>
                                    )}
                                  </DialogContent>
                                </Dialog>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteIngredient(ingredient.id)}
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>












    </div>
  )
}