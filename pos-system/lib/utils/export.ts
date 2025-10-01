import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Sale } from '@/lib/supabase/client'

/**
 * Export sales data to Excel
 */
export async function exportSalesToExcel(sales: Sale[], filename: string = 'sales-report') {
    if (sales.length === 0) {
        alert('No sales data to export')
        return
    }

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Sales Report')

    // Define columns
    worksheet.columns = [
        { header: 'Transaction ID', key: 'id', width: 20 },
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Time', key: 'time', width: 15 },
        { header: 'Customer', key: 'customer', width: 25 },
        { header: 'Amount', key: 'amount', width: 15 },
        { header: 'Payment Method', key: 'paymentMethod', width: 20 },
        { header: 'Status', key: 'status', width: 15 }
    ]

    // Add sales rows
    sales.forEach(sale => {
        worksheet.addRow({
            id: sale.id,
            date: sale.date,
            time: sale.time,
            customer: sale.customer || 'Walk-in Customer',
            amount: `₱${sale.totalAmount.toFixed(2)}`,
            paymentMethod: sale.paymentMethod,
            status: sale.status
        })
    })

    // Add totals row
    const totalAmount = sales.reduce((sum, sale) => sum + sale.totalAmount, 0)
    worksheet.addRow({
        id: 'TOTAL',
        customer: `${sales.length} transactions`,
        amount: `₱${totalAmount.toFixed(2)}`
    })

    // Style header
    worksheet.getRow(1).font = { bold: true }

    // Download
    const buffer = await workbook.xlsx.writeBuffer()
    const date = new Date().toISOString().split('T')[0]
    saveAs(new Blob([buffer]), `${filename}-${date}.xlsx`)
}


/**
 * Export products (inventory) to Excel
 */
export async function exportProductsToExcel(products: any[], filename: string = 'inventory-report') {
    if (products.length === 0) {
        alert('No products to export')
        return
    }

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Inventory')

    worksheet.columns = [
        { header: 'SKU', key: 'sku', width: 15 },
        { header: 'Product Name', key: 'name', width: 25 },
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Price', key: 'price', width: 15 },
        { header: 'Stock', key: 'stock', width: 10 },
        { header: 'Min Stock', key: 'minStock', width: 12 },
        { header: 'Value', key: 'value', width: 15 },
        { header: 'Status', key: 'status', width: 15 }
    ]

    products.forEach(product => {
        worksheet.addRow({
            sku: product.sku,
            name: product.name,
            category: product.category,
            price: `₱${product.price.toFixed(2)}`,
            stock: product.stock,
            minStock: product.minStock,
            value: `₱${(product.price * product.stock).toFixed(2)}`,
            status: product.stock <= product.minStock ? 'Low Stock' : 'In Stock'
        })
    })

    worksheet.getRow(1).font = { bold: true }

    const buffer = await workbook.xlsx.writeBuffer()
    const date = new Date().toISOString().split('T')[0]
    saveAs(new Blob([buffer]), `${filename}-${date}.xlsx`)
}
