import { supabase, type Sale, type SaleItem, type CartItem } from '@/lib/supabase/client'
import { updateStock } from './products'

export async function getSales(limit?: number): Promise<Sale[]> {
    try {
        let query = supabase
            .from('sales')
            .select('*')
            .order('created_at', { ascending: false })

        if (limit) {
            query = query.limit(limit)
        }

        const { data, error } = await query

        if (error) throw error

        return data?.map(sale => ({
            id: sale.id,
            date: sale.date,
            time: sale.time,
            customer: sale.customer,
            totalAmount: sale.total_amount,
            paymentMethod: sale.payment_method,
            status: sale.status,
        })) || []
    } catch (err) {
        console.error('Error fetching sales:', err)
        return []
    }
}

export async function getSaleById(id: string): Promise<Sale | null> {
    try {
        const { data, error } = await supabase
            .from('sales')
            .select('*')
            .eq('id', id)
            .single()

        if (error) throw error

        return {
            id: data.id,
            date: data.date,
            time: data.time,
            customer: data.customer,
            totalAmount: data.total_amount,
            paymentMethod: data.payment_method,
            status: data.status,
        }
    } catch (err) {
        console.error('Error fetching sale:', err)
        return null
    }
}

export async function getSaleItems(saleId: string): Promise<SaleItem[]> {
    try {
        const { data, error } = await supabase
            .from('sale_items')
            .select('*')
            .eq('sale_id', saleId)

        if (error) throw error

        return data?.map(item => ({
            id: item.id,
            saleId: item.sale_id,
            productId: item.product_id,
            productName: item.product_name,
            quantity: item.quantity,
            unitPrice: item.unit_price,
            subtotal: item.subtotal,
        })) || []
    } catch (err) {
        console.error('Error fetching sale items:', err)
        return []
    }
}

export async function createSale(
    cart: CartItem[],
    paymentMethod: "Cash" | "E-Payment",
    paymentSubMethod?: "GCash" | "Maya",
    customer?: string
): Promise<Sale> {
    const now = new Date()
    const date = now.toISOString().split('T')[0]
    const time = now.toTimeString().split(' ')[0].substring(0, 5)
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    // Fetch the last transaction ID to generate a new one
    const { data: lastSale, error: lastSaleError } = await supabase
        .from('sales')
        .select('id')
        .order('id', { ascending: false })
        .limit(1)
        .single()

    if (lastSaleError && lastSaleError.code !== 'PGRST116') { // Ignore 'range not found' error for the first sale
        throw lastSaleError
    }

    let newTransactionId: string
    if (lastSale) {
        const lastIdNumber = parseInt(lastSale.id.split('-')[1], 10)
        const newIdNumber = lastIdNumber + 1
        newTransactionId = `TXN-${newIdNumber.toString().padStart(4, '0')}`
    } else {
        newTransactionId = 'TXN-0001'
    }

    try {
        const { data: saleData, error: saleError } = await supabase
            .from('sales')
            .insert({
                id: newTransactionId,
                date,
                time,
                customer: customer || 'Walk-in Customer',
                total_amount: totalAmount,
                payment_method: paymentMethod,
                payment_sub_method: paymentSubMethod,
                status: 'Completed',
            })
            .select()
            .single()

        if (saleError) throw saleError

        const saleItems: SaleItem[] = cart.map(item => ({
            saleId: newTransactionId,
            productId: item.id,
            productName: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
            subtotal: item.price * item.quantity,
        }))

        const { error: itemError } = await supabase.from('sale_items').insert(
            saleItems.map(item => ({
                sale_id: item.saleId,
                product_id: item.productId,
                product_name: item.productName,
                quantity: item.quantity,
                unit_price: item.unitPrice,
                subtotal: item.subtotal,
            }))
        )

        if (itemError) throw itemError

        for (const item of cart) {
            await updateStock(item.id, -item.quantity)
        }

        return {
            id: saleData.id,
            date: saleData.date,
            time: saleData.time,
            customer: saleData.customer,
            totalAmount: saleData.total_amount,
            paymentMethod: saleData.payment_method,
            paymentSubMethod: saleData.payment_sub_method,
            status: saleData.status,
            items: saleItems,
        }
    } catch (err) {
        console.error('Error creating sale:', err)
        throw err
    }
}

export async function getSalesByDateRange(startDate: string, endDate: string): Promise<Sale[]> {
    try {
        const { data, error } = await supabase
            .from('sales')
            .select('*')
            .gte('date', startDate)
            .lte('date', endDate)
            .order('created_at', { ascending: false })

        if (error) throw error

        return data?.map(sale => ({
            id: sale.id,
            date: sale.date,
            time: sale.time,
            customer: sale.customer,
            totalAmount: sale.total_amount,
            paymentMethod: sale.payment_method,
            status: sale.status,
        })) || []
    } catch (err) {
        console.error('Error fetching sales by date range:', err)
        return []
    }
}

export async function getTodaysSales(): Promise<Sale[]> {
    const today = new Date().toISOString().split('T')[0]
    return getSalesByDateRange(today, today)
}

export async function getSalesStats() {
    const sales = await getSales()
    const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0)
    const totalTransactions = sales.length
    const averageOrderValue = totalTransactions > 0 ? totalSales / totalTransactions : 0

    return {
        totalSales,
        totalTransactions,
        averageOrderValue,
    }
}
