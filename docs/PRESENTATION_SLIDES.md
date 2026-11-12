# MediCore – Internship Project Presentation Slides
**Company:** ALGiONS AI LABS PRIVATE LIMITED  
**Designation:** DevOps and Cloud Engineering Intern  
**Project:** Cloud Deployment & CI/CD – Pharmacy Management Platform  

---

## Slide 1: Project Title & Introduction
- **Project Title:** MediCore – Smart Pharmacy Management Platform
- **Tagline:** Smart Pharmacy Management. Simplified.
- **Presenter:** DevOps & Cloud Engineering Intern
- **Organization:** ALGiONS AI LABS PRIVATE LIMITED
- **Domain:** Healthcare SaaS, Cloud Architecture, CI/CD Automation, Full-Stack Web Development
- **Key Deliverable:** A production-grade, multi-tier, fully Dockerized healthcare management platform with automated GitHub Actions CI/CD deploying to AWS cloud infrastructure.

---

## Slide 2: Problem Statement
- **Manual Pharmacy Inefficiencies:** Traditional retail pharmacies struggle with manual billing, paper invoices, unorganized vendor orders, and stock discrepancies.
- **Critical Expiry Risks:** Dispensing expired medication poses clinical liabilities and financial loss due to lack of real-time lot expiry notifications.
- **Stockout & Procurement Gaps:** Without automated minimum threshold alerts, high-demand drugs run out of stock before reordering occurs.
- **Deployment & Scaling Bottlenecks:** Lack of modern DevOps pipelines leads to downtime during updates, environmental drift, and unverified manual server changes.

---

## Slide 3: Project Objectives
- **Full-Stack SaaS Platform:** Develop a responsive, Stripe-style healthcare web application with real-time POS billing, medicine inventory CRUD, and vendor management.
- **ACID Database Transactions:** Guarantee zero stock corruption, prevent negative inventory, and block sale of expired medicines using PostgreSQL.
- **Multi-Stage Dockerization:** Containerize frontend (React + Vite + Nginx) and backend (Java 21 + Spring Boot 3) into minimal, secure, non-root images.
- **Automated CI/CD Pipeline:** Build GitHub Actions workflows that automatically validate code, run tests, push immutable images to Amazon ECR, and deploy to AWS EC2 without downtime.
- **Enterprise Cloud Security:** Implement least-privilege IAM policies, private database networking, JWT authentication, and SSL/TLS encryption.

---

## Slide 4: Technology Stack
- **Frontend:** React 18, Vite, Tailwind CSS, Lucide React, Recharts, Axios
- **Backend:** Java 21, Spring Boot 3.3.5, Spring Security 6, Spring Data JPA, Hibernate, Maven
- **Database:** PostgreSQL 16, Flyway Database Migrations
- **Containerization:** Docker Engine, Docker Compose, Multi-stage builds, Alpine Linux
- **DevOps & Automation:** Git, GitHub, GitHub Actions (CI & CD), Shell Scripts
- **Cloud Infrastructure (AWS):** Amazon EC2, Amazon ECR, AWS IAM, Security Groups, CloudWatch
- **Web Server & Reverse Proxy:** Nginx, Let's Encrypt SSL/TLS

---

## Slide 5: System Architecture
- **Three-Tier Architecture:** Client &rarr; Nginx Reverse Proxy &rarr; Spring Boot REST API &rarr; PostgreSQL Database.
- **Stateless Authentication:** JSON Web Token (JWT) with HMAC-SHA256 signature, validated per-request via Spring Security filters.
- **Internal Container Networking:** Backend and Database communicate within an isolated Docker bridge network; database port 5432 is never exposed to the public Internet.
- **Real-Time Data Streaming:** Real database queries power 8 KPI cards, weekly sales graphs, monthly revenue bars, and top-selling product statistics.

---

## Slide 6: Application Features & Highlights
- **Smart POS Terminal:** Search-as-you-type medicine catalog, barcode scanning simulation, quantity adjustment, GST tax and discount calculation, and printable tax invoices.
- **Inventory Lot Tracking:** Granular stock history audit ledger tracking `STOCK_IN`, `STOCK_OUT`, `ADJUSTMENT`, `SALE`, and `PURCHASE_RECEIVE`.
- **Automated Purchase Orders:** Vendor PO generation with multiple line items. Stock is automatically incremented only when marked as `RECEIVED`.
- **Alert Center:** Proactive alerts for medicines approaching expiration within 30 days, expired lot quarantine, and low-stock threshold triggers.
- **Reporting & Exporting:** Daily, weekly, monthly, and annual sales analytics with instant CSV export and print preview.

---

## Slide 7: Docker Containerization
- **Backend Multi-Stage Build:**
  - *Stage 1 (Builder):* `maven:3.9.9-eclipse-temurin-21-alpine` caches dependencies and builds executable jar.
  - *Stage 2 (Runner):* `eclipse-temurin:21-jre-alpine` runs the jar under a non-root `medicore` user with G1GC memory optimization.
- **Frontend Multi-Stage Build:**
  - *Stage 1 (Builder):* `node:22-alpine` compiles optimized static React assets in ~6 seconds.
  - *Stage 2 (Runner):* `nginx:1.27-alpine` serves static files and reverse proxies `/api/*` to the backend.
- **Docker Compose Orchestration:** Single-command local startup via `docker compose up -d --build`.

---

## Slide 8: GitHub Actions CI/CD Pipeline
- **Continuous Integration (`ci.yml`):**
  - Triggers on push or pull request to `main`.
  - Sets up Java 21 & Node.js 22 with dependency caching.
  - Executes Spring Boot automated test suite and Maven packaging.
  - Compiles frontend distribution and validates build integrity.
- **Continuous Deployment (`cd.yml`):**
  - Triggers automatically upon successful CI completion.
  - Generates immutable image tags based on the Git commit SHA (`git rev-parse --short HEAD`).
  - Authenticates with Amazon ECR and pushes versioned images.
  - Connects via secure SSH to AWS EC2, updates environment files, pulls new images, and launches updated containers with zero downtime.
  - Runs automated health check and executes automated rollback if checks fail.

---

## Slide 9: AWS Cloud Deployment & Security
- **Amazon EC2:** Hosts Dockerized container instances with automated systemd restart policies.
- **Amazon ECR:** Private, encrypted image registry with automated image vulnerability scanning on push.
- **AWS IAM Least Privilege:** EC2 instance role allows only read access to ECR repositories; credentials are never hardcoded.
- **Security Groups Hardening:** Only Ports 80 (HTTP) and 443 (HTTPS) are open to the world. SSH (Port 22) is IP-restricted. Internal database ports are shielded.
- **Observability:** Health endpoints (`/actuator/health`) and container logs piped to AWS CloudWatch.

---

## Slide 10: Results, Challenges & Future Scope
- **Key Results Achieved:**
  - 100% functional, commercial-grade pharmacy SaaS platform.
  - Automated deployment pipeline: **Code Change &rarr; Git Push &rarr; CI/CD &rarr; Live Update on EC2 in < 3 minutes.**
  - Zero hardcoded statistics—all analytics computed directly from PostgreSQL.
- **Challenges Overcome:**
  - Enforcing strict transactional consistency during concurrent POS stock deductions.
  - Streamlining Java 21 byte-buddy agent attachment inside containerized environments.
  - Configuring Nginx reverse proxy with SPA client-side routing fallback and WebSocket headers.
- **Future Enhancements:**
  - Multi-branch pharmacy tenancy with warehouse inter-store transfers.
  - AI-driven predictive reordering based on historical seasonal sickness trends.
  - Kubernetes (EKS) migration with Horizontal Pod Autoscaler (HPA).

