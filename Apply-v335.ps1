$ErrorActionPreference = 'Stop'
try {
  $projectRoot = $PSScriptRoot
  $target = Join-Path $projectRoot 'src\pages\documents\CustomerRoofDocument.jsx'
  if (!(Test-Path $target)) { throw 'Extract this update into the app root (the folder containing src), then run again.' }
  $text = [System.IO.File]::ReadAllText($target)
  if (!$text.Contains('ModernOrderForm')) {
    if (!$text.Contains('<OrderForm key={record.id} data={d}/>')) { throw 'The expected Order Form render was not found. No existing file has been changed.' }
    $text = "import ModernOrderForm from './ModernOrderForm';" + [Environment]::NewLine + $text
    $text = $text.Replace('<OrderForm key={record.id} data={d}/>', '<ModernOrderForm key={record.id} data={d}/>')
  }
  if (!$text.Contains('contactName:customer?.contactName')) {
    $old = "email:customer?.email??'',phone:"
    if (!$text.Contains($old)) { throw 'The expected contact fields were not found. No existing file has been changed.' }
    $new = "contactName:customer?.contactName??'',siteContact:typeof delivery==='object'?delivery.contactName??'':'',sitePhone:typeof delivery==='object'?delivery.contactPhone??'':''," + [Environment]::NewLine + "  email:customer?.email??'',phone:"
    $text = $text.Replace($old,$new)
  }
  $backup = $target + '.before-v335-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.bak'
  Copy-Item $target $backup
  [System.IO.File]::WriteAllText($target,$text,(New-Object System.Text.UTF8Encoding($false)))
  Write-Host 'v335 installed. Your quotation signature and CSS edits have been preserved.' -ForegroundColor Green
} catch {
  Write-Host $_.Exception.Message -ForegroundColor Red
  exit 1
}
