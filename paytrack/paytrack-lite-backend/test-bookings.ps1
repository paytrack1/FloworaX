$uniqueId = Get-Date -Format "yyyyMMddHHmmss"
$email = "bookingtest$uniqueId@example.com"

$body = @{ email = $email; password = "testpass123"; businessName = "Booking Test Biz" } | ConvertTo-Json
$res = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method Post -Body $body -ContentType "application/json"
$token = $res.token
if (-not $token) {
    Write-Host "REGISTRATION FAILED - stopping" -ForegroundColor Red
    exit
}
$headers = @{ Authorization = "Bearer $token" }
Write-Host "Registered as $email" -ForegroundColor Cyan

$serviceBody = @{ title = "Test Service"; price = 0; isFree = $true; duration = 30 } | ConvertTo-Json
$service = Invoke-RestMethod -Uri "http://localhost:3000/api/services" -Method Post -Headers $headers -Body $serviceBody -ContentType "application/json"
$serviceId = $service.service._id
if (-not $serviceId) {
    Write-Host "SERVICE CREATION FAILED - stopping" -ForegroundColor Red
    exit
}
Write-Host "Service created: $serviceId" -ForegroundColor Cyan

for ($i = 1; $i -le 3; $i++) {
    $bookingBody = @{
        serviceId = $serviceId
        clientName = "Client $i"
        clientEmail = "client$i-$uniqueId@example.com"
        scheduledDate = "2026-08-0$i"
        scheduledTime = "10:00"
    } | ConvertTo-Json
    try {
        $booking = Invoke-RestMethod -Uri "http://localhost:3000/api/bookings/public" -Method Post -Body $bookingBody -ContentType "application/json"
        Write-Host "Booking $i created" -ForegroundColor Green
    } catch {
        $errorDetails = $_.ErrorDetails.Message
        Write-Host "Booking $i BLOCKED: $errorDetails" -ForegroundColor Yellow
    }
}