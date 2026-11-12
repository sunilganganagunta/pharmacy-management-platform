-- MediCore Database Seed Data Migration V2
-- Realistic Seed Data for Smart Pharmacy Management Platform

-- 1. Insert Default Roles & Users
-- Passwords:
-- admin@medicore.com -> Admin@123 ($2a$10$eACCYoNOHEqgkHgDEQdWcuKkV1.aK7sN7bY9r7pfxP1tYjS1W1H4G)
-- pharmacist@medicore.com -> Pharmacist@123 ($2a$10$eACCYoNOHEqgkHgDEQdWcuKkV1.aK7sN7bY9r7pfxP1tYjS1W1H4G)
INSERT INTO users (username, email, password_hash, full_name, phone, role, is_active)
VALUES 
('admin', 'admin@medicore.com', '$2a$10$eACCYoNOHEqgkHgDEQdWcuKkV1.aK7sN7bY9r7pfxP1tYjS1W1H4G', 'Dr. Sunil Sharma (Admin)', '+91 98765 43210', 'ADMIN', true),
('pharmacist', 'pharmacist@medicore.com', '$2a$10$eACCYoNOHEqgkHgDEQdWcuKkV1.aK7sN7bY9r7pfxP1tYjS1W1H4G', 'Priya Patel (Lead Pharmacist)', '+91 98765 43211', 'PHARMACIST', true)
ON CONFLICT (username) DO NOTHING;

-- 2. Insert Medicine Categories
INSERT INTO medicine_categories (name, description) VALUES
('Antibiotics', 'Broad and narrow spectrum antibacterial medicines'),
('Analgesics & Pain Relief', 'Pain relievers, antipyretics, and anti-inflammatory drugs'),
('Cardiovascular', 'Blood pressure, cardiac, and circulatory medications'),
('Gastrointestinal', 'Antacids, PPIs, anti-diarrheal, and digestive aids'),
('Respiratory', 'Bronchodilators, antihistamines, and cough syrups'),
('Dermatology', 'Topical creams, ointments, and anti-fungal treatments'),
('Vitamins & Supplements', 'Multivitamins, minerals, and dietary supplements'),
('Diabetes Care', 'Insulin, oral hypoglycemics, and test strips')
ON CONFLICT (name) DO NOTHING;

-- 3. Insert Suppliers
INSERT INTO suppliers (name, company_name, contact_person, email, phone, address, is_active) VALUES
('Sun Pharma Dist', 'Sun Pharmaceutical Industries Ltd', 'Rajesh Gupta', 'orders@sunpharma-dist.com', '+91 22 6645 5656', 'Plot 201, MIDC Industrial Area, Mumbai, MH', true),
('Cipla Healthcare Care', 'Cipla Ltd Distribution Network', 'Ananya Verma', 'supply@ciplacare.com', '+91 22 2482 6000', 'Cipla House, Peninsula Business Park, Mumbai, MH', true),
('Dr. Reddy Direct', 'Dr. Reddy Laboratories Logistics', 'Vikram Malhotra', 'logistics@drreddys.com', '+91 40 4900 2900', 'Road No. 3, Banjara Hills, Hyderabad, TS', true),
('Abbott India Supply', 'Abbott India Healthcare Solutions', 'Sneha Kulkarni', 'orders@abbott-dist.com', '+91 22 3816 2000', 'Godrej BKC, Bandra Kurla Complex, Mumbai, MH', true),
('Torrent Pharma Logistics', 'Torrent Pharmaceuticals Ltd', 'Amit Joshi', 'dispatch@torrentpharma.com', '+91 79 2659 9000', 'Torrent House, Off Ashram Road, Ahmedabad, GJ', true);

