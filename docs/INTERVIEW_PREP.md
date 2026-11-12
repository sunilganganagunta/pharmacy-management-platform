# MediCore – Comprehensive Technical Interview Q&A Guide
**Company:** ALGiONS AI LABS PRIVATE LIMITED  
**Role:** DevOps and Cloud Engineering Intern  
**Project:** Cloud Deployment & CI/CD – Pharmacy Management Platform  

---

## 1. Full-Stack & Architecture Questions

### Q1: How does the React frontend integrate with the Spring Boot backend?
**Answer:**
- The React frontend communicates with the Spring Boot backend through a centralized **Axios** HTTP client (`frontend/src/api/axiosInstance.js`).
- During local development, the Vite dev server proxies API calls (`/api/*` &rarr; `http://localhost:8080`).
- In production, **Nginx** acts as a reverse proxy: client requests to `/api/*` are forwarded over the internal Docker network to `http://backend:8080/api/`.
- All requests include the client's JWT token in the `Authorization: Bearer <token>` header via an Axios request interceptor.
- If a 401 Unauthorized response is received, the interceptor clears local storage and routes the user to the login screen.

### Q2: Why did you use DTOs instead of returning JPA entities directly from REST endpoints?
**Answer:**
1. **Security & Data Encapsulation:** JPA entities like `User` contain sensitive fields like `passwordHash`. Exposing entities directly risks leaking credentials or private data.
2. **Preventing Circular Reference Errors:** Bidirectional JPA relationships (e.g., `Sale` &rarr; `SaleItem` &rarr; `Sale`) cause Jackson JSON serialization infinite loops or `LazyInitializationException`.
3. **Decoupling Database Schema from API Contract:** Database tables can be renamed, normalized, or refactored without breaking client web applications or mobile apps.
4. **Tailored Payloads:** DTOs allow returning computed fields (such as `isLowStock`, `isExpiringSoon`, or formatted currency strings) without polluting the database entity.

### Q3: How is JWT authentication and Role-Based Access Control (RBAC) implemented?
**Answer:**
- When a user logs in via `/api/auth/login`, Spring Security's `AuthenticationManager` validates the credentials against `UserRepository` using `BCryptPasswordEncoder`.
- Upon successful authentication, `JwtUtils` generates an HMAC-SHA256 signed JWT containing the user's ID, username, email, and roles (e.g., `ROLE_ADMIN`, `ROLE_PHARMACIST`).
- For subsequent requests, `AuthTokenFilter` extracts the Bearer token, cryptographically validates the signature and expiration, extracts the user authorities, and sets the `SecurityContextHolder`.
- Spring Security is configured with stateless session policy (`SessionCreationPolicy.STATELESS`), meaning the backend stores zero server-side sessions, enabling effortless horizontal scaling.

---

## 2. Database & Data Integrity Questions

### Q4: How do you prevent negative inventory or selling expired medicines during high concurrency?
**Answer:**
1. **Preventing Expired Medicine Sales:** In `SaleService.processSale()`, every requested medicine is checked against `medicine.isExpired()` (`expiryDate < LocalDate.now()`). If expired, an `ExpiredMedicineException` is thrown, aborting the transaction before any stock is modified.
2. **Preventing Negative Stock:**
   - At the Java service layer, available stock is compared to requested quantity (`availableQuantity < requestedQuantity`). If insufficient, an `InsufficientStockException` is thrown.
   - At the database level, a `CHECK (available_quantity >= 0)` constraint is enforced in PostgreSQL.
3. **Transactional Isolation:** The entire checkout process is annotated with `@Transactional`. If any item validation fails or an exception occurs, the entire transaction rolls back automatically, preventing partial deductions.

### Q5: What is Flyway and why is it used?
**Answer:**
- Flyway is a database migration tool that provides version-controlled, reproducible database schema management.
- Instead of using `hibernate.ddl-auto=update` (which is dangerous in production and can accidentally alter or drop columns), Flyway executes ordered SQL scripts:
  - `V1__init_schema.sql`: Creates tables, primary keys, foreign keys, unique constraints, and B-Tree indexes.
  - `V2__seed_initial_data.sql`: Seeds realistic pharmacy catalog data, categories, users, and purchase orders.
- Flyway records applied scripts in the `flyway_schema_history` table, ensuring all team members, CI runners, and production instances have an identical database state.

---

## 3. Docker & Containerization Questions

### Q6: Why did you use multi-stage Docker builds for both frontend and backend?
**Answer:**
- **Minimizing Image Size:**
  - *Backend:* The builder stage uses Maven + JDK 21 (~800 MB) to compile code and build the JAR. The final runner stage copies only the compiled JAR into a minimal `eclipse-temurin:21-jre-alpine` image (~200 MB).
  - *Frontend:* The builder stage uses Node.js 22 (~1 GB with `node_modules`). The runner stage copies only the compiled static HTML/JS/CSS into `nginx:alpine` (~25 MB).
- **Security Hardening:** Build tools (compilers, git, npm, maven) are omitted from the production container.
- **Non-Root Execution:** The backend runs under a dedicated, unprivileged system user (`medicore`) rather than `root`, reducing the impact of potential container breakout vulnerabilities.

### Q7: How do the containers communicate in Docker Compose?
**Answer:**
- Docker Compose creates an isolated user-defined bridge network (`medicore-net`).
- Services resolve each other by their service names using Docker's built-in DNS server:
  - Frontend Nginx connects to backend via `http://backend:8080/api/`.
  - Backend Spring Boot connects to PostgreSQL via `jdbc:postgresql://postgres:5432/medicoredb`.
- The database port `5432` is not exposed to the public Internet in production; it is reachable only within the Docker network.

