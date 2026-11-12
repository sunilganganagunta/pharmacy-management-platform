# MediCore – AWS Cloud Infrastructure Security Audit Report

**Project:** MediCore – Smart Pharmacy Management Platform  
**Target Cloud:** Amazon Web Services (AWS) | Selected Region: `ap-southeast-2` (Sydney)  
**AWS Project ID:** `774697186763`  
**Security Classification:** Cloud Defense-in-Depth / Least Privilege  
**Status:** AUDITED, HARDENED & VERIFIED  
**Date:** November 2026  

---

## 1. Cloud Perimeter & Network Security

```mermaid
flowchart TD
    subgraph Internet
        PublicUsers["Public Users & Terminals"]
        AdminIP["Administrator IP (128.185.168.197/32)"]
    end

    subgraph AWS Security Group ["Security Group: medicore-app-sg (sg-057cdb536bf1239fe)"]
        Port80["Port 80/tcp: ALLOWED (0.0.0.0/0)"]
        Port443["Port 443/tcp: ALLOWED (0.0.0.0/0)"]
        Port22["Port 22/tcp: RESTRICTED (128.185.168.197/32)"]
        Port8080["Port 8080/tcp: REVOKED (BLOCKED)"]
        Port5432["Port 5432/tcp: ISOLATED (DOCKER ONLY)"]
    end

    subgraph EC2 Instance ["EC2: i-0be536c99a4381e25 (Ubuntu 24.04 LTS)"]
        IMDS["IMDSv2 Enforced (HttpTokens=required)"]
        EBS["20 GB gp3 Root Volume (Encrypted at Rest via KMS)"]
    end

    PublicUsers --> Port80 & Port443
    AdminIP --> Port22
    Port80 & Port443 --> EC2 Instance
```

### 1.1 Ingress Rule Audit Matrix
| Port / Protocol | Source CIDR | Status | Operational Justification |
| :--- | :--- | :---: | :--- |
| **80 / TCP (HTTP)** | `0.0.0.0/0` | **ALLOWED** | Required for public access to the React frontend SPA and reverse-proxied APIs. |
| **443 / TCP (HTTPS)** | `0.0.0.0/0` | **ALLOWED** | Pre-configured for automated Let's Encrypt TLS certificate termination. |
| **22 / TCP (SSH)** | `128.185.168.197/32` | **RESTRICTED** | **Locked down strictly to administrator IP**. Zero open SSH access to the general internet. |
| **8080 / TCP (Spring Boot)** | — | **REVOKED** | Ingress rule removed from security group. Application port is unreachable from outside host. |
| **5432 / TCP (PostgreSQL)** | — | **ISOLATED** | Unmapped on host. Bound exclusively to internal Docker bridge network `medicore-prod-net`. |

---

## 2. Host Hardening & Metadata Protection (IMDSv2)

- **Instance ID:** `i-0be536c99a4381e25` (`t3.micro`, Ubuntu 24.04 LTS, `15.135.82.107`).
- **IMDSv2 Verification:**
  - `HttpTokens`: `required`
  - `HttpPutResponseHopLimit`: `1`
  - `HttpEndpoint`: `enabled`
- **Security Impact:** Enforcing IMDSv2 completely blocks Server-Side Request Forgery (SSRF) vulnerabilities from harvesting IAM role credentials from the link-local metadata address `169.254.169.254`. The hop limit of 1 prevents containerized workloads from accessing host instance credentials via forwarded HTTP packets.

---

## 3. IAM Least-Privilege Governance

- **Instance Profile:** `medicore-ec2-profile` (Role: `medicore-ec2-role`)
- **Attached AWS Managed Policies:**
  1. `AmazonEC2ContainerRegistryReadOnly`: Permits pulling container images from Amazon ECR without granting permissions to push, overwrite, or delete repositories.
  2. `AmazonSSMManagedInstanceCore`: Enables secure Systems Manager administration, allowing remote command execution, log aggregation, and session terminal access without requiring open inbound SSH ports.
- **Revoked High-Risk Policies:** `AmazonEC2ContainerRegistryPowerUser` was permanently revoked, adhering strictly to the principle of least privilege.

---

## 4. Encrypted Block Storage

- **Root Volume:** 20 GB `gp3` SSD attached at `/dev/sda1`.
- **Encryption:** Encrypted at rest using AWS managed KMS encryption (`alias/aws/ebs`).
- **Disk Performance:** Baseline 3,000 IOPS and 125 MB/s throughput; current disk usage is **45%** (11 GB free space available).

---

## 5. Free Tier Cost Control & Budget Audit

- **AWS Plan Status:** Checked via `aws freetier get-account-plan-state`:
  - Plan Type: `"FREE"` (Active).
  - Remaining Credits: **\$100.00 USD** expiring May 2027.
- **Current Operational Cloud Cost:** **$0.00 / month**.
  - `t3.micro` EC2 instance: 750 hours/month free under AWS Free Tier.
  - Amazon ECR: 500 MB free private storage.
  - Amazon CloudWatch: Basic 5-minute metrics 100% free.
  - Systems Manager: Standard instance management at \$0.00 cost.
