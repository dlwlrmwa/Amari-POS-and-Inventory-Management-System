import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cwylpvnfmdbuztarjuuv.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3eWxwdm5mbWRidXp0YXJqdXV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxOTU4MzQsImV4cCI6MjA3NDc3MTgzNH0.cxCqfdbcgr5JBKxOb8Pm9LT6I9uuMZ16tWzNWZumpAs'

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

export interface CartItem {
    id: number
    name: string
    price: number
    quantity: number
}

export interface Sale {
    id: string
    date: string
    time: string
    customer?: string
    totalAmount: number
    paymentMethod: string
    status: string
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
    name: string
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