-- #############################################################################
-- ## SAFE DATABASE ENHANCEMENTS
-- ## This script adds functions, triggers, and stored procedures
-- ## WITHOUT destroying existing data or tables
-- ## Safe to run multiple times (uses IF NOT EXISTS and CREATE OR REPLACE)
-- #############################################################################

-- -----------------------------------------------------------------------------
-- ## FUNCTION 1: Auto-update timestamp
-- ## Automatically updates the 'updated_at' column when a row is modified
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically sets updated_at to current timestamp on row updates';


-- -----------------------------------------------------------------------------
-- ## TRIGGERS: Apply auto-timestamp to all tables
-- -----------------------------------------------------------------------------

-- Trigger for products table
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for sales table
DROP TRIGGER IF EXISTS update_sales_updated_at ON sales;
CREATE TRIGGER update_sales_updated_at 
    BEFORE UPDATE ON sales
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for sale_items table
DROP TRIGGER IF EXISTS update_sale_items_updated_at ON sale_items;
CREATE TRIGGER update_sale_items_updated_at 
    BEFORE UPDATE ON sale_items
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();


-- -----------------------------------------------------------------------------
-- ## FUNCTION 2: Check Stock Availability
-- ## Returns TRUE if product has enough stock, FALSE otherwise
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_stock_availability(
    p_product_id BIGINT,
    p_quantity INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    current_stock INTEGER;
BEGIN
    SELECT stock INTO current_stock 
    FROM products 
    WHERE id = p_product_id;
    
    IF current_stock IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN current_stock >= p_quantity;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_stock_availability(BIGINT, INTEGER) IS 'Checks if a product has sufficient stock for the requested quantity';


-- -----------------------------------------------------------------------------
-- ## FUNCTION 3: Get Low Stock Products
-- ## Returns all products where stock <= min_stock
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_low_stock_products()
RETURNS TABLE (
    product_id BIGINT,
    product_name TEXT,
    current_stock INTEGER,
    min_stock INTEGER,
    sku TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        id,
        name,
        stock,
        min_stock,
        sku
    FROM products
    WHERE stock <= min_stock
    ORDER BY stock ASC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_low_stock_products() IS 'Returns all products with stock at or below minimum threshold';


-- -----------------------------------------------------------------------------
-- ## FUNCTION 4: Calculate Daily Sales Total
-- ## Gets total sales for a specific date
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_daily_sales_total(p_date DATE)
RETURNS NUMERIC(10, 2) AS $$
DECLARE
    total NUMERIC(10, 2);
BEGIN
    SELECT COALESCE(SUM(total_amount), 0) 
    INTO total
    FROM sales
    WHERE date = p_date;
    
    RETURN total;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_daily_sales_total(DATE) IS 'Returns total sales amount for a specific date';


-- -----------------------------------------------------------------------------
-- ## FUNCTION 5: Calculate Date Range Sales
-- ## Gets total sales between two dates
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_sales_by_date_range(
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    total_sales NUMERIC(10, 2),
    total_transactions BIGINT,
    avg_order_value NUMERIC(10, 2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(total_amount), 0) as total_sales,
        COUNT(*)::BIGINT as total_transactions,
        CASE 
            WHEN COUNT(*) > 0 THEN COALESCE(SUM(total_amount) / COUNT(*), 0)
            ELSE 0
        END as avg_order_value
    FROM sales
    WHERE date BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_sales_by_date_range(DATE, DATE) IS 'Returns sales statistics for a date range';


-- -----------------------------------------------------------------------------
-- ## STORED PROCEDURE 1: Process Sale Transaction
-- ## Safely creates a sale with transaction support
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION process_sale_transaction(
    p_sale_id TEXT,
    p_date DATE,
    p_time TIME,
    p_customer TEXT,
    p_total_amount NUMERIC(10, 2),
    p_payment_method TEXT,
    p_payment_sub_method TEXT,
    p_items JSONB  -- Array of {product_id, quantity, unit_price}
)
RETURNS TEXT AS $$
DECLARE
    item JSONB;
    product_name TEXT;
    product_stock INTEGER;
    calculated_subtotal NUMERIC(10, 2);
BEGIN
    -- Insert the sale header
    INSERT INTO sales (
        id, date, time, customer, total_amount, 
        payment_method, payment_sub_method, status
    ) VALUES (
        p_sale_id, p_date, p_time, p_customer, p_total_amount,
        p_payment_method, p_payment_sub_method, 'Completed'
    );
    
    -- Process each sale item
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        -- Get product details and check stock
        SELECT name, stock INTO product_name, product_stock
        FROM products
        WHERE id = (item->>'product_id')::BIGINT;
        
        IF product_stock < (item->>'quantity')::INTEGER THEN
            RAISE EXCEPTION 'Insufficient stock for product: %', product_name;
        END IF;
        
        -- Calculate subtotal
        calculated_subtotal := (item->>'unit_price')::NUMERIC * (item->>'quantity')::INTEGER;
        
        -- Insert sale item
        INSERT INTO sale_items (
            sale_id, product_id, product_name, 
            quantity, unit_price, subtotal
        ) VALUES (
            p_sale_id,
            (item->>'product_id')::BIGINT,
            product_name,
            (item->>'quantity')::INTEGER,
            (item->>'unit_price')::NUMERIC,
            calculated_subtotal
        );
        
        -- Update product stock
        UPDATE products
        SET stock = stock - (item->>'quantity')::INTEGER
        WHERE id = (item->>'product_id')::BIGINT;
    END LOOP;
    
    RETURN p_sale_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Transaction failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION process_sale_transaction IS 'Processes a complete sale transaction with automatic stock updates';


-- -----------------------------------------------------------------------------
-- ## FUNCTION 6: Get Product Sales Statistics
-- ## Returns detailed sales stats for a specific product
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_product_sales_stats(p_product_id BIGINT)
RETURNS TABLE (
    product_id BIGINT,
    product_name TEXT,
    total_quantity_sold INTEGER,
    total_revenue NUMERIC(10, 2),
    number_of_transactions BIGINT,
    avg_quantity_per_sale NUMERIC(10, 2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p_product_id,
        MAX(si.product_name) as product_name,
        SUM(si.quantity)::INTEGER as total_quantity_sold,
        SUM(si.subtotal) as total_revenue,
        COUNT(DISTINCT si.sale_id) as number_of_transactions,
        CASE 
            WHEN COUNT(DISTINCT si.sale_id) > 0 
            THEN SUM(si.quantity)::NUMERIC / COUNT(DISTINCT si.sale_id)
            ELSE 0
        END as avg_quantity_per_sale
    FROM sale_items si
    WHERE si.product_id = p_product_id
    GROUP BY p_product_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_product_sales_stats(BIGINT) IS 'Returns comprehensive sales statistics for a specific product';


-- -----------------------------------------------------------------------------
-- ## FUNCTION 7: Validate Sale Data
-- ## Checks if sale data is valid before insertion
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION validate_sale_data(
    p_total_amount NUMERIC(10, 2),
    p_payment_method TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    -- Check if total amount is positive
    IF p_total_amount <= 0 THEN
        RAISE EXCEPTION 'Total amount must be greater than zero';
    END IF;
    
    -- Check if payment method is valid
    IF p_payment_method NOT IN ('Cash', 'E-Payment') THEN
        RAISE EXCEPTION 'Invalid payment method: %', p_payment_method;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_sale_data IS 'Validates sale data before processing';


-- -----------------------------------------------------------------------------
-- ## VIEW: Enhanced Daily Sales Summary (replaces existing)
-- ## Adds more details to the daily summary
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.daily_sales_summary AS
SELECT 
    date,
    SUM(total_amount) as total_sales,
    COUNT(*) as transaction_count,
    AVG(total_amount) as avg_transaction_value,
    MIN(total_amount) as min_transaction,
    MAX(total_amount) as max_transaction
FROM public.sales
GROUP BY date
ORDER BY date DESC;


-- -----------------------------------------------------------------------------
-- ## Verification Queries
-- ## Run these to verify everything is working
-- -----------------------------------------------------------------------------

-- List all functions
-- SELECT routine_name, routine_type 
-- FROM information_schema.routines 
-- WHERE routine_schema = 'public' 
-- ORDER BY routine_name;

-- List all triggers
-- SELECT trigger_name, event_object_table, action_statement
-- FROM information_schema.triggers
-- WHERE trigger_schema = 'public'
-- ORDER BY event_object_table, trigger_name;

-- Test low stock function
-- SELECT * FROM get_low_stock_products();

-- Test daily sales function
-- SELECT * FROM get_daily_sales_total(CURRENT_DATE);


-- #############################################################################
-- ## INSTALLATION COMPLETE
-- ## All enhancements have been safely added to your database
-- ## Your existing data remains untouched
-- #############################################################################