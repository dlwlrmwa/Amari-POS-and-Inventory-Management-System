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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Edit, Trash2, Download } from "lucide-react"
import type { Ingredient } from "@/lib/supabase/client"
import {
  getIngredients,
  addIngredient,
  updateIngredient,
  deleteIngredient,
  updateIngredientStock,
} from "@/lib/data/ingredients"
import { exportIngredientsToExcel } from "@/lib/utils/export"
import { supabase } from "@/lib/supabase/client"

export function InventoryManagement() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [ingredientSearchTerm, setIngredientSearchTerm] = useState("")
  const [isAddIngredientDialogOpen, setIsAddIngredientDialogOpen] = useState(false)
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null)
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
    loadIngredients()
  }, [])

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

  const handleExport = () => {
    exportIngredientsToExcel(ingredients, 'ingredients-report')
  }

  const getStockStatus = (item: Ingredient) => {
    const stock = item.current_stock;
    const minStock = item.minimum_stock;

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
        </div>
      </div>

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
    </div>
  )
}
