# Test User Registration
$baseUrl = "https://usermanagementapi.poultrycore.com"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing User Registration" -ForegroundColor Cyan
Write-Host "URL: $baseUrl/api/Authentication/Register" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test with valid password (meets all requirements)
$registerData = @{
    farmName = "Test Farm $(Get-Date -Format 'yyyyMMddHHmmss')"
    username = "testuser$(Get-Date -Format 'yyyyMMddHHmmss')"
    email = "test$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
    password = "testpass"
    firstName = "Test"
    lastName = "User"
    phoneNumber = "+1234567890"
    roles = @("User")
}

$body = $registerData | ConvertTo-Json

Write-Host "Registration Data:" -ForegroundColor Yellow
Write-Host $body -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/Authentication/Register" `
        -Method POST `
        -Body $body `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "✅ REGISTRATION SUCCESSFUL!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 5 | Write-Host
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "❌ REGISTRATION FAILED" -ForegroundColor Red
    Write-Host "Status Code: $statusCode" -ForegroundColor Yellow
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        $reader.Close()
        
        Write-Host ""
        Write-Host "Error Response:" -ForegroundColor Yellow
        Write-Host $responseBody -ForegroundColor White
        
        # Try to parse as JSON
        try {
            $errorObj = $responseBody | ConvertFrom-Json
            if ($errorObj.message) {
                Write-Host ""
                Write-Host "Error Message: $($errorObj.message)" -ForegroundColor Red
            }
        } catch {
            # Not JSON, just show raw response
        }
    }
    
    Write-Host ""
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Password Requirements:" -ForegroundColor Yellow
Write-Host "  - Minimum 4 characters" -ForegroundColor White
Write-Host "  - Any characters allowed (simple passwords accepted)" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan

