# ========================================================
# MediCore Production End-to-End Business Workflow Test Suite
# Target Host: http://15.135.82.107
# ========================================================

$baseUrl = "http://15.135.82.107"
$results = @()

function Record-Test($category, $testName, $expectedCode, $actualCode, $passed, $details) {
    $script:results += [PSCustomObject]@{
        Category     = $category
        TestName     = $testName
        ExpectedHTTP = $expectedCode
        ActualHTTP   = $actualCode
        Status       = if ($passed) { "PASSED" } else { "FAILED" }
        Details      = $details
    }
}

Write-Host "Starting MediCore Production Business Workflow Verification against $baseUrl..." -ForegroundColor Cyan

# ----------------------------------------------------
# 1. Health & Actuator Check
# ----------------------------------------------------
try {
    $r = Invoke-RestMethod -Uri "$baseUrl/actuator/health" -Method Get
    Record-Test "Infrastructure" "Actuator Liveness & DB Ping" 200 200 ($r.status -eq "UP" -and $r.components.db.status -eq "UP") "DB: $($r.components.db.status), Disk: $($r.components.diskSpace.status)"
} catch {
    Record-Test "Infrastructure" "Actuator Liveness & DB Ping" 200 $_.Exception.Response.StatusCode.value__ $false $_.Exception.Message
}

# ----------------------------------------------------
# 2. Authentication: Valid Admin Login
# ----------------------------------------------------
$adminToken = ""
try {
    $body = @{ username = "admin"; password = "Admin@123" } | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $body -ContentType "application/json"
    $adminToken = $r.data.token
    $role = $r.data.role
    Record-Test "Authentication" "Valid Admin Login" 200 200 ($role -eq "ADMIN" -and $adminToken.Length -gt 20) "Role: $role, Token: $($adminToken.Substring(0, 15))..."
} catch {
    Record-Test "Authentication" "Valid Admin Login" 200 $_.Exception.Response.StatusCode.value__ $false $_.Exception.Message
}

# ----------------------------------------------------
# 3. Authentication: Valid Pharmacist Login
# ----------------------------------------------------
$pharmacistToken = ""
try {
    $body = @{ username = "pharmacist"; password = "Admin@123" } | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $body -ContentType "application/json"
    $pharmacistToken = $r.data.token
    $role = $r.data.role
    Record-Test "Authentication" "Valid Pharmacist Login" 200 200 ($role -eq "PHARMACIST") "Role: $role"
} catch {
    Record-Test "Authentication" "Valid Pharmacist Login" 200 $_.Exception.Response.StatusCode.value__ $false $_.Exception.Message
}

# ----------------------------------------------------
# 4. Authentication: Invalid Password Attempt (401 Expected)
# ----------------------------------------------------
try {
    $body = @{ username = "admin"; password = "WrongPassword999!" } | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $body -ContentType "application/json"
    Record-Test "Authentication" "Invalid Password Rejected" 401 200 $false "Unexpectedly succeeded"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    Record-Test "Authentication" "Invalid Password Rejected" 401 $code ($code -eq 401) "Properly rejected with 401 Unauthorized"
}

# ----------------------------------------------------
# 5. Security: Unauthenticated Access to Protected API (401 Expected)
# ----------------------------------------------------
try {
    $r = Invoke-RestMethod -Uri "$baseUrl/api/dashboard/stats" -Method Get
    Record-Test "Security" "Reject Unauthenticated API Call" 401 200 $false "Allowed unauthenticated request"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    Record-Test "Security" "Reject Unauthenticated API Call" 401 $code ($code -eq 401) "Blocked unauthenticated request"
}

# ----------------------------------------------------
# 6. Dashboard Stats (Admin Auth)
# ----------------------------------------------------
$authHeader = @{ "Authorization" = "Bearer $adminToken" }
try {
    $r = Invoke-RestMethod -Uri "$baseUrl/api/dashboard/stats" -Method Get -Headers $authHeader
    $stats = $r.data
    Record-Test "Dashboard" "Retrieve Dashboard Statistics" 200 200 ($stats.totalMedicines -ge 15) "Medicines: $($stats.totalMedicines), Suppliers: $($stats.totalSuppliers), LowStock: $($stats.lowStockCount)"
} catch {
    Record-Test "Dashboard" "Retrieve Dashboard Statistics" 200 $_.Exception.Response.StatusCode.value__ $false $_.Exception.Message
}

