Write-Host "=== Does sales.js exist anywhere in the backend? ===" -ForegroundColor Cyan
Get-ChildItem -Path "C:\Users\Peter\Desktop\Paytrack lite\paytrack\paytrack-lite-backend" -Recurse -Filter "sales*.js" -Exclude node_modules |
    Select-Object FullName

Write-Host "`n=== Does a Sale model exist? ===" -ForegroundColor Cyan
Get-ChildItem -Path "C:\Users\Peter\Desktop\Paytrack lite\paytrack\paytrack-lite-backend\src\models" -Filter "*.js" |
    Select-Object Name

Write-Host "`n=== Full untruncated requireFeature matches (with file + line) ===" -ForegroundColor Cyan
Get-ChildItem -Path "C:\Users\Peter\Desktop\Paytrack lite\paytrack\paytrack-lite-backend\src\routes" -Include *.js -Recurse |
    Select-String -Pattern "requireFeature" |
    ForEach-Object { "$($_.Path):$($_.LineNumber): $($_.Line.Trim())" }

Write-Host "`n=== index.js route mounting (to see what's actually wired up) ===" -ForegroundColor Cyan
Get-Content "C:\Users\Peter\Desktop\Paytrack lite\paytrack\paytrack-lite-backend\index.js" | Select-String -Pattern "require\(|app\.use"