-- MediCore Database Schema Migration V1
-- Clean Relational Architecture for Pharmacy Management Platform

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    role VARCHAR(30) NOT NULL DEFAULT 'PHARMACIST',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Medicine Categories Table
CREATE TABLE IF NOT EXISTS medicine_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    company_name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(150),
    phone VARCHAR(30) NOT NULL,
    address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Medicines Table
CREATE TABLE IF NOT EXISTS medicines (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    generic_name VARCHAR(200) NOT NULL,
    brand VARCHAR(150),
    category_id BIGINT REFERENCES medicine_categories(id) ON DELETE SET NULL,
    manufacturer VARCHAR(150),
    batch_number VARCHAR(100) NOT NULL,
    barcode VARCHAR(100) UNIQUE,
    purchase_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    selling_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    available_quantity INTEGER NOT NULL DEFAULT 0 CHECK (available_quantity >= 0),
    minimum_stock INTEGER NOT NULL DEFAULT 10 CHECK (minimum_stock >= 0),
    manufacturing_date DATE,
    expiry_date DATE NOT NULL,
    supplier_id BIGINT REFERENCES suppliers(id) ON DELETE SET NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes on Medicines
CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(name);
CREATE INDEX IF NOT EXISTS idx_medicines_generic ON medicines(generic_name);
CREATE INDEX IF NOT EXISTS idx_medicines_category ON medicines(category_id);
CREATE INDEX IF NOT EXISTS idx_medicines_expiry ON medicines(expiry_date);
CREATE INDEX IF NOT EXISTS idx_medicines_quantity ON medicines(available_quantity);
CREATE INDEX IF NOT EXISTS idx_medicines_barcode ON medicines(barcode);

-- 5. Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NOT NULL UNIQUE,
    email VARCHAR(150),
    address TEXT,
    total_purchases NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- 6. Inventory Transactions Table
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id BIGSERIAL PRIMARY KEY,
    medicine_id BIGINT NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL, -- STOCK_IN, STOCK_OUT, ADJUSTMENT, SALE, PURCHASE_RECEIVE
    quantity INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    reference_id VARCHAR(100),
    reason TEXT,
    performed_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inv_trans_medicine ON inventory_transactions(medicine_id);
CREATE INDEX IF NOT EXISTS idx_inv_trans_created ON inventory_transactions(created_at);

-- 7. Purchase Orders Table
CREATE TABLE IF NOT EXISTS purchase_orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    supplier_id BIGINT NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    order_date DATE NOT NULL,
    expected_date DATE,
    received_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, RECEIVED, CANCELLED
    total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_po_supplier ON purchase_orders(supplier_id);

-- 8. Purchase Order Items Table
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id BIGSERIAL PRIMARY KEY,
    purchase_order_id BIGINT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    medicine_id BIGINT NOT NULL REFERENCES medicines(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_cost NUMERIC(12, 2) NOT NULL CHECK (unit_cost >= 0),
    subtotal NUMERIC(14, 2) NOT NULL CHECK (subtotal >= 0)
);

CREATE INDEX IF NOT EXISTS idx_poi_order ON purchase_order_items(purchase_order_id);

-- 9. Sales Table
CREATE TABLE IF NOT EXISTS sales (
    id BIGSERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(150),
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tax_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(30) NOT NULL DEFAULT 'CASH', -- CASH, CARD, UPI
    status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED', -- COMPLETED, CANCELLED
    pharmacist_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_number);

-- 10. Sale Items Table
CREATE TABLE IF NOT EXISTS sale_items (
    id BIGSERIAL PRIMARY KEY,
    sale_id BIGINT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    medicine_id BIGINT NOT NULL REFERENCES medicines(id) ON DELETE RESTRICT,
    medicine_name VARCHAR(200) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    subtotal NUMERIC(14, 2) NOT NULL CHECK (subtotal >= 0)
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_medicine ON sale_items(medicine_id);

-- 11. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- LOW_STOCK, EXPIRY_WARNING, EXPIRED, PURCHASE_ORDER, SALE_COMPLETED, SYSTEM
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    reference_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);

