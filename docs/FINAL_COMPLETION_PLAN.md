# MediCore – Master Project Completion Plan (Phase 0 Baseline)

**Project Name:** MediCore – Smart Pharmacy Management Platform  
**Target Environment:** Amazon Web Services (AWS) | Selected Region: `ap-southeast-2`  
**Author:** Cloud Architecture & DevSecOps Engineering Team  
**Evaluation Reference:** Full Production Cloud Readiness, SRE & DevSecOps Audit  
**Date:** November 2026  
**Status:** ACTIVE EXECUTION BASELINE  

---

## 1. Executive Baseline & Audit Summary

Following a comprehensive audit of the full repository (Frontend, Backend, Database, Docker, CI/CD, and AWS infrastructure), the current project state is:

- **Frontend (React 18 / Vite / Tailwind CSS):** Fully functional single-page application with 9 core views (Dashboard, POS, Medicines, Inventory, Purchases, Suppliers, Customers, Reports, Notifications). Builds cleanly (`npm run build` in 11.08s, zero errors).
- **Backend (Spring Boot 3.3.5 / Java 21):** Modular monolith with REST controllers, JPA repositories, Flyway migrations, and JWT security filter. Compiles with Java 21.
- **Database (PostgreSQL 16):** Fully normalized schema with 11 tables and 2 applied Flyway migrations (`V1__init_schema.sql`, `V2__seed_initial_data.sql`). Quantity `CHECK (available_quantity >= 0)` constraint is enforced at schema level.
- **Critical Security Findings Discovered:**
  1. *SEC-01 (High):* `POST /api/auth/register` accepts a user-supplied `role` field; unauthenticated callers can request `"role": "ADMIN"` and escalate privileges.
  2. *SEC-02 (High):* `POST /api/auth/forgot-password` updates user passwords directly without an OTP or cryptographically secure reset token.
  3. *SEC-03 (Medium):* `CASHIER` role is referenced in requirements but missing from `User.Role` enum.
  4. *SEC-04 (Low):* Swagger UI is publicly exposed without authentication.
  5. *SEC-05 (Medium):* Hardcoded default passwords (`Admin@123`, `Pharmacist@123`) seeded in `V2` migration and `DataInitializer.java`.
- **CI/CD Pipeline:** CI passes 100% in GitHub Actions. CD is authored with immutable SHA tagging, ECR publishing, and SSM EC2 deployment, but paused due to missing repository secrets (`0` configured).
- **AWS Infrastructure:** EC2 `i-0be536c99a4381e25` (Ubuntu 24.04, `15.135.82.107`) running stack reliably. Ports 8080 and 5432 isolated, SSH restricted to admin IP, IMDSv2 enforced.
- **Disaster Recovery:** Local AES-256 encrypted backup and isolated restore verified on EC2. Nightly cron active. S3 offsite bucket architecture ready for approval.

---

## 2. Task-by-Task Implementation Checklist

