-- PostgreSQL version of order_list.sql
-- Converted from MySQL/MariaDB format

-- Order list table schema for PostgreSQL
-- 如果表格已存在則刪除
DROP TABLE IF EXISTS public.order_list CASCADE;

CREATE TABLE public.order_list (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    order_id VARCHAR(50) NOT NULL,
    order_amount INTEGER NOT NULL,
    payment_method SMALLINT NOT NULL,
    coupon_id INTEGER DEFAULT NULL,
    receiver VARCHAR(200) DEFAULT NULL,
    phone VARCHAR(200) NOT NULL,
    address VARCHAR(100) DEFAULT NULL,
    already_pay INTEGER NOT NULL DEFAULT 0,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO public.order_list (id, user_id, order_id, order_amount, payment_method, coupon_id, receiver, phone, address, already_pay, create_time) VALUES
(1, 2, '3438b1a3-5df1-4cd0-bcf3-d331c909b517', 25900, 0, 0, 'test', '0987654321', '台灣台北市中正區八德路１段1號', 1, '2024-11-18 11:41:13'),
(2, 2, 'b507128a-1902-42f9-8852-c06a4132bad1', 18900, 0, 0, 'test', '0987654321', '台灣台北市中正區八德路１段1號', 0, '2024-11-18 11:54:32');

-- Reset sequence to continue from the last inserted ID
-- 重置序列到下一個可用ID
DO $$
BEGIN
    PERFORM setval(pg_get_serial_sequence('public.order_list', 'id'), COALESCE((SELECT MAX(id) FROM public.order_list), 0) + 1, false);
END $$;

-- Add comments for better documentation
COMMENT ON TABLE public.order_list IS 'Order list table storing order summary information';
COMMENT ON COLUMN public.order_list.id IS 'Primary key for order';
COMMENT ON COLUMN public.order_list.user_id IS 'Reference to user who made the order';
COMMENT ON COLUMN public.order_list.order_id IS 'Unique order identifier';
COMMENT ON COLUMN public.order_list.order_amount IS 'Total amount of the order';
COMMENT ON COLUMN public.order_list.payment_method IS 'Payment method used (0=cash, 1=card, etc.)';
COMMENT ON COLUMN public.order_list.coupon_id IS 'Reference to coupon used';
COMMENT ON COLUMN public.order_list.receiver IS 'Name of the receiver';
COMMENT ON COLUMN public.order_list.phone IS 'Phone number for delivery';
COMMENT ON COLUMN public.order_list.address IS 'Delivery address';
COMMENT ON COLUMN public.order_list.already_pay IS 'Payment status (0=unpaid, 1=paid)';
COMMENT ON COLUMN public.order_list.create_time IS 'Order creation timestamp';
