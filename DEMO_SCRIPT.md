# MediCore — 3–5 Minute Internship Demonstration Script

This script guides the presenter through an end-to-end technical demonstration of MediCore for internship evaluators and technical interviewers.

---

## Timing Overview (Total: 4 Minutes 30 Seconds)

| Time | Section | Screen / Tool |
| :--- | :--- | :--- |
| **0:00 – 0:30** | 1. Project Introduction & Problem Statement | Presentation Slide or Architecture Diagram |
| **0:30 – 1:30** | 2. Working Application & POS Checkout | Browser (`http://15.135.82.107/`) |
| **1:30 – 2:15** | 3. Backend Architecture & API Capabilities | VS Code / Swagger UI |
| **2:15 – 3:00** | 4. Docker Containerization & Multi-Stage Builds | Terminal (`docker compose ps`) |
| **3:00 – 3:30** | 5. GitHub Actions CI/CD Pipeline | GitHub Actions Web Interface |
| **3:30 – 4:00** | 6. AWS Cloud Deployment & Health Probes | Browser (`/actuator/health`) & AWS Console |
| **4:00 – 4:30** | 7. Operations, Automated Backups & Sign-off | Terminal (`scripts/backup.sh`) |

---

## Detailed Speaking Script

### 1. Project Introduction (0:00 – 0:30)
> *"Hello, my name is Sunil Sharma. Today I am presenting MediCore, a cloud-native Smart Pharmacy Management Platform engineered with Java 21, Spring Boot 3.3.5, React 18, and PostgreSQL 16.*
> *Traditional pharmacies struggle with stockouts, accidental sales of expired medications, and fragmented supplier ordering. MediCore addresses these challenges with real-time POS billing, batch-level expiry validation, automated inventory tracking, and full cloud containerization."*

### 2. Live Application Walkthrough (0:30 – 1:30)
> *"Let's examine the live deployment running on our AWS EC2 instance at `15.135.82.107`.*
> *Here on the login screen, we have role-based access control supporting Administrators, Pharmacists, and Cashiers.*
> *I will sign in as our Lead Pharmacist, Priya Patel. Upon authentication, a secure JWT token is issued, and we are redirected to the Pharmacist Dashboard.*
> *Notice our live inventory metrics: 23 medicines in catalog, live low-stock alerts, and recent sales trends.*
> *Now, let's open the Point-of-Sale terminal. Notice our safety rules in action: if a medicine batch is expired or stock is insufficient, the system enforces pre-validation and rejects the transaction. When an order completes, stock is atomically decremented, a printable invoice is generated, and an auditable inventory transaction is logged."*

### 3. Backend Architecture & REST APIs (1:30 – 2:15)
> *"Looking at the backend codebase in Java 21, we have built a layered architecture:*
> *Controllers expose clean REST endpoints for medicines, inventory, purchases, and sales.*
> *In `SaleService`, we implemented a 2-Phase atomic checkout with pessimistic write locking on `MedicineRepository` to prevent concurrent POS transactions from overselling the same batch.*
> *Database schema evolution is managed by Flyway migrations from V1 through V4, guaranteeing idempotent migrations across all environments."*

### 4. Docker Containerization (2:15 – 3:00)
> *"For containerization, both frontend and backend use multi-stage Dockerfiles:*
> *The backend builds with Maven on Eclipse Temurin 21 and runs as an unprivileged, non-root `medicore` user inside an Alpine JRE.*
> *The frontend compiles with Vite and is served by an optimized Nginx 1.27 Alpine web server with gzip compression and reverse proxy routing for `/api/` and `/actuator/`.*
> *Running `docker compose ps` shows our 3 services—PostgreSQL 16, backend, and frontend—all running with configured health checks and persistent volume storage."*

### 5. GitHub Actions CI/CD (3:00 – 3:30)
> *"In our GitHub repository, our automated Continuous Integration workflow triggers on every push to `main`.*
> *The CI pipeline builds the Spring Boot application, executes all 40 automated unit and integration tests with 100% pass rate, and verifies the production React Vite bundle, archiving test artifacts."*

### 6. AWS Deployment & Health Monitoring (3:30 – 4:00)
> *"In the cloud, MediCore is deployed on AWS EC2 (`t3.micro`) in the Sydney `ap-southeast-2` Region.*
> *Querying our live actuator health endpoint at `/actuator/health` returns `status: UP`, verifying active connectivity to the PostgreSQL database.*
> *Security groups strictly close port 22, and all administrative access is secured through AWS Systems Manager."*

### 7. Backup, Recovery & Wrap-Up (4:00 – 4:30)
> *"Finally, operational reliability is maintained through automated scripts in the `scripts/` directory:*
> *Running `scripts/backup.sh` performs an automated `pg_dump`, gzip compression, and encrypted AES-256 backup.*
> *In the event of a faulty release, `scripts/rollback.sh` enables zero-downtime rollback to the previous version tag.*
> *Thank you for your time and evaluation."*

