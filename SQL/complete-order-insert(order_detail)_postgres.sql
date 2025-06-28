-- PostgreSQL version of complete-order-insert(order_detail).sql
-- Convert MySQL syntax to PostgreSQL syntax

INSERT INTO order_list 
(user_id, order_id, order_amount, address, already_pay, create_time) 
SELECT 
    u.user_id,
    CONCAT(
        'ORD',
        TO_CHAR(
            NOW() - INTERVAL '1 day' * FLOOR(RANDOM() * 365),
            'YYYYMMDD'
        ),
        LPAD(ROW_NUMBER() OVER (PARTITION BY u.user_id ORDER BY RANDOM())::text, 3, '0')
    ) as order_id,
    CASE 
        WHEN u.level = 4 THEN FLOOR(80000 + RANDOM() * 50000)::integer  -- 鑽石會員 (100000+)
        WHEN u.level = 3 THEN FLOOR(50000 + RANDOM() * 30000)::integer  -- 金牌會員 (70000-99999)
        WHEN u.level = 2 THEN FLOOR(30000 + RANDOM() * 20000)::integer  -- 銀牌會員 (40000-69999)
        WHEN u.level = 1 THEN FLOOR(15000 + RANDOM() * 15000)::integer  -- 銅牌會員 (20000-39999)
        WHEN u.level = 0 THEN FLOOR(5000 + RANDOM() * 15000)::integer   -- 一般會員 (0-19999)
        ELSE FLOOR(5000 + RANDOM() * 15000)::integer                    -- 預設情況
    END as order_amount,
    CONCAT(u.city, u.district, u.road_name, u.detailed_address) as address,
    1 as already_pay,
    (NOW() - INTERVAL '1 day' * FLOOR(RANDOM() * 365) 
           - INTERVAL '1 hour' * FLOOR(RANDOM() * 24)
           - INTERVAL '1 minute' * FLOOR(RANDOM() * 60))::timestamp as create_time
FROM users u
CROSS JOIN (
    SELECT 1 as n 
    UNION SELECT 2 
    UNION SELECT 3
) numbers
WHERE u.user_id BETWEEN 1 AND 447 
AND RANDOM() < 0.7  -- 70% 機率生成訂單
ORDER BY u.user_id, RANDOM();
