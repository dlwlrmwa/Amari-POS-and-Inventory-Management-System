-- =====================================================
-- AMARI POS AND INVENTORY MANAGEMENT SYSTEM
-- DATABASE SCHEMA - STORED PROCEDURES
-- Updated: Using TIMESTAMPTZ with Asia/Manila timezone
-- =====================================================

-- Set timezone for this session
SET timezone = 'Asia/Manila';

-- =====================================================
-- PROCEDURE: Create new sale with items
-- =====================================================
CREATE OR REPLACE FUNCTION create_sale_with_items(
    p_salesid VARCHAR,
    p_date DATE,
    p_time TIME,
    p_total_amount DECIMAL,
    p_payment_method VARCHAR,
    p_payment_sub_method VARCHAR,
    p_staffid INTEGER,
    p_cash_received DECIMAL,
    p_change DECIMAL,
    p_items JSONB
)
RETURNS TABLE (
    sale_id VARCHAR,
    status VARCHAR,
    message TEXT
) AS $$
DECLARE
    v_item JSONB;
    v_product_id INTEGER;
    v_quantity INTEGER;
    v_unit_price DECIMAL;
    v_subtotal DECIMAL;
BEGIN
    BEGIN
        -- Insert sale
        INSERT INTO sales (
            salesid, date, sale_time, total_amount, 
            payment_method, payment_sub_method, staffid, 
            cash_received, change, status
        ) VALUES (
            p_salesid, p_date, p_time, p_total_amount,
            p_payment_method, p_payment_sub_method, p_staffid,
            p_cash_received, p_change, 'Completed'
        );
        
        -- Insert sale items
        FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
        LOOP
            v_product_id := (v_item->>'product_id')::INTEGER;
            v_quantity := (v_item->>'quantity')::INTEGER;
            v_unit_price := (v_item->>'unit_price')::DECIMAL;
            v_subtotal := (v_item->>'subtotal')::DECIMAL;
            
            INSERT INTO sale_items (
                sale_id, product_id, product_name, 
                quantity, unit_price, subtotal
            ) VALUES (
                p_salesid, v_product_id, v_item->>'product_name',
                v_quantity, v_unit_price, v_subtotal
            );
            
            -- Update product stock
            UPDATE products
            SET stock = stock - v_quantity
            WHERE id = v_product_id;
        END LOOP;
        
        RETURN QUERY SELECT p_salesid::VARCHAR, 'Success'::VARCHAR, 'Sale created successfully'::TEXT;
        
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT p_salesid::VARCHAR, 'Error'::VARCHAR, SQLERRM::TEXT;
        ROLLBACK;
    END;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PROCEDURE: Restock product
-- =====================================================
CREATE OR REPLACE FUNCTION restock_product(
    p_product_id INTEGER,
    p_quantity INTEGER,
    p_changed_by INTEGER,
    p_cost_per_unit DECIMAL DEFAULT NULL
)
RETURNS TABLE (
    product_id INTEGER,
    new_stock INTEGER,
    status VARCHAR,
    message TEXT
) AS $$
DECLARE
    v_new_stock INTEGER;
BEGIN
    BEGIN
        -- Update product stock
        UPDATE products
        SET stock = stock + p_quantity
        WHERE id = p_product_id
        RETURNING stock INTO v_new_stock;
        
        RETURN QUERY SELECT p_product_id::INTEGER, v_new_stock::INTEGER, 'Success'::VARCHAR, 'Product restocked'::TEXT;
        
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT p_product_id::INTEGER, 0::INTEGER, 'Error'::VARCHAR, SQLERRM::TEXT;
    END;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PROCEDURE: Update ingredient stock
-- =====================================================
CREATE OR REPLACE FUNCTION update_ingredient_stock(
    p_ingredient_id INTEGER,
    p_quantity_change DECIMAL,
    p_reason VARCHAR
)
RETURNS TABLE (
    ingredient_id INTEGER,
    new_stock DECIMAL,
    status VARCHAR,
    message TEXT
) AS $$
DECLARE
    v_new_stock DECIMAL;
    v_current_stock DECIMAL;
BEGIN
    BEGIN
        -- Get current stock
        SELECT current_stock INTO v_current_stock
        FROM ingredients
        WHERE id = p_ingredient_id;
        
        IF v_current_stock IS NULL THEN
            RAISE EXCEPTION 'Ingredient not found';
        END IF;
        
        -- Calculate new stock
        v_new_stock := v_current_stock + p_quantity_change;
        
        -- Check if stock goes below minimum
        IF v_new_stock < 0 THEN
            RAISE EXCEPTION 'Insufficient stock. Current: %, Requested: %', v_current_stock, ABS(p_quantity_change);
        END IF;
        
        -- Update ingredient stock
        UPDATE ingredients
        SET current_stock = v_new_stock
        WHERE id = p_ingredient_id;
        
        RETURN QUERY SELECT p_ingredient_id::INTEGER, v_new_stock::DECIMAL, 'Success'::VARCHAR, 'Ingredient stock updated'::TEXT;
        
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT p_ingredient_id::INTEGER, 0::DECIMAL, 'Error'::VARCHAR, SQLERRM::TEXT;
    END;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PROCEDURE: Create user with role
-- =====================================================
CREATE OR REPLACE FUNCTION create_user_account(
    p_username VARCHAR,
    p_password VARCHAR,
    p_name VARCHAR,
    p_role VARCHAR,
    p_email VARCHAR DEFAULT NULL,
    p_phone VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    user_id INTEGER,
    status VARCHAR,
    message TEXT
) AS $$
DECLARE
    v_user_id INTEGER;
