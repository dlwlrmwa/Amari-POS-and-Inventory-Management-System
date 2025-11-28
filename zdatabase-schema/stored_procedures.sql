-- =====================================================
-- AMARI POS SYSTEM - STORED PROCEDURES
-- =====================================================

-- =====================================================
-- 1. STORED PROCEDURE - Create a complete sale with items
-- =====================================================
CREATE OR REPLACE FUNCTION create_sale_transaction(
    p_salesid VARCHAR,
    p_date DATE,
    p_sale_time TIME,
    p_total_amount DECIMAL,
    p_cash_received DECIMAL,
    p_change DECIMAL,
    p_payment_method VARCHAR,
    p_payment_sub_method VARCHAR,
    p_staffid BIGINT
)
RETURNS TABLE (
    success BOOLEAN,
    message VARCHAR,
    sale_id BIGINT
) AS $$
DECLARE
    v_sale_id BIGINT;
BEGIN
    INSERT INTO sales (salesid, date, sale_time, total_amount, cash_received, change, payment_method, payment_sub_method, staffid, status)
    VALUES (p_salesid, p_date, p_sale_time, p_total_amount, p_cash_received, p_change, p_payment_method, p_payment_sub_method, p_staffid, 'Completed')
    RETURNING id INTO v_sale_id;
    
    RETURN QUERY SELECT TRUE::BOOLEAN, 'Sale created successfully'::VARCHAR, v_sale_id;
EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE::BOOLEAN, ('Error: ' || SQLERRM)::VARCHAR, NULL::BIGINT;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. STORED PROCEDURE - Get detailed sales report with items
-- =====================================================
CREATE OR REPLACE FUNCTION get_detailed_sales_report(start_date DATE, end_date DATE)
RETURNS TABLE (
    salesID VARCHAR,
    sale_date DATE,
    sale_time TIME,
    total_amount DECIMAL,
    payment_method VARCHAR,
    payment_sub_method VARCHAR,
    staff_name VARCHAR,
    item_count BIGINT,
    status VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.salesID,
        s.date,
        s.time,
        s.total_amount,
        s.payment_method,
        s.payment_sub_method,
        u.name,
        COUNT(si.id)::BIGINT as item_count,
        s.status
    FROM sales s
    LEFT JOIN users u ON s.staffID = u.id
    LEFT JOIN sale_items si ON s.salesID = si.sale_id
    WHERE s.date >= start_date AND s.date <= end_date AND s.status = 'Completed'
    GROUP BY s.id, s.salesID, s.date, s.sale_time, s.total_amount, s.payment_method, s.payment_sub_method, u.name, s.status
    ORDER BY s.date DESC, s.sale_time DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- END OF STORED PROCEDURES FILE
-- =====================================================
