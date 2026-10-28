@echo off
setlocal
cd /d "%~dp0"
title Timberlite QuoteApp - Local app and delivery API
if not exist "package.json" (
  echo Put this launcher in the QuoteApp project folder beside package.json.
  pause
  exit /b 1
)
if not exist "api\delivery-distance.js" (
  echo Missing api\delivery-distance.js. Restore that file before starting.
  pause
  exit /b 1
)
where npx >nul 2>&1
if errorlevel 1 (
  echo Node.js / npx was not found. Open this launcher on your usual development PC.
  pause
  exit /b 1
)
echo Close the old npm start window first.
echo This starts a LOCAL app and API. It does not deploy your website.
echo First run: allow installation of Vercel CLI if asked, sign in,
echo and link to the EXISTING QuoteApp project, not a new project.
echo Development needs GOOGLE_MAPS_API_KEY and BUSINESS_POSTCODE.
echo Keep this window open. QuoteApp will open at http://localhost:3000/quote.
echo.
REM Stop React opening its private random-port URL.
set "BROWSER=none"
REM Open the working URL only after the delivery endpoint answers.
start "" /b powershell.exe -NoProfile -Command "$deadline=(Get-Date).AddMinutes(10); while((Get-Date) -lt $deadline){ $ready=$false; try { $null=Invoke-WebRequest -Uri 'http://localhost:3000/api/delivery-distance' -Method Get -UseBasicParsing -TimeoutSec 2 } catch { if($_.Exception.Response -and [int]$_.Exception.Response.StatusCode -eq 405){ $ready=$true } }; if($ready){ Start-Process 'http://localhost:3000/quote'; exit }; Start-Sleep -Seconds 2 }"
call npx vercel dev --listen 3000
set "quoteapp_exit_code=%errorlevel%"
echo.
echo Local server stopped. Review any error above.
pause
exit /b %quoteapp_exit_code%