-- 4. Insert Medicines with Diverse Stock & Expiry Situations
-- (CURRENT_DATE reference ensures expiry alerts and charts are always accurate and active!)
INSERT INTO medicines (name, generic_name, brand, category_id, manufacturer, batch_number, barcode, purchase_price, selling_price, available_quantity, minimum_stock, manufacturing_date, expiry_date, supplier_id, description, is_active) VALUES
-- Normal Stock
('Augmentin 625 Duo', 'Amoxicillin + Clavulanic Acid', 'GlaxoSmithKline', 1, 'GSK Healthcare', 'AUG-2026-01', '890103001001', 145.00, 204.50, 85, 20, CURRENT_DATE - INTERVAL '120 days', CURRENT_DATE + INTERVAL '500 days', 1, 'Broad-spectrum antibiotic tablet for bacterial infections', true),
('Azithral 500mg', 'Azithromycin', 'Alembic Pharmaceuticals', 1, 'Alembic Pharma', 'AZI-2026-92', '890103001002', 88.00, 132.00, 45, 15, CURRENT_DATE - INTERVAL '90 days', CURRENT_DATE + INTERVAL '420 days', 2, 'Macrolide antibiotic for respiratory tract infections', true),
('Dolo 650mg', 'Paracetamol', 'Micro Labs Ltd', 2, 'Micro Labs', 'DOL-2026-44', '890103001003', 18.50, 34.00, 320, 50, CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE + INTERVAL '700 days', 3, 'Fast-acting fever and mild to moderate pain reliever', true),
('Combiflam Tablet', 'Ibuprofen + Paracetamol', 'Sanofi India', 2, 'Sanofi India Ltd', 'CMB-2026-15', '890103001004', 22.00, 42.50, 160, 30, CURRENT_DATE - INTERVAL '100 days', CURRENT_DATE + INTERVAL '550 days', 4, 'Anti-inflammatory analgesic for body ache and fever', true),
('Telma 40mg', 'Telmisartan', 'Glenmark Pharmaceuticals', 3, 'Glenmark', 'TLM-2026-88', '890103001005', 92.00, 148.00, 75, 25, CURRENT_DATE - INTERVAL '150 days', CURRENT_DATE + INTERVAL '600 days', 1, 'Angiotensin receptor blocker for hypertension', true),
('Pan-D Capsule', 'Pantoprazole + Domperidone', 'Alkem Laboratories', 4, 'Alkem Labs', 'PND-2026-33', '890103001006', 110.00, 175.00, 110, 25, CURRENT_DATE - INTERVAL '80 days', CURRENT_DATE + INTERVAL '480 days', 2, 'Proton pump inhibitor with prokinetic for GERD and acidity', true),
('Montair-LC', 'Montelukast + Levocetirizine', 'Cipla Ltd', 5, 'Cipla Ltd', 'MLC-2026-72', '890103001007', 135.00, 215.00, 95, 20, CURRENT_DATE - INTERVAL '40 days', CURRENT_DATE + INTERVAL '650 days', 2, 'Anti-allergic combination for asthma and allergic rhinitis', true),
('Becosules Z', 'B-Complex + Vitamin C + Zinc', 'Pfizer India', 7, 'Pfizer India', 'BCS-2026-11', '890103001008', 35.00, 56.00, 220, 40, CURRENT_DATE - INTERVAL '70 days', CURRENT_DATE + INTERVAL '720 days', 4, 'Daily multivitamin capsule for energy and immunity', true),
('Glycomet GP 1', 'Metformin + Glimepiride', 'USV Private Ltd', 8, 'USV Ltd', 'GLY-2026-55', '890103001009', 70.00, 115.00, 80, 20, CURRENT_DATE - INTERVAL '95 days', CURRENT_DATE + INTERVAL '400 days', 3, 'Oral anti-diabetic medication for Type 2 diabetes', true),

-- Low Stock Alert Medicines (availableQuantity <= minimumStock)
('Ciproglen 500mg', 'Ciprofloxacin', 'Glenmark', 1, 'Glenmark', 'CIP-2026-03', '890103001010', 42.00, 72.00, 5, 25, CURRENT_DATE - INTERVAL '140 days', CURRENT_DATE + INTERVAL '300 days', 5, 'Fluoroquinolone antibiotic for urinary and gastrointestinal infections', true),
('Amlong 5mg', 'Amlodipine', 'Micro Labs', 3, 'Micro Labs', 'AML-2026-19', '890103001011', 28.00, 49.00, 8, 30, CURRENT_DATE - INTERVAL '110 days', CURRENT_DATE + INTERVAL '450 days', 3, 'Calcium channel blocker for blood pressure regulation', true),
('Ascoril LS Syrup', 'Levosalbutamol + Ambroxol + Guaiphenesin', 'Glenmark', 5, 'Glenmark', 'ASC-2026-08', '890103001012', 68.00, 118.00, 4, 15, CURRENT_DATE - INTERVAL '50 days', CURRENT_DATE + INTERVAL '240 days', 5, 'Expectorant cough syrup for productive cough', true),

