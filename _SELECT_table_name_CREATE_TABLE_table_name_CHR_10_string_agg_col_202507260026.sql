INSERT INTO "SELECT 
    table_name,
    'CREATE TABLE ' || table_name || ' (' || CHR(10) ||
    string_agg(
        '    ' || column_name || ' ' || 
        CASE 
            WHEN data_type = 'character varying' THEN 'VARCHAR(' || COALESCE(character_maximum_length::text, '') || ')'
            WHEN data_type = 'character' THEN 'CHAR(' || character_maximum_length || ')'
            WHEN data_type = 'numeric' THEN 'NUMERIC(' || COALESCE(numeric_precision::text, '') || COALESCE(',' || numeric_scale::text, '') || ')'
            WHEN data_type = 'timestamp without time zone' THEN 'TIMESTAMP'
            WHEN data_type = 'timestamp with time zone' THEN 'TIMESTAMPTZ'
            WHEN data_type = 'USER-DEFINED' THEN udt_name  -- 顯示自定義類型名稱
            ELSE UPPER(data_type)
        END ||
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
        CASE 
            WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default 
            ELSE '' 
        END,
        ',' || CHR(10) ORDER BY ordinal_position
    ) || CHR(10) ||
    ');' || CHR(10) || CHR(10) as create_statement
FROM information_schema.columns 
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY table_name" (table_name,create_statement) VALUES
	 ('blogcomment','CREATE TABLE blogcomment (
    blog_comment_id INTEGER NOT NULL DEFAULT nextval(''blogcomment_blog_comment_id_seq''::regclass),
    blog_id INTEGER,
    user_id VARCHAR(10),
    blog_content TEXT NOT NULL,
    blog_created_date TIMESTAMP NOT NULL
);

'),
	 ('blogoverview','CREATE TABLE blogoverview (
    blog_id INTEGER NOT NULL DEFAULT nextval(''blogoverview_blog_id_seq''::regclass),
    user_id VARCHAR(10) DEFAULT NULL::character varying,
    blog_type VARCHAR(20),
    blog_title VARCHAR(500),
    blog_content TEXT,
    blog_created_date TIMESTAMP,
    blog_brand VARCHAR(10),
    blog_brand_model VARCHAR(50) DEFAULT NULL::character varying,
    blog_image VARCHAR(100) DEFAULT NULL::character varying,
    blog_views VARCHAR(10) DEFAULT NULL::character varying,
    blog_keyword TEXT,
    blog_valid_value INTEGER,
    blog_url TEXT
);

'),
	 ('cart','CREATE TABLE cart (
    id INTEGER NOT NULL DEFAULT nextval(''cart_id_seq''::regclass),
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    valid BOOLEAN NOT NULL DEFAULT true
);

