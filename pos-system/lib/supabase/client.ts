import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qwwbhkdvrkklewofsvzb.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3d2Joa2R2cmtrbGV3b2ZzdnpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyOTE0ODYsImV4cCI6MjA3OTg2NzQ4Nn0.w2jRoPCEDnwyFS2qFxrdJHEfVsC69LtPcr85AiZT2FY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Product {
    id: number
    name: string
    price: number
    category: string
    stock: number
    minStock: number
    sku: string
    image: string
    image_url?: string
}

export interface Ingredient {
    id: number
    name: string
    unit: string
    current_stock: number
    minimum_stock: number
    added_date?: string
    updated_date?: string
}

export interface CartItem {
    id: number
    name: string
    price: number
    quantity: number
    image: string
}

export interface Sale {
    id: string
    date: string
    time: string
    totalAmount: number
    cashReceived?: number
    change?: number
    paymentMethod: "Cash" | "E-Payment"
    paymentSubMethod?: "GCash" | "Maya"
    staffId?: number
    staffName?: string
    status: string
    items?: SaleItem[]
}

export interface SaleItem {
    id?: number
    saleId: string
    productId: number
    productName: string
    quantity: number
    unitPrice: number
    subtotal: number
}

export interface User {
    id: string
    username: string
    role: 'cashier' | 'manager' | 'admin'
}

export async function uploadProductImage(file: File): Promise<string> {
    try {
        // Validate file
        if (!file) throw new Error('No file provided')

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
            throw new Error('Invalid file type. Only JPEG, PNG and WebP images are allowed')
        }

        // Validate file size (max 5MB)
        const maxSize = 50 * 1024 * 1024 // 5MB
        if (file.size > maxSize) {
            throw new Error('File size too large. Maximum size is 5MB')
        }

        const fileExt = file.name.split('.').pop()
        // Create a more unique filename with timestamp
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `product-images/${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            })

        if (uploadError) {
            console.error('Upload error:', uploadError)
            throw new Error(`Failed to upload image: ${uploadError.message}`)
        }

        const { data } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath)

        if (!data.publicUrl) {
            throw new Error('Failed to get public URL')
        }

        return data.publicUrl
    } catch (error) {
        console.error('Image upload error:', error)
        throw error instanceof Error ? error : new Error('Failed to upload image')
    }
}