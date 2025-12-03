-- =====================================================
-- AMARI POS AND INVENTORY MANAGEMENT SYSTEM
-- DATABASE SCHEMA - TRIGGERS
-- Updated: Using TIMESTAMPTZ with Asia/Manila timezone
-- =====================================================

-- =====================================================
-- TRIGGER: Update product updated_at on change
-- =====================================================
CREATE OR REPLACE FUNCTION update_product_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_product_timestamp ON products;
CREATE TRIGGER update_product_timestamp
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_product_timestamp();

-- =====================================================
-- TRIGGER: Update user updated_at on change
-- =====================================================
CREATE OR REPLACE FUNCTION update_user_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_timestamp ON users;
CREATE TRIGGER update_user_timestamp
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_user_timestamp();

-- =====================================================
-- TRIGGER: Update ingredient updated_date on change
-- =====================================================
CREATE OR REPLACE FUNCTION update_ingredient_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_date = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_ingredient_timestamp ON ingredients;
CREATE TRIGGER update_ingredient_timestamp
    BEFORE UPDATE ON ingredients
    FOR EACH ROW
    EXECUTE FUNCTION update_ingredient_timestamp();

-- =====================================================
-- TRIGGER: Update product sales performance after sale
-- =====================================================
CREATE OR REPLACE FUNCTION update_product_sales_performance()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO product_sales_performance (product_id, product_name, total_quantity_sold, total_revenue, last_sold_date)
    VALUES (NEW.product_id, NEW.product_name, NEW.quantity, NEW.subtotal, (SELECT date FROM sales WHERE salesid = NEW.sale_id))
    ON CONFLICT (product_id) DO UPDATE SET
        total_quantity_sold = product_sales_performance.total_quantity_sold + NEW.quantity,
        total_revenue = product_sales_performance.total_revenue + NEW.subtotal,
        last_sold_date = (SELECT date FROM sales WHERE salesid = NEW.sale_id),
        updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_product_sales_performance ON sale_items;
CREATE TRIGGER update_product_sales_performance
    AFTER INSERT ON sale_items
    FOR EACH ROW
    EXECUTE FUNCTION update_product_sales_performance();

-- =====================================================
-- TRIGGER: Create audit log for sales
-- =====================================================
CREATE OR REPLACE FUNCTION audit_sale_creation()
RETURNS TRIGGER AS $$
DECLARE
    user_name VARCHAR(50);
BEGIN
    SELECT username INTO user_name FROM users WHERE id = NEW.staffid;
    
    INSERT INTO audit_logs (
        user_id,
        username,
        action,
        entity_type,
        entity_id,
        description,
        new_value
    ) VALUES (
        NEW.staffid,
        user_name,
        'SALE',
        'Sale',
        NULL,
        'Sale created: ' || NEW.salesid,
        'Amount: ' || NEW.total_amount || ' | Payment: ' || NEW.payment_method
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_sale_creation ON sales;
CREATE TRIGGER audit_sale_creation
    AFTER INSERT ON sales
    FOR EACH ROW
    EXECUTE FUNCTION audit_sale_creation();

-- =====================================================
-- TRIGGER: Create audit log for user changes
-- =====================================================
CREATE OR REPLACE FUNCTION audit_user_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (
            action,
            entity_type,
            entity_id,
            description,
            new_value
        ) VALUES (
            'USER_CREATE',
            'User',
            NEW.id,
            'User created: ' || NEW.username,
            'Role: ' || NEW.role
        );
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (
            action,
            entity_type,
            entity_id,
            description,
            old_value,
            new_value
        ) VALUES (
            'USER_UPDATE',
            'User',
            NEW.id,
            'User updated: ' || NEW.username,
            'Old Role: ' || OLD.role,
            'New Role: ' || NEW.role
        );
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (
            action,
            entity_type,
            entity_id,
            description,
            old_value
        ) VALUES (
            'USER_DELETE',
            'User',
            OLD.id,
            'User deleted: ' || OLD.username,
            'Role was: ' || OLD.role
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_user_changes ON users;
CREATE TRIGGER audit_user_changes
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW
    EXECUTE FUNCTION audit_user_changes();

-- =====================================================
-- TRIGGER: Create audit log for product changes
-- =====================================================
CREATE OR REPLACE FUNCTION audit_product_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (
            action,
            entity_type,
            entity_id,
            description,
            new_value
        ) VALUES (
            'PRODUCT_CREATE',
            'Product',
            NEW.id,
            'Product created: ' || NEW.name,
            'Price: ' || NEW.price || ' | Stock: ' || NEW.stock
        );
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.stock != NEW.stock THEN
            INSERT INTO audit_logs (
                action,
                entity_type,
                entity_id,
                description,
                old_value,
                new_value
            ) VALUES (
                'STOCK_ADJUSTMENT',
                'Product',
                NEW.id,
                'Stock adjusted for: ' || NEW.name,
                'Stock was: ' || OLD.stock,
                'Stock now: ' || NEW.stock
            );
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (
            action,
            entity_type,
            entity_id,
            description,
            old_value
        ) VALUES (
            'PRODUCT_DELETE',
            'Product',
            OLD.id,
            'Product deleted: ' || OLD.name,
            'Price was: ' || OLD.price
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_product_changes ON products;
CREATE TRIGGER audit_product_changes
    AFTER INSERT OR UPDATE OR DELETE ON products
    FOR EACH ROW
    EXECUTE FUNCTION audit_product_changes();

-- =====================================================
-- TRIGGER: Update daily sales summary after sale
-- =====================================================
CREATE OR REPLACE FUNCTION update_daily_sales_summary()
RETURNS TRIGGER AS $$
DECLARE
    sale_date DATE;
    total_amt DECIMAL(12, 2);
    trans_count INTEGER;
    avg_trans DECIMAL(10, 2);
    cash_amt DECIMAL(12, 2);
    epay_amt DECIMAL(12, 2);
BEGIN
    sale_date := NEW.date;
    
    SELECT 
        COALESCE(SUM(total_amount), 0),
        COUNT(*),
        COALESCE(AVG(total_amount), 0),
        COALESCE(SUM(CASE WHEN payment_method = 'Cash' THEN total_amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN payment_method = 'E-Payment' THEN total_amount ELSE 0 END), 0)
    INTO total_amt, trans_count, avg_trans, cash_amt, epay_amt
    FROM sales
    WHERE date = sale_date AND status = 'Completed';
    
    INSERT INTO daily_sales_summary (date, total_sales, transaction_count, average_transaction, cash_sales, epayment_sales)
    VALUES (sale_date, total_amt, trans_count, avg_trans, cash_amt, epay_amt)
    ON CONFLICT (date) DO UPDATE SET
        total_sales = total_amt,
        transaction_count = trans_count,
        average_transaction = avg_trans,
        cash_sales = cash_amt,
        epayment_sales = epay_amt,
        created_at = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_daily_sales_summary ON sales;
CREATE TRIGGER update_daily_sales_summary
    AFTER INSERT OR UPDATE ON sales
    FOR EACH ROW
    WHEN (NEW.status = 'Completed')
    EXECUTE FUNCTION update_daily_sales_summary();

COMMIT;