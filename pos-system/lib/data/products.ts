import { supabase, type Product, uploadProductImage } from '@/lib/supabase/client'

export async function getProducts(): Promise<Product[]> {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('id, name, price, category, stock, min_stock, sku, image')
            .order('name')

        if (error) throw error

        if (!data) return []

        return data.map(product => ({
            id: product.id,
            name: product.name,
            price: product.price,
            category: product.category,
            stock: product.stock,
            minStock: product.min_stock,
            sku: product.sku,
            image: product.image,
        }))
    } catch (err) {
        console.error('Error fetching products:', err)
        return []
    }
}

export async function getProductById(id: number): Promise<Product | null> {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('id, name, price, category, stock, min_stock, sku, image')
            .eq('id', id)
            .single()

        if (error) throw error
        if (!data) return null

        return {
            id: data.id,
            name: data.name,
            price: data.price,
            category: data.category,
            stock: data.stock,
            minStock: data.min_stock,
            sku: data.sku,
            image: data.image,
        }
    } catch (err) {
        console.error('Error fetching product:', err)
        return null
    }
}

export async function addProduct(product: Omit<Product, 'id'>): Promise<Product> {
    try {
        const { data, error } = await supabase
            .from('products')
            .insert([{
                name: product.name,
                price: product.price,
                category: product.category,
                stock: product.stock,
                min_stock: product.minStock,
                sku: product.sku,
                image: product.image
            }])
            .select()
            .single();

        if (error) {
            console.error('Database error:', error);
            throw new Error(`Failed to add product: ${error.message}`);
        }

        if (!data) {
            throw new Error('No data returned from database');
        }

        return {
            id: data.id,
            name: data.name,
            price: data.price,
            category: data.category,
            stock: data.stock,
            minStock: data.min_stock,
            sku: data.sku,
            image: data.image
        };
    } catch (err) {
        console.error('Error adding product:', err);
        throw err;
    }
}

export async function updateProduct(id: number, updates: Partial<Product>, imageFile?: File): Promise<Product> {
    try {
        let imageUrl = updates.image

        if (imageFile) {
            imageUrl = await uploadProductImage(imageFile)
        }

        const { data, error } = await supabase
            .from('products')
            .update({
                name: updates.name,
                price: updates.price,
                category: updates.category,
                stock: updates.stock,
                min_stock: updates.minStock,
                sku: updates.sku,
                image: imageUrl,
            })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        return {
            id: data.id,
            name: data.name,
            price: data.price,
            category: data.category,
            stock: data.stock,
            minStock: data.min_stock,
            sku: data.sku,
            image: data.image,
        }
    } catch (err) {
        console.error('Error updating product:', err)
        throw err
    }
}

export async function deleteProduct(id: number): Promise<void> {
    try {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id)

        if (error) throw error
    } catch (err) {
        console.error('Error deleting product:', err)
        throw err
    }
}

export async function updateStock(id: number, quantity: number): Promise<Product> {
    try {
        const { data: product, error: fetchError } = await supabase
            .from('products')
            .select('stock')
            .eq('id', id)
            .single()

        if (fetchError) throw fetchError

        const { data, error } = await supabase
            .from('products')
            .update({ stock: product.stock + quantity })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        return {
            id: data.id,
            name: data.name,
            price: data.price,
            category: data.category,
            stock: data.stock,
            minStock: data.min_stock,
            sku: data.sku,
            image: data.image,
        }
    } catch (err) {
        console.error('Error updating stock:', err)
        throw err
    }
}

export async function getLowStockProducts(): Promise<Product[]> {
    const products = await getProducts()
    return products.filter(p => p.stock <= p.minStock)
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
    const products = await getProducts()
    if (category === 'All') return products
    return products.filter(p => p.category === category)
}
