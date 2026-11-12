# MediCore Production Security Audit & Hardening Report

**Project**: MediCore – Smart Pharmacy Management Platform  
**Target Environment**: AWS EC2 (`ap-southeast-2`), Amazon ECR, Docker Compose  
**Security Classification**: Production Grade / HIPAA-Aligned Best Practices  
**Status**: AUDITED, HARDENED & REMEDIATION PLAN DOCUMENTED  
**Date of Audit**: November 2026  

---

## 1. Executive Summary

A comprehensive end-to-end security audit of the MediCore application codebase and AWS cloud infrastructure was conducted across eight core security dimensions:
1. Authentication & Role-Based Access Control (RBAC)
2. Password Hashing & Credential Lifecycle
3. JWT Token Security & Expiration
4. Network Perimeter & Ingress Hardening
5. Host & Cloud Defense (IMDSv2, Least Privilege IAM)
6. Container Hardening (Non-Root Execution, Minimal Base Images)
7. Code Quality & Input Validation (JSR-380, Sanitized Error Responses)
8. Vulnerability Assessment & Authorization Gap Analysis

### Key Findings Summary
- **Infrastructure & Perimeter**: **EXCELLENT / PRODUCTION GRADE**. Port 8080 revoked, PostgreSQL port 5432 isolated on private Docker network, SSH port 22 restricted strictly to administrator IP (`128.185.168.197/32`), IMDSv2 enforced (`HttpTokens=required`), and IAM privileges strictly scoped to `AmazonEC2ContainerRegistryReadOnly` and `AmazonSSMManagedInstanceCore`.
- **Cryptography & Tokens**: **EXCELLENT**. BCrypt password hashing (10 rounds with per-password 128-bit salt), HMAC-SHA256 JWT tokens with 24-hour expiration, and zero secrets tracked in Git.
- **Application Logic Vulnerabilities Discovered**: **3 CRITICAL/HIGH FINDINGS IDENTIFIED & REMEDIATION DOCUMENTED**:
  1. *Unverified Password Reset (High Severity)*: `/api/auth/forgot-password` allows resetting any user's password given only their email address, without email token or OTP verification.
  2. *Self-Registration Privilege Escalation (High Severity)*: `/api/auth/register` allows public callers to request `role: "ADMIN"`, automatically creating administrative accounts.
  3. *Missing Method-Level Access Control (Medium Severity)*: Sensitive mutations (`DELETE /api/medicines/{id}`, inventory adjustments) rely on `/api/**.authenticated()` rather than granular `@PreAuthorize("hasRole('ADMIN')")`.

---

## 2. Authentication & Authorization Matrix

### 2.1 Current Implementation vs. Target RBAC

| Endpoint Pattern | Method | Target Permitted Roles | Current Enforcement | Finding / Gap |
| :--- | :--- | :--- | :--- | :--- |
| `/api/auth/login` | POST | Anonymous | `permitAll()` | Verified secure. Returns JWT + user claims. |
| `/api/auth/register` | POST | Admin Only (or public Pharmacist) | `permitAll()` | **Vulnerability**: Permits caller to specify `ADMIN` role. |
| `/api/auth/forgot-password` | POST | Verified Account Owner | `permitAll()` | **Vulnerability**: Resets password without email verification code. |
| `/api/auth/me` | GET | Authenticated User | `authenticated()` | Verified secure. Extracts user details from JWT. |
| `/actuator/health`, `/info` | GET | Anonymous / Health Check | `permitAll()` | Verified secure. Provides liveness check for Nginx/AWS. |
| `/actuator/env, heapdump` | ALL | None | Disabled | Verified secure. Sensitive actuator endpoints revoked. |
| `/swagger-ui/**`, `/api-docs/**`| GET | Dev / Internal | `permitAll()` | Active. Should be IP-whitelisted in enterprise production. |
| `/api/admin/**` | ALL | `ROLE_ADMIN` | `.hasRole("ADMIN")` | Configured in `SecurityConfig`, but no controllers map to `/api/admin/**`. |
| `/api/medicines` (Read) | GET | `ADMIN`, `PHARMACIST`, `CASHIER` | `authenticated()` | Verified secure. Requires valid JWT. |
| `/api/medicines` (Create/Update)| POST, PUT | `ADMIN`, `PHARMACIST` | `authenticated()` | **Gap**: Any authenticated user can modify medicine records. |
| `/api/medicines/{id}` (Delete) | DELETE | `ADMIN` only | `authenticated()` | **Gap**: Pharmacists can soft-delete medicines. |
| `/api/sales` (Checkout) | POST | `ADMIN`, `PHARMACIST`, `CASHIER` | `authenticated()` | Verified secure. Atomic inventory deduction. |
| `/api/reports/**` (CSV Export) | GET | `ADMIN`, `PHARMACIST` | `authenticated()` | Verified secure. Full transactional export. |