# ----------------------------------------------------
# 7. Medicine Search by Generic / Brand Name
# ----------------------------------------------------
try {
    $r = Invoke-RestMethod -Uri "$baseUrl/api/medicines?search=Amoxicillin" -Method Get -Headers $authHeader
    $items = $r.data.content
    Record-Test "Medicines" "Medicine Search by Query" 200 200 ($items.Count -ge 1) "Found $($items.Count) match for Amoxicillin"
} catch {
    Record-Test "Medicines" "Medicine Search by Query" 200 $_.Exception.Response.StatusCode.value__ $false $_.Exception.Message
}

# ----------------------------------------------------
# 8. Medicine Barcode Lookup
# ----------------------------------------------------
try {
    $r = Invoke-RestMethod -Uri "$baseUrl/api/medicines/barcode/890103001015" -Method Get -Headers $authHeader
    $med = $r.data
    Record-Test "Medicines" "Barcode Lookup (890103001015)" 200 200 ($med.name -like "*Amoxil*") "Resolved: $($med.name) (Batch: $($med.batchNumber))"
} catch {
    Record-Test "Medicines" "Barcode Lookup (890103001015)" 200 $_.Exception.Response.StatusCode.value__ $false $_.Exception.Message
}

# ----------------------------------------------------
# 9. Medicine CRUD: Create New Medicine
# ----------------------------------------------------
$testMedId = 0
try {
    $medPayload = @{
        name = "Azithromycin 500mg (E2E Test)"
        genericName = "Azithromycin"
        brand = "Aziwok"
        batchNumber = "AZ-TEST-$(Get-Random -Minimum 1000 -Maximum 9999)"
        barcode = "890$(Get-Random -Minimum 1000000000 -Maximum 9999999999)"
        purchasePrice = 75.50
        sellingPrice = 120.00
        availableQuantity = 50
        minimumStock = 10
        expiryDate = (Get-Date).AddMonths(18).ToString("yyyy-MM-dd")
        description = "Automated test batch"
        active = $true
    } | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "$baseUrl/api/medicines" -Method Post -Headers $authHeader -Body $medPayload -ContentType "application/json"
    $testMedId = $r.data.id
    Record-Test "Medicines" "Create Medicine Record (POST)" 200 200 ($testMedId -gt 0) "Created Medicine ID: $testMedId"
} catch {
    Record-Test "Medicines" "Create Medicine Record (POST)" 200 $_.Exception.Response.StatusCode.value__ $false $_.Exception.Message
}

# ----------------------------------------------------
# 10. Medicine CRUD: Update Created Medicine
# ----------------------------------------------------
if ($testMedId -gt 0) {
    try {
        $updatePayload = @{
            name = "Azithromycin 500mg (Updated E2E Test)"
            genericName = "Azithromycin"
            brand = "Aziwok"
            batchNumber = "AZ-TEST-UPDATED"
            purchasePrice = 80.00
            sellingPrice = 130.00
            availableQuantity = 45
            minimumStock = 10
            expiryDate = (Get-Date).AddMonths(18).ToString("yyyy-MM-dd")
            active = $true
        } | ConvertTo-Json
        $r = Invoke-RestMethod -Uri "$baseUrl/api/medicines/$testMedId" -Method Put -Headers $authHeader -Body $updatePayload -ContentType "application/json"
        Record-Test "Medicines" "Update Medicine Record (PUT)" 200 200 ($r.data.sellingPrice -eq 130.00) "Updated Selling Price to 130.00"
    } catch {
        Record-Test "Medicines" "Update Medicine Record (PUT)" 200 $_.Exception.Response.StatusCode.value__ $false $_.Exception.Message
    }
}

# ----------------------------------------------------
# 11. Suppliers: List Suppliers
# ----------------------------------------------------
try {
    $r = Invoke-RestMethod -Uri "$baseUrl/api/suppliers" -Method Get -Headers $authHeader
    $suppliers = $r.data
    Record-Test "Suppliers" "List Active Suppliers" 200 200 ($suppliers.Count -ge 5) "Total active suppliers: $($suppliers.Count)"
} catch {
    Record-Test "Suppliers" "List Active Suppliers" 200 $_.Exception.Response.StatusCode.value__ $false $_.Exception.Message
}

# ----------------------------------------------------
# 12. POS: Insufficient Stock Rejection (Conflict / 409 Expected)
# ----------------------------------------------------
try {
    $oversellPayload = @{
        customerName = "Test Oversell"
        customerPhone = "+91 99999 88888"
        items = @(
            @{ medicineId = 1; quantity = 99999 } # Far exceeds available stock
        )
        paymentMethod = "CASH"
    } | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "$baseUrl/api/sales" -Method Post -Headers $authHeader -Body $oversellPayload -ContentType "application/json"
    Record-Test "POS & Sales" "Insufficient Stock Handled (Negative Test)" 409 200 $false "Oversell was permitted!"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    Record-Test "POS & Sales" "Insufficient Stock Handled (Negative Test)" 409 $code ($code -eq 409 -or $code -eq 400) "Correctly blocked with HTTP $code (Insufficient stock)"
}

