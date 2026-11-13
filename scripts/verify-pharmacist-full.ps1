$baseUrl = "http://15.135.82.107"

function Invoke-LoginTest($username, $password, $expectedStatus, $expectedRole, $testName) {
    Write-Host "[$testName]" -ForegroundColor Cyan
    $body = @{ username = $username; password = $password } | ConvertTo-Json
    $res = $null
    $actualStatus = $null
    try {
        $res = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $body -ContentType "application/json"
        $actualStatus = 200
    } catch {
        if ($_.Exception.Response) {
            $actualStatus = [int]$_.Exception.Response.StatusCode
        } else {
            $actualStatus = "Connection Error"
        }
    }

    $pass = ($actualStatus -eq $expectedStatus)
    if ($pass -and $actualStatus -eq 200) {
        $roleMatch = ($res.data.role -eq $expectedRole)
        $hasToken = ($null -ne $res.data.token -and $res.data.token.Length -gt 20)
        $userMatch = ($res.data.username -eq $username -or $res.data.email -eq $username)
        $pass = $roleMatch -and $hasToken
        Write-Host "  Result: $(if ($pass) {'PASS'} else {'FAIL'}) | HTTP $actualStatus | Role: $($res.data.role) | Token Present: $hasToken | User: $($res.data.username)" -ForegroundColor $(if ($pass) {'Green'} else {'Red'})
        return @{ Success = $pass; Token = $res.data.token; Role = $res.data.role }
    } else {
        Write-Host "  Result: $(if ($pass) {'PASS'} else {'FAIL'}) | Expected: HTTP $expectedStatus | Actual: HTTP $actualStatus" -ForegroundColor $(if ($pass) {'Green'} else {'Yellow'})
        return @{ Success = $pass; Token = $null; Role = $null }
    }
}

Write-Host "=================================================="
Write-Host " MediCore Live Authentication Matrix Verification "
Write-Host " Target: $baseUrl"
Write-Host "=================================================="

# 1. Admin Login (Regression Check)
$adminTest = Invoke-LoginTest "admin@medicore.com" "Admin@123" 200 "ADMIN" "Test: Admin Login"

# 2. Pharmacist with Documented Password (Pharmacist@123)
$pharmDocTest = Invoke-LoginTest "pharmacist@medicore.com" "Pharmacist@123" 200 "PHARMACIST" "Test: Pharmacist (Documented: Pharmacist@123)"

# 3. Pharmacist with Legacy Seed Password (Admin@123)
$pharmLegacyTest = Invoke-LoginTest "pharmacist@medicore.com" "Admin@123" 200 "PHARMACIST" "Test: Pharmacist (Legacy Seed: Admin@123)"

# 4. Incorrect Password
$badPassTest = Invoke-LoginTest "pharmacist@medicore.com" "IncorrectPassword!999" 401 "" "Test: Incorrect Pharmacist Password"

# 5. Unknown Email
$unknownUserTest = Invoke-LoginTest "unknown_user_98765@medicore.com" "AnyPassword123" 401 "" "Test: Unknown User Email"

# 6. Cashier Account Login
$cashierTest = Invoke-LoginTest "cashier@medicore.com" "Cashier@123" 200 "CASHIER" "Test: Cashier Login"

# 7. Authenticated Endpoint Verification (using active Pharmacist token)
$activePharmToken = if ($pharmLegacyTest.Token) { $pharmLegacyTest.Token } else { $pharmDocTest.Token }
if ($activePharmToken) {
    Write-Host "`n[Test: Pharmacist Authorized API Access]" -ForegroundColor Cyan
    $headers = @{ "Authorization" = "Bearer $activePharmToken" }
    
    # Dashboard Stats
    try {
        $dash = Invoke-RestMethod -Uri "$baseUrl/api/dashboard/stats" -Headers $headers -Method Get
        Write-Host "  GET /api/dashboard/stats: PASS (HTTP 200 | Total Medicines: $($dash.data.totalMedicines))" -ForegroundColor Green
    } catch {
        Write-Host "  GET /api/dashboard/stats: FAIL (HTTP $($_.Exception.Response.StatusCode))" -ForegroundColor Red
    }

    # Medicines List
    try {
        $meds = Invoke-RestMethod -Uri "$baseUrl/api/medicines" -Headers $headers -Method Get
        Write-Host "  GET /api/medicines: PASS (HTTP 200 | Items Returned: $($meds.data.content.Count))" -ForegroundColor Green
    } catch {
        Write-Host "  GET /api/medicines: FAIL (HTTP $($_.Exception.Response.StatusCode))" -ForegroundColor Red
    }

    # Inventory History
    try {
        $inv = Invoke-RestMethod -Uri "$baseUrl/api/inventory/history" -Headers $headers -Method Get
        Write-Host "  GET /api/inventory/history: PASS (HTTP 200)" -ForegroundColor Green
    } catch {
        Write-Host "  GET /api/inventory/history: FAIL (HTTP $($_.Exception.Response.StatusCode))" -ForegroundColor Red
    }
}

