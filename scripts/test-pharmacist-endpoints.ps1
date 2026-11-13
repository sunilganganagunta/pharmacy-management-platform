$baseUrl = "http://15.135.82.107"

Write-Host "=== Testing Pharmacist Authentication & Permissions ===" -ForegroundColor Cyan

# 1. Login with Pharmacist
$loginPayload = @{
    username = "pharmacist@medicore.com"
    password = "Admin@123"
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $loginPayload -ContentType "application/json"
$pharmToken = $loginRes.data.token
$pharmHeaders = @{ "Authorization" = "Bearer $pharmToken" }

Write-Host "Pharmacist Token Acquired. Role: $($loginRes.data.role)" -ForegroundColor Green

function Test-Endpoint($url, $method, $headers, $expectedStatus, $desc) {
    try {
        $r = Invoke-RestMethod -Uri "$baseUrl$url" -Method $method -Headers $headers -ContentType "application/json"
        Write-Host "[$expectedStatus] PASS: $desc (HTTP 200)" -ForegroundColor Green
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        if ($code -eq $expectedStatus) {
            Write-Host "[$expectedStatus] PASS: $desc (HTTP $code as expected)" -ForegroundColor Green
        } else {
            Write-Host "[$expectedStatus] FAIL: $desc (Actual: HTTP $code)" -ForegroundColor Red
        }
    }
}

# Permitted Pharmacist Endpoints
Test-Endpoint "/api/dashboard/stats" "Get" $pharmHeaders 200 "Dashboard Stats"
Test-Endpoint "/api/medicines" "Get" $pharmHeaders 200 "Medicine Search"
Test-Endpoint "/api/inventory/history" "Get" $pharmHeaders 200 "Inventory History"
Test-Endpoint "/api/purchases" "Get" $pharmHeaders 200 "Purchase Orders"
Test-Endpoint "/api/suppliers" "Get" $pharmHeaders 200 "Suppliers List"
Test-Endpoint "/api/customers" "Get" $pharmHeaders 200 "Customers List"
Test-Endpoint "/api/reports/sales?range=daily" "Get" $pharmHeaders 200 "Daily Sales Report"
Test-Endpoint "/api/notifications/unread-count" "Get" $pharmHeaders 200 "Unread Notifications"
Test-Endpoint "/api/auth/me" "Get" $pharmHeaders 200 "Current User Profile (/auth/me)"

# Forbidden Pharmacist Endpoints (Admin-only operations, e.g. medicine deletion)
Test-Endpoint "/api/medicines/999999" "Delete" $pharmHeaders 403 "Forbidden: Admin Medicine Deletion"

# Missing / Invalid JWT
Test-Endpoint "/api/dashboard/stats" "Get" @{} 401 "Forbidden: Missing JWT"
$invalidHeader = @{ "Authorization" = "Bearer invalid.fake.token" }
Test-Endpoint "/api/dashboard/stats" "Get" $invalidHeader 401 "Forbidden: Invalid JWT"

