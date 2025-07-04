-- PostgreSQL version of coupon_postgres_complete.sql
-- Converted from MySQL on 2025-06-18 11:03:55
-- Table: public

-- PostgreSQL version of coupon table
-- Converted from MySQL to PostgreSQL format
-- Original file: coupon.sql

-- Create coupon table with proper PostgreSQL syntax
-- 如果表格已存在則刪除
DROP TABLE IF EXISTS public.coupon CASCADE;

CREATE TABLE public.coupon (
    coupon_id SERIAL PRIMARY KEY,
    coupon_code VARCHAR(50) NOT NULL,
    coupon_content VARCHAR(200) NOT NULL,
    discount_method INTEGER NOT NULL,
    coupon_discount VARCHAR(200) NOT NULL,
    coupon_start_time TIMESTAMP NOT NULL,
    coupon_end_time TIMESTAMP NOT NULL,
    valid INTEGER NOT NULL DEFAULT 1
);

-- Add comments to describe table and columns
COMMENT ON TABLE public.coupon IS 'Coupon management table for discount codes and promotions';
COMMENT ON COLUMN public.coupon.coupon_id IS 'Primary key for coupons';
COMMENT ON COLUMN public.coupon.coupon_code IS 'Unique coupon code for redemption';
COMMENT ON COLUMN public.coupon.coupon_content IS 'Description of the coupon offer';
COMMENT ON COLUMN public.coupon.discount_method IS 'Discount method: 0=percentage, 1=fixed amount, 2=shipping';
COMMENT ON COLUMN public.coupon.coupon_discount IS 'Discount value based on method';
COMMENT ON COLUMN public.coupon.coupon_start_time IS 'Start DATE and TIME for coupon validity';
COMMENT ON COLUMN public.coupon.coupon_end_time IS 'End DATE and TIME for coupon validity';
COMMENT ON COLUMN public.coupon.valid IS 'Flag to indicate if coupon is active (1=active, 0=inactive)';

-- Create indexes for better query performance
CREATE UNIQUE INDEX idx_coupon_code ON public.coupon(coupon_code);
CREATE INDEX idx_coupon_valid ON public.coupon(valid);
CREATE INDEX idx_coupon_start_time ON public.coupon(coupon_start_time);
CREATE INDEX idx_coupon_end_time ON public.coupon(coupon_end_time);

-- Insert coupon data
INSERT INTO public.coupon (coupon_id, coupon_code, coupon_content, discount_method, coupon_discount, coupon_start_time, coupon_end_time, valid) VALUES
    (1, 'laptop15', '筆電結帳即可折扣1500元', 1, '1500', '2024-08-19 00:00:00', '2025-08-25 00:00:00', 1),
    (2, 'count10', '筆電結帳9折', 0, '9', '2024-08-21 00:00:00', '2025-08-29 00:00:00', 1),
    (3, '8ievtmqvxzc', '冬季限定折價500元', 1, '500', '2024-11-13 13:23:00', '2024-12-31 13:24:00', 1),
    (4, '6egr8d73yoh', '特賣8折優惠', 0, '8', '2024-11-15 13:29:00', '2024-12-24 13:29:00', 1),
    (5, 'o72lbpn5sjq', '聖誕節折價200元', 1, '200', '2024-11-01 14:00:00', '2024-12-31 14:00:00', 1),
    (6, 'ls3690qbs3r', '跨年限定優惠享9折', 0, '9', '2024-12-25 14:02:00', '2025-01-10 14:02:00', 1),
    (7, '1lwjl8caz1li', '特惠7折', 0, '7', '2024-12-29 14:53:00', '2025-01-31 14:53:00', 1),
    (8, 's986h6cjf7b', '限時閃購折價500元', 1, '500', '2024-11-20 14:56:00', '2024-12-20 14:56:00', 1),
    (9, 'b3mf01x3lb6', '會員專屬8折優惠', 0, '8', '2024-11-13 14:57:00', '2024-12-31 14:57:00', 1),
    (10, 'e0g6qd7sfhn', '感恩節特惠折價800元', 1, '800', '2024-11-20 14:57:00', '2024-11-29 14:57:00', 1),
    (11, '4eidw05tdge', '筆電驚喜價6折', 0, '6', '2024-11-20 14:57:00', '2024-12-31 14:57:00', 1),
    (12, 'rjnmmdjc9q', '週年慶8折優惠', 0, '8', '2024-11-19 15:02:00', '2024-12-29 15:02:00', 1),
    (13, 'alfpi3gh196', '聖誕交換禮物折價100元', 1, '100', '2024-11-22 15:03:00', '2024-12-31 15:03:00', 1),
    (14, 'q652opnq1gs', '跨年狂歡5折', 0, '5', '2024-11-23 15:03:00', '2025-01-31 15:03:00', 1),
    (15, 'gikrpy74gtn', '冬季購物節折價500元', 1, '500', '2024-11-15 15:03:00', '2025-01-03 15:03:00', 1),
    (16, 'mcffpdtu50q', '耶誕限定8折', 0, '8', '2024-12-20 15:03:00', '2024-12-31 15:03:00', 1),
    (17, 'dleyelptqgc', '冬季暖心折價500元', 1, '500', '2024-11-14 15:27:00', '2024-12-31 15:27:00', 1),
    (18, 'b94pvjnkpmi', '新年開運折價500元', 1, '500', '2024-11-20 15:47:00', '2025-01-30 15:47:00', 1),
    (19, 'yb8tn16vg5', '筆電結帳9折', 0, '9', '2024-08-20 16:57:00', '2024-12-31 16:57:00', 1),
    (20, '1l8g3xqzjsh', '歲末感恩9折優惠', 0, '9', '2024-11-22 17:01:00', '2024-12-28 17:01:00', 1),
    (21, 'w47e8zre3eo', '下單結帳結帳7折', 0, '7', '2024-08-31 11:23:00', '2024-11-31 11:23:00', 1),
    (22, 'FREESHIP60', '7-11運費折抵', 2, '60', '2024-11-19 00:00:00', '2024-12-31 23:59:59', 1),
    (23, 'FREESHIP200', '宅配運費折抵', 2, '200', '2024-11-19 00:00:00', '2024-12-31 23:59:59', 1);

-- Reset sequence to continue from the last id
-- 重置序列到下一個可用ID
DO $$
BEGIN
    PERFORM setval('coupon_coupon_id_seq', COALESCE((SELECT MAX(coupon_id) FROM coupon), 0) + 1, false);
END $$;
