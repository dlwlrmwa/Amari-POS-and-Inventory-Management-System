-- =====================================================
-- AMARI POS AND INVENTORY MANAGEMENT SYSTEM
-- DATABASE SCHEMA - FUNCTIONS
-- Updated: Using TIMESTAMPTZ with Asia/Manila timezone
-- =====================================================

-- Set timezone for this session
SET timezone = 'Asia/Manila';

-- =====================================================
-- HELPER FUNCTIONS: Manila Time
-- =====================================================

-- Function to get current Manila date
CREATE OR REPLACE FUNCTION manila_date()
RETURNS DATE AS $$
BEGIN
    RETURN CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to get current Manila time
CREATE OR REPLACE FUNCTION manila_time()
RETURNS TIME AS $$
BEGIN
    RETURN CURRENT_TIME;
END;
$$ LANGUAGE plpgsql;

-- Function to get current Manila timestamp
CREATE OR REPLACE FUNCTION manila_now()
RETURNS TIMESTAMPTZ AS $$
BEGIN
    RETURN CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Get sales by date range with staff info
-- =====================================================
CREATE OR REPLACE FUNCTION get_sales_by_range(p_start_date DATE, p_end_date DATE)
RETURNS TABLE (
    id VARCHAR,
    sale_date DATE,
    sale_time TIME,
    total_amount DECIMAL,
    payment_method VARCHAR,
    staff_name VARCHAR,
    transaction_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.salesid,
        s.date,
        s.sale_time,
        s.total_amount,
        s.payment_method,
        COALESCE(u.name, 'Unknown') as staff_name,
        COUNT(*) OVER (PARTITION BY s.date) as transaction_count
    FROM sales s
    LEFT JOIN users u ON s.staffid = u.id
    WHERE s.date BETWEEN p_start_date AND p_end_date
    AND s.status = 'Completed'
    ORDER BY s.date DESC, s.sale_time DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Get daily sales summary
-- =====================================================
CREATE OR REPLACE FUNCTION get_daily_summary(p_date DATE)
RETURNS TABLE (
    total_sales DECIMAL,
    transaction_count INTEGER,
    average_transaction DECIMAL,
    cash_sales DECIMAL,
    epayment_sales DECIMAL,
    gcash_count INTEGER,
    maya_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(s.total_amount), 0)::DECIMAL as total_sales,
        COUNT(*)::INTEGER as transaction_count,
        COALESCE(AVG(s.total_amount), 0)::DECIMAL as average_transaction,
        COALESCE(SUM(CASE WHEN s.payment_method = 'Cash' THEN s.total_amount ELSE 0 END), 0)::DECIMAL as cash_sales,
        COALESCE(SUM(CASE WHEN s.payment_method = 'E-Payment' THEN s.total_amount ELSE 0 END), 0)::DECIMAL as epayment_sales,
        COUNT(CASE WHEN s.payment_sub_method = 'GCash' THEN 1 END)::INTEGER as gcash_count,
        COUNT(CASE WHEN s.payment_sub_method = 'Maya' THEN 1 END)::INTEGER as maya_count
    FROM sales s
    WHERE s.date = p_date AND s.status = 'Completed';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Get top selling products
-- =====================================================
CREATE OR REPLACE FUNCTION get_top_products(p_limit INTEGER DEFAULT 10, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
    product_id INTEGER,
    product_name VARCHAR,
    total_quantity_sold INTEGER,
    total_revenue DECIMAL,
    average_price DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        si.product_id,
        si.product_name,
        SUM(si.quantity)::INTEGER as total_quantity_sold,
        SUM(si.subtotal)::DECIMAL as total_revenue,
        AVG(si.unit_price)::DECIMAL as average_price
    FROM sale_items si
    JOIN sales s ON si.sale_id = s.salesid
    WHERE s.date >= CURRENT_DATE - INTERVAL '1 day' * p_days
    AND s.status = 'Completed'
    GROUP BY si.product_id, si.product_name
    ORDER BY total_revenue DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Get low stock products
-- =====================================================
DROP FUNCTION IF EXISTS get_low_stock_products();
CREATE OR REPLACE FUNCTION get_low_stock_products()
RETURNS TABLE (
    product_id INTEGER,
    product_name VARCHAR,
    current_stock INTEGER,
    minimum_stock INTEGER,
    status VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.stock,
        p.min_stock,
        CASE 
            WHEN p.stock = 0 THEN 'Out of Stock'
            WHEN p.stock < p.min_stock THEN 'Low Stock'
            ELSE 'In Stock'
        END as status
    FROM products p
    WHERE p.stock <= p.min_stock
    AND p.is_active = true
    ORDER BY p.stock ASC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Get audit logs by date range
-- =====================================================
DROP FUNCTION IF EXISTS get_audit_logs_by_range(TIMESTAMP, TIMESTAMP, VARCHAR);
CREATE OR REPLACE FUNCTION get_audit_logs_by_range(
    p_start_date TIMESTAMPTZ, 
    p_end_date TIMESTAMPTZ, 
    p_action VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    id INTEGER,
    user_id INTEGER,
    username VARCHAR,
    action VARCHAR,
    entity_type VARCHAR,
    description TEXT,
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.id,
        al.user_id,
        al.username,
        al.action,
        al.entity_type,
        al.description,
        al.old_value,
        al.new_value,
        al.created_at
    FROM audit_logs al
    WHERE al.created_at BETWEEN p_start_date AND p_end_date
    AND (p_action IS NULL OR al.action = p_action)
    ORDER BY al.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Get user login history
-- =====================================================
DROP FUNCTION IF EXISTS get_user_login_history(INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION get_user_login_history(
    p_user_id INTEGER DEFAULT NULL, 
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    id INTEGER,
    username VARCHAR,
    action VARCHAR,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.id,
        al.username,
        al.action,
        al.created_at
    FROM audit_logs al
    WHERE al.action IN ('LOGIN', 'LOGOUT')
    AND al.created_at >= CURRENT_TIMESTAMP - INTERVAL '1 day' * p_days
    AND (p_user_id IS NULL OR al.user_id = p_user_id)
    ORDER BY al.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Calculate monthly sales
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_monthly_sales(p_year INTEGER, p_month INTEGER)
RETURNS TABLE (
    day INTEGER,
    total_sales DECIMAL,
    transaction_count INTEGER,
    average_transaction DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXTRACT(DAY FROM s.date)::INTEGER as day,
        SUM(s.total_amount)::DECIMAL as total_sales,
        COUNT(*)::INTEGER as transaction_count,
        AVG(s.total_amount)::DECIMAL as average_transaction
    FROM sales s
    WHERE EXTRACT(YEAR FROM s.date) = p_year
    AND EXTRACT(MONTH FROM s.date) = p_month
    AND s.status = 'Completed'
    GROUP BY EXTRACT(DAY FROM s.date)
    ORDER BY day ASC;
END;
$$ LANGUAGE plpgsql;

    
    -- Restore product stock
    UPDATE products p
    SET stock = stock + si.quantity
    FROM sale_items si
    WHERE si.sale_id = p_sale_id
    AND p.id = si.product_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Get payment processing report
-- =====================================================
CREATE OR REPLACE FUNCTION get_payment_processing_report(p_start_date DATE, p_end_date DATE)
RETURNS TABLE (
    date DATE,
    payment_method VARCHAR,
    payment_sub_method VARCHAR,
    transaction_count INTEGER,
    total_amount DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.date,
        s.payment_method,
        COALESCE(s.payment_sub_method, 'N/A') as payment_sub_method,
        COUNT(*)::INTEGER as transaction_count,
        SUM(s.total_amount)::DECIMAL as total_amount
    FROM sales s
    WHERE s.date BETWEEN p_start_date AND p_end_date
    AND s.status = 'Completed'
    GROUP BY s.date, s.payment_method, s.payment_sub_method
    ORDER BY s.date DESC, transaction_count DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Get staff performance
-- =====================================================
CREATE OR REPLACE FUNCTION get_staff_performance(p_start_date DATE, p_end_date DATE)
RETURNS TABLE (
    staff_id INTEGER,
    staff_name VARCHAR,
    total_sales DECIMAL,
    transaction_count INTEGER,
    average_transaction DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(s.staffid, 0)::INTEGER as staff_id,
        COALESCE(u.name, 'Unknown')::VARCHAR as staff_name,
        SUM(s.total_amount)::DECIMAL as total_sales,
        COUNT(*)::INTEGER as transaction_count,
        AVG(s.total_amount)::DECIMAL as average_transaction
    FROM sales s
    LEFT JOIN users u ON s.staffid = u.id
    WHERE s.date BETWEEN p_start_date AND p_end_date
    AND s.status = 'Completed'
    GROUP BY s.staffid, u.name
    ORDER BY total_sales DESC;
END;
$$ LANGUAGE plpgsql;

COMMIT;