# ----------------------------------------------------
# 13. POS: Process Valid Sale Transaction
# ----------------------------------------------------
$invoiceNumber = ""
try {
    $validSalePayload = @{
        customerName = "Anita Roy"
        customerPhone = "+91 98765 43299"
        items = @(
            @{ medicineId = 1; quantity = 2 }
        )
        discountPercent = 5.0
        taxPercent = 12.0
        paymentMethod = "CASH"
        notes = "Automated POS E2E Sale Verification"
    } | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "$baseUrl/api/sales" -Method Post -Headers $authHeader -Body $validSalePayload -ContentType "application/json"
    $invoiceNumber = $r.data.invoiceNumber
    Record-Test "POS & Sales" "Process Sale Transaction (POST)" 200 200 ($invoiceNumber.Length -gt 3) "Generated Invoice: $invoiceNumber, Total: $($r.data.totalAmount)"
} catch {
    Record-Test "POS & Sales" "Process Sale Transaction (POST)" 200 $_.Exception.Response.StatusCode.value__ $false $_.Exception.Message
}

# ----------------------------------------------------
# 14. Reports: Export Sales CSV
# ----------------------------------------------------
try {
    $r = Invoke-WebRequest -Uri "$baseUrl/api/reports/export/sales" -Method Get -Headers $authHeader -UseBasicParsing -TimeoutSec 10
    $isCsv = $r.Headers["Content-Type"] -like "*text/csv*" -or $r.Content -like "*Invoice Number*"
    Record-Test "Reports" "Export Sales CSV Report" 200 $r.StatusCode $isCsv "Content-Type: $($r.Headers['Content-Type']), Bytes: $($r.RawContentLength)"
} catch {
    Record-Test "Reports" "Export Sales CSV Report" 200 $_.Exception.Response.StatusCode.value__ $false $_.Exception.Message
}

# ----------------------------------------------------
# 15. Reports: Export Inventory CSV
# ----------------------------------------------------
try {
    $r = Invoke-WebRequest -Uri "$baseUrl/api/reports/export/inventory" -Method Get -Headers $authHeader -UseBasicParsing -TimeoutSec 10
    $isCsv = $r.Headers["Content-Type"] -like "*text/csv*" -or $r.Content -like "*Medicine Name*"
    Record-Test "Reports" "Export Inventory CSV Report" 200 $r.StatusCode $isCsv "Content-Type: $($r.Headers['Content-Type']), Bytes: $($r.RawContentLength)"
} catch {
    Record-Test "Reports" "Export Inventory CSV Report" 200 $_.Exception.Response.StatusCode.value__ $false $_.Exception.Message
}

# ----------------------------------------------------
# 16. Notifications: Unread Count API
# ----------------------------------------------------
try {
    $r = Invoke-RestMethod -Uri "$baseUrl/api/notifications/unread-count" -Method Get -Headers $authHeader
    Record-Test "Notifications" "Fetch Unread Notification Count" 200 200 ($r.data.unreadCount -ge 0) "Unread Notifications: $($r.data.unreadCount)"
} catch {
    Record-Test "Notifications" "Fetch Unread Notification Count" 200 $_.Exception.Response.StatusCode.value__ $false $_.Exception.Message
}

# ----------------------------------------------------
# 17. Cleanup Test Medicine (Delete)
# ----------------------------------------------------
if ($testMedId -gt 0) {
    try {
        $r = Invoke-RestMethod -Uri "$baseUrl/api/medicines/$testMedId" -Method Delete -Headers $authHeader
        Record-Test "Medicines" "Delete Medicine Record (DELETE)" 200 200 $true "Deleted test medicine ID: $testMedId"
    } catch {
        Record-Test "Medicines" "Delete Medicine Record (DELETE)" 200 $_.Exception.Response.StatusCode.value__ $false $_.Exception.Message
    }
}

# ----------------------------------------------------
# Output Formatted Results Table
# ----------------------------------------------------
Write-Host "`n=== MediCore End-to-End Business Workflow Test Results ===" -ForegroundColor Green
$results | Format-Table -Property Category, TestName, ExpectedHTTP, ActualHTTP, Status, Details -AutoSize
