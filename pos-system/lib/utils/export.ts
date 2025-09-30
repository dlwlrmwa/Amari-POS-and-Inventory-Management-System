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
 * Export sales data to PDF
 */
export function exportSalesToPDF(sales: Sale[], filename: string = 'sales-report') {
    if (sales.length === 0) {
        alert('No sales data to export')
        return
    }

    const doc = new jsPDF()

    // Header with store branding
    doc.setFontSize(20)
    doc.text("Amari's Scoops & Savours", 14, 20)

    doc.setFontSize(14)
    doc.text('Sales Report', 14, 28)

    doc.setFontSize(10)
    doc.text(`Generated: ${new Date().toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
    })}`, 14, 35)

    // Prepare table data
    const tableData = sales.map(sale => [
        sale.id,
        sale.date,
        sale.time,
        sale.customer || 'Walk-in',
        `₱${sale.totalAmount.toFixed(2)}`,
        sale.paymentMethod,
        sale.status
    ])

    // Add table
    autoTable(doc, {
        head: [['ID', 'Date', 'Time', 'Customer', 'Amount', 'Payment', 'Status']],
        body: tableData,
        startY: 42,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: {
            fillColor: [21, 128, 61],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
        },
        alternateRowStyles: { fillColor: [240, 253, 244] },
        columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 25 },
            2: { cellWidth: 20 },
            3: { cellWidth: 30 },
            4: { cellWidth: 25, halign: 'right' },
            5: { cellWidth: 25 },
            6: { cellWidth: 25 }
        }
    })

    // Add summary at bottom
    const totalAmount = sales.reduce((sum, sale) => sum + sale.totalAmount, 0)
    const cashSales = sales.filter(s => s.paymentMethod === 'Cash')
    const cardSales = sales.filter(s => s.paymentMethod === 'Card')
    const totalCash = cashSales.reduce((sum, sale) => sum + sale.totalAmount, 0)
    const totalCard = cardSales.reduce((sum, sale) => sum + sale.totalAmount, 0)

    const finalY = (doc as any).lastAutoTable.finalY || 42

    doc.setFillColor(240, 253, 244)
    doc.rect(14, finalY + 10, 182, 40, 'F')

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Summary', 18, finalY + 18)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Total Transactions: ${sales.length}`, 18, finalY + 25)
    doc.text(`Total Sales: ₱${totalAmount.toFixed(2)}`, 18, finalY + 32)
    doc.text(`Cash Payments: ₱${totalCash.toFixed(2)} (${cashSales.length} txn)`, 18, finalY + 39)
    doc.text(`Card Payments: ₱${totalCard.toFixed(2)} (${cardSales.length} txn)`, 18, finalY + 46)

    // Footer
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    doc.text('This is a computer-generated report', 105, 285, { align: 'center' })

    // Download
    const date = new Date().toISOString().split('T')[0]
    doc.save(`${filename}-${date}.pdf`)
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
