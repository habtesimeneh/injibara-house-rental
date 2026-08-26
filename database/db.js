import mysql from 'mysql2/promise';
import { createClient } from "@libsql/client";
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

let dbDir = process.cwd();
if (typeof __dirname !== 'undefined') {
  dbDir = __dirname;
} else {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.url) {
      dbDir = path.dirname(fileURLToPath(import.meta.url));
    }
  } catch (e) {
    dbDir = path.join(process.cwd(), 'database');
  }
}
const dbDirname = dbDir;

let mysqlPool = null;
let sqliteClient = null;
let activeEngine = 'sqlite'; // 'mysql' or 'sqlite'

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'root',
  database: process.env.DB_NAME || 'house_rental'
};

const isProduction = process.env.NODE_ENV === 'production';
const allowSqliteFallback = process.env.ALLOW_SQLITE_FALLBACK === 'true';

export const validateProductionSecrets = () => {
  if (!isProduction) return true;

  const required = [
    'DB_HOST',
    'DB_PORT',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
    'JWT_SECRET',
    'TEXTBEE_API_KEY',
    'TEXTBEE_DEVICE_ID',
    'TEXTBEE_WEBHOOK_SECRET',
    'PUBLIC_BASE_URL',
    'ADMIN_EMAIL',
    'ADMIN_PASSWORD',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_SECURE',
    'SMTP_USER',
    'SMTP_PASS',
    'SMTP_FROM'
  ];

  const missing = required.filter(key => !process.env[key] || String(process.env[key]).trim() === '');

  if (missing.length > 0) {
    console.error(`[STARTUP] Missing required production environment variables: ${missing.join(', ')}`);
    console.error('[STARTUP] Application cannot start without required secrets.');
    return false;
  }

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.error('[STARTUP] JWT_SECRET must be at least 32 characters.');
    return false;
  }

  const publicBaseUrl = process.env.PUBLIC_BASE_URL;
  if (publicBaseUrl && !/^https?:\/\/.+/.test(publicBaseUrl)) {
    console.error('[STARTUP] PUBLIC_BASE_URL must be an absolute HTTP/HTTPS URL.');
    return false;
  }

  return true;
};

const isIgnorableSchemaError = (error) => {
  const message = String(error && error.message ? error.message : '');
  return (
    message.includes('Duplicate column name') ||
    message.includes('already exists') ||
    message.includes('Duplicate entry') ||
    message.includes('Column already exists') ||
    message.includes('Duplicate key name')
  );
};

export const getPool = () => {
  const wrapper = {
    getConnection: async () => {
      if (activeEngine === 'mysql' && mysqlPool) {
        const conn = await mysqlPool.getConnection();
        const transactionWrapper = {
          query: async (sql, params = []) => {
            const normalizedSql = sql.replace(/INSERT OR IGNORE/gi, 'INSERT IGNORE');
            const [rows, fields] = await conn.query(normalizedSql, params);
            return [rows, fields];
          },
          execute: async (sql, params = []) => {
            const normalizedSql = sql.replace(/INSERT OR IGNORE/gi, 'INSERT IGNORE');
            const [rows, fields] = await conn.query(normalizedSql, params);
            return [rows, fields];
          },
          beginTransaction: async () => conn.beginTransaction(),
          commit: async () => conn.commit(),
          rollback: async () => conn.rollback(),
          release: () => conn.release(),
          get activeEngine() { return activeEngine; }
        };
        return transactionWrapper;
      }
      return wrapper;
    },
    query: async (sql, params = []) => {
      if (activeEngine === 'mysql' && mysqlPool) {
        try {
          // Normalize SQL for MySQL syntax if needed (e.g., replace 'INSERT OR IGNORE' with 'INSERT IGNORE')
          const normalizedSql = sql.replace(/INSERT OR IGNORE/gi, 'INSERT IGNORE');
          const [rows, fields] = await mysqlPool.query(normalizedSql, params);
          return [rows, fields];
        } catch (err) {
          if (isIgnorableSchemaError(err)) {
            return [[], []];
          }
          console.error("MySQL Query Error:", err.message);
          throw err;
        }
      }

      // SQLite Fallback
      try {
        if (!sqliteClient) {
          sqliteClient = createClient({ url: "file:./database.sqlite" });
        }

        if ((!params || params.length === 0) && sql.includes(';')) {
            await sqliteClient.executeMultiple(sql);
            return [[]];
        }
        
        const res = await sqliteClient.execute({ sql, args: params });
        
        if (sql.trim().toLowerCase().startsWith('select')) {
            return [res.rows];
        } else {
            const insertId = res.lastInsertRowid !== undefined ? Number(res.lastInsertRowid) : 0;
            return [{ insertId, affectedRows: res.rowsAffected }];
        }
      } catch (err) {
        if (err.code === 'SQLITE_CORRUPT' || (err.message && err.message.includes('malformed'))) {
          console.error("Corrupted SQLite DB detected, resetting client...");
          sqliteClient = null;
        }
        throw err;
      }
    },
    execute: async function(sql, params) { return this.query(sql, params); },
    release: () => {},
    get activeEngine() { return activeEngine; }
  };

  return wrapper;
};