---

## 3. Detailed Vulnerability Findings & Production Remediation

### Finding SEC-01: Public Self-Registration Privilege Escalation (High Severity)
- **Location**: `backend/src/main/java/com/medicore/service/AuthService.java` (Lines 69–73)
- **Root Cause**:
  ```java
  User.Role role = User.Role.PHARMACIST;
  if (request.getRole() != null && request.getRole().equalsIgnoreCase("ADMIN")) {
      role = User.Role.ADMIN; // Allows caller to self-assign ADMIN
  }
  ```
- **Risk**: An external attacker can send `POST /api/auth/register` with `{"username": "attacker", "role": "ADMIN", ...}` and gain full administrative privileges.
- **Remediation**:
  1. Default all self-registered users strictly to `PHARMACIST` (or `CASHIER`).
  2. Require existing `ADMIN` authentication for any registration specifying `ADMIN` role, or restrict registration to an internal management interface:
  ```java
  // Secure Implementation:
  User.Role role = User.Role.PHARMACIST;
  Authentication auth = SecurityContextHolder.getContext().getAuthentication();
  boolean isAdmin = auth != null && auth.getAuthorities().stream()
      .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
  
  if (request.getRole() != null && request.getRole().equalsIgnoreCase("ADMIN")) {
      if (!isAdmin) {
          throw new AccessDeniedException("Only existing administrators can provision ADMIN accounts");
      }
      role = User.Role.ADMIN;
  }
  ```

---

### Finding SEC-02: Unauthenticated Password Reset via Forgot-Password (High Severity)
- **Location**: `backend/src/main/java/com/medicore/service/AuthService.java` (Lines 89–98)
- **Root Cause**:
  ```java
  public void resetPassword(ForgotPasswordRequest request) {
      User user = userRepository.findByEmail(request.getEmail())
              .orElseThrow(() -> new ResourceNotFoundException("No account found with email: " + request.getEmail()));

      String newPass = (request.getNewPassword() != null && !request.getNewPassword().isBlank()) 
              ? request.getNewPassword() 
              : "MediCore@2026";
      user.setPasswordHash(passwordEncoder.encode(newPass));
      userRepository.save(user);
  }
  ```
- **Risk**: Any actor knowing a pharmacy employee's email address (e.g., `admin@medicore.com`) can POST to `/api/auth/forgot-password` and reset their password immediately, executing an account takeover.
- **Remediation**:
  1. Introduce a secure random token generator (`SecureRandom`) with a 15-minute expiration stored in a new `password_reset_tokens` table.
  2. Integrate an email service (Amazon SES) to send a cryptographically signed reset link.
  3. Require the reset token to accompany the new password before updating the database.

---

### Finding SEC-03: Three-Tier Role Expansion (`CASHIER` Role Support)
- **Location**: `backend/src/main/java/com/medicore/entity/User.java` (Lines 10–13)
- **Current State**: `User.Role` enum contains only `ADMIN` and `PHARMACIST`.
- **Target Design**:
  ```java
  public enum Role {
      ADMIN,
      PHARMACIST,
      CASHIER
  }
  ```
- **Enforcement Rules for `CASHIER`**:
  - `PERMITTED`: `/api/sales` (POST checkout), `/api/medicines/all` (GET catalog for POS), `/api/medicines/barcode/{barcode}` (GET barcode scan), `/api/sales/recent` (GET invoices).
  - `DENIED`: `/api/medicines` (POST/PUT/DELETE catalogue management), `/api/purchases/**` (vendor procurement), `/api/reports/**` (financial reporting), `/api/admin/**` (user management).

---

