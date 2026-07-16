$content = Get-Content "C:\Users\Peter\Desktop\Paytrack lite\paytrack\paytrack-lite-backend\index.js" -Raw
$startIdx = $content.IndexOf("app.post('/webhook/paystack'")
$endIdx = $content.IndexOf("app.use('/api/bookings'")
if ($startIdx -ge 0 -and $endIdx -gt $startIdx) {
    $content.Substring($startIdx, $endIdx - $startIdx)
} else {
    Write-Host "Could not locate handler boundaries, dumping whole file instead" -ForegroundColor Yellow
    $content
}