BEGIN
    BEGIN
        -- Validate role
        IF p_role NOT IN ('cashier', 'manager', 'admin') THEN
            RAISE EXCEPTION 'Invalid role: %', p_role;
        END IF;
        
        -- Insert user
        INSERT INTO users (
            username, password, name, role, email, phone, is_active
        ) VALUES (
            p_username, p_password, p_name, p_role, p_email, p_phone, true
        )
        RETURNING id INTO v_user_id;
        
        RETURN QUERY SELECT v_user_id::INTEGER, 'Success'::VARCHAR, 'User created'::TEXT;
        
    EXCEPTION 
        WHEN unique_violation THEN
            RETURN QUERY SELECT 0::INTEGER, 'Error'::VARCHAR, 'Username already exists'::TEXT;
        WHEN OTHERS THEN
            RETURN QUERY SELECT 0::INTEGER, 'Error'::VARCHAR, SQLERRM::TEXT;
    END;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PROCEDURE: Update user information
-- =====================================================
CREATE OR REPLACE FUNCTION update_user_info(
    p_user_id INTEGER,
    p_name VARCHAR DEFAULT NULL,
    p_email VARCHAR DEFAULT NULL,
    p_phone VARCHAR DEFAULT NULL,
    p_role VARCHAR DEFAULT NULL,
    p_is_active BOOLEAN DEFAULT NULL
)
RETURNS TABLE (
    user_id INTEGER,
    status VARCHAR,
    message TEXT
) AS $$
BEGIN
    BEGIN
        UPDATE users
        SET 
            name = COALESCE(p_name, name),
            email = COALESCE(p_email, email),
            phone = COALESCE(p_phone, phone),
            role = COALESCE(p_role, role),
            is_active = COALESCE(p_is_active, is_active)
        WHERE id = p_user_id;
        
        RETURN QUERY SELECT p_user_id::INTEGER, 'Success'::VARCHAR, 'User updated'::TEXT;
        
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT p_user_id::INTEGER, 'Error'::VARCHAR, SQLERRM::TEXT;
    END;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PROCEDURE: Delete user (soft delete)
-- =====================================================
CREATE OR REPLACE FUNCTION delete_user(p_user_id INTEGER)
RETURNS TABLE (
    user_id INTEGER,
    status VARCHAR,
    message TEXT
) AS $$
BEGIN
    BEGIN
        UPDATE users
        SET is_active = false
        WHERE id = p_user_id;
        
        RETURN QUERY SELECT p_user_id::INTEGER, 'Success'::VARCHAR, 'User deactivated'::TEXT;
        
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT p_user_id::INTEGER, 'Error'::VARCHAR, SQLERRM::TEXT;
    END;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PROCEDURE: Generate sales report
-- =====================================================
CREATE OR REPLACE FUNCTION generate_sales_report(
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    report_date DATE,
    total_sales DECIMAL,
    total_transactions INTEGER,
    cash_sales DECIMAL,
    epayment_sales DECIMAL,
    average_transaction DECIMAL,
    top_payment_method VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CURRENT_DATE::DATE,
        SUM(s.total_amount)::DECIMAL,
        COUNT(*)::INTEGER,
        SUM(CASE WHEN s.payment_method = 'Cash' THEN s.total_amount ELSE 0 END)::DECIMAL,
        SUM(CASE WHEN s.payment_method = 'E-Payment' THEN s.total_amount ELSE 0 END)::DECIMAL,
        AVG(s.total_amount)::DECIMAL,
        (SELECT payment_method FROM sales WHERE date BETWEEN p_start_date AND p_end_date AND status = 'Completed' GROUP BY payment_method ORDER BY COUNT(*) DESC LIMIT 1)::VARCHAR
    FROM sales s
    WHERE s.date BETWEEN p_start_date AND p_end_date
    AND s.status = 'Completed';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PROCEDURE: Archive old data
-- =====================================================
CREATE OR REPLACE FUNCTION archive_old_sales_data(p_months_old INTEGER DEFAULT 12)
RETURNS TABLE (
    archived_records INTEGER,
    status VARCHAR,
    message TEXT
) AS $$
DECLARE
    v_count INTEGER;
    v_cutoff_date DATE;
BEGIN
    BEGIN
        v_cutoff_date := CURRENT_DATE - INTERVAL '1 month' * p_months_old;
        
        -- You can implement archiving logic here
        -- For now, just count records
        SELECT COUNT(*) INTO v_count
        FROM sales
        WHERE date < v_cutoff_date;
        
        RETURN QUERY SELECT v_count::INTEGER, 'Success'::VARCHAR, 'Archive analysis completed'::TEXT;
        
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 0::INTEGER, 'Error'::VARCHAR, SQLERRM::TEXT;
    END;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PROCEDURE: Check and alert low stock
-- =====================================================
CREATE OR REPLACE FUNCTION check_low_stock_alert()
RETURNS TABLE (
    product_id INTEGER,
    product_name VARCHAR,
    current_stock INTEGER,
    minimum_stock INTEGER,
    alert_level VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.stock,
        p.min_stock,
        CASE 
            WHEN p.stock = 0 THEN 'CRITICAL - OUT OF STOCK'
            WHEN p.stock < (p.min_stock * 0.5)::INTEGER THEN 'CRITICAL - URGENT RESTOCK'
            WHEN p.stock < p.min_stock THEN 'WARNING - LOW STOCK'
            ELSE 'OK'
        END as alert_level
    FROM products p
    WHERE p.stock <= p.min_stock
    AND p.is_active = true
    ORDER BY p.stock ASC;
END;
$$ LANGUAGE plpgsql;

COMMIT;