| ID | Phase / Task Description | Priority | Current Status | Required Changes | Files Affected | Validation Method | Completion Evidence |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- | :--- |
| **T01** | **Phase 1: Fix SEC-01 (Admin Registration)** | **CRITICAL** | INCOMPLETE | Public registration must strictly force `PHARMACIST` role. Ignore user-supplied `ADMIN` in public requests. Restrict `ADMIN` creation to authenticated administrators. | `AuthService.java`, `AuthController.java`, `RegisterRequest.java` | Unit tests submitting `role: ADMIN` without auth verifying role is forced to `PHARMACIST`. | Passing JUnit test `testPublicRegistrationCannotCreateAdmin`. |
| **T02** | **Phase 1: Fix SEC-02 (Secure Password Reset)** | **CRITICAL** | INCOMPLETE | Introduce secure random reset token entity (`PasswordResetToken`), store hashed token with 15-min expiry, require token in reset confirmation endpoint, prevent token reuse. | `User.java`, `PasswordResetToken.java`, `AuthService.java`, `AuthController.java`, `ForgotPasswordRequest.java`, `ResetPasswordConfirmRequest.java` | Unit tests for token generation, expiration rejection, single-use invalidation, and generic responses. | Passing JUnit tests for token lifecycle and invalid token rejection. |
| **T03** | **Phase 1: Implement SEC-03 (3-Tier RBAC & Cashier)** | **HIGH** | PARTIAL | Add `CASHIER` to `User.Role` enum. Update Flyway migration `V3`. Apply `@PreAuthorize` guards on sensitive endpoints (medicine mutation, purchase orders, financial reports). | `User.java`, `SecurityConfig.java`, `MedicineController.java`, `PurchaseController.java`, `ReportController.java`, `V3__add_cashier_role_and_tokens.sql` | Controller tests asserting HTTP 403 Forbidden for `CASHIER` on catalog deletions and financial reports. | Passing tests asserting 403 on admin-only endpoints. |
| **T04** | **Phase 1: Fix SEC-04 (Lockdown Swagger in Prod)** | **MEDIUM** | INCOMPLETE | Restrict `/swagger-ui/**` and `/v3/api-docs/**` in production via Spring Security configuration or IP whitelist. | `SecurityConfig.java`, `application.yml` | Curl verification that `/swagger-ui/` requires authentication or returns 403 when configured. | Security configuration and test assertion. |
| **T05** | **Phase 1: Fix SEC-05 (Default Credentials Hardening)** | **HIGH** | PARTIAL | Ensure `DataInitializer.java` uses environment variables for default credentials with fallback flags, and document the out-of-band BCrypt rotation runbook. | `DataInitializer.java`, `application.yml` | Verify no plaintext default credentials appear in application logs. | Clean startup logs with zero credential leakage. |
| **T06** | **Phase 2: Database Reliability & Flyway V3** | **HIGH** | INCOMPLETE | Author `V3__add_cashier_role_and_tokens.sql` to create `password_reset_tokens` table with FK to `users`, index on `token_hash`, and ensure role length accommodates `CASHIER`. | `V3__add_cashier_role_and_tokens.sql` | Flyway clean migration test on PostgreSQL. | Successful migration execution without schema conflicts. |
| **T07** | **Phase 2: Stock Deduction & Transaction Atomicity** | **HIGH** | VERIFIED | Verify `@Transactional` on `SaleService.processSale` and `InventoryService.adjustStock`. Ensure stock deduction and transaction recording are atomic. | `SaleService.java`, `InventoryService.java` | Automated negative test verifying rollback when stock is insufficient. | Test `testInsufficientStockRollback` passes (HTTP 409). |
| **T08** | **Phase 3: Frontend Integration & Role Navigation** | **MEDIUM** | INCOMPLETE | Update `ForgotPassword.jsx` to support the two-step reset flow (Request Token &rarr; Verify Token & Set Password). Update `Sidebar.jsx` to filter menu items based on role (`isAdmin`, `isPharmacist`, `isCashier`). | `ForgotPassword.jsx`, `Sidebar.jsx`, `AuthContext.jsx` | Frontend build verification (`npm run build`) and component rendering tests. | Clean Vite build with zero JSX or lint errors. |
| **T09** | **Phase 4: CI/CD Documentation & Blocker Resolution** | **HIGH** | PARTIAL | Document exact GitHub secrets and AWS IAM permissions required for automated deployment. Prepare deployment instructions for user approval. | `.github/workflows/cd.yml`, `docs/CICD_IMPLEMENTATION_REPORT.md` | Verification of GitHub Actions run status and job gate conditions. | Documented runbook with zero-leak placeholders. |
| **T10** | **Phase 5: HTTPS Configuration & Deployment Guide** | **MEDIUM** | PARTIAL | Verify Nginx SSL template (`nginx.ssl.conf.template`), document Certbot automation, and outline DNS A-record requirements. | `frontend/nginx.ssl.conf.template`, `docs/HTTPS_DEPLOYMENT_GUIDE.md` | Nginx configuration syntax check (`nginx -t`). | Verified SSL configuration template and complete guide. |
| **T11** | **Phase 6: S3 Offsite Backup & Disaster Recovery** | **MEDIUM** | PARTIAL | Author S3 sync script `/opt/medicore/scripts/backup-s3.sh`, draft IAM bucket policy with SSE-KMS, and outline isolated restore procedure. | `scripts/backup-s3.sh`, `docs/S3_BACKUP_AND_DISASTER_RECOVERY.md` | Verified local AES-256 backup restore test and script syntax check. | Documented S3 disaster recovery architecture and cost model. |
| **T12** | **Phase 7: Monitoring & Alerting Guide** | **MEDIUM** | VERIFIED | Document host telemetry, Docker daemon log rotation (30MB cap), and CloudWatch alarm metrics (CPU > 85%, StatusCheckFailed > 0). | `docs/MONITORING_AND_ALERTING_GUIDE.md`, `scripts/monitor.sh` | Telemetry script verification output on host. | Verified telemetry output: CPU 0.04, RAM 67%, Disk 45%. |
| **T13** | **Phase 8: Comprehensive Automated Testing** | **HIGH** | INCOMPLETE | Expand unit and integration test suite: add tests for SEC-01 (admin registration prevention), SEC-02 (password reset tokens), SEC-03 (RBAC permissions), and full business flows. | `AuthServiceTest.java`, `SecurityRbacTest.java`, `scripts/test-all-business-workflows.ps1` | Execute `mvn test` and PowerShell test suite against live deployment. | 100% test pass rate across all suites. |
| **T14** | **Phase 9: Docker Production Readiness** | **MEDIUM** | PARTIAL | Remove unnecessary public port 8080 mapping from `docker-compose.prod.yml` (routing all traffic via Nginx on port 80/443). Confirm non-root container users. | `docker-compose.prod.yml`, `docs/DOCKER_PRODUCTION_READINESS.md` | Docker compose validation (`docker compose config`). | Validated configuration with zero unnecessary public ports. |
| **T15** | **Phase 10: AWS Infrastructure Security Audit** | **MEDIUM** | VERIFIED | Document security group rules, IMDSv2 enforcement, least-privilege IAM roles, EBS encryption, and cost breakdown under AWS Free Tier. | `docs/AWS_INFRASTRUCTURE_SECURITY_AUDIT.md` | AWS CLI verification of security group and instance profile. | Complete audit report with zero critical perimeter findings. |
| **T16** | **Phase 11: Performance & Quality Improvements** | **LOW** | VERIFIED | Review HikariCP settings (pool size 10), JVM ergonomics (G1GC, MaxRAMPercentage 75.0), and 2.0 GB swapfile protection. | `docs/PERFORMANCE_REVIEW.md` | Performance and latency measurement on live endpoints (< 50ms). | Documented performance benchmarks. |
| **T17** | **Phase 12: Final Documentation Suite** | **HIGH** | INCOMPLETE | Update `README.md` and ensure all 15 required documentation files are written, formatted, and cross-linked. | `README.md`, `docs/*.md` | Markdown link verification and documentation audit. | 15 complete, accurate documentation files in repository. |
| **T18** | **Phase 13: Final Production-Readiness Audit** | **HIGH** | INCOMPLETE | Generate `docs/FINAL_COMPLETION_REPORT.md` with category completion table, evidence-based scores out of 10, and prioritized next steps. | `docs/FINAL_COMPLETION_REPORT.md` | Final project evaluation review against all prompt criteria. | Formal evaluation report delivered with verified evidence. |

---

## 3. Immediate Execution Sequence

1. **Phase 1 Execution (Security Fixes):**
   - Refactor `AuthService.java` and `RegisterRequest.java` to prevent unauthorized admin creation (SEC-01).
   - Implement `PasswordResetToken` entity, repository, and secure reset service methods with expiration and single-use invalidation (SEC-02).
   - Add `CASHIER` to `User.Role` and update `SecurityConfig.java` with `@PreAuthorize` method security (SEC-03).
   - Author Flyway migration `V3__add_cashier_role_and_tokens.sql` (Phase 2).
   - Write comprehensive automated tests in `backend/src/test/java/` to validate SEC-01, SEC-02, and RBAC (Phase 8).
2. **Phase 3 Execution (Frontend Hardening):**
   - Update `ForgotPassword.jsx` to interface with the new secure two-step token reset workflow.
   - Update `Sidebar.jsx` with role-aware menu visibility.
   - Run `npm run build` to verify the frontend compilation.
3. **Phase 4 & 9 Execution (DevOps & Docker):**
   - Update `docker-compose.prod.yml` to remove external host port 8080 mapping.
   - Document CI/CD pipeline blockers and required secrets.
4. **Phase 5–13 Execution (Documentation & Verification):**
   - Complete all required documentation guides.
   - Execute test suites and record all verification outputs.
   - Compile `docs/FINAL_COMPLETION_REPORT.md`.