export const testConnection = async () => {
  // First attempt MySQL connection (MAMP / Local MySQL / Cloud MySQL)
  try {
    // Auto-create database if it doesn't exist on MySQL server yet
    try {
      const initConn = await mysql.createConnection({
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        password: dbConfig.password,
        connectTimeout: 5000
      });
      await initConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
      await initConn.end();
      console.log(`Database '${dbConfig.database}' verified/created on MySQL server.`);
    } catch (dbCreateErr) {
      console.warn("Auto DB creation check:", dbCreateErr.message);
    }

    const testPool = mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 50,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      connectTimeout: 5000
    });

    // Test ping
    const connection = await testPool.getConnection();
    await connection.ping();
    connection.release();

    mysqlPool = testPool;
    activeEngine = 'mysql';
    console.log(`Successfully connected to MySQL Database at ${dbConfig.host}:${dbConfig.port} (User: ${dbConfig.user}, DB: ${dbConfig.database})`);
    
    // Seed or verify MySQL Schema
    const connWrapper = getPool();
    const schemaStatements = [
      `CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        role_name VARCHAR(255) NOT NULL UNIQUE
      ) ENGINE=InnoDB`,
      `CREATE TABLE IF NOT EXISTS users (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(100),
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'Tenant',
        region VARCHAR(100),
        city VARCHAR(100),
        sub_city VARCHAR(100),
        address TEXT,
        avatar VARCHAR(255),
        last_seen DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`,
      `CREATE TABLE IF NOT EXISTS locations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        region VARCHAR(100) NOT NULL,
        city VARCHAR(100) NOT NULL,
        UNIQUE(region, city)
      ) ENGINE=InnoDB`,
      `CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        name_am VARCHAR(255),
        description TEXT,
        description_am TEXT,
        font_size VARCHAR(50) DEFAULT 'text-xl md:text-2xl',
        image_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`,
      `CREATE TABLE IF NOT EXISTS ticker_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        text_en TEXT NOT NULL,
        text_am TEXT NOT NULL,
        is_active TINYINT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`,
      `CREATE TABLE IF NOT EXISTS houses (
        house_id INT AUTO_INCREMENT PRIMARY KEY,
        owner_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        title_am VARCHAR(255),
        description TEXT,
        description_am TEXT,
        type VARCHAR(100) NOT NULL,
        region VARCHAR(100) NOT NULL,
        city VARCHAR(100) NOT NULL,
        sub_city VARCHAR(100),
        address TEXT,
        avatar VARCHAR(255),
        price DECIMAL(15, 2) NOT NULL,
        rooms INT DEFAULT 1,
        bathrooms INT DEFAULT 1,
        square_meter DECIMAL(10, 2),
        status VARCHAR(50) NOT NULL DEFAULT 'Available',
        image_url VARCHAR(255),
        video_url VARCHAR(255),
        is_featured INT DEFAULT 0,
        rented_at DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(user_id) ON DELETE CASCADE
      ) ENGINE=InnoDB`,
      `CREATE TABLE IF NOT EXISTS house_images (
        image_id INT AUTO_INCREMENT PRIMARY KEY,
        house_id INT NOT NULL,
        image_url VARCHAR(255) NOT NULL,
        caption TEXT,
        is_primary TINYINT DEFAULT 0,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (house_id) REFERENCES houses(house_id) ON DELETE CASCADE
      ) ENGINE=InnoDB`,
      `CREATE TABLE IF NOT EXISTS house_videos (
        video_id INT AUTO_INCREMENT PRIMARY KEY,
        house_id INT NOT NULL,
        video_url VARCHAR(255) NOT NULL,
        video_type VARCHAR(50) DEFAULT 'upload',
        display_order INT DEFAULT 0,
        is_primary TINYINT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (house_id) REFERENCES houses(house_id) ON DELETE CASCADE
      ) ENGINE=InnoDB`,
      `CREATE TABLE IF NOT EXISTS rental_requests (
        request_id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        house_id INT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'Pending',
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (house_id) REFERENCES houses(house_id) ON DELETE CASCADE
      ) ENGINE=InnoDB`,
      `CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sender_id INT NOT NULL,
        receiver_id INT NOT NULL,
        house_id INT,
        content TEXT NOT NULL,
        is_read TINYINT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (house_id) REFERENCES houses(house_id) ON DELETE CASCADE
      ) ENGINE=InnoDB`,
      `CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read TINYINT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      ) ENGINE=InnoDB`,
      `CREATE TABLE IF NOT EXISTS wishlists (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        house_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, house_id),
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (house_id) REFERENCES houses(house_id) ON DELETE CASCADE
      ) ENGINE=InnoDB`,
      `CREATE TABLE IF NOT EXISTS website_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        key_name VARCHAR(100) NOT NULL UNIQUE,
        value TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'text',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`,
      `CREATE TABLE IF NOT EXISTS payment_accounts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        bank_name VARCHAR(100) NOT NULL,
        account_name VARCHAR(150) NOT NULL,
        account_number VARCHAR(100) NOT NULL,
        payment_type VARCHAR(50) DEFAULT 'Bank Transfer',
        instructions TEXT,
        qr_code_url TEXT,
        is_active TINYINT(1) DEFAULT 1,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`,
      `CREATE TABLE IF NOT EXISTS seo_meta (
        id INT AUTO_INCREMENT PRIMARY KEY,
        route_path VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        keywords TEXT,
        og_image VARCHAR(255),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`,
      `CREATE TABLE IF NOT EXISTS testimonials (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        role_en VARCHAR(255),
        role_am VARCHAR(255),
        location_en VARCHAR(255),
        location_am VARCHAR(255),
        avatar VARCHAR(255),
        rating INT DEFAULT 5,
        house_type_en VARCHAR(255),
        house_type_am VARCHAR(255),
        comment_en TEXT,
        comment_am TEXT,
        badge_en VARCHAR(255),
        badge_am VARCHAR(255),
        is_approved INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`,
      `CREATE TABLE IF NOT EXISTS tenant_seeking_ads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        budget_max DECIMAL(15,2),
        preferred_location TEXT,
        house_type VARCHAR(100),
        status VARCHAR(50) DEFAULT 'Active',
        is_featured INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      ) ENGINE=InnoDB`,
      `CREATE TABLE IF NOT EXISTS property_alerts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        house_type VARCHAR(100) DEFAULT 'All',
        min_price DECIMAL(15, 2) DEFAULT 0,
        max_price DECIMAL(15, 2),
        location_keyword VARCHAR(255),
        min_rooms INT DEFAULT 0,
        notification_email VARCHAR(255),
        is_active TINYINT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      ) ENGINE=InnoDB`,
      `CREATE TABLE IF NOT EXISTS email_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        recipient_email VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        body_html LONGTEXT NOT NULL,
        house_id INT,
        status VARCHAR(50) DEFAULT 'Delivered',
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (house_id) REFERENCES houses(house_id) ON DELETE SET NULL
      ) ENGINE=InnoDB`,
      `CREATE TABLE IF NOT EXISTS ad_payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        user_role VARCHAR(50) NOT NULL DEFAULT 'Landlord',
        ad_type VARCHAR(100) NOT NULL,
        house_id INT,
        seeking_ad_id INT,
        amount DECIMAL(15, 2) NOT NULL,
        payment_method VARCHAR(100) NOT NULL,
        transaction_ref VARCHAR(255) NOT NULL,
        receipt_url VARCHAR(255),
        status VARCHAR(50) NOT NULL DEFAULT 'Pending',
        admin_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (house_id) REFERENCES houses(house_id) ON DELETE SET NULL,
        FOREIGN KEY (seeking_ad_id) REFERENCES tenant_seeking_ads(id) ON DELETE SET NULL
      ) ENGINE=InnoDB`,
      `CREATE TABLE IF NOT EXISTS ai_chats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        user_message TEXT NOT NULL,
        ai_response TEXT NOT NULL,
        is_read TINYINT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
      ) ENGINE=InnoDB`,
      `CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        house_id INT NOT NULL,
        rating INT,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (house_id) REFERENCES houses(house_id) ON DELETE CASCADE
      ) ENGINE=InnoDB`,
      `CREATE TABLE IF NOT EXISTS rental_contracts (
        contract_id INT AUTO_INCREMENT PRIMARY KEY,
        house_id INT NOT NULL,
        landlord_id INT NOT NULL,
        tenant_id INT NOT NULL,
        landlord_name VARCHAR(255) NOT NULL,
        landlord_id_no VARCHAR(100),
        landlord_phone VARCHAR(100),
        tenant_name VARCHAR(255) NOT NULL,
        tenant_id_no VARCHAR(100),
        tenant_phone VARCHAR(100),
        monthly_rent DECIMAL(15, 2) NOT NULL,
        deposit_amount DECIMAL(15, 2) DEFAULT 0,
        start_date VARCHAR(50) NOT NULL,
        end_date VARCHAR(50) NOT NULL,
        terms_conditions TEXT,
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (house_id) REFERENCES houses(house_id) ON DELETE CASCADE,
        FOREIGN KEY (landlord_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (tenant_id) REFERENCES users(user_id) ON DELETE CASCADE
      ) ENGINE=InnoDB`,
      `CREATE TABLE IF NOT EXISTS rent_reminders (
        reminder_id INT AUTO_INCREMENT PRIMARY KEY,
        house_id INT NOT NULL,
        tenant_id INT NOT NULL,
        landlord_id INT NOT NULL,
        monthly_rent DECIMAL(15, 2) NOT NULL,
        due_day_of_month INT NOT NULL DEFAULT 1,
        last_paid_month VARCHAR(50),
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (house_id) REFERENCES houses(house_id) ON DELETE CASCADE,
        FOREIGN KEY (tenant_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (landlord_id) REFERENCES users(user_id) ON DELETE CASCADE
      ) ENGINE=InnoDB`,
      `CREATE TABLE IF NOT EXISTS otp_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        identifier VARCHAR(255) NOT NULL,
        code VARCHAR(255) NOT NULL,
        type VARCHAR(50) DEFAULT 'register',
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_otp_identifier (identifier)
      ) ENGINE=InnoDB`,
      `CREATE TABLE IF NOT EXISTS announcements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title_en VARCHAR(255) NOT NULL,
        title_am VARCHAR(255) NOT NULL,
        content_en TEXT,
        content_am TEXT,
        badge VARCHAR(50) DEFAULT 'NEWS',
        is_active TINYINT DEFAULT 1,
        type VARCHAR(50) DEFAULT 'general',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`,
      `CREATE TABLE IF NOT EXISTS hero_slides (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title_en VARCHAR(255) NOT NULL,
        title_am VARCHAR(255) NOT NULL,
        subtitle_en VARCHAR(255) NOT NULL,
        subtitle_am VARCHAR(255) NOT NULL,
        description_en TEXT,
        description_am TEXT,
        button_text_en VARCHAR(100),
        button_text_am VARCHAR(100),
        button_url VARCHAR(255),
        image_url VARCHAR(255) NOT NULL,
        is_active TINYINT DEFAULT 1,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`,
      `CREATE TABLE IF NOT EXISTS about_page (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title_en VARCHAR(255) NOT NULL,
        title_am VARCHAR(255) NOT NULL,
        subtitle_en VARCHAR(255),
        subtitle_am VARCHAR(255),
        content_en TEXT NOT NULL,
        content_am TEXT NOT NULL,
        image_url VARCHAR(255) NOT NULL,
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
        banner_image_url VARCHAR(255),
        banner_subtitle_en VARCHAR(255),
        banner_subtitle_am VARCHAR(255),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`,
      `CREATE TABLE IF NOT EXISTS about_faqs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        question_en TEXT NOT NULL,
        question_am TEXT NOT NULL,
        answer_en TEXT NOT NULL,
        answer_am TEXT NOT NULL,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`,
      `CREATE TABLE IF NOT EXISTS auth_page_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        login_title_en VARCHAR(255),
        login_title_am VARCHAR(255),
        login_subtitle_en TEXT,
        login_subtitle_am TEXT,
        register_title_en VARCHAR(255),
        register_title_am VARCHAR(255),
        register_subtitle_en TEXT,
        register_subtitle_am TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`,
      `CREATE TABLE IF NOT EXISTS auth_slides (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title_en VARCHAR(255) NOT NULL,
        title_am VARCHAR(255) NOT NULL,
        desc_en TEXT NOT NULL,
        desc_am TEXT NOT NULL,
        badge_en VARCHAR(100),
        badge_am VARCHAR(100),
        image_url VARCHAR(255) NOT NULL,
        display_order INT DEFAULT 0,
        is_active TINYINT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`,
      `CREATE TABLE IF NOT EXISTS contact_page (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title_en VARCHAR(255) NOT NULL,
        title_am VARCHAR(255) NOT NULL,
        subtitle_en VARCHAR(255),
        subtitle_am VARCHAR(255),
        address_en TEXT,
        address_am TEXT,
        phone_1 VARCHAR(100),
        phone_2 VARCHAR(100),
        phone_3 VARCHAR(100),
        email VARCHAR(255),
        working_hours_en TEXT,
        working_hours_am TEXT,
        facebook_url VARCHAR(255),
        telegram_url VARCHAR(255),
        tiktok_url VARCHAR(255),
        youtube_url VARCHAR(255),
        banner_image_url VARCHAR(255),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`,
      `CREATE TABLE IF NOT EXISTS contact_offices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name_en VARCHAR(255) NOT NULL,
        name_am VARCHAR(255) NOT NULL,
        address_en TEXT,
        address_am TEXT,
        phone VARCHAR(100),
        agent_name VARCHAR(150),
        working_hours VARCHAR(255),
        is_active TINYINT DEFAULT 1,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`,
      `CREATE TABLE IF NOT EXISTS contact_phones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        department_en VARCHAR(255) NOT NULL,
        department_am VARCHAR(255) NOT NULL,
        phone_number VARCHAR(100) NOT NULL,
        telegram_username VARCHAR(100),
        contact_person VARCHAR(150),
        is_whatsapp TINYINT DEFAULT 0,
        is_active TINYINT DEFAULT 1,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`,
      `CREATE TABLE IF NOT EXISTS security_audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        user_role VARCHAR(50),
        action VARCHAR(100) NOT NULL,
        ip_address VARCHAR(100),
        user_agent TEXT,
        details JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
      ) ENGINE=InnoDB`,
      `CREATE TABLE IF NOT EXISTS login_attempts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255),
        ip_address VARCHAR(100) NOT NULL,
        attempt_count INT DEFAULT 1,
        locked_until DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_email_ip (email, ip_address)
      ) ENGINE=InnoDB`,
      `CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        used TINYINT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      ) ENGINE=InnoDB`
    ];

    for (const statement of schemaStatements) {
      try {
        await connWrapper.query(statement);
      } catch (err) {
        if (!isIgnorableSchemaError(err)) {
          throw err;
        }
      }
    }

    try {
      await connWrapper.query('ALTER TABLE otp_codes MODIFY COLUMN code VARCHAR(255) NOT NULL');
    } catch (e) {}

    try {
      await connWrapper.query('CREATE INDEX idx_otp_identifier_type ON otp_codes(identifier, type)');
    } catch (e) {
      if (!String(e?.message || '').includes('Duplicate key name')) {
        throw e;
      }
    }

    const [users] = await connWrapper.query('SELECT COUNT(*) as count FROM users');
    if (!users || !users[0] || users[0].count === 0) {
      console.log('MySQL Database empty, seeding initial data...');
      await seedInitialData(connWrapper);
    }
    return true;
  } catch (mysqlErr) {
    if (isProduction) {
      console.error('[STARTUP] FATAL: MySQL connection failed in production. Application cannot start.');
      console.error('[STARTUP] Ensure DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME are correctly configured.');
      throw new Error('MySQL connection is required in production. Application startup aborted.');
    }

    if (!allowSqliteFallback) {
      console.error('[STARTUP] MySQL connection failed and SQLite fallback is disabled (ALLOW_SQLITE_FALLBACK is not true).');
      throw new Error('MySQL connection failed and SQLite fallback is disabled.');
    }

    console.log(`Using SQLite engine for Cloud preview (MySQL not configured locally).`);
    activeEngine = 'sqlite';
  }

  // Fallback to SQLite engine (development only)
  if (isProduction) {
    // Should never reach here in production due to the check above
    console.error('[STARTUP] FATAL: SQLite fallback is not allowed in production.');
    throw new Error('SQLite fallback is not allowed in production.');
  }

  try {
    const connection = await getPool().getConnection();
    console.log('Successfully connected to SQLite Database via libsql');
    
    try {
      const schemaPath = fs.existsSync(path.join(dbDirname, 'schema.sql')) ? path.join(dbDirname, 'schema.sql') : path.join(process.cwd(), 'database', 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await connection.query(schema);
      console.log('Database tables verified/created successfully');

      // Migration checks
      try { await connection.query('ALTER TABLE houses ADD COLUMN video_url TEXT'); } catch(e) {}
      try { await connection.query('ALTER TABLE houses ADD COLUMN is_featured INTEGER DEFAULT 0'); } catch(e) {}
      try { await connection.query('ALTER TABLE tenant_seeking_ads ADD COLUMN is_featured INTEGER DEFAULT 0'); } catch(e) {}
      try { await connection.query('ALTER TABLE tenant_seeking_ads ADD COLUMN house_type TEXT'); } catch(e) {}
      try { await connection.query('ALTER TABLE users ADD COLUMN last_seen DATETIME'); } catch(e) {}
      try { await connection.query('ALTER TABLE users ADD COLUMN avatar TEXT'); } catch(e) {}
      try { await connection.query('ALTER TABLE houses ADD COLUMN rented_at DATETIME'); } catch(e) {}
      try { await connection.query('ALTER TABLE categories ADD COLUMN description TEXT'); } catch(e) {}
      try { await connection.query('ALTER TABLE categories ADD COLUMN description_am TEXT'); } catch(e) {}
      try { await connection.query('ALTER TABLE categories ADD COLUMN font_size TEXT'); } catch(e) {}
      try { await connection.query('ALTER TABLE testimonials ADD COLUMN is_approved INTEGER DEFAULT 1'); } catch(e) {}
      try { await connection.query('ALTER TABLE ai_chats ADD COLUMN is_read TINYINT(1) DEFAULT 0'); } catch(e) {}
      try { await connection.query('ALTER TABLE house_images ADD COLUMN is_primary INTEGER DEFAULT 0'); } catch(e) {}
      try { await connection.query('ALTER TABLE house_images ADD COLUMN display_order INTEGER DEFAULT 0'); } catch(e) {}
      try { await connection.query('ALTER TABLE house_images ADD COLUMN caption TEXT'); } catch(e) {}
      try { await connection.query('ALTER TABLE houses ADD COLUMN amenities TEXT'); } catch(e) {}
      try { await connection.query('ALTER TABLE houses ADD COLUMN availability_date TEXT'); } catch(e) {}
      try { await connection.query('ALTER TABLE houses ADD COLUMN seo_title TEXT'); } catch(e) {}
      try { await connection.query('ALTER TABLE houses ADD COLUMN seo_description TEXT'); } catch(e) {}

      await connection.query(`
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
      `);

      // Create new features tables if not existing
      try {
        await connection.query(`
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
        `);
        try { await connection.query("ALTER TABLE announcements ADD COLUMN badge TEXT"); } catch(e) {}
        await connection.query(`
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
        `);
        try {
          await connection.query('ALTER TABLE hero_slides ADD COLUMN description_en TEXT');
        } catch(e) {}
        try {
          await connection.query('ALTER TABLE hero_slides ADD COLUMN description_am TEXT');
        } catch(e) {}
        try {
          await connection.query('ALTER TABLE hero_slides ADD COLUMN button_text_en TEXT');
        } catch(e) {}
        try {
          await connection.query('ALTER TABLE hero_slides ADD COLUMN button_text_am TEXT');
        } catch(e) {}
        try {
          await connection.query('ALTER TABLE hero_slides ADD COLUMN button_url TEXT');
        } catch(e) {}
        try {
          await connection.query('ALTER TABLE hero_slides ADD COLUMN display_order INTEGER DEFAULT 0');
        } catch(e) {}
        await connection.query(`
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
        `);
        const aboutCols = [
          'subtitle_en', 'subtitle_am', 'content_en', 'content_am', 'image_url',
          'mission_en', 'mission_am', 'vision_en', 'vision_am', 'values_en', 'values_am',
          'tailored_en', 'tailored_am', 'footprint_en', 'footprint_am',
          'banner_image_url', 'banner_subtitle_en', 'banner_subtitle_am'
        ];
        for (const col of aboutCols) {
          try {
            await connection.query(`ALTER TABLE about_page ADD COLUMN ${col} TEXT`);
          } catch(e) {}
        }
        await connection.query(`
          CREATE TABLE IF NOT EXISTS about_faqs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question_en TEXT NOT NULL,
            question_am TEXT NOT NULL,
            answer_en TEXT NOT NULL,
            answer_am TEXT NOT NULL,
            display_order INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);
        await connection.query(`
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
        `);
        await connection.query(`
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
        `);
        await connection.query(`
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
        `);
        // Add phone_3 if missing
        try {
          await connection.query("ALTER TABLE contact_page ADD COLUMN phone_3 TEXT;");
        } catch (e) {
          // Column likely already exists
        }
        await connection.query(`
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
        `);
        await connection.query(`
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
        `);
        await connection.query(`
          CREATE TABLE IF NOT EXISTS property_alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            house_type TEXT,
            min_price REAL DEFAULT 0,
            max_price REAL,
            location_keyword TEXT,
            min_rooms INTEGER DEFAULT 0,
            notification_email TEXT,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
          );
        `);
        await connection.query(`
          CREATE TABLE IF NOT EXISTS email_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            recipient_email TEXT NOT NULL,
            subject TEXT NOT NULL,
            body_html TEXT NOT NULL,
            house_id INTEGER,
            status TEXT,
            sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
            FOREIGN KEY (house_id) REFERENCES houses(house_id) ON DELETE SET NULL
          );
        `);
        await connection.query(`
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
        `);
        await connection.query(`
          CREATE TABLE IF NOT EXISTS rental_contracts (
            contract_id INTEGER PRIMARY KEY AUTOINCREMENT,
            house_id INTEGER NOT NULL,
            landlord_id INTEGER NOT NULL,
            tenant_id INTEGER NOT NULL,
            landlord_name TEXT NOT NULL,
            landlord_id_no TEXT,
            landlord_phone TEXT,
            tenant_name TEXT NOT NULL,
            tenant_id_no TEXT,
            tenant_phone TEXT,
            monthly_rent REAL NOT NULL,
            deposit_amount REAL DEFAULT 0,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            terms_conditions TEXT,
            status TEXT DEFAULT 'Active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (house_id) REFERENCES houses(house_id) ON DELETE CASCADE,
            FOREIGN KEY (landlord_id) REFERENCES users(user_id) ON DELETE CASCADE,
            FOREIGN KEY (tenant_id) REFERENCES users(user_id) ON DELETE CASCADE
          );
        `);
        await connection.query(`
          CREATE TABLE IF NOT EXISTS rent_reminders (
            reminder_id INTEGER PRIMARY KEY AUTOINCREMENT,
            house_id INTEGER NOT NULL,
            tenant_id INTEGER NOT NULL,
            landlord_id INTEGER NOT NULL,
            monthly_rent REAL NOT NULL,
            due_day_of_month INTEGER NOT NULL DEFAULT 1,
            last_paid_month TEXT,
            status TEXT DEFAULT 'Pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (house_id) REFERENCES houses(house_id) ON DELETE CASCADE,
            FOREIGN KEY (tenant_id) REFERENCES users(user_id) ON DELETE CASCADE,
            FOREIGN KEY (landlord_id) REFERENCES users(user_id) ON DELETE CASCADE
          );
        `);
        await connection.query(`
          CREATE TABLE IF NOT EXISTS payment_accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bank_name TEXT NOT NULL,
            account_name TEXT NOT NULL,
            account_number TEXT NOT NULL,
            payment_type TEXT,
            instructions TEXT,
            qr_code_url TEXT,
            is_active INTEGER DEFAULT 1,
            display_order INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);
        await connection.query(`
          CREATE TABLE IF NOT EXISTS otp_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            identifier TEXT NOT NULL,
            code TEXT NOT NULL,
            type TEXT,
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);
        try {
          await connection.query(`ALTER TABLE payment_accounts ADD COLUMN qr_code_url TEXT;`);
        } catch (e) {
          // Column may already exist
        }
      } catch (tblErr) {
        console.error('Table setup note:', tblErr.message);
      }

      const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
      if (!users || !users[0] || users[0].count === 0) {
        console.log('Database empty, running initial seed...');
        await seedInitialData(connection);
      }
    } catch (err) {
      console.error('Failed to verify schema:', err.message);
      if (err.code === 'SQLITE_CORRUPT' || (err.message && err.message.includes('malformed'))) {
        console.log('Attempting auto-repair of corrupt database file...');
        try {
          if (fs.existsSync('./database.sqlite')) {
            fs.unlinkSync('./database.sqlite');
          }
          sqliteClient = null;
          const freshConn = await getPool().getConnection();
          const schemaPath = fs.existsSync(path.join(dbDirname, 'schema.sql')) ? path.join(dbDirname, 'schema.sql') : path.join(process.cwd(), 'database', 'schema.sql');
          const schema = fs.readFileSync(schemaPath, 'utf8');
          await freshConn.query(schema);
          await seedInitialData(freshConn);
          console.log('Database auto-repaired and seeded successfully.');
        } catch (repairErr) {
          console.error('Failed to auto-repair database:', repairErr);
        }
      }
    }

    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
};

async function seedInitialData(connection) {
  try {
    const envValue = (key, fallback = '') => {
      const value = process.env[key];
      return typeof value === 'string' && value.trim() ? value.trim() : fallback;
    };

    const settings = [
      ["hero_title", "እንጅባራ ቤት ደላላ - Injibara House Rental Platform", "text"],
      ["hero_subtitle", "በእንጅባራ ከተማ፣ በቀበሌዎች፣ በዩኒቨርሲቲ እና አውቶቡስ ተራ አካባቢ የሚከራዩ ቤቶችን በቀላሉ ያግኙ።", "text"],
      ["hero_image", "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80", "image"],
      ["contact_email", envValue('CONTACT_EMAIL', 'support@example.com'), "text"],
      ["contact_phone", envValue('CONTACT_PHONE', '+251 000 000 000'), "text"],
      ["contact_telegram", envValue('CONTACT_TELEGRAM', '@InjibaraHouseSupport'), "text"],
      ["contact_instagram", envValue('CONTACT_INSTAGRAM', 'injibarahousebroker'), "text"],
      ["about_text", "እንጅባራ ቤት ደላላ (Injibara House Broker) በእንጅባራ ከተማና አካባቢዋ ለሚገኙ ተከራዮችና የቤት አከራዮች የተዘጋጀ ታማኝና ዘመናዊ የቤት ኪራይ መድረክ ነው።", "text"],
      ["ad_fee_featured_house", envValue('AD_FEE_FEATURED_HOUSE', '500'), "number"],
      ["ad_fee_tenant_seeking", envValue('AD_FEE_TENANT_SEEKING', '200'), "number"],
      ["ad_fee_tenant_contact", envValue('AD_FEE_TENANT_CONTACT', '150'), "number"],
      ["ad_fee_banner", envValue('AD_FEE_BANNER', '1000'), "number"],
      ["telebirr_no", envValue('TELEBIRR_NO', ''), "text"],
      ["telebirr_name", envValue('TELEBIRR_NAME', ''), "text"],
      ["cbe_account", envValue('CBE_ACCOUNT', ''), "text"],
      ["cbe_account_name", envValue('CBE_ACCOUNT_NAME', ''), "text"],
      ["abyssinia_account", envValue('ABYSSINIA_ACCOUNT', ''), "text"],
      ["abyssinia_account_name", envValue('ABYSSINIA_ACCOUNT_NAME', ''), "text"],
      ["mpesa_account", envValue('MPESA_ACCOUNT', ''), "text"],
      ["mpesa_account_name", envValue('MPESA_ACCOUNT_NAME', ''), "text"],
      ["amhara_account", envValue('AMHARA_ACCOUNT', ''), "text"],
      ["amhara_account_name", envValue('AMHARA_ACCOUNT_NAME', ''), "text"]
    ];

    for (const s of settings) {
      await connection.query("INSERT OR IGNORE INTO website_settings (key_name, value, type) VALUES (?, ?, ?)", s);
    }

    // Force update critical user settings to ensure existing databases reflect the current env values.
    const forceSettings = [
      ["contact_email", envValue('CONTACT_EMAIL', 'support@example.com')],
      ["contact_phone", envValue('CONTACT_PHONE', '+251 000 000 000')],
      ["contact_telegram", envValue('CONTACT_TELEGRAM', '@InjibaraHouseSupport')],
      ["contact_instagram", envValue('CONTACT_INSTAGRAM', 'injibarahousebroker')],
      ["telebirr_no", envValue('TELEBIRR_NO', '')],
      ["telebirr_name", envValue('TELEBIRR_NAME', '')],
      ["cbe_account", envValue('CBE_ACCOUNT', '')],
      ["cbe_account_name", envValue('CBE_ACCOUNT_NAME', '')],
      ["abyssinia_account", envValue('ABYSSINIA_ACCOUNT', '')],
      ["abyssinia_account_name", envValue('ABYSSINIA_ACCOUNT_NAME', '')],
      ["mpesa_account", envValue('MPESA_ACCOUNT', '')],
      ["mpesa_account_name", envValue('MPESA_ACCOUNT_NAME', '')],
      ["amhara_account", envValue('AMHARA_ACCOUNT', '')],
      ["amhara_account_name", envValue('AMHARA_ACCOUNT_NAME', '')]
    ];

    for (const [k, v] of forceSettings) {
      try {
        await connection.query("DELETE FROM website_settings WHERE key_name = ?", [k]);
        await connection.query("INSERT INTO website_settings (key_name, value, type) VALUES (?, ?, 'text')", [k, v]);
      } catch (err) {
        console.error("Failed to force update setting in website_settings:", k, err.message);
      }
    }

    const seoMeta = [
      ["/", "እንጅባራ ቤት ደላላ | Injibara House Rental Platform", "በባህር ዳር፣ ጎንደር፣ ደሴ እና በእንጅባራ ከተማ የሚከራዩ ቤቶች። Houses for rent in Bahir Dar, Gondar, Dessie and Injibara Ethiopia.", "ቤት ኪራይ, ደላላ, እንጅባራ, house rent, Ethiopia rental, Amhara house broker", "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9"],
      ["/houses", "የሚከራዩ ቤቶች ዝርዝር | Browse Houses for Rent", "በአማራ ክልል የሚገኙ ምርጥ የመኖሪያ እና የንግድ ቤቶች ዝርዝር። List of best residential and commercial houses for rent in Amhara region.", "የሚከራይ ቤት, ቪላ, አፓርታማ, rent villa, apartment Ethiopia, rental listings", "https://images.unsplash.com/photo-1512917774080-9991f1c4c750"]
    ];

    for (const m of seoMeta) {
      await connection.query("INSERT OR IGNORE INTO seo_meta (route_path, title, description, keywords, og_image) VALUES (?, ?, ?, ?, ?)", m);
    }

    const categories = [
      ["የመኖሪያ ቤት", "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&q=80"],
      ["የንግድ ሱቅ", "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80"],
      ["ለሆቴል እና ለምግብ (ሽሮ) ቤት", "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80"],
      ["ለኤሌክትሮኒክስ እና ፎቶ ቤት", "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&q=80"],
      ["ለፋርማሲ እና ክሊኒክ", "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&q=80"],
      ["ሌሎች የንግድና የአገልግሎት ቦታዎች", "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80"]
    ];

    for (const c of categories) {
      await connection.query("INSERT OR IGNORE INTO categories (name, image_url) VALUES (?, ?)", c);
    }

    try {
      await connection.query("ALTER TABLE announcements ADD COLUMN type VARCHAR(50) NOT NULL DEFAULT 'promotional_notice'");
    } catch (e) {}

    const [annCount] = await connection.query('SELECT COUNT(*) as count FROM announcements');
    if (!annCount || !annCount[0] || annCount[0].count === 0) {
      const defaultAnnouncements = [
        ["🔥 NEW UPDATE: Instant SMS notifications are now active for both landlords and tenants!", "🔥 አዲስ ማሻሻያ፡ ለአከራዮች እና ለተከራዮች ፈጣን የኤስኤምኤስ (SMS) ማሳወቂያዎች በስራ ላይ ውለዋል!", "Automatic notifications upon request & payment updates", "በየጥያቄዎች እና ክፍያዎች ላይ አውቶማቲክ ማሳወቂያ ይላካል", "NEWS", 1, "promotional_notice"],
        ["⭐ SPECIAL OFFER: Boost your listing or seeking request on top of the main page to rent 5x faster!", "⭐ ልዩ ማስታወቂያ፡ ማስታወቂያዎን በመጀመሪያ ገጽ ላይ በማውጣት 5 እጥፍ ፈጣን ተከራይ ያግኙ!", "Promote your house or seeking ad for maximum visibility", "ቤትዎን ወይም የቤት ፈላጊ ማስታወቂያዎን ከላይ በመሰቀል በፍጥነት ያከራዩ", "OFFER", 1, "promotional_notice"],
        ["📞 CALL US: Reach our support office at +251 912 345 678 for instant brokerage and physical property tours!", "📞 ለፈጣን እገዛ እና የቤት ማሳያ ቀጠሮዎች በ +251 912 345 678 ይደውሉልን!", "Physical tour booking & direct guidance", "በአካል ሂደው ቤቶችን ለመጎብኘት እና ፈጣን እርዳታ ለማግኘት", "SUPPORT", 1, "promotional_notice"]
      ];
      for (const ann of defaultAnnouncements) {
        await connection.query("INSERT INTO announcements (title_en, title_am, content_en, content_am, badge, is_active, type) VALUES (?, ?, ?, ?, ?, ?, ?)", ann);
      }
    }

    const [homepageAnnCount] = await connection.query("SELECT COUNT(*) as count FROM announcements WHERE type = 'homepage_notice'");
    if (!homepageAnnCount || !homepageAnnCount[0] || homepageAnnCount[0].count === 0) {
      const defaultHomepageNotices = [
        ["Instant SMS & Email Notifications Now Active!", "የኤስኤምኤስ (SMS) እና የኢሜይል ማሳወቂያዎች በስራ ላይ ውለዋል!", "We have launched an advanced SMS & Email alert system. Landlords and tenants will now receive real-time text message alerts for new rental applications, payment approvals, and matching home listings directly on their mobile phones!", "አከራዮች እና ተከራዮች በቀጥታ በስልካቸው ላይ የኪራይ ጥያቄዎችን፣ የክፍያ ሁኔታዎችን እና አዳዲስ የቤት ማስታወቂያዎችን በኤስኤምኤስ (SMS) እንዲደርሳቸው የሚያደርግ አዲስ ቴክኖሎጂ ተዘርግቷል። አሁን ግንኙነቱ ይበልጥ ፈጣን ሆኗል!", "NEW", 1, "homepage_notice"],
        ["Low Commission Landlord-Tenant Matching Guarantee", "አስተማማኝ የቤት ፈላጊዎች እና አከራዮች ትስስር ዋስትና", "Injibara House Rentals Head Office offers a direct connection between landlords and house seekers. No unfair middlemen, with low commission and service fee only. Search and secure rental homes easily and affordably!", "የእንጅባራ የቤት ኪራይ ዋና መስሪያ ቤት በአከራዮች እና በተከራዮች መካከል ምንም ዓይነት አላስፈላጊ መካከለኛ ደላላ ሳይኖር ቀጥታ ትስስር ይፈጥራል። ተከራዮች በአነስተኛ ኮሚሽን እና የአገልግሎት ክፍያ ብቻ ቤቶችን መፈለግ እና ማከራየት ይችላሉ። ከአላስፈላጊ ደላላ ክፍያ ይዳኑ!", "OFFER", 1, "homepage_notice"],
        ["Injibara House Rentals Head Office & Verification Services", "የእንጅባራ የቤት ኪራይ ዋና መስሪያ ቤት አድራሻ እና የቤት ማረጋገጫ ሂደት", "Our head office is located in Injibara, Kebele 01, behind the Commercial Bank of Ethiopia (CBE) branch. We physically verify listed homes for your security. Drop by or call us at +251 912 345 678 for rapid support with low commission and service fee only.", "ዋናው ቢሯችን በእንጅባራ ከተማ ቀበሌ 01 ከኢትዮጵያ ንግድ ባንክ (CBE) ጀርባ ይገኛል። ቤቶችን በአካል ሄደን የምናረጋግጥ ሲሆን፣ ደንበኞቻችን ወደ ቢሯችን በመምጣት ወይም በስልክ ቁጥር +251 912 345 678 ደውለው በአነስተኛ ኮሚሽን እና የአገልግሎት ክፍያ ፈጣን አገልግሎት ማግኘት ይችላሉ።", "SUPPORT", 1, "homepage_notice"]
      ];
      for (const ann of defaultHomepageNotices) {
        await connection.query("INSERT INTO announcements (title_en, title_am, content_en, content_am, badge, is_active, type) VALUES (?, ?, ?, ?, ?, ?, ?)", ann);
      }
    }

    const salt = await bcrypt.genSalt(10);

    if (isProduction) {
      const requiredSeedEnvVars = [
        'DEFAULT_ADMIN_EMAIL',
        'DEFAULT_ADMIN_PASSWORD',
        'DEFAULT_ADMIN_PHONE',
        'DEFAULT_LANDLORD_EMAIL',
        'DEFAULT_LANDLORD_PASSWORD',
        'DEFAULT_LANDLORD_PHONE',
        'DEFAULT_TENANT_EMAIL',
        'DEFAULT_TENANT_PASSWORD',
        'DEFAULT_TENANT_PHONE'
      ];

      const missingSeedEnvVars = requiredSeedEnvVars.filter(key => !process.env[key] || String(process.env[key]).trim() === '');

      if (missingSeedEnvVars.length > 0) {
        console.error(`[STARTUP] Missing required seed environment variables for production: ${missingSeedEnvVars.join(', ')}`);
        console.error('[STARTUP] Application cannot start without explicit seed credentials in production.');
        throw new Error('Missing required seed environment variables for production.');
      }
    }

    const getEnv = (key, fallback) => {
      const value = process.env[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
      if (!isProduction && fallback) return fallback;
      return '';
    };

    const defaultAdminPassword = getEnv('ADMIN_PASSWORD', getEnv('DEFAULT_ADMIN_PASSWORD', ''));
    const defaultLandlordPassword = getEnv('DEFAULT_LANDLORD_PASSWORD', '');
    const defaultTenantPassword = getEnv('DEFAULT_TENANT_PASSWORD', '');
    const adminEmail = getEnv('ADMIN_EMAIL', getEnv('DEFAULT_ADMIN_EMAIL', ''));
    const adminPhone = getEnv('ADMIN_PHONE', getEnv('DEFAULT_ADMIN_PHONE', ''));
    const landlordEmail = getEnv('DEFAULT_LANDLORD_EMAIL', '');
    const landlordPhone = getEnv('DEFAULT_LANDLORD_PHONE', '');
    const tenantEmail = getEnv('DEFAULT_TENANT_EMAIL', '');
    const tenantPhone = getEnv('DEFAULT_TENANT_PHONE', '');

    const pass = await bcrypt.hash(defaultAdminPassword, salt);
    const landlordPass = await bcrypt.hash(defaultLandlordPassword, salt);
    const tenantPass = await bcrypt.hash(defaultTenantPassword, salt);

    await connection.query("INSERT OR IGNORE INTO users (user_id, name, email, phone, password, role, region, city) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 
      [1, "Admin", adminEmail, adminPhone, pass, "Admin", "Injibara", "Injibara"]);

    await connection.query("INSERT OR IGNORE INTO users (user_id, name, email, phone, password, role, region, city) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 
      [2, "Landlord User", landlordEmail, landlordPhone, landlordPass, "Landlord", "Injibara", "Injibara"]);

    await connection.query("INSERT OR IGNORE INTO users (user_id, name, email, phone, password, role, region, city) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 
      [3, "Tenant User", tenantEmail, tenantPhone, tenantPass, "Tenant", "Injibara", "Injibara"]);

    const houses = [
      [1,2,"እንጅባራ ቀበሌ 01 ሰፊ የመኖሪያ ቤት","በእንጅባራ ከተማ ቀበሌ 01 የሚገኝ ለቤተሰብ የሚሆን 3 ክፍል የመኖሪያ ቤት።","የመኖሪያ ቤት","Injibara","Injibara","Kebele 01","ቀበሌ 01 መሐል ከተማ",8500,3,1,150,"Available","https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&q=80"],
      [2,1,"እንጅባራ ዩኒቨርሲቲ አቅራቢያ የመኖሪያ ቤት","ለዩኒቨርሲቲ መምህራን የሚሆን 2 ክፍል ዘመናዊ የመኖሪያ ቤት።","የመኖሪያ ቤት","Injibara","Injibara","Injibara University","ዩኒቨርሲቲ መንገድ",6500,2,1,100,"Available","https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&q=80"],
      [3,2,"ቀበሌ 02 ጸጥተኛ የመኖሪያ ቤት","በቀበሌ 02 ለሰላማዊ ኑሮ የሚሆን 4 ክፍል ያለው አጥር ግቢ ያለው የመኖሪያ ቤት።","የመኖሪያ ቤት","Injibara","Injibara","Kebele 02","ቀበሌ 02 የመኖሪያ መንደር",10000,4,2,200,"Available","https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80"],
      [4,1,"ዘመናዊ አፓርታማ እንጅባራ","ለአዲስ ተጋቢዎች የሚሆን ዘመናዊ አፓርታማ ከተሟላ ዕቃ ጋር።","የመኖሪያ ቤት","Injibara","Injibara","Kebele 03","መሐል ከተማ",12000,2,1,120,"Available","https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80"],
      [5,2,"ሰፊ የግቢ ቤት ለቤተሰብ","ትልቅ መኪና ማቆሚያ እና መጫወቻ ቦታ ያለው ሰፊ የግቢ ቤት።","የመኖሪያ ቤት","Injibara","Injibara","Kebele 01","አስፋልት ዳር",15000,5,2,300,"Available","https://images.unsplash.com/photo-1613490908677-2b738c642671?auto=format&fit=crop&q=80"],
      [6,1,"አነስተኛ የኮንዶሚኒየም ቤት","ለአንድ ሰው ወይም ለተማሪ የሚሆን ንጹህ ቤት።","የመኖሪያ ቤት","Injibara","Injibara","University Area","ዩኒቨርሲቲ ፊት ለፊት",4000,1,1,50,"Available","https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&q=80"],
      [7,2,"በአስፋልት ዳር የሚገኝ የንግድ ሱቅ (ቀበሌ 01)","በእንጅባራ ዋና አስፋልት ዳር ለተለያዩ የንግድ ስራዎች የሚሆን።","የንግድ ሱቅ","Injibara","Injibara","Kebele 01","ዋና አስፋልት መንገድ",15000,2,1,60,"Available","https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80"],
      [8,1,"አውቶቡስ ተራ የንግድ ሱቅ","በእንጅባራ አውቶቡስ ተራ ከፍተኛ የህዝብ እንቅስቃሴ ባለው ቦታ።","የንግድ ሱቅ","Injibara","Injibara","Bus Station","አውቶቡስ ተራ ገበያ",12000,1,1,45,"Available","https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80"],
      [9,1,"ለቡቲክ የሚሆን ሱቅ","ለልብስ እና ጫማ ንግድ (ቡቲክ) ተስማሚ የሆነ ሰፊ ሱቅ በመሐል ከተማ።","የንግድ ሱቅ","Injibara","Injibara","Kebele 02","ገበያ አጠገብ",18000,1,1,50,"Available","https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80"],
      [10,1,"ለችርቻሮ ንግድ የሚሆን ትንሽ ሱቅ","ለጉልት ወይም ለጥቃቅን ንግድ የሚሆን ተመጣጣኝ ሱቅ።","የንግድ ሱቅ","Injibara","Injibara","Kebele 03","መንደር ውስጥ",5000,1,1,20,"Available","https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&q=80"],
      [11,1,"ለትልቅ ጅምላ ንግድ የሚሆን መጋዘን","በእንጅባራ መውጫ ላይ ለጅምላ ንግድ መጋዘን የሚሆን ትልቅ ቦታ።","የንግድ ሱቅ","Injibara","Injibara","Zuria","ዋና መንገድ",25000,3,1,250,"Available","https://images.unsplash.com/photo-1586528116311-ad8ed7c83a7f?auto=format&fit=crop&q=80"],
      [12,1,"ለኮስሞቲክስ የሚሆን ማራኪ ሱቅ","ለኮስሞቲክስ እና ጌጣጌጥ ንግድ የሚሆን ዘመናዊ ሱቅ።","የንግድ ሱቅ","Injibara","Injibara","Kebele 01","ዋና መንገድ",10000,1,1,30,"Available","https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80"],
      [13,1,"ለሆቴል እና ለምግብ ሽሮ ቤት የሚሆን ቦታ","በእንጅባራ መሐል ከተማ ለምግብና መጠጥ፣ ለሽሮ ቤት ወይም ለሆቴል አገልግሎት የተዘጋጀ።","ለሆቴል እና ለምግብ (ሽሮ) ቤት","Injibara","Injibara","Kebele 01","መሐል ከተማ ዋና መንገድ",22000,4,2,180,"Available","https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80"],
      [14,1,"አውቶቡስ ተራ አካባቢ ለምግብ ቤት የሚሆን","በአውቶቡስ ተራ አቅራቢያ ለምግብ ቤት እና ለካፌ የሚሆን የተዘጋጀ ህንጻ።","ለሆቴል እና ለምግብ (ሽሮ) ቤት","Injibara","Injibara","Bus Station","አውቶቡስ ተራ",18000,3,2,140,"Available","https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80"],
      [15,1,"በባህል ምግቦች ለሚሰራ ሬስቶራንት","ሰፊ ግቢ ያለውና ለባህላዊ ምግቦች ሬስቶራንት ተስማሚ የሆነ ቦታ።","ለሆቴል እና ለምግብ (ሽሮ) ቤት","Injibara","Injibara","Kebele 03","ጫካ አቅራቢያ",30000,5,4,400,"Available","https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80"],
      [16,1,"ለዘመናዊ ካፌ እና ኬክ ቤት","ለካፌ እና ለኬክ ቤት የሚሆን ሙሉ ብርጭቆ የሆነ ሱቅ በመሐል ከተማ።","ለሆቴል እና ለምግብ (ሽሮ) ቤት","Injibara","Injibara","Kebele 01","ዋና አስፋልት ዳር",16000,2,1,80,"Available","https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80"],
      [17,1,"ለቁርስ ቤት የሚሆን ቦታ","በዩኒቨርሲቲው በር ላይ ለቁርስ ቤት (ፉል፣ ፈጢራ) የሚሆን ቦታ።","ለሆቴል እና ለምግብ (ሽሮ) ቤት","Injibara","Injibara","University Area","ዩኒቨርሲቲ በር",8000,1,1,40,"Available","https://images.unsplash.com/photo-1525610553991-2bede1a236e2?auto=format&fit=crop&q=80"],
      [18,1,"ለስጋ ቤት እና ሬስቶራንት","ከትልቅ ቄራ ጋር ተያይዞ የሚሰራ ለስጋ ቤት እና ሬስቶራንት።","ለሆቴል እና ለምግብ (ሽሮ) ቤት","Injibara","Injibara","Kebele 02","ገበያ ጀርባ",25000,4,2,200,"Available","https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&q=80"],
      [19,1,"ለኤሌክትሮኒክስ እና ፎቶ ቤት የሚሆን ሱቅ","በመሐል ከተማ ቀበሌ 01 ለሞባይል/ኤሌክትሮኒክስ ሽያጭ ወይም ለፎቶ ቤት ጥራት ያለው ሱቅ።","ለኤሌክትሮኒክስ እና ፎቶ ቤት","Injibara","Injibara","Kebele 01","መሐል ገበያ",9000,1,1,35,"Available","https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&q=80"],
      [20,1,"ለኮምፒውተር ጥገና እና ሽያጭ","ሰፊ እና ለኮምፒውተር እቃዎች ማሳያ የሚሆን የመስታወት ሱቅ።","ለኤሌክትሮኒክስ እና ፎቶ ቤት","Injibara","Injibara","Kebele 02","ትምህርት ቤት አቅራቢያ",11000,1,1,40,"Available","https://images.unsplash.com/photo-1550009158-9ebf6d61a00a?auto=format&fit=crop&q=80"],
      [21,1,"ለሞባይል ጥገና አነስተኛ ሱቅ","በአውቶቡስ ተራ ውስጥ ለሞባይል ጥገና እና ቻርጀር ሽያጭ ተስማሚ።","ለኤሌክትሮኒክስ እና ፎቶ ቤት","Injibara","Injibara","Bus Station","አውቶቡስ ተራ",4500,1,1,15,"Available","https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?auto=format&fit=crop&q=80"],
      [22,1,"ለፎቶ ስቱዲዮ እና ዲኮር","ለፎቶ ስቱዲዮ እና ቪዲዮ ኤዲቲንግ ተስማሚ ዝግ ያለ ቦታ።","ለኤሌክትሮኒክስ እና ፎቶ ቤት","Injibara","Injibara","Kebele 03","ዋና መንገድ",8500,2,1,45,"Available","https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80"],
      [23,1,"ለትላልቅ የኤሌክትሮኒክስ እቃዎች","ለፍሪጅ፣ ቲቪ፣ እና የቤት እቃዎች ማሳያ የሚሆን ትልቅ መጋዘን መሰል ሱቅ።","ለኤሌክትሮኒክስ እና ፎቶ ቤት","Injibara","Injibara","Kebele 01","መውጫ መንገድ",20000,2,1,120,"Available","https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&q=80"],
      [24,1,"ለጌም ዞን (Playstation)","ለፕሌይስቴሽን እና የጌም ዞን አገልግሎት ተስማሚ ሰፊ ክፍል በተማሪዎች ሰፈር።","ለኤሌክትሮኒክስ እና ፎቶ ቤት","Injibara","Injibara","University Area","ዩኒቨርሲቲ መንገድ",13000,1,1,70,"Available","https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80"],
      [25,1,"በአግኒ ሆስፒታል አቅራቢያ ለፋርማሲ/ክሊኒክ","ከአግኒ ሆስፒታል አቅራቢያ የሚገኝ ለፋርማሲ፣ ላቦራቶሪ ወይም ለጤና ክሊኒክ ተስማሚ ቦታ።","ለፋርማሲ እና ክሊኒክ","Injibara","Injibara","Hospital Area","ሆስፒታል መንገድ",16000,3,2,110,"Available","https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&q=80"],
      [26,1,"ለጥርስ ህክምና ክሊኒክ","ሁለት ሰፊ ክፍሎች ያሉትና ውሃ የገባበት ለጥርስ ህክምና ተስማሚ።","ለፋርማሲ እና ክሊኒክ","Injibara","Injibara","Kebele 02","መሐል ከተማ",14000,2,1,65,"Available","https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&q=80"],
      [27,1,"በገበያ አጠገብ ለፋርማሲ","ብዙ ሰው በሚተላለፍበት ቦታ ለፋርማሲ ሽያጭ ተስማሚ የሆነ ሱቅ።","ለፋርማሲ እና ክሊኒክ","Injibara","Injibara","Market Area","ገበያ አቅራቢያ",18000,1,1,40,"Available","https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&q=80"],
      [28,1,"ለትልቅ የህክምና ማዕከል","5 ክፍሎች ያሉት፣ ለህፃናትና እናቶች የህክምና ማዕከል የሚሆን ሙሉ ቤት።","ለፋርማሲ እና ክሊኒክ","Injibara","Injibara","Kebele 01","ዋና መንገድ ዳር",35000,5,3,250,"Available","https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80"],
      [29,1,"ለዓይን ህክምና እና መነፅር ሽያጭ","ንጹህና ብርሃን ያለው ሱቅ፣ ለዓይን ምርመራ እና መነፅር ሽያጭ።","ለፋርማሲ እና ክሊኒክ","Injibara","Injibara","Kebele 03","በመንገድ ዳር",12000,1,1,45,"Available","https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&q=80"],
      [30,1,"ለላቦራቶሪ አገልግሎት","የተለየ የውሃ መስመርና የፍሳሽ ማስወገጃ ያለው ለላቦራቶሪ ምርመራ።","ለፋርማሲ እና ክሊኒክ","Injibara","Injibara","Hospital Area","ከሆስፒታል አጠገብ",10000,2,1,55,"Available","https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80"],
      [31,1,"ለባንክ ወይም ኢንሹራንስ ቅርንጫፍ","ለፋይናንስ ተቋማት የሚሆን እጅግ ሰፊና ዘመናዊ መሬት ላይ ያለ አዳራሽ።","ሌሎች የንግድና የአገልግሎት ቦታዎች","Injibara","Injibara","Kebele 01","አስፋልት ዳር",45000,4,3,350,"Available","https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80"],
      [32,1,"ለስብሰባ አዳራሽ ወይም ጂም","ወለሉ ሙሉ ለሙሉ የተሰራ ለስፖርት ጂም ወይም ለስብሰባ አዳራሽ።","ሌሎች የንግድና የአገልግሎት ቦታዎች","Injibara","Injibara","Kebele 02","ስታዲየም አካባቢ",28000,1,2,200,"Available","https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80"],
      [33,1,"ለቢሮ (ለጠበቃ ወይም አነስተኛ ድርጅት)","2 ክፍል ያለው ጸጥ ያለ ቦታ ለቢሮ አገልግሎት ተስማሚ።","ሌሎች የንግድና የአገልግሎት ቦታዎች","Injibara","Injibara","Kebele 01","ፍርድ ቤት አካባቢ",8000,2,1,50,"Available","https://images.unsplash.com/photo-1497215898141-866891ebf622?auto=format&fit=crop&q=80"],
      [34,1,"ለጋራዥ እና መኪና እጥበት","ሰፊ ክፍት ቦታ ከውሃ ጉድጓድ ጋር ለመኪና እጥበት ወይም ጋራዥ።","ሌሎች የንግድና የአገልግሎት ቦታዎች","Injibara","Injibara","Zuria","መውጫ መንገድ",18000,1,1,400,"Available","https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&q=80"],
      [35,1,"ለውበት ሳሎን እና ስፓ","ለሴቶች ውበት ሳሎን ውሃና መብራት የተሟላለት ዘመናዊ ሱቅ።","ሌሎች የንግድና የአገልግሎት ቦታዎች","Injibara","Injibara","Kebele 03","መሐል ሰፈር",11000,1,1,40,"Available","https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80"],
      [36,1,"ለትምህርት ቤት ወይም ኪንደርጋርደን","ትልቅ መጫወቻ ሜዳ እና 8 ክፍሎች ያሉት ለቅድመ መደበኛ ትምህርት ቤት።","ሌሎች የንግድና የአገልግሎት ቦታዎች","Injibara","Injibara","Kebele 02","ሰላማዊ ሰፈር",50000,8,4,600,"Available","https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80"]
    ];

    for (const h of houses) {
      await connection.query("INSERT OR IGNORE INTO houses (house_id, owner_id, title, description, type, region, city, sub_city, address, price, rooms, bathrooms, square_meter, status, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", h);
    }

    await connection.query("INSERT OR IGNORE INTO rental_requests (request_id, tenant_id, house_id, status) VALUES (?, ?, ?, ?)", [1, 3, 1, "Pending"]);
    await connection.query("INSERT OR IGNORE INTO rental_requests (request_id, tenant_id, house_id, status) VALUES (?, ?, ?, ?)", [2, 3, 2, "Approved"]);
  } catch (err) {
    console.error('Error seeding initial data:', err);
  }
}

