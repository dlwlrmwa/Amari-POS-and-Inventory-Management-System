-- =====================================================
-- AMARI POS SYSTEM - FUNCTIONS
-- =====================================================

-- =====================================================
-- 1. HELPER FUNCTION FOR TIMESTAMP UPDATES
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. HELPER FUNCTION FOR INGREDIENTS TIMESTAMP
-- =====================================================
CREATE OR REPLACE FUNCTION update_ingredients_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_date = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. FUNCTION - Update product stock after a sale
-- =====================================================
CREATE OR REPLACE FUNCTION update_product_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products
    SET stock = stock - NEW.quantity,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. FUNCTION - Get low stock products (below minimum)
-- =====================================================
CREATE OR REPLACE FUNCTION get_low_stock_products()
RETURNS TABLE (
    id BIGINT,
    name VARCHAR,
    stock BIGINT,
    min_stock BIGINT,
    category VARCHAR,
    sku VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.name, p.stock, p.min_stock, p.category, p.sku
    FROM products p
    WHERE p.stock <= p.min_stock
    ORDER BY p.stock ASC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. FUNCTION - Get sales summary for a date range
-- =====================================================
CREATE OR REPLACE FUNCTION get_sales_summary(start_date DATE, end_date DATE)
RETURNS TABLE (
    total_sales DECIMAL,
    total_transactions BIGINT,
    average_order_value DECIMAL,
    total_cash_transactions BIGINT,
    total_epayment_transactions BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(total_amount), 0)::DECIMAL as total_sales,
        COUNT(*)::BIGINT as total_transactions,
        COALESCE(AVG(total_amount), 0)::DECIMAL as average_order_value,
        COALESCE(SUM(CASE WHEN payment_method = 'Cash' THEN 1 ELSE 0 END), 0)::BIGINT as total_cash_transactions,
        COALESCE(SUM(CASE WHEN payment_method = 'E-Payment' THEN 1 ELSE 0 END), 0)::BIGINT as total_epayment_transactions
    FROM sales
    WHERE date >= start_date AND date <= end_date AND status = 'Completed';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. FUNCTION - Get daily sales
-- =====================================================
CREATE OR REPLACE FUNCTION get_daily_sales(sale_date DATE)
RETURNS TABLE (
    id BIGINT,
    salesid VARCHAR,
    date DATE,
    sale_time TIME,
    total_amount DECIMAL,
    payment_method VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT s.id, s.salesid, s.date, s.sale_time, s.total_amount, s.payment_method
    FROM sales s
    WHERE s.date = sale_date AND s.status = 'Completed'
    ORDER BY s.sale_time DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. FUNCTION - Get sales by payment method
-- =====================================================
CREATE OR REPLACE FUNCTION get_sales_by_payment_method(start_date DATE, end_date DATE)
RETURNS TABLE (
    payment_method VARCHAR,
    payment_sub_method VARCHAR,
    total_amount DECIMAL,
    transaction_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.payment_method,
        s.payment_sub_method,
        COALESCE(SUM(s.total_amount), 0)::DECIMAL as total_amount,
        COUNT(*)::BIGINT as transaction_count
    FROM sales s
    WHERE s.date >= start_date AND s.date <= end_date AND s.status = 'Completed'
    GROUP BY s.payment_method, s.payment_sub_method
    ORDER BY total_amount DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. FUNCTION - Get inventory by category
-- =====================================================
CREATE OR REPLACE FUNCTION get_inventory_by_category()
RETURNS TABLE (
    category VARCHAR,
    total_products BIGINT,
    total_stock BIGINT,
    total_value DECIMAL,
    low_stock_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.category,
        COUNT(p.id)::BIGINT as total_products,
        COALESCE(SUM(p.stock), 0)::BIGINT as total_stock,
        COALESCE(SUM(p.price * p.stock), 0)::DECIMAL as total_value,
        COALESCE(SUM(CASE WHEN p.stock <= p.min_stock THEN 1 ELSE 0 END), 0)::BIGINT as low_stock_count
    FROM products p
    GROUP BY p.category
    ORDER BY p.category;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- END OF FUNCTIONS FILE
-- =====================================================
