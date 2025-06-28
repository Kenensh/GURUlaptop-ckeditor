-- PostgreSQL version of order_detail.sql
-- Converted from MySQL/MariaDB format

-- Order detail table schema for PostgreSQL
-- 如果表格已存在則刪除
DROP TABLE IF EXISTS public.order_detail CASCADE;

CREATE TABLE public.order_detail (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    order_id VARCHAR(50) NOT NULL,
    product_id INTEGER NOT NULL,
    product_price INTEGER NOT NULL,
    quantity INTEGER NOT NULL
);

-- Insert sample data
INSERT INTO public.order_detail (id, user_id, order_id, product_id, product_price, quantity) VALUES
(1, 2, '3438b1a3-5df1-4cd0-bcf3-d331c909b517', 270, 25900, 1),
(2, 2, 'b507128a-1902-42f9-8852-c06a4132bad1', 254, 18900, 1);

-- Reset sequence to continue from the last inserted ID
-- 重置序列到下一個可用ID
DO $$
BEGIN
    PERFORM setval(pg_get_serial_sequence('public.order_detail', 'id'), COALESCE((SELECT MAX(id) FROM public.order_detail), 0) + 1, false);
END $$;

-- Add comments for better documentation
COMMENT ON TABLE public.order_detail IS 'Order detail table storing individual product orders';
COMMENT ON COLUMN public.order_detail.id IS 'Primary key for order detail';
COMMENT ON COLUMN public.order_detail.user_id IS 'Reference to user who made the order';
COMMENT ON COLUMN public.order_detail.order_id IS 'Order identifier';
COMMENT ON COLUMN public.order_detail.product_id IS 'Reference to the product ordered';
COMMENT ON COLUMN public.order_detail.product_price IS 'Price of the product at time of order';
COMMENT ON COLUMN public.order_detail.quantity IS 'Quantity ordered';