-- Expiring Soon Medicines (expiry_date within 30 days)
('Cefix 200mg', 'Cefixime', 'Cipla Ltd', 1, 'Cipla Ltd', 'CFX-2025-99', '890103001013', 95.00, 150.00, 18, 15, CURRENT_DATE - INTERVAL '340 days', CURRENT_DATE + INTERVAL '14 days', 2, 'Third generation cephalosporin antibiotic', true),
('Allegra 120mg', 'Fexofenadine', 'Sanofi India', 5, 'Sanofi', 'ALG-2025-41', '890103001014', 125.00, 198.00, 22, 10, CURRENT_DATE - INTERVAL '330 days', CURRENT_DATE + INTERVAL '22 days', 4, 'Non-drowsy antihistamine for seasonal allergy relief', true),

-- Expired Medicines (expiry_date < CURRENT_DATE)
('Amoxil 250mg Suspension', 'Amoxicillin', 'GSK', 1, 'GSK', 'AMX-2024-12', '890103001015', 55.00, 89.00, 12, 10, CURRENT_DATE - INTERVAL '400 days', CURRENT_DATE - INTERVAL '15 days', 1, 'Pediatric oral antibiotic suspension', true);

-- 5. Insert Customers
INSERT INTO customers (name, phone, email, address, total_purchases) VALUES
('Ramesh Chand', '+91 98230 11223', 'ramesh.c@gmail.com', 'Flat 402, Green Valley Apartments, Pune', 1450.00),
('Sunita Sharma', '+91 97110 33445', 'sunita.sharma@yahoo.com', 'B-12, Sector 15, Noida, UP', 890.50),
('Arjun Nair', '+91 99401 55667', 'arjun.nair@outlook.com', '14/A, Indira Nagar, Bangalore, KA', 3240.00),
('Meera Deshmukh', '+91 98902 77889', 'meera.d@rediffmail.com', '78 Shivneri Heights, Shivaji Nagar, Pune', 620.00),
('Kavita Krishnan', '+91 98450 99001', 'kavita.k@gmail.com', 'Flat 503, Skyline Towers, Chennai, TN', 2150.00);

-- 6. Insert Purchase Orders
INSERT INTO purchase_orders (order_number, supplier_id, order_date, expected_date, received_date, status, total_amount, notes, created_by) VALUES
('PO-2026-001', 1, CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '10 days', 'RECEIVED', 14500.00, 'Regular monthly antibiotic replenishment', 'admin'),
('PO-2026-002', 2, CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE - INTERVAL '2 days', 'RECEIVED', 9850.00, 'Respiratory and anti-allergic batch order', 'admin'),
('PO-2026-003', 3, CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '3 days', NULL, 'PENDING', 7600.00, 'Restocking Dolo 650 and Amlodipine urgently', 'admin');

-- 7. Insert Purchase Order Items
INSERT INTO purchase_order_items (purchase_order_id, medicine_id, quantity, unit_cost, subtotal) VALUES
(1, 1, 50, 145.00, 7250.00),
(1, 5, 50, 92.00, 4600.00),
(1, 8, 75, 35.00, 2650.00),
(2, 2, 50, 88.00, 4400.00),
(2, 6, 40, 110.00, 4400.00),
(2, 7, 7, 135.00, 1050.00),
(3, 3, 200, 18.50, 3700.00),
(3, 11, 100, 28.00, 2800.00),
(3, 10, 25, 42.00, 1050.00);

-- 8. Insert Sales
INSERT INTO sales (invoice_number, customer_id, customer_name, sale_date, subtotal, discount_percent, discount_amount, tax_percent, tax_amount, total_amount, payment_method, status, pharmacist_id, notes) VALUES
('INV-2026-0001', 1, 'Ramesh Chand', CURRENT_DATE - INTERVAL '3 days', 545.00, 5.00, 27.25, 12.00, 62.13, 579.88, 'UPI', 'COMPLETED', 2, 'Prescription verified by Dr. Verma'),
('INV-2026-0002', 2, 'Sunita Sharma', CURRENT_DATE - INTERVAL '2 days', 380.00, 0.00, 0.00, 12.00, 45.60, 425.60, 'CARD', 'COMPLETED', 2, 'Monthly maintenance medication'),
('INV-2026-0003', 3, 'Arjun Nair', CURRENT_DATE - INTERVAL '1 days', 840.00, 10.00, 84.00, 12.00, 90.72, 846.72, 'CASH', 'COMPLETED', 2, 'Family healthcare package'),
('INV-2026-0004', 4, 'Meera Deshmukh', CURRENT_DATE, 337.00, 0.00, 0.00, 12.00, 40.44, 377.44, 'UPI', 'COMPLETED', 2, 'OTC pain relief and supplements');

