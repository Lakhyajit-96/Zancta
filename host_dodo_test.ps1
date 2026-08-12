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
$envMode = $map['DODO_ENVIRONMENT']
if (-not $envMode) { $envMode = 'test' }
$base = if ($envMode.ToLower() -in @('live','production','live_mode')) { 'https://live.dodopayments.com' } else { 'https://test.dodopayments.com' }
Write-Host "env=$envMode base=$base api_len=$($api.Length) prefix=$($api.Substring(0,4)) monthly=$($map['DODO_PRODUCT_MONTHLY_ID'].Substring(0,8)) annual=$($map['DODO_PRODUCT_ANNUAL_ID'].Substring(0,8))"
# Clear proxy for host test
$env:HTTP_PROXY = $null; $env:HTTPS_PROXY = $null; $env:ALL_PROXY = $null; $env:http_proxy = $null; $env:https_proxy = $null; $env:all_proxy = $null
try {
  $headers = @{ Authorization = "Bearer $api" }
  $resp = Invoke-RestMethod -Uri "$base/products" -Headers $headers -Method Get -TimeoutSec 15
  Write-Host "HOST GET /products -> 200 keys=$($resp.PSObject.Properties.Name -join ',')"
  $first = $resp | Select-Object -First 1
  Write-Host "HOST first product id: $($first.id) name: $($first.name)"
} catch {
  $status = $_.Exception.Response.StatusCode.value__
  $body = ''
  try {
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $body = $reader.ReadToEnd()
  } catch {}
  Write-Host "HOST GET /products -> $status"
  Write-Host "HOST body: $($body.Substring(0,500))"
  Write-Host "HOST error: $($_.Exception.Message.Substring(0,500))"
}
