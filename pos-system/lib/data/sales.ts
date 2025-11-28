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
            id: sale.salesid,
            date: sale.date,
            time: sale.sale_time,
            totalAmount: sale.total_amount,
            cashReceived: sale.cash_received,
            change: sale.change,
            paymentMethod: sale.payment_method,
            paymentSubMethod: sale.payment_sub_method,
            staffId: sale.staffID,
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
            .eq('salesid', id)
            .single()

        if (error) throw error

        return {
            id: data.salesid,
            date: data.date,
            time: data.sale_time,
            totalAmount: data.total_amount,
            cashReceived: data.cash_received,
            change: data.change,
            paymentMethod: data.payment_method,
            paymentSubMethod: data.payment_sub_method,
            staffId: data.staffid,
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
    cashReceived?: number,
    paymentSubMethod?: "GCash" | "Maya",
    staffId?: number
): Promise<Sale> {
    const now = new Date()
    const date = now.toISOString().split('T')[0]
    const time = now.toTimeString().split(' ')[0].substring(0, 5)
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    // Calculate change for cash payments
    const change = paymentMethod === "Cash" && cashReceived ? cashReceived - totalAmount : 0

    // Fetch the last transaction ID to generate a new one
    const { data: lastSale, error: lastSaleError } = await supabase
        .from('sales')
        .select('salesid')
        .order('salesid', { ascending: false })
        .limit(1)
        .single()

    if (lastSaleError && lastSaleError.code !== 'PGRST116') { // Ignore 'range not found' error for the first sale
        throw lastSaleError
    }

    let newTransactionId: string
    if (lastSale) {
        const lastIdNumber = parseInt(lastSale.salesid.split('-')[1], 10)
        const newIdNumber = lastIdNumber + 1
        newTransactionId = `TXN-${newIdNumber.toString().padStart(4, '0')}`
    } else {
        newTransactionId = 'TXN-0001'
    }

    try {
        const { data: saleData, error: saleError } = await supabase
            .from('sales')
            .insert({
                salesid: newTransactionId,
                date,
                sale_time: time,
                total_amount: totalAmount,
                cash_received: paymentMethod === "Cash" ? cashReceived : null,
                change: paymentMethod === "Cash" ? change : null,
                payment_method: paymentMethod,
                payment_sub_method: paymentSubMethod,
                staffid: staffId || null,
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
            id: saleData.salesid,
            date: saleData.date,
            time: saleData.sale_time,
            totalAmount: saleData.total_amount,
            cashReceived: saleData.cash_received,
            change: saleData.change,
            paymentMethod: saleData.payment_method,
            paymentSubMethod: saleData.payment_sub_method,
            staffId: saleData.staffid,
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
            id: sale.salesid,
            date: sale.date,
            time: sale.sale_time,
            totalAmount: sale.total_amount,
            cashReceived: sale.cash_received,
            change: sale.change,
            paymentMethod: sale.payment_method,
            paymentSubMethod: sale.payment_sub_method,
            staffId: sale.staffid,
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