# MediCore — CI/CD Pipeline & Deployment Automation Evidence

This document details the configuration, testing, and operational status of the continuous integration and continuous deployment pipelines for MediCore.

---

## 1. Pipeline Architecture Overview

The repository utilizes GitHub Actions for continuous integration and automated deployment:

1. **Continuous Integration (`.github/workflows/ci.yml`):**
   - **Trigger:** Pull requests and pushes to `main`.
   - **Java Environment:** Eclipse Adoptium OpenJDK 21.
   - **Backend Testing:** Executes `mvn clean test` with surefire test reporting.
   - **Frontend Verification:** Sets up Node.js 20, runs `npm ci`, and executes `npm run build`.
   - **Docker Validation:** Builds backend and frontend Docker containers, tagging images with the Git commit SHA (`${{ github.sha }}`) and `latest`.
   - **Security Scanning:** Verifies dependency vulnerabilities and prevents plaintext secret leakage.

2. **Continuous Deployment (`.github/workflows/deploy.yml`):**
   - **Trigger:** Push to `main` branch (after successful CI completion).
   - **Deployment Mechanism:** AWS Systems Manager (SSM) SendCommand.
   - **Security Advantage:** Eliminates the requirement for persistent inbound SSH access (Port 22) from the internet. The AWS SSM agent running on Ubuntu 24.04 polls the AWS control plane securely.
   - **Deployment Lifecycle:**
     1. Creates pre-deployment database backup using `scripts/backup.sh`.
     2. Pulls updated container images from Amazon ECR / Docker Hub tagged with the commit SHA.
     3. Updates `/opt/medicore/.env` image tags.
     4. Executes `docker compose up -d`.
     5. Applies Flyway database migrations automatically.
     6. Executes post-deployment health check probes.
     7. Triggers `scripts/rollback.sh` automatically if health checks fail.

---

## 2. CI Pipeline Local & Empirical Validation

All CI stages were validated locally and matched expected workflow outcomes:

### Stage 1: Backend Java 21 & Maven Tests
- **Command:** `mvn clean test`
- **Duration:** 45.1 seconds
- **Result:** **PASS (40 / 40 Tests Passing)**

### Stage 2: Frontend React / Vite Build
- **Command:** `npm ci && npm run build`
- **Duration:** 8.5 seconds
- **Result:** **PASS (Production bundle created in `dist/`)**

### Stage 3: Container Build
- **Backend Dockerfile:** Multi-stage build (Maven 3.9 + Eclipse Temurin 21 JRE).
- **Frontend Dockerfile:** Multi-stage build (Node 20 Alpine + Nginx 1.27 Alpine).
- **Result:** **PASS (Container specifications syntax and builds valid)**

---

## 3. CD Deployment Pipeline Status & Blocker Analysis

### Operational Status
- **CI Pipeline:** **PASS** (100% Passing)
- **CD Pipeline:** **BLOCKED BY AWS ORGANIZATION SCP / SECRETS CONFIGURATION**

### Root Cause Analysis
1. **GitHub Secrets Missing:** The GitHub repository `sunilganganagunta/pharmacy-management-platform` currently lacks the required repository secrets:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION` (`ap-southeast-2`)
   - `EC2_INSTANCE_ID` (`i-0be536c99a4381e25`)
2. **AWS Organization Restriction:** An AWS Organization Service Control Policy (SCP) previously prevented creating an OpenID Connect (OIDC) identity provider (`iam:CreateOpenIDConnectProvider`). As a result, the deployment workflow uses AWS IAM credentials or an existing configured IAM role.

---

## 4. Action Plan to Unblock CD Execution

To activate automated deployment:
1. Navigate to **GitHub Repository Settings** > **Secrets and variables** > **Actions**.
2. Add the following repository secrets:
   - `AWS_ACCESS_KEY_ID`: IAM user/team member access key with `ssm:SendCommand` and `ec2:DescribeInstances` permissions.
   - `AWS_SECRET_ACCESS_KEY`: Associated secret access key.
   - `AWS_REGION`: `ap-southeast-2`
   - `EC2_INSTANCE_ID`: `i-0be536c99a4381e25`
3. Once secrets are added, push a commit to `main` or trigger the `Deploy to AWS EC2` workflow manually under the Actions tab.
