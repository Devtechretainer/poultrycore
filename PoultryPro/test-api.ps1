# Test User Management API
$baseUrl = "https://UserManagementAPI.techretainer.com"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing User Management API" -ForegroundColor Cyan
Write-Host "Base URL: $baseUrl" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Ping Endpoint
Write-Host "Test 1: Ping Endpoint" -ForegroundColor Yellow
Write-Host "URL: $baseUrl/api/Test/ping" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/Test/ping" -Method GET -ErrorAction Stop
    Write-Host "✅ SUCCESS" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor White
} catch {
    Write-Host "❌ FAILED" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
    }
}
Write-Host ""

# Test 2: Health Check
Write-Host "Test 2: Health Check" -ForegroundColor Yellow
Write-Host "URL: $baseUrl/api/Test/health" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/Test/health" -Method GET -ErrorAction Stop
    Write-Host "✅ SUCCESS" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor White
} catch {
    Write-Host "❌ FAILED" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
    }
}
Write-Host ""

# Test 3: Swagger UI
Write-Host "Test 3: Swagger UI" -ForegroundColor Yellow
Write-Host "URL: $baseUrl/swagger" -ForegroundColor Gray
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/swagger" -Method GET -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ SUCCESS - Status: $($response.StatusCode)" -ForegroundColor Green
    if ($response.Content -like "*swagger*") {
        Write-Host "Swagger UI is accessible" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ FAILED" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
    }
}
Write-Host ""

# Test 4: Authentication Endpoint (GET should return 405 Method Not Allowed)
Write-Host "Test 4: Authentication Endpoint" -ForegroundColor Yellow
Write-Host "URL: $baseUrl/api/Authentication/login" -ForegroundColor Gray
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/Authentication/login" -Method GET -UseBasicParsing -ErrorAction Stop
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Yellow
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 405) {
        Write-Host "✅ Endpoint exists (405 Method Not Allowed is expected for GET)" -ForegroundColor Green
    } elseif ($statusCode -eq 404) {
        Write-Host "❌ Endpoint not found (404)" -ForegroundColor Red
    } else {
        Write-Host "Status Code: $statusCode" -ForegroundColor Yellow
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 5: API Base
Write-Host "Test 5: API Base" -ForegroundColor Yellow
Write-Host "URL: $baseUrl/api" -ForegroundColor Gray
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api" -Method GET -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ SUCCESS - Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "Status Code: $statusCode" -ForegroundColor Yellow
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