## 4. Password Cryptography & Credential Rotation Runbook

### Hashing Standard
- **Algorithm**: `BCryptPasswordEncoder`
- **Salt Generation**: Cryptographically secure 128-bit salt generated per password.
- **Work Factor (Cost)**: `10` rounds (1,024 iterations).

### Production Credential Rotation Procedure
Default seeded passwords (`Admin@123`, `Pharmacist@123`) must be rotated prior to real patient data ingestion.

#### Out-of-Band BCrypt Hash Update via EC2 Host
To rotate credentials directly in the production PostgreSQL database:
```bash
# 1. Connect to EC2 via AWS Systems Manager (SSM)
aws ssm start-session --target i-0be536c99a4381e25 --region ap-southeast-2

# 2. Generate new BCrypt hash using Python or Spring Boot
NEW_HASH=$(python3 -c "import bcrypt; print(bcrypt.hashpw(b'<STRONG_NEW_PASSWORD>', bcrypt.gensalt(10)).decode())")

# 3. Update the database record directly inside the Docker container
docker exec -i medicore-prod-postgres psql -U medicore_user -d medicoredb -c "
UPDATE users 
SET password_hash = '$NEW_HASH', updated_at = NOW() 
WHERE username = 'admin';
"
```

---

## 5. JWT Architecture & Verification

- **Algorithm**: HMAC-SHA256 (`HS256`)
- **Key Length**: 256 bits (64 hex characters)
- **Token Lifespan**: `86400000` ms (24 hours)
- **Header Format**: `Authorization: Bearer <token>`
- **Token Structure**:
  - `sub`: Username (e.g. `admin`)
  - `iat`: Issue timestamp
  - `exp`: Expiration timestamp (24h after `iat`)
- **Secret Management**: Injected at runtime via `${JWT_SECRET}`. Zero default secrets hardcoded in production containers.

---

## 6. Network Perimeter & Ingress Hardening

| Component | Port | Ingress Source | Status / Defense |
| :--- | :--- | :--- | :--- |
| **HTTP (Web)** | `80/tcp` | `0.0.0.0/0` | Publicly accessible for frontend SPA and reverse-proxied API. |
| **HTTPS (SSL)** | `443/tcp` | `0.0.0.0/0` | Configured and ready for Let's Encrypt / Certbot when domain DNS points. |
| **Spring Boot** | `8080/tcp` | **REVOKED** | Ingress rule removed from security group. Accessible exclusively via Nginx on localhost. |
| **PostgreSQL** | `5432/tcp` | **ISOLATED** | Bound exclusively to private Docker bridge network (`medicore-prod-net`). Unmapped on host. |
| **SSH Management**| `22/tcp` | `128.185.168.197/32`| **Restricted to administrator IP**. Zero open SSH access to the general internet. |

---

## 7. Host & Cloud Defense (AWS EC2 & IAM)

1. **IMDSv2 Enforced**:
   - `HttpTokens`: `required`
   - `HttpPutResponseHopLimit`: `1`
   - **Verification**: Blocks Server-Side Request Forgery (SSRF) attacks attempting to exfiltrate IAM role credentials from `169.254.169.254`.
2. **IAM Least Privilege**:
   - High-privilege policies like `AmazonEC2ContainerRegistryPowerUser` have been removed.
   - Instance profile operates with:
     - `AmazonEC2ContainerRegistryReadOnly` (pulling container images only).
     - `AmazonSSMManagedInstanceCore` (secure management without open inbound ports).
3. **Encrypted Storage**:
   - Root EBS volume: 20 GB `gp3` encrypted at rest using AWS managed KMS encryption.

---

## 8. Container Hardening & Defense-in-Depth

1. **Non-Root Execution**:
   - Backend container runs under unprivileged user `medicore:medicore` (UID 1000).
   - PostgreSQL container runs under unprivileged user `postgres` (UID 70).
2. **Minimal Alpine Base Images**:
   - `eclipse-temurin:21-jre-alpine` (eliminates compilers, debuggers, and build utilities from runtime image).
   - `nginx:1.27-alpine` (lightweight reverse proxy footprint).
3. **Host Permission Isolation**:
   - Production `.env` file on EC2 is restricted to `chmod 600` (readable only by the owner).