---

## 4. CI/CD & DevOps Automation Questions

### Q8: Explain the complete GitHub Actions CI/CD pipeline workflow.
**Answer:**
1. **Continuous Integration (`ci.yml`):**
   - Triggered on push or pull request to `main`.
   - Checks out code, sets up Java 21 with Maven caching, builds Spring Boot, and runs automated tests.
   - Sets up Node.js 22 with npm caching, installs dependencies, and runs `npm run build` to verify frontend compilation.
   - If any test or build step fails, the workflow terminates immediately and blocks deployment.
2. **Continuous Deployment (`cd.yml`):**
   - Runs only after CI passes on `main`.
   - Extracts the short commit SHA (`git rev-parse --short HEAD`) to use as an **immutable image tag**.
   - Authenticates with Amazon ECR and builds/pushes versioned Docker images.
   - Connects securely to the AWS EC2 instance over SSH using GitHub Secrets.
   - Authenticates EC2 with ECR using AWS CLI, updates `.env`, pulls the new images, and launches the updated containers via `docker compose -f docker-compose.prod.yml up -d`.
   - Executes health checks against `/actuator/health` and the web server. If checks fail, it automatically triggers rollback.

### Q9: Why is tagging Docker images with Git commit SHA better than using only `:latest`?
**Answer:**
1. **Immutability & Traceability:** A Git SHA tag (e.g., `:a1b2c3d`) maps 1:1 to the exact commit in GitHub. The `:latest` tag is mutable and changes with every build.
2. **Deterministic Rollbacks:** If a deployment has a regression, you cannot easily rollback using `:latest` because the previous image was overwritten. With Git SHA tags, rolling back is as simple as running the previous tag.
3. **Cache Invalidation:** Docker daemon or orchestrators might not pull an updated image if the tag is `:latest` and already present locally. An immutable SHA tag guarantees the new image is always pulled.

---

## 5. AWS Cloud Infrastructure Questions

### Q10: How did you implement least-privilege security in AWS?
**Answer:**
1. **AWS IAM:**
   - The EC2 instance is assigned an IAM Role with read-only ECR permissions (`ecr:GetAuthorizationToken`, `ecr:BatchGetImage`, etc.). No long-lived AWS secret access keys are stored on the EC2 server.
   - The CI/CD GitHub Actions workflow uses separate deployment credentials restricted to ECR publishing.
2. **Security Groups:**
   - Inbound traffic is restricted to Port 80 (HTTP) and Port 443 (HTTPS) for the public web.
   - SSH (Port 22) is restricted to authorized IP addresses.
   - PostgreSQL (Port 5432) and Spring Boot internal port (8080) are shielded from public ingress.
3. **Environment Secrets:** Database passwords and JWT encryption keys are injected at runtime via environment variables or secrets managers, never committed to Git.

### Q11: What is your disaster recovery and rollback strategy?
**Answer:**
- During every CD deployment on EC2, the script backs up the active version tag to `previous_version.txt` before applying the new version.
- If the post-deployment health check (`curl http://localhost:8080/actuator/health`) fails:
  1. The automated script detects the non-200 exit code.
  2. It reads `previous_version.txt`.
  3. It updates `.env` with the previous tag and executes `docker compose -f docker-compose.prod.yml up -d`.
  4. The healthy previous version is restored immediately without human intervention.
- Database volumes (`/var/lib/medicore/pgdata`) are stored independently of container lifecycles, ensuring data persistence across restarts and updates.

---

## 6. Live Demonstration Script for Reviewers

When demonstrating to your internship evaluator, follow this structured 5-step walkthrough:

1. **Step 1: Open Live Web Application:**
   - Navigate to your public URL.
   - Demonstrate the modern responsive UI, dark/light theme toggle, and system status indicator.
2. **Step 2: Authenticate with Demo Credentials:**
   - Click "Admin Account" quick-fill button (`admin@medicore.com` / `Admin@123`).
   - Show the dynamic dashboard displaying live KPI cards (Total Medicines, Inventory Value, Sales, Expiring Soon).
3. **Step 3: Perform Live End-to-End Business Operations:**
   - *Add a Medicine:* Create "Paracetamol 500mg Batch-2026" with stock 50.
   - *Process POS Checkout:* Go to POS terminal, add 5 units of the medicine, apply 10% discount and 12% GST, complete sale via UPI.
   - *Print Tax Invoice:* Show the generated tax invoice with pharmacy GSTIN, drug license, and customer details.
   - *Verify Stock Reduction:* Return to Medicine catalog and verify stock has decreased from 50 to 45 units.
   - *Receive Purchase Order:* Open a pending PO, click "Receive Stock", and verify the inventory automatically increments.
4. **Step 4: Show Automated CI/CD in GitHub:**
   - Open GitHub repository `pharmacy-management-platform`.
   - Show clean commit history, `.github/workflows/ci.yml`, and `.github/workflows/cd.yml`.
   - Show the green checkmark on previous workflow runs.
5. **Step 5: Live CI/CD Demonstration (The "Gold Standard" DevOps Demo):**
   - Make a small noticeable modification in `frontend/src/pages/Dashboard.jsx` (e.g., change banner heading to "MediCore Operations Hub – Live v1.0.1").
   - Commit and push to GitHub: `git commit -am "chore: release v1.0.1" && git push origin main`.
   - Switch to the GitHub Actions tab in front of the reviewer.
   - Show CI building and testing backend and frontend.
   - Show CD building Docker images and publishing to Amazon ECR.
   - Show CD deploying over SSH to EC2 and running health checks.
   - Refresh the live website and show the updated banner heading without any manual server intervention!