-- 9. Insert Sale Items
INSERT INTO sale_items (sale_id, medicine_id, medicine_name, quantity, unit_price, subtotal) VALUES
(1, 1, 'Augmentin 625 Duo', 2, 204.50, 409.00),
(1, 3, 'Dolo 650mg', 4, 34.00, 136.00),
(2, 5, 'Telma 40mg', 2, 148.00, 296.00),
(2, 4, 'Combiflam Tablet', 2, 42.00, 84.00),
(3, 7, 'Montair-LC', 3, 215.00, 645.00),
(3, 6, 'Pan-D Capsule', 1, 175.00, 175.00),
(3, 8, 'Becosules Z', 2, 56.00, 112.00),
(4, 4, 'Combiflam Tablet', 3, 42.50, 127.50),
(4, 8, 'Becosules Z', 2, 56.00, 112.00),
(4, 9, 'Glycomet GP 1', 1, 115.00, 115.00);

-- 10. Insert Inventory Transactions History
INSERT INTO inventory_transactions (medicine_id, transaction_type, quantity, previous_stock, new_stock, reference_id, reason, performed_by, created_at) VALUES
(1, 'STOCK_IN', 50, 37, 87, 'PO-2026-001', 'Purchase order received', 'admin', CURRENT_DATE - INTERVAL '10 days'),
(1, 'SALE', 2, 87, 85, 'INV-2026-0001', 'Retail pharmacy sale', 'pharmacist', CURRENT_DATE - INTERVAL '3 days'),
(3, 'SALE', 4, 324, 320, 'INV-2026-0001', 'Retail pharmacy sale', 'pharmacist', CURRENT_DATE - INTERVAL '3 days'),
(5, 'STOCK_IN', 50, 27, 77, 'PO-2026-001', 'Purchase order received', 'admin', CURRENT_DATE - INTERVAL '10 days'),
(5, 'SALE', 2, 77, 75, 'INV-2026-0002', 'Retail pharmacy sale', 'pharmacist', CURRENT_DATE - INTERVAL '2 days'),
(10, 'ADJUSTMENT', -5, 10, 5, 'ADJ-2026-01', 'Damaged ampoules discarded', 'admin', CURRENT_DATE - INTERVAL '5 days');

-- 11. Insert System & Inventory Notifications
INSERT INTO notifications (title, message, type, is_read, reference_id, created_at) VALUES
('Critical Low Stock: Ascoril LS Syrup', 'Ascoril LS Syrup has only 4 units remaining (Threshold: 15). Please place a purchase order.', 'LOW_STOCK', false, 'MED-12', CURRENT_DATE - INTERVAL '2 hours'),
('Low Stock Alert: Ciproglen 500mg', 'Ciproglen 500mg inventory is down to 5 units (Minimum threshold is 25).', 'LOW_STOCK', false, 'MED-10', CURRENT_DATE - INTERVAL '5 hours'),
('Medicine Expiring Soon: Cefix 200mg', 'Batch CFX-2025-99 of Cefix 200mg expires in 14 days. Stop reordering and prioritize batch clearance.', 'EXPIRY_WARNING', false, 'MED-13', CURRENT_DATE - INTERVAL '1 day'),
('Expired Stock Warning: Amoxil 250mg', 'Amoxil 250mg Batch AMX-2024-12 has expired. Quarantined from sales automatically.', 'EXPIRED', true, 'MED-15', CURRENT_DATE - INTERVAL '2 days'),
('New Purchase Order Created', 'PO-2026-003 created for Dr. Reddy Direct with total amount ₹7,600.00 (Pending approval).', 'PURCHASE_ORDER', false, 'PO-2026-003', CURRENT_DATE - INTERVAL '2 days'),
('POS Sale Completed', 'Invoice INV-2026-0004 generated successfully for customer Meera Deshmukh (₹377.44).', 'SALE_COMPLETED', true, 'INV-2026-0004', CURRENT_DATE - INTERVAL '1 hour');

