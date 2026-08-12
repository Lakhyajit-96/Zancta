$ErrorActionPreference = 'Stop'
$envPath = 'E:\Projects\New folder\.env'
$lines = Get-Content $envPath
$map = @{}
foreach ($line in $lines) {
  if ($line.Trim() -eq '' -or $line.Trim().StartsWith('#')) { continue }
  if ($line -match '^\s*([A-Z_]+)\s*=\s*(.*)\s*$') {
    $k = $matches[1]
    $v = $matches[2].Trim().Split('#')[0].Trim().Trim('"').Trim("'").Trim()
    $map[$k] = $v
  }
}
$api = $map['DODO_API_KEY']
$monthly = $map['DODO_PRODUCT_MONTHLY_ID']
$annual = $map['DODO_PRODUCT_ANNUAL_ID']
$base = 'https://test.dodopayments.com'
$env:HTTP_PROXY=$null; $env:HTTPS_PROXY=$null; $env:ALL_PROXY=$null; $env:http_proxy=$null; $env:https_proxy=$null; $env:all_proxy=$null
$headers = @{ Authorization = "Bearer $api" }
try {
  $resp = Invoke-RestMethod -Uri "$base/products" -Headers $headers -Method Get -TimeoutSec 15
  Write-Host "GET /products 200 items count: $($resp.items.Count)"
  foreach ($item in $resp.items) {
    $id = $item.product_id
    $name = $item.name
    $price = $item.price
    $cur = $item.currency
    $rec = $item.is_recurring
    $int = $item.recurring_interval
    Write-Host "  product $id name=$name price=$price cur=$cur recurring=$rec interval=$int"
  }
  $foundMonthly = $resp.items | Where-Object { $_.product_id -eq $monthly }
  $foundAnnual = $resp.items | Where-Object { $_.product_id -eq $annual }
  Write-Host "monthly $monthly found: $($null -ne $foundMonthly) annual found: $($null -ne $foundAnnual)"
  if ($foundMonthly) { Write-Host "monthly detail: price=$($foundMonthly.price) cur=$($foundMonthly.currency) interval=$($foundMonthly.recurring_interval)" }
  if ($foundAnnual) { Write-Host "annual detail: price=$($foundAnnual.price) cur=$($foundAnnual.currency) interval=$($foundAnnual.recurring_interval)" }
} catch {
  Write-Host "GET /products failed: $($_.Exception.Message)"
  try { $s=$_.Exception.Response.GetResponseStream(); $r=New-Object System.IO.StreamReader($s); Write-Host $r.ReadToEnd().Substring(0,800) } catch {}
}
# Individual fetch
foreach ($pid in @($monthly, $annual)) {
  try {
    $r = Invoke-RestMethod -Uri "$base/products/$pid" -Headers $headers -Method Get -TimeoutSec 15
    Write-Host "GET /products/$($pid.Substring(0,8)) -> 200 name=$($r.name) price=$($r.price) cur=$($r.currency) rec=$($r.is_recurring) int=$($r.recurring_interval)"
  } catch {
    Write-Host "GET /products/$($pid.Substring(0,8)) failed: $($_.Exception.Response.StatusCode.value__)"
  }
}
