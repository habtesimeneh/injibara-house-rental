-- Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_name TEXT NOT NULL UNIQUE
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Tenant',
    region TEXT,
    city TEXT,
    sub_city TEXT,
    address TEXT,
    avatar TEXT,
    last_seen DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Locations Table (Regions and Cities)
CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    region TEXT NOT NULL,
    city TEXT NOT NULL,
    UNIQUE(region, city)
);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Ticker Items Table
CREATE TABLE IF NOT EXISTS ticker_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text_en TEXT NOT NULL,
    text_am TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Houses Table
CREATE TABLE IF NOT EXISTS houses (
    house_id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    region TEXT NOT NULL,
    city TEXT NOT NULL,
    sub_city TEXT,
    address TEXT,
    price REAL NOT NULL,
    rooms INTEGER DEFAULT 1,
    bathrooms INTEGER DEFAULT 1,
    square_meter REAL,
    status TEXT NOT NULL DEFAULT 'Available',
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- House Images Table
CREATE TABLE IF NOT EXISTS house_images (
    image_id INTEGER PRIMARY KEY AUTOINCREMENT,
    house_id INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    caption TEXT,
    is_primary INTEGER DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (house_id) REFERENCES houses(house_id) ON DELETE CASCADE
);

-- House Videos Table
CREATE TABLE IF NOT EXISTS house_videos (
    video_id INTEGER PRIMARY KEY AUTOINCREMENT,
    house_id INTEGER NOT NULL,
    video_url TEXT NOT NULL,
    video_type TEXT DEFAULT 'upload',
    display_order INTEGER DEFAULT 0,
    is_primary INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (house_id) REFERENCES houses(house_id) ON DELETE CASCADE
);

-- Rental Requests Table
CREATE TABLE IF NOT EXISTS rental_requests (
    request_id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    house_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (house_id) REFERENCES houses(house_id) ON DELETE CASCADE
);

-- Favorites Table
CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    house_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (house_id) REFERENCES houses(house_id) ON DELETE CASCADE
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    house_id INTEGER,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (house_id) REFERENCES houses(house_id) ON DELETE CASCADE
);

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER NOT NULL,
    tenant_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    payment_method TEXT,
    status TEXT DEFAULT 'Pending',
    transaction_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES rental_requests(request_id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    house_id INTEGER NOT NULL,
    rating INTEGER CHECK(rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (house_id) REFERENCES houses(house_id) ON DELETE CASCADE
);

-- Website Settings Table
CREATE TABLE IF NOT EXISTS website_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key_name TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    type TEXT DEFAULT 'text',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- OTP Verification Codes Table
CREATE TABLE IF NOT EXISTS otp_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    identifier TEXT NOT NULL,
    code TEXT NOT NULL,
    type TEXT DEFAULT 'register',
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Rent Reminders Table (New extension based on your code)
CREATE TABLE IF NOT EXISTS rent_reminders (
    reminder_id INTEGER PRIMARY KEY AUTOINCREMENT,
    house_id INTEGER NOT NULL,
    tenant_id INTEGER NOT NULL,
    landlord_id INTEGER NOT NULL,
    monthly_rent REAL NOT NULL,
    due_day_of_month INTEGER NOT NULL,
    last_paid_month TEXT,
    status TEXT DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (house_id) REFERENCES houses(house_id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (landlord_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Rental Contracts Table (New extension based on your code)
CREATE TABLE IF NOT EXISTS rental_contracts (
    contract_id INTEGER PRIMARY KEY AUTOINCREMENT,
    house_id INTEGER NOT NULL,
    landlord_id INTEGER NOT NULL,
    tenant_id INTEGER NOT NULL,
    landlord_name TEXT,
    landlord_id_no TEXT,
    landlord_phone TEXT,
    tenant_name TEXT,
    tenant_id_no TEXT,
    tenant_phone TEXT,
    monthly_rent REAL NOT NULL,
    deposit_amount REAL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    terms_conditions TEXT,
    status TEXT DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (house_id) REFERENCES houses(house_id) ON DELETE CASCADE,
    FOREIGN KEY (landlord_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Wishlists Table
CREATE TABLE IF NOT EXISTS wishlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    house_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, house_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (house_id) REFERENCES houses(house_id) ON DELETE CASCADE
);

-- Payment Accounts Table
CREATE TABLE IF NOT EXISTS payment_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bank_name TEXT NOT NULL,
    account_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    payment_type TEXT DEFAULT 'Bank Transfer',
    instructions TEXT,
    qr_code_url TEXT,
    is_active INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- SEO Meta Table
CREATE TABLE IF NOT EXISTS seo_meta (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    route_path TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    keywords TEXT,
    og_image TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Testimonials Table
CREATE TABLE IF NOT EXISTS testimonials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role_en TEXT,
    role_am TEXT,
    location_en TEXT,
    location_am TEXT,
    avatar TEXT,
    rating INTEGER DEFAULT 5,
    house_type_en TEXT,
    house_type_am TEXT,
    comment_en TEXT,
    comment_am TEXT,
    badge_en TEXT,
    badge_am TEXT,
    is_approved INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tenant Seeking Ads Table
CREATE TABLE IF NOT EXISTS tenant_seeking_ads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    budget_max REAL,
    preferred_location TEXT,
    house_type TEXT,
    status TEXT DEFAULT 'Active',
    is_featured INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- AI Chats Table
CREATE TABLE IF NOT EXISTS ai_chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    user_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Announcements Table
CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title_en TEXT NOT NULL,
    title_am TEXT NOT NULL,
    content_en TEXT,
    content_am TEXT,
    badge TEXT DEFAULT 'NEWS',
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Hero Slides Table
CREATE TABLE IF NOT EXISTS hero_slides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title_en TEXT NOT NULL,
    title_am TEXT NOT NULL,
    subtitle_en TEXT NOT NULL,
    subtitle_am TEXT NOT NULL,
    description_en TEXT,
    description_am TEXT,
    button_text_en TEXT,
    button_text_am TEXT,
    button_url TEXT,
    image_url TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- About Page Table
CREATE TABLE IF NOT EXISTS about_page (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title_en TEXT NOT NULL,
    title_am TEXT NOT NULL,
    subtitle_en TEXT,
    subtitle_am TEXT,
    content_en TEXT NOT NULL,
    content_am TEXT NOT NULL,
    image_url TEXT NOT NULL,
    mission_en TEXT,
    mission_am TEXT,
    vision_en TEXT,
    vision_am TEXT,
    values_en TEXT,
    values_am TEXT,
    tailored_en TEXT,
    tailored_am TEXT,
    footprint_en TEXT,
    footprint_am TEXT,
    banner_image_url TEXT,
    banner_subtitle_en TEXT,
    banner_subtitle_am TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- About FAQs Table
CREATE TABLE IF NOT EXISTS about_faqs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_en TEXT NOT NULL,
    question_am TEXT NOT NULL,
    answer_en TEXT NOT NULL,
    answer_am TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Auth Page Settings Table
CREATE TABLE IF NOT EXISTS auth_page_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    login_title_en TEXT,
    login_title_am TEXT,
    login_subtitle_en TEXT,
    login_subtitle_am TEXT,
    register_title_en TEXT,
    register_title_am TEXT,
    register_subtitle_en TEXT,
    register_subtitle_am TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Auth Slides Table
CREATE TABLE IF NOT EXISTS auth_slides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title_en TEXT NOT NULL,
    title_am TEXT NOT NULL,
    desc_en TEXT NOT NULL,
    desc_am TEXT NOT NULL,
    badge_en TEXT,
    badge_am TEXT,
    image_url TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Contact Page Table
CREATE TABLE IF NOT EXISTS contact_page (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title_en TEXT NOT NULL,
    title_am TEXT NOT NULL,
    subtitle_en TEXT,
    subtitle_am TEXT,
    address_en TEXT,
    address_am TEXT,
    phone_1 TEXT,
    phone_2 TEXT,
    phone_3 TEXT,
    email TEXT,
    working_hours_en TEXT,
    working_hours_am TEXT,
    facebook_url TEXT,
    telegram_url TEXT,
    tiktok_url TEXT,
    youtube_url TEXT,
    banner_image_url TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Contact Offices Table
CREATE TABLE IF NOT EXISTS contact_offices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name_en TEXT NOT NULL,
    name_am TEXT NOT NULL,
    address_en TEXT,
    address_am TEXT,
    phone TEXT,
    agent_name TEXT,
    working_hours TEXT,
    is_active INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Contact Phones Table
CREATE TABLE IF NOT EXISTS contact_phones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    department_en TEXT NOT NULL,
    department_am TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    telegram_username TEXT,
    contact_person TEXT,
    is_whatsapp INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Property Alerts Table
CREATE TABLE IF NOT EXISTS property_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    house_type TEXT DEFAULT 'All',
    min_price REAL DEFAULT 0,
    max_price REAL,
    location_keyword TEXT,
    min_rooms INTEGER DEFAULT 0,
    notification_email TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Email Logs Table
CREATE TABLE IF NOT EXISTS email_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    house_id INTEGER,
    status TEXT DEFAULT 'Delivered',
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (house_id) REFERENCES houses(house_id) ON DELETE SET NULL
);

-- Ad Payments Table
CREATE TABLE IF NOT EXISTS ad_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    user_role TEXT NOT NULL DEFAULT 'Landlord',
    ad_type TEXT NOT NULL,
    house_id INTEGER,
    seeking_ad_id INTEGER,
    amount REAL NOT NULL,
    payment_method TEXT NOT NULL,
    transaction_ref TEXT NOT NULL,
    receipt_url TEXT,
    status TEXT NOT NULL DEFAULT 'Pending',
    admin_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (house_id) REFERENCES houses(house_id) ON DELETE SET NULL,
    FOREIGN KEY (seeking_ad_id) REFERENCES tenant_seeking_ads(id) ON DELETE SET NULL
);

-- Security Audit Logs Table
CREATE TABLE IF NOT EXISTS security_audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    user_role TEXT,
    action TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Login Attempts Table
CREATE TABLE IF NOT EXISTS login_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT,
    ip_address TEXT NOT NULL,
    attempt_count INTEGER DEFAULT 1,
    locked_until DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(email, ip_address)
);

-- Password Reset Tokens Table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
