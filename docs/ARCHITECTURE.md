# MediCore – System Architecture & Technical Design

## 1. Executive Architecture Overview

**MediCore** is an enterprise-grade Smart Pharmacy Management SaaS platform engineered with a decoupled multi-tier architecture. It delivers real-time inventory lot tracking, Point of Sale (POS) checkout, automated supplier procurement reconciliation, and clinical expiry tracking.

```mermaid
flowchart TD
    Client["Clients: Web Browsers / POS Terminals / Mobile"] -->|"HTTPS / TLS (Port 443/80)"| Nginx["Nginx Reverse Proxy & Static SPA Server"]
    
    subgraph Frontend Tier ["Frontend Tier (Docker Container)"]
        Nginx -->|"Static Routing"| ReactApp["React 18 + Vite + Tailwind CSS"]
    end

    subgraph Backend Tier ["Backend Tier (Docker Container)"]
        Nginx -->|"API Proxy (/api/*)"| SpringBoot["Spring Boot 3.3.5 (Java 21)"]
        SpringBoot --> Security["Spring Security 6 (JWT Filter)"]
        Security --> Controllers["REST API Controllers"]
        Controllers --> Services["Business Service Layer (Transactional)"]
        Services --> Repositories["Spring Data JPA & Hibernate"]
    end

    subgraph Data Tier ["Data Tier (Docker Container / RDS)"]
        Repositories -->|"JDBC Connection Pool (HikariCP)"| Postgres["PostgreSQL 16 (Flyway Migrations)"]
    end

    subgraph Observability ["Observability & Cloud Services"]
        SpringBoot -->|"Health & Metrics (/actuator)"| CloudWatch["AWS CloudWatch / System Health"]
    end
```

---

## 2. Layered Backend Architecture

The backend strictly follows the **Controller &rarr; Service &rarr; Repository &rarr; Database** pattern:

