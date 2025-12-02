-- =====================================================
-- AMARI POS AND INVENTORY MANAGEMENT SYSTEM
-- DATABASE SCHEMA - INDEXES AND OPTIMIZATION
-- Updated: Using TIMESTAMPTZ with Asia/Manila timezone
-- =====================================================

-- Set timezone for this session
SET timezone = 'Asia/Manila';

-- =====================================================
-- ADDITIONAL INDEXES FOR PERFORMANCE
-- =====================================================

-- Sales query optimization
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON sales(payment_method, status);
CREATE INDEX IF NOT EXISTS idx_sales_staff_date ON sales(staffid, date);

-- Sale items query optimization
CREATE INDEX IF NOT EXISTS idx_sale_items_created_at ON sale_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_name ON sale_items(product_name);

-- Products query optimization
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active, stock);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock) WHERE stock <= min_stock;

-- Ingredients query optimization
CREATE INDEX IF NOT EXISTS idx_ingredients_active ON ingredients(is_active);
CREATE INDEX IF NOT EXISTS idx_ingredients_stock ON ingredients(current_stock) WHERE current_stock <= minimum_stock;

-- Audit logs query optimization
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action_date ON audit_logs(user_id, action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_date ON audit_logs(action, created_at DESC);

-- Users query optimization
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Daily summary query optimization
CREATE INDEX IF NOT EXISTS idx_daily_summary_range ON daily_sales_summary(date DESC);

-- Product performance query optimization
CREATE INDEX IF NOT EXISTS idx_product_perf_date ON product_sales_performance(updated_at DESC);

-- =====================================================
-- COMPOSITE INDEXES FOR COMMON QUERIES
-- =====================================================

-- For sales report queries
CREATE INDEX IF NOT EXISTS idx_sales_date_payment ON sales(date DESC, payment_method, status);

-- For product search
CREATE INDEX IF NOT EXISTS idx_products_category_stock ON products(category, stock, is_active);

-- For audit trail
CREATE INDEX IF NOT EXISTS idx_audit_user_date_action ON audit_logs(user_id, created_at DESC, action);

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- Create view for active products
DROP VIEW IF EXISTS v_active_products CASCADE;
CREATE VIEW v_active_products AS
SELECT 
    id,
    name,
    price,
    category,
    stock,
    min_stock,
    sku,
    image,
    (stock <= min_stock) as needs_restock
FROM products
WHERE is_active = true
ORDER BY name;

-- Create view for sales with staff info
DROP VIEW IF EXISTS v_sales_with_staff CASCADE;
CREATE VIEW v_sales_with_staff AS
SELECT 
    s.id,
    s.salesid,
    s.date,
    s.sale_time,
    s.total_amount,
    s.cash_received,
    s.change,
    s.payment_method,
    s.payment_sub_method,
    s.status,
    s.created_at,
    u.id as staff_id,
    u.name as staff_name,
    u.username as staff_username
FROM sales s
LEFT JOIN users u ON s.staffid = u.id
ORDER BY s.date DESC, s.sale_time DESC;

-- Create view for active users
DROP VIEW IF EXISTS v_active_users CASCADE;
CREATE VIEW v_active_users AS
SELECT 
    id,
    username,
    name,
    role,
    email,
    phone,
    is_active,
    created_at
FROM users
WHERE is_active = true
ORDER BY name;

-- Create view for low stock alert
DROP VIEW IF EXISTS v_low_stock_alert CASCADE;
CREATE VIEW v_low_stock_alert AS
SELECT 
    id,
    name,
    category,
    stock,
    min_stock,
    sku,
    CASE 
        WHEN stock = 0 THEN 'OUT_OF_STOCK'
        WHEN stock < (min_stock * 0.3)::INTEGER THEN 'CRITICAL'
        WHEN stock < min_stock THEN 'LOW'
        ELSE 'OK'
    END as alert_status,
    (min_stock - stock) as units_needed
FROM products
WHERE is_active = true
AND stock <= min_stock
ORDER BY stock ASC;

-- Create view for daily sales summary
DROP VIEW IF EXISTS v_daily_sales CASCADE;
CREATE VIEW v_daily_sales AS
SELECT 
    DATE(created_at) as sale_date,
    COUNT(*) as transaction_count,
    SUM(total_amount)::DECIMAL as total_sales,
    AVG(total_amount)::DECIMAL as average_transaction,
    MAX(total_amount)::DECIMAL as max_transaction,
    MIN(total_amount)::DECIMAL as min_transaction,
    SUM(CASE WHEN payment_method = 'Cash' THEN total_amount ELSE 0 END)::DECIMAL as cash_total,
    SUM(CASE WHEN payment_method = 'E-Payment' THEN total_amount ELSE 0 END)::DECIMAL as epayment_total,
FROM sales
WHERE status IN ('Completed')
GROUP BY DATE(created_at)
ORDER BY sale_date DESC;

-- Create view for top products
DROP VIEW IF EXISTS v_top_products CASCADE;
CREATE VIEW v_top_products AS
SELECT 
    p.id,
    p.name,
    p.category,
    p.price,
    COUNT(si.id)::INTEGER as times_sold,
    SUM(si.quantity)::INTEGER as total_quantity,
    SUM(si.subtotal)::DECIMAL as total_revenue,
    ROUND(SUM(si.subtotal)::NUMERIC / NULLIF(COUNT(si.id), 0), 2)::DECIMAL as average_sale
FROM products p
LEFT JOIN sale_items si ON p.id = si.product_id
LEFT JOIN sales s ON si.sale_id = s.salesid AND s.status = 'Completed'
WHERE p.is_active = true
GROUP BY p.id, p.name, p.category, p.price
ORDER BY total_revenue DESC NULLS LAST;

-- Create view for staff performance
DROP VIEW IF EXISTS v_staff_performance CASCADE;
CREATE VIEW v_staff_performance AS
SELECT 
    u.id as staff_id,
    u.name as staff_name,
    u.role,
    COUNT(s.id)::INTEGER as total_transactions,
    SUM(s.total_amount)::DECIMAL as total_sales,
    AVG(s.total_amount)::DECIMAL as average_transaction,
    MAX(s.total_amount)::DECIMAL as highest_transaction,
    MIN(s.created_at) as first_sale,
    MAX(s.created_at) as last_sale
FROM users u
LEFT JOIN sales s ON u.id = s.staffid AND s.status = 'Completed'
WHERE u.is_active = true AND u.role IN ('cashier', 'manager')
GROUP BY u.id, u.name, u.role
ORDER BY total_sales DESC NULLS LAST;

-- Create view for audit trail
DROP VIEW IF EXISTS v_audit_trail CASCADE;
CREATE VIEW v_audit_trail AS
SELECT 
    al.id,
    al.user_id,
    al.username,
    al.action,
    al.entity_type,
    al.entity_id,
    al.description,
    al.old_value,
    al.new_value,
    al.created_at,
    al.created_at::DATE as action_date,
    al.created_at::TIME as action_time
FROM audit_logs al
ORDER BY al.created_at DESC;

-- Create view for payment processing
DROP VIEW IF EXISTS v_payment_processing CASCADE;
CREATE VIEW v_payment_processing AS
SELECT 
    s.payment_method,
    s.payment_sub_method,
    COUNT(*)::INTEGER as transaction_count,
    SUM(s.total_amount)::DECIMAL as total_amount,
    AVG(s.total_amount)::DECIMAL as average_amount,
    DATE(s.created_at) as transaction_date
FROM sales s
WHERE s.status = 'Completed'
GROUP BY DATE(s.created_at), s.payment_method, s.payment_sub_method
ORDER BY transaction_date DESC;

-- =====================================================
-- MATERIALIZED VIEWS (For heavier queries)
-- =====================================================

-- Create materialized view for weekly sales summary
DROP MATERIALIZED VIEW IF EXISTS mv_weekly_sales CASCADE;
CREATE MATERIALIZED VIEW mv_weekly_sales AS
SELECT 
    DATE_TRUNC('week', s.date)::DATE as week_start,
    COUNT(*)::INTEGER as transaction_count,
    SUM(s.total_amount)::DECIMAL as total_sales,
    AVG(s.total_amount)::DECIMAL as average_transaction,
    SUM(CASE WHEN s.payment_method = 'Cash' THEN s.total_amount ELSE 0 END)::DECIMAL as cash_sales,
    SUM(CASE WHEN s.payment_method = 'E-Payment' THEN s.total_amount ELSE 0 END)::DECIMAL as epayment_sales
FROM sales s
WHERE s.status = 'Completed'
GROUP BY DATE_TRUNC('week', s.date);

CREATE INDEX idx_mv_weekly_sales_date ON mv_weekly_sales(week_start DESC);

-- Create materialized view for monthly sales summary
DROP MATERIALIZED VIEW IF EXISTS mv_monthly_sales CASCADE;
CREATE MATERIALIZED VIEW mv_monthly_sales AS
SELECT 
    DATE_TRUNC('month', s.date)::DATE as month_start,
    COUNT(*)::INTEGER as transaction_count,
    SUM(s.total_amount)::DECIMAL as total_sales,
    AVG(s.total_amount)::DECIMAL as average_transaction,
    SUM(CASE WHEN s.payment_method = 'Cash' THEN s.total_amount ELSE 0 END)::DECIMAL as cash_sales,
    SUM(CASE WHEN s.payment_method = 'E-Payment' THEN s.total_amount ELSE 0 END)::DECIMAL as epayment_sales
FROM sales s
WHERE s.status = 'Completed'
GROUP BY DATE_TRUNC('month', s.date);

CREATE INDEX idx_mv_monthly_sales_date ON mv_monthly_sales(month_start DESC);

-- =====================================================
-- PERFORMANCE SETTINGS
-- =====================================================

-- Analyze all tables for query optimization
ANALYZE users;
ANALYZE products;
ANALYZE ingredients;
ANALYZE sales;
ANALYZE sale_items;
ANALYZE audit_logs;
ANALYZE settings;
ANALYZE daily_sales_summary;
ANALYZE product_sales_performance;

COMMIT;