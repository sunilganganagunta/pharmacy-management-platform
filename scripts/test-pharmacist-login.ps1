$baseUrl = "http://15.135.82.107"

function Test-Login($user, $pass, $label) {
    Write-Host "`n--- Testing $label ---" -ForegroundColor Cyan
    Write-Host "Identifier: $user | Password: $pass"
    $payload = @{
        username = $user
        password = $pass
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $payload -ContentType "application/json"
        Write-Host "Status: SUCCESS (HTTP 200)" -ForegroundColor Green
        Write-Host "Role: $($response.data.role)"
        Write-Host "Username: $($response.data.username)"
        Write-Host "Email: $($response.data.email)"
        Write-Host "Token Prefix: $($response.data.token.Substring(0, 20))..."
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "Status: FAILED (HTTP $statusCode)" -ForegroundColor Red
        if ($_.ErrorDetails) {
            Write-Host "Error Details: $($_.ErrorDetails.Message)"
        } else {
            Write-Host "Exception: $($_.Exception.Message)"
        }
    }
}

Test-Login "admin@medicore.com" "Admin@123" "Admin (email)"
Test-Login "pharmacist@medicore.com" "Pharmacist@123" "Pharmacist (email + Pharmacist@123)"
Test-Login "pharmacist@medicore.com" "Admin@123" "Pharmacist (email + Admin@123)"
Test-Login "pharmacist" "Pharmacist@123" "Pharmacist (username + Pharmacist@123)"
Test-Login "pharmacist" "Admin@123" "Pharmacist (username + Admin@123)"
Test-Login "cashier@medicore.com" "Cashier@123" "Cashier (email + Cashier@123)"
Test-Login "cashier" "Cashier@123" "Cashier (username + Cashier@123)"