1. **Controller Layer (`com.medicore.controller`)**:
   - Exposes RESTful endpoints conforming to HTTP conventions (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`).
   - Validates incoming request payloads using Jakarta Bean Validation (`@Valid`, `@NotNull`, `@Min`, `@DecimalMin`).
   - Translates domain exceptions into structured JSON responses through `GlobalExceptionHandler`.
   - Documents all endpoints via OpenAPI 3 / Swagger (`@Tag`, `@Operation`).

2. **Service Layer (`com.medicore.service`)**:
   - Encapsulates core business rules (e.g., preventing negative inventory, preventing sale of expired medicines, transactional multi-table updates).
   - Manages database transaction boundaries with `@Transactional` (ensuring atomic updates for inventory adjustments and billing).
   - Maps database entities to DTOs to avoid leaking persistence internals to clients.

3. **Repository Layer (`com.medicore.repository`)**:
   - Extends Spring Data `JpaRepository` for type-safe queries and pagination.
   - Leverages JPQL queries with aggregation (`SUM`, `COUNT`, `GROUP BY`) for live KPI statistics and reporting without hardcoded values.

4. **Security Filter Chain (`com.medicore.security`)**:
   - Stateless JWT Bearer token authentication via `AuthTokenFilter`.
   - Token creation and cryptographic verification using HMAC-SHA256 (`jjwt` 0.12.6).
   - Role-Based Access Control (`ADMIN`, `PHARMACIST`).

---

## 3. Sequence Workflows

### 3.1 Point of Sale (POS) Checkout Transaction

```mermaid
sequenceDiagram
    autonumber
    actor Pharmacist
    participant UI as React POS Terminal
    participant Controller as SaleController
    participant Service as SaleService
    participant MedRepo as MedicineRepository
    participant SaleRepo as SaleRepository
    participant InvRepo as InventoryTransactionRepo
    participant DB as PostgreSQL

    Pharmacist->>UI: Scan Barcode / Add Items to Cart
    Pharmacist->>UI: Select Payment Method (Cash/Card/UPI) & Checkout
    UI->>Controller: POST /api/sales (SaleRequestDto)
    Controller->>Service: processSale(SaleRequestDto)
    
    critical Database Transaction
        loop For Each Cart Item
            Service->>MedRepo: findById(medicineId)
            MedRepo->>DB: SELECT * FROM medicines WHERE id = ?
            Service->>Service: Verify Not Expired (expiryDate >= today)
            Service->>Service: Verify Available Stock >= Requested Qty
            Service->>MedRepo: Decrement availableQuantity
            MedRepo->>DB: UPDATE medicines SET available_quantity = ?
            Service->>InvRepo: Log Transaction (Type: SALE, -Qty)
            InvRepo->>DB: INSERT INTO inventory_transactions ...
        end
        Service->>SaleRepo: Save Sale & SaleItems
        SaleRepo->>DB: INSERT INTO sales & sale_items ...
    end
    
    Service->>Controller: Return InvoiceDto
    Controller->>UI: 200 OK (Tax Invoice JSON)
    UI->>Pharmacist: Display Printable Tax Invoice Modal
```

### 3.2 Purchase Order Receipt & Inventory Reconciliation

```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant UI as Purchases View
    participant Service as PurchaseService
    participant POItemRepo as PurchaseOrderItemRepo
    participant MedRepo as MedicineRepository
    participant DB as PostgreSQL

    Admin->>UI: Click "Receive Stock" on PO-2026-001
    UI->>Service: PATCH /api/purchases/{id}/status (status: RECEIVED)
    
    critical Atomic Stock Increment
        Service->>Service: Verify PO is not already RECEIVED
        Service->>POItemRepo: Get Line Items for PO
        loop For Each PO Item
            Service->>MedRepo: Increment availableQuantity (+item.quantity)
            MedRepo->>DB: UPDATE medicines SET available_quantity = ...
            Service->>DB: INSERT INTO inventory_transactions (Type: PURCHASE_RECEIVE)
        end
        Service->>DB: UPDATE purchase_orders SET status = 'RECEIVED', received_date = CURRENT_DATE
    end
    
    Service->>UI: Status Updated (Stock incremented in real time)
    UI->>Admin: Success Notification & Updated Inventory
```

---

## 4. Docker Network Topology

```
+-------------------------------------------------------------+
|                     Docker Host (EC2)                       |
|                                                             |
|   +-------------------+              +------------------+   |
|   |                   |   :8080      |                  |   |
|   | medicore-frontend |------------->| medicore-backend |   |
|   |  (Nginx + SPA)    |   (proxy)    | (Spring Boot 3)  |   |
|   +-------------------+              +------------------+   |
|             |                                 |             |
|             | :80 (Public)                    | :5432       |
|             v                                 v             |
|      Internet Clients               +-------------------+   |
|                                     | medicore-postgres |   |
|                                     |  (PostgreSQL 16)  |   |
|                                     +-------------------+   |
|                                               |             |
|                                               v             |
|                                        Persistent Volume    |
|                                       (/var/lib/postgresql) |
+-------------------------------------------------------------+
```

1. **Frontend Container**: Exposed on Port 80 (and 443 with SSL). Serves pre-compiled Vite production static bundles, applies gzip compression, and reverse proxies `/api/*` to the backend container over internal Docker DNS (`http://backend:8080`).
2. **Backend Container**: Listens on Port 8080 internally. Communicates with PostgreSQL on port 5432. Runs health checks via Spring Boot Actuator (`/actuator/health`).
3. **Database Container**: Isolated inside `medicore-prod-net` bridge network. Port 5432 is not exposed to the public Internet for maximum security. Data is persisted to host directory `/var/lib/medicore/pgdata`.

---

## 5. Automated CI/CD & Deployment Architecture

```mermaid
flowchart TD
    GitPush["git push origin main"] --> CIGate["GitHub Actions: ci-gate"]
    
    subgraph CI ["Continuous Integration (ci.yml)"]
        BackendTest["Backend CI: JDK 21 / Maven test"]
        FrontendBuild["Frontend CI: Node 22 / Vite build"]
    end
    
    CIGate --> BackendTest
    CIGate --> FrontendBuild
    
    BackendTest & FrontendBuild --> ECRJob["Job: build-and-push-ecr"]
    
    subgraph ECR ["Amazon ECR Publish"]
        OIDCAuth["Authenticate to AWS (OIDC or IAM Credentials)"]
        BuildBackend["Build medicore-backend:SHA"]
        BuildFrontend["Build medicore-frontend:SHA"]
        PushBackend["Push to ECR: backend:SHA & :latest"]
        PushFrontend["Push to ECR: frontend:SHA & :latest"]
    end
    
    ECRJob --> OIDCAuth --> BuildBackend & BuildFrontend --> PushBackend & PushFrontend
    
    PushBackend & PushFrontend --> DeployJob["Job: deploy-to-ec2"]
    
    subgraph SSMDeploy ["AWS Systems Manager Deployment (Zero Open SSH Ports)"]
        SSMDispatch["aws ssm send-command to i-0be536c99a4381e25"]
        EC2Pull["EC2 pulls immutable SHA-tagged images"]
        EnvPreserve["Preserve existing production .env & Postgres data volume"]
        ComposeUp["docker compose up -d (backend & frontend)"]
        HealthProbe["Probe /actuator/health and http://localhost:80/"]
        AutoRollback["If health check fails: Revert to previous_version.txt tag"]
    end
    
    DeployJob --> SSMDispatch --> EC2Pull --> EnvPreserve --> ComposeUp --> HealthProbe
    HealthProbe -->|"Healthy (200 OK)"| LiveDeployment["Production Active (15.135.82.107)"]
    HealthProbe -.->|"Failed"| AutoRollback
```

### Key Architectural Strengths
1. **Zero Open SSH Ports**: Deployment executes over AWS Systems Manager (SSM) agent's outbound secure channel. Port 22 is never exposed to dynamic GitHub runner IP addresses.
2. **Secrets Protection**: Existing production database passwords and JWT secrets on the EC2 host are preserved across updates, preventing configuration drift or accidental overwrites.
3. **Immutable Tagging**: Images are pinned to their short Git commit SHA, preventing tag collision and enabling instantaneous rollback to `previous_version.txt`.
4. **Data Durability**: PostgreSQL storage is bound to `/var/lib/medicore/pgdata` on the host, ensuring database persistence is completely independent of container lifecycles.


