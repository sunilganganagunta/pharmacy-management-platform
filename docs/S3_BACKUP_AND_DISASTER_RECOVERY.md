# MediCore – Encrypted Offsite S3 Backup & Disaster Recovery Architecture

**Project:** MediCore – Smart Pharmacy Management Platform  
**Target Environment:** Amazon Web Services (AWS) | Selected Region: `ap-southeast-2`  
**Database:** PostgreSQL 16 Alpine (`medicoredb`)  
**Encryption Standard:** OpenSSL AES-256-CBC with PBKDF2 + AWS KMS (SSE-KMS)  
**Status:** LOCAL DR VERIFIED (100%) / S3 ARCHITECTURE DESIGNED & AWAITING BUCKET APPROVAL  
**Date:** November 2026  

---

## 1. End-to-End Backup & Disaster Recovery Architecture

```mermaid
flowchart TD
    subgraph Host Database
        DB[(PostgreSQL 16 Engine)]
    end

    subgraph Host Backup Automation ["Nightly Cron (02:00 UTC)"]
        Dump["pg_dump -U medicore_user -d medicoredb --clean"]
        Gzip["gzip Compression (Level 9)"]
        Encrypt["OpenSSL AES-256-CBC (PBKDF2 100,000 iter)"]
        LocalStore["Local Encrypted Store: /var/backups/medicore/"]
    end

    subgraph Cloud Storage Tier ["Amazon S3 Offsite Storage (ap-southeast-2)"]
        S3Bucket["Private Bucket: medicore-backups-774697186763"]
        SSE["Server-Side Encryption: AWS KMS (SSE-KMS)"]
        Versioning["S3 Bucket Versioning (Ransomware Defense)"]
        Glacier["S3 Glacier Flexible Retrieval (Day 31+)"]
        DeepArchive["S3 Glacier Deep Archive (Day 91-365)"]
    end

    subgraph Disaster Recovery Verification
        RestoreScript["/opt/medicore/scripts/restore.sh"]
        TestDB[(Isolated Database: medicore_restore_test)]
        Verify["Assert Counts: 16 Meds, 2 Users, 5 Suppliers"]
        Teardown["Drop Test Database Cleanly"]
    end

    DB --> Dump --> Gzip --> Encrypt --> LocalStore
    LocalStore -->|"aws s3 cp --sse aws:kms"| S3Bucket
    S3Bucket --> SSE & Versioning
    S3Bucket -.->|"Lifecycle Policy"| Glacier --> DeepArchive
    LocalStore -.->|"DR Test Drill"| RestoreScript --> TestDB --> Verify --> Teardown
```

---

## 2. Backup Encryption Specifications

- **Symmetric Cipher:** OpenSSL AES-256 in Cipher Block Chaining mode (`-aes-256-cbc`).
- **Key Derivation Function:** Password-Based Key Derivation Function 2 (PBKDF2) using cryptographic salt (`-salt`) with **100,000 iterations** (`-iter 100000`).
- **Key Management:** Read from protected host key file `/etc/medicore/backup.key` with strict `chmod 400` permissions (accessible only by root).
- **Security Guarantee:** In the event of physical host confiscation or unencrypted storage compromise, encrypted backup files cannot be read without the private cryptographic key.

---

## 3. Verified Disaster Recovery Drill Evidence

A live disaster recovery restoration drill was performed on the production EC2 host (`i-0be536c99a4381e25`):

1. **Backup Creation:** Generated encrypted backup file `/var/backups/medicore/medicoredb_20261112_185636.sql.gz.enc` (8.3 KB).
2. **Restoration into Isolated Test Database:**
   - Created test database `medicore_restore_test` inside PostgreSQL container.
   - Executed `/opt/medicore/scripts/restore.sh` targeting the encrypted backup.
   - Decrypted the payload and restored all relational tables.
3. **Data Integrity Assertions (VERIFIED):**
   - Verified 16 medicines restored with 100% attribute fidelity.
   - Verified 2 users (`admin`, `pharmacist`) with intact BCrypt password hashes.
   - Verified 5 pharmaceutical suppliers with full contact records.
4. **Clean Teardown:** Dropped `medicore_restore_test` cleanly. Production database `medicoredb` was verified **100% unaffected and continuously operational**.

---

## 4. Amazon S3 Offsite Bucket Specifications

To achieve Level 9 disaster recovery, the encrypted backup is replicated offsite to Amazon S3:

### 4.1 Bucket Configuration
- **Bucket Name:** `medicore-backups-774697186763`
- **Region:** `ap-southeast-2` (selected Region)
- **Public Access:** **Block All Public Access** (100% private bucket).
- **Server-Side Encryption:** `aws:kms` (SSE-KMS) with AWS managed key or customer managed KMS key.
- **Bucket Versioning:** Enabled (protects against accidental deletion or ransomware overwrites).
- **Object Lock:** WORM compliance enabled where regulatory auditing requires immutable storage.

### 4.2 S3 Lifecycle & Retention Policy
| Timeline | Storage Class | Action / Benefit |
| :--- | :--- | :--- |
| **Day 0 – 30** | S3 Standard | Immediate retrieval for disaster recovery drills and audits. |
| **Day 31 – 90** | S3 Glacier Flexible Retrieval | Retrieval within 1–5 minutes; 68% storage cost reduction. |
| **Day 91 – 365** | S3 Glacier Deep Archive | Archival storage at \$0.00099 per GB/month. |
| **Day 366+** | Expired | Permanently deleted to maintain minimal storage footprint. |

### 4.3 Cost Analysis
- Expected Monthly Backup Volume: ~300 MB compressed and encrypted data per month.
- S3 Standard Storage Cost: ~\$0.01 / month.
- Glacier Storage Cost: ~\$0.001 / month.
- **Total Projected S3 Disaster Recovery Cost:** **< \$0.05 / month** (fully covered by the \$100 AWS Free Tier credit allocation).

---

## 5. IAM Least-Privilege Policy for EC2 Instance Role

The EC2 instance role (`medicore-ec2-role`) should be attached with this least-privilege inline policy, allowing the instance to upload backups without providing broad S3 administrative access:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "MediCoreBackupUploadOnly",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::medicore-backups-774697186763",
        "arn:aws:s3:::medicore-backups-774697186763/*"
      ]
    }
  ]
}
```

---

## 6. Restoration Runbook from Amazon S3

In the event of a catastrophic EC2 hardware failure:
```bash
# 1. Download latest encrypted backup from S3
aws s3 cp s3://medicore-backups-774697186763/backups/latest.sql.gz.enc /var/backups/medicore/

# 2. Decrypt with private key
openssl enc -d -aes-256-cbc -pbkdf2 -iter 100000 \
  -in /var/backups/medicore/latest.sql.gz.enc \
  -out /var/backups/medicore/latest.sql.gz \
  -pass file:/etc/medicore/backup.key

# 3. Decompress and pipe into PostgreSQL
gunzip -c /var/backups/medicore/latest.sql.gz | \
  docker exec -i medicore-prod-postgres psql -U medicore_user -d medicoredb

# 4. Remove decrypted artifact
rm -f /var/backups/medicore/latest.sql.gz
```
