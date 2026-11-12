# MediCore – System Architecture & Technical Design

**Project:** MediCore – Smart Pharmacy Management Platform  
**Target Cloud:** Amazon Web Services (AWS) | Selected Region: `ap-southeast-2`  
**Architecture Style:** Decoupled Full-Stack SaaS (React SPA + Spring Boot Modular Monolith + PostgreSQL)  
**Status:** PRODUCTION ACTIVE  
**Date:** November 2026  

---

## 1. Executive System Architecture

```mermaid
flowchart TD
    Client["Clients: Web Browsers / POS Terminals / Mobile"] -->|"HTTP Port 80 (TLS Ready)"| Nginx["Nginx Reverse Proxy & Static SPA Server"]
    
    subgraph Frontend Tier ["Frontend Tier (medicore-prod-frontend)"]
        Nginx -->|"Static Routing"| ReactApp["React 18 + Vite + Tailwind CSS"]
    end

    subgraph Backend Tier ["Backend Tier (medicore-prod-backend)"]
        Nginx -->|"API Proxy (/api/*)"| SpringBoot["Spring Boot 3.3.5 (Java 21 LTS)"]
        SpringBoot --> Security["Spring Security 6 (Stateless JWT Filter)"]
        Security --> RBAC["3-Tier RBAC (ADMIN, PHARMACIST, CASHIER)"]
        RBAC --> Controllers["REST API Controllers (OpenAPI 3)"]
        Controllers --> Services["Business Service Layer (@Transactional)"]
        Services --> Repositories["Spring Data JPA & Hibernate 6"]
    end

    subgraph Data Tier ["Data Tier (medicore-prod-postgres)"]
        Repositories -->|"HikariCP JDBC Connection Pool"| Postgres["PostgreSQL 16 Alpine (Flyway Migrations)"]
    end

    subgraph Host Infrastructure ["AWS EC2 Host (Ubuntu 24.04 LTS)"]
        DockerEngine["Docker Engine & Compose Runtime"]
        SwapMemory["2.0 GB SSD Swap Space (/swapfile)"]
        BackupCron["Automated Nightly Backup Cron (02:00 UTC)"]
        LogRotate["Docker Daemon Log Rotation (30MB Cap)"]
    end

    subgraph Cloud Management ["AWS Cloud Services (ap-southeast-2)"]
        ECR["Amazon ECR (medicore-backend & medicore-frontend)"]
        SSM["AWS Systems Manager (Zero Inbound SSH Required)"]
        IAM["IAM Profile: medicore-ec2-profile"]
        S3["Amazon S3: medicore-backups-774697186763 (SSE-KMS)"]
    end

    SpringBoot -.->|"Pull Images"| ECR
    SSM -.->|"Remote Management & CD"| Host Infrastructure
    BackupCron -.->|"Encrypted Replication"| S3
```

---

## 2. Layered Software Architecture

1. **Presentation Tier (React 18 SPA):**
   - Built with Vite, Tailwind CSS, Lucide React, and Recharts.
   - Client-side routing managed via React Router v6 with `ProtectedRoute` guards.
   - Role-aware sidebar navigation automatically hides administrative links from unprivileged cashiers.
   - Axios client with Bearer token injection and automatic 401 redirect interceptor.

2. **Application Tier (Java 21 / Spring Boot 3.3.5):**
   - **Controller Layer:** Conforms to RESTful standards, validates DTO inputs with Bean Validation (`@Valid`), and maps responses into standardized `ApiResponse<T>` envelopes.
   - **Security Filter Chain:** Custom `AuthTokenFilter` validates stateless HMAC-SHA256 JWT tokens. Method security (`@EnableMethodSecurity`) enforces granular `@PreAuthorize` guards on sensitive business mutations.
   - **Service Layer:** Encapsulates business validation (e.g. non-negative inventory, expiry date checks, single-use password reset tokens) inside transactional boundaries (`@Transactional`).
   - **Repository Layer:** Spring Data JPA with type-safe query derivation and server-side pagination (`Pageable`).

3. **Persistence Tier (PostgreSQL 16 Alpine):**
   - Schema versioning managed via Flyway (`V1__init_schema.sql`, `V2__seed_initial_data.sql`, `V3__add_cashier_and_password_reset_tokens.sql`).
   - Hard database constraints: `CHECK (available_quantity >= 0)` and `CHECK (minimum_stock >= 0)`.
   - Host SSD volume mapping at `/var/lib/medicore/pgdata` ensures zero data loss across container lifecycle events.

4. **Cloud Infrastructure & DevOps Tier:**
   - AWS EC2 `t3.micro` instance in Sydney (`ap-southeast-2`).
   - Security group ingress restricted strictly to ports 80, 443, and admin SSH (`128.185.168.197/32`).
   - Container images versioned with Git commit SHAs and published to Amazon ECR.
   - Zero-downtime deployments dispatched via AWS Systems Manager without open SSH ports.