'),
	 ('chat_messages','CREATE TABLE chat_messages (
    id INTEGER NOT NULL DEFAULT nextval(''chat_messages_id_seq''::regclass),
    room_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    is_private SMALLINT DEFAULT 0,
    is_system SMALLINT DEFAULT 0,
    recipient_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

'),
	 ('chat_room_members','CREATE TABLE chat_room_members (
    id INTEGER NOT NULL DEFAULT nextval(''chat_room_members_id_seq''::regclass),
    room_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

'),
	 ('chat_rooms','CREATE TABLE chat_rooms (
    id INTEGER NOT NULL DEFAULT nextval(''chat_rooms_id_seq''::regclass),
    name VARCHAR(100) NOT NULL,
    creator_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid SMALLINT DEFAULT 1
);

'),
	 ('coupon','CREATE TABLE coupon (
    coupon_id INTEGER NOT NULL DEFAULT nextval(''coupon_coupon_id_seq''::regclass),
    coupon_code VARCHAR(50) NOT NULL,
    coupon_content VARCHAR(200) NOT NULL,
    discount_method SMALLINT NOT NULL,
    coupon_discount VARCHAR(200) NOT NULL,
    coupon_start_time TIMESTAMP NOT NULL,
    coupon_end_time TIMESTAMP NOT NULL,
    valid INTEGER NOT NULL DEFAULT 1
);

'),
	 ('coupon_user','CREATE TABLE coupon_user (
    id INTEGER NOT NULL DEFAULT nextval(''coupon_user_id_seq''::regclass),
    user_id INTEGER NOT NULL,
    coupon_id INTEGER NOT NULL,
    valid SMALLINT DEFAULT 1
);

'),
	 ('event_registration','CREATE TABLE event_registration (
    registration_id INTEGER NOT NULL DEFAULT nextval(''event_registration_registration_id_seq''::regclass),
    event_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    registration_type registration_type_enum NOT NULL,
    team_id INTEGER,
    team_name VARCHAR(100) DEFAULT NULL::character varying,
    participant_info JSONB,
    registration_status registration_status_enum NOT NULL DEFAULT ''active''::registration_status_enum,
    registration_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valid SMALLINT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

'),
	 ('event_status_type','CREATE TABLE event_status_type (
    status_id INTEGER NOT NULL DEFAULT nextval(''event_status_type_status_id_seq''::regclass),
    status_name VARCHAR(20) NOT NULL
);

');
INSERT INTO "SELECT 
    table_name,
    'CREATE TABLE ' || table_name || ' (' || CHR(10) ||
    string_agg(
        '    ' || column_name || ' ' || 
        CASE 
            WHEN data_type = 'character varying' THEN 'VARCHAR(' || COALESCE(character_maximum_length::text, '') || ')'
            WHEN data_type = 'character' THEN 'CHAR(' || character_maximum_length || ')'
            WHEN data_type = 'numeric' THEN 'NUMERIC(' || COALESCE(numeric_precision::text, '') || COALESCE(',' || numeric_scale::text, '') || ')'
            WHEN data_type = 'timestamp without time zone' THEN 'TIMESTAMP'
            WHEN data_type = 'timestamp with time zone' THEN 'TIMESTAMPTZ'
            WHEN data_type = 'USER-DEFINED' THEN udt_name  -- 顯示自定義類型名稱
            ELSE UPPER(data_type)
        END ||
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
        CASE 
            WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default 
            ELSE '' 
        END,
        ',' || CHR(10) ORDER BY ordinal_position
    ) || CHR(10) ||
    ');' || CHR(10) || CHR(10) as create_statement
FROM information_schema.columns 
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY table_name" (table_name,create_statement) VALUES
	 ('event_team_members','CREATE TABLE event_team_members (
    member_id INTEGER NOT NULL DEFAULT nextval(''event_team_members_member_id_seq''::regclass),
    team_id INTEGER NOT NULL,
    registration_id INTEGER NOT NULL,
    member_name VARCHAR(50) NOT NULL,
    member_game_id VARCHAR(50) NOT NULL,
    valid SMALLINT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

'),
	 ('event_teams','CREATE TABLE event_teams (
    team_id INTEGER NOT NULL DEFAULT nextval(''event_teams_team_id_seq''::regclass),
    registration_id INTEGER NOT NULL,
    event_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    team_name VARCHAR(100) NOT NULL,
    captain_info JSONB,
    valid BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

'),
	 ('event_type','CREATE TABLE event_type (
    event_id INTEGER NOT NULL DEFAULT nextval(''event_type_event_id_seq''::regclass),
    event_name VARCHAR(50) NOT NULL,
    event_type VARCHAR(20) NOT NULL,
    event_platform VARCHAR(20) NOT NULL,
    event_content TEXT NOT NULL,
    event_rule TEXT NOT NULL,
    event_award TEXT NOT NULL,
    individual_or_team VARCHAR(2) NOT NULL DEFAULT ''個人''::character varying,
    event_picture VARCHAR(255) NOT NULL,
    apply_start_time TIMESTAMP NOT NULL,
    apply_end_time TIMESTAMP NOT NULL,
    event_start_time TIMESTAMP NOT NULL,
    event_end_time TIMESTAMP NOT NULL,
    maximum_people INTEGER NOT NULL,
    status_id INTEGER DEFAULT 1,
    valid BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    current_participants INTEGER DEFAULT 0
);

'),
	 ('favorite_management','CREATE TABLE favorite_management (
    id INTEGER NOT NULL DEFAULT nextval(''favorite_management_id_seq''::regclass),
    product_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

'),
	 ('group','CREATE TABLE group (
    group_id INTEGER NOT NULL DEFAULT nextval(''group_group_id_seq''::regclass),
    group_name VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    creator_id INTEGER NOT NULL,
    max_members INTEGER NOT NULL,
    group_img VARCHAR(255) NOT NULL,
    creat_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    group_time TIMESTAMP,
    event_id INTEGER,
    chat_room_id INTEGER
);

'),
	 ('group_application_notifications','CREATE TABLE group_application_notifications (
    notification_id INTEGER NOT NULL DEFAULT nextval(''group_application_notifications_notification_id_seq''::regclass),
    application_id INTEGER NOT NULL,
    recipient_id INTEGER NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

'),
	 ('group_applications','CREATE TABLE group_applications (
    application_id INTEGER NOT NULL DEFAULT nextval(''group_applications_application_id_seq''::regclass),
    group_id INTEGER NOT NULL,
    applicant_id INTEGER NOT NULL,
    message TEXT,
    status VARCHAR(10) NOT NULL DEFAULT ''pending''::character varying,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ
);

'),
	 ('group_members','CREATE TABLE group_members (
    id INTEGER NOT NULL DEFAULT nextval(''group_members_id_seq''::regclass),
    group_id INTEGER NOT NULL,
    member_id INTEGER NOT NULL,
    join_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status group_member_status NOT NULL DEFAULT ''accepted''::group_member_status
);

'),
	 ('group_requests','CREATE TABLE group_requests (
    id INTEGER NOT NULL DEFAULT nextval(''group_requests_id_seq''::regclass),
    group_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    creator_id INTEGER NOT NULL,
    game_id VARCHAR(255) DEFAULT NULL::character varying,
    description TEXT,
    status request_status NOT NULL DEFAULT ''pending''::request_status,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

'),
	 ('messages','CREATE TABLE messages (
    id INTEGER NOT NULL DEFAULT nextval(''messages_id_seq''::regclass),
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMPTZ
);

');
INSERT INTO "SELECT 
    table_name,
    'CREATE TABLE ' || table_name || ' (' || CHR(10) ||
    string_agg(
        '    ' || column_name || ' ' || 
        CASE 
            WHEN data_type = 'character varying' THEN 'VARCHAR(' || COALESCE(character_maximum_length::text, '') || ')'
            WHEN data_type = 'character' THEN 'CHAR(' || character_maximum_length || ')'
            WHEN data_type = 'numeric' THEN 'NUMERIC(' || COALESCE(numeric_precision::text, '') || COALESCE(',' || numeric_scale::text, '') || ')'
            WHEN data_type = 'timestamp without time zone' THEN 'TIMESTAMP'
            WHEN data_type = 'timestamp with time zone' THEN 'TIMESTAMPTZ'
            WHEN data_type = 'USER-DEFINED' THEN udt_name  -- 顯示自定義類型名稱
            ELSE UPPER(data_type)
        END ||
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
        CASE 
            WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default 
            ELSE '' 
        END,
        ',' || CHR(10) ORDER BY ordinal_position
    ) || CHR(10) ||
    ');' || CHR(10) || CHR(10) as create_statement
FROM information_schema.columns 
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY table_name" (table_name,create_statement) VALUES
	 ('order_detail','CREATE TABLE order_detail (
    id INTEGER NOT NULL DEFAULT nextval(''order_detail_id_seq''::regclass),
    user_id INTEGER NOT NULL,
    order_id VARCHAR(50) NOT NULL,
    product_id INTEGER NOT NULL,
    product_price INTEGER NOT NULL,
    quantity INTEGER NOT NULL
);

'),
	 ('order_list','CREATE TABLE order_list (
    id INTEGER NOT NULL DEFAULT nextval(''order_list_id_seq''::regclass),
    user_id INTEGER NOT NULL,
    order_id VARCHAR(50) NOT NULL,
    order_amount INTEGER NOT NULL,
    payment_method SMALLINT NOT NULL,
    coupon_id INTEGER,
    receiver VARCHAR(200) DEFAULT NULL::character varying,
    phone VARCHAR(200) NOT NULL,
    address VARCHAR(100) DEFAULT NULL::character varying,
    already_pay INTEGER NOT NULL DEFAULT 0,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

'),
	 ('product','CREATE TABLE product (
    product_id INTEGER NOT NULL DEFAULT nextval(''product_product_id_seq''::regclass),
    product_name VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    product_brand VARCHAR(10) NOT NULL,
    list_price INTEGER NOT NULL,
    affordance VARCHAR(10) NOT NULL,
    product_color VARCHAR(10) NOT NULL,
    product_size VARCHAR(10) NOT NULL,
    product_weight REAL NOT NULL,
    product_cpu VARCHAR(100) NOT NULL,
    discrete_display_card VARCHAR(5) NOT NULL,
    product_display_card VARCHAR(100) NOT NULL,
    product_ram VARCHAR(10) NOT NULL,
    product_hardisk_type VARCHAR(10) NOT NULL,
    product_hardisk_volume VARCHAR(10) NOT NULL,
    product_os VARCHAR(20) NOT NULL,
    product_wireless VARCHAR(100) NOT NULL,
    product_camera VARCHAR(100) NOT NULL,
    product_keyboard VARCHAR(100) NOT NULL,
    product_cardreader VARCHAR(100) NOT NULL,
    product_power VARCHAR(100) NOT NULL,
    product_i_o VARCHAR(500) NOT NULL,
    valid SMALLINT NOT NULL DEFAULT 1
);

'),
	 ('product_detail_img','CREATE TABLE product_detail_img (
    id INTEGER NOT NULL DEFAULT nextval(''product_detail_img_id_seq''::regclass),
    img_product_id INTEGER NOT NULL,
    product_img_path VARCHAR(255) NOT NULL
);

'),
	 ('product_img','CREATE TABLE product_img (
    img_id INTEGER NOT NULL,
    img_product_id INTEGER NOT NULL,
    product_img_path VARCHAR(255) NOT NULL
);

'),
	 ('purchase_order','CREATE TABLE purchase_order (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL,
    amount INTEGER,
    transaction_id VARCHAR(255) DEFAULT NULL::character varying,
    payment payment_method_enum,
    shipping shipping_method_enum,
    status order_status_enum DEFAULT ''pending''::order_status_enum,
    order_info TEXT,
    reservation TEXT,
    confirm TEXT,
    return_code VARCHAR(255) DEFAULT NULL::character varying,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

'),
	 ('users','CREATE TABLE users (
    user_id INTEGER NOT NULL DEFAULT nextval(''users_user_id_seq''::regclass),
    name VARCHAR(30),
    password VARCHAR(80) NOT NULL,
    gender VARCHAR(50),
    birthdate TIMESTAMPTZ,
    phone VARCHAR(30),
    email VARCHAR(100) NOT NULL,
    country VARCHAR(30),
    city VARCHAR(30),
    district VARCHAR(30),
    road_name VARCHAR(30),
    detailed_address VARCHAR(30),
    image_path TEXT,
    remarks VARCHAR(150),
    level INTEGER DEFAULT 0,
    valid BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ,
    google_uid INTEGER
);

');
