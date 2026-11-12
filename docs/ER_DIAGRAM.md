# MediCore – Relational Database Design & ER Diagram

## 1. Database Entity-Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ SALES : "processed by"
    USERS {
        bigint id PK
        varchar username UK
        varchar email UK
        varchar password_hash
        varchar full_name
        varchar phone
        varchar role
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    MEDICINE_CATEGORIES ||--o{ MEDICINES : "categorizes"
    MEDICINE_CATEGORIES {
        bigint id PK
        varchar name UK
        text description
        timestamp created_at
    }

    SUPPLIERS ||--o{ MEDICINES : "supplies"
    SUPPLIERS ||--o{ PURCHASE_ORDERS : "receives order"
    SUPPLIERS {
        bigint id PK
        varchar name
        varchar company_name
        varchar contact_person
        varchar email
        varchar phone
        text address
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    MEDICINES ||--o{ INVENTORY_TRANSACTIONS : "tracks history"
    MEDICINES ||--o{ PURCHASE_ORDER_ITEMS : "ordered in"
    MEDICINES ||--o{ SALE_ITEMS : "sold in"
    MEDICINES {
        bigint id PK
        varchar name
        varchar generic_name
        varchar brand
        bigint category_id FK
        varchar manufacturer
        varchar batch_number
        varchar barcode UK
        numeric purchase_price
        numeric selling_price
        integer available_quantity
        integer minimum_stock
        date manufacturing_date
        date expiry_date
        bigint supplier_id FK
        text description
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    CUSTOMERS ||--o{ SALES : "places"
    CUSTOMERS {
        bigint id PK
        varchar name
        varchar phone UK
        varchar email
        text address
        numeric total_purchases
        timestamp created_at
        timestamp updated_at
    }

    PURCHASE_ORDERS ||--|{ PURCHASE_ORDER_ITEMS : "contains"
    PURCHASE_ORDERS {
        bigint id PK
        varchar order_number UK
        bigint supplier_id FK
        date order_date
        date expected_date
        date received_date
        varchar status
        numeric total_amount
        text notes
        varchar created_by
        timestamp created_at
        timestamp updated_at
    }

    PURCHASE_ORDER_ITEMS {
        bigint id PK
        bigint purchase_order_id FK
        bigint medicine_id FK
        integer quantity
        numeric unit_cost
        numeric subtotal
    }

    SALES ||--|{ SALE_ITEMS : "contains"
    SALES {
        bigint id PK
        varchar invoice_number UK
        bigint customer_id FK
        varchar customer_name
        timestamp sale_date
        numeric subtotal
        numeric discount_percent
        numeric discount_amount
        numeric tax_percent
        numeric tax_amount
        numeric total_amount
        varchar payment_method
        varchar status
        bigint pharmacist_id FK
        text notes
        timestamp created_at
    }

    SALE_ITEMS {
        bigint id PK
        bigint sale_id FK
        bigint medicine_id FK
        varchar medicine_name
        integer quantity
        numeric unit_price
        numeric subtotal
    }

    INVENTORY_TRANSACTIONS {
        bigint id PK
        bigint medicine_id FK
        varchar transaction_type
        integer quantity
        integer previous_stock
        integer new_stock
        varchar reference_id
        text reason
        varchar performed_by
        timestamp created_at
    }

    NOTIFICATIONS {
        bigint id PK
        varchar title
        text message
        varchar type
        boolean is_read
        varchar reference_id
        timestamp created_at
    }
```

---

## 2. Table Specifications & Indexes

| Table Name | Primary Key | Foreign Keys | Key Indexes | Purpose |
|------------|-------------|--------------|-------------|---------|
| `users` | `id` | None | `username` (UK), `email` (UK) | Pharmacist & Admin authentication |
| `medicine_categories` | `id` | None | `name` (UK) | Drug classifications |
| `suppliers` | `id` | None | `phone` | Pharmaceutical vendor directory |
| `medicines` | `id` | `category_id`, `supplier_id` | `name`, `generic_name`, `expiry_date`, `available_quantity`, `barcode` (UK) | Core medicine inventory catalog |
| `customers` | `id` | None | `phone` (UK) | Patient & customer profiles |
| `inventory_transactions` | `id` | `medicine_id` | `medicine_id`, `created_at` | Audit ledger for all stock adjustments & sales |
| `purchase_orders` | `id` | `supplier_id` | `order_number` (UK), `status`, `supplier_id` | Vendor procurement orders |
| `purchase_order_items` | `id` | `purchase_order_id`, `medicine_id` | `purchase_order_id` | PO line items |
| `sales` | `id` | `customer_id`, `pharmacist_id` | `invoice_number` (UK), `sale_date` | Retail POS invoices |
| `sale_items` | `id` | `sale_id`, `medicine_id` | `sale_id`, `medicine_id` | Itemized invoice records |
| `notifications` | `id` | None | `is_read`, `created_at` | System & inventory alerts |

---

## 3. Database Integrity & Constraints

1. **Non-Negative Quantity**: `available_quantity >= 0` check constraint guarantees that concurrent POS checkouts cannot reduce inventory below zero.
2. **Flyway Migrations**:
   - `V1__init_schema.sql`: Strictly typed schema definition with proper relational constraints.
   - `V2__seed_initial_data.sql`: Dynamic seed data utilizing `CURRENT_DATE` so live alert badges, low stock warnings, and expiring lot trackers are always active during live evaluation.
3. **Transaction Isolation**: Service methods handling sales and PO receiving are decorated with `@Transactional`, guaranteeing ACID compliance across stock decrements and invoice creation.
