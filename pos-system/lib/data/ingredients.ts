import { supabase } from "@/lib/supabase/client"
import type { Ingredient } from "@/lib/supabase/client"

export const getIngredients = async (): Promise<Ingredient[]> => {
    const { data, error } = await supabase.from("ingredients").select("*")
    if (error) throw error
    return data || []
}

export const addIngredient = async (ingredient: Omit<Ingredient, "id">): Promise<Ingredient> => {
    const { data, error } = await supabase.from("ingredients").insert(ingredient).single()
    if (error) throw error
    return data
}

export const updateIngredient = async (id: number, ingredient: Partial<Ingredient>): Promise<Ingredient> => {
    const { data, error } = await supabase.from("ingredients").update(ingredient).eq("id", id).select().single()
    if (error) throw error
    return data
}

export const deleteIngredient = async (id: number): Promise<void> => {
    const { error } = await supabase.from("ingredients").delete().eq("id", id)
    if (error) throw error
}

export const updateIngredientStock = async (id: number, quantity: number): Promise<Ingredient> => {
    const { data: currentIngredient, error: fetchError } = await supabase
        .from("ingredients")
        .select("current_stock")
        .eq("id", id)
        .single()

    if (fetchError) throw fetchError
    if (!currentIngredient) throw new Error("Ingredient not found")

    const newStock = currentIngredient.current_stock + quantity
    return updateIngredient(id, { current_stock: newStock })
}
