$ErrorActionPreference = 'Continue'
$env:HTTP_PROXY=$null; $env:HTTPS_PROXY=$null; $env:http_proxy=$null; $env:https_proxy=$null; $env:ALL_PROXY=$null; $env:all_proxy=$null
$map=@{}
Get-Content 'E:\Projects\New folder\.env' | ForEach-Object {
  if ($_ -match '^\s*([A-Z_]+)\s*=\s*(.*)\s*$') {
    $k=$matches[1]; $v=$matches[2].Trim().Split('#')[0].Trim().Trim('"').Trim("'").Trim()
    $map[$k]=$v
  }
}
$api=$map['DODO_API_KEY']
$base='https://test.dodopayments.com'
$monthlyId=$map['DODO_PRODUCT_MONTHLY_ID']
$annualId=$map['DODO_PRODUCT_ANNUAL_ID']
$h=@{ Authorization="Bearer $api" }
Write-Host "=== DODO ENV $base monthly=$monthlyId annual=$annualId ==="
try {
  $m = Invoke-RestMethod -Uri "$base/products/$monthlyId" -Headers $h -Method Get -TimeoutSec 15
  Write-Host "GET monthly 200 price=$($m.price.price) cur=$($m.price.currency) freq=$($m.price.payment_frequency_interval) id=$($m.product_id) name=$($m.name) recurring=$($m.is_recurring)"
} catch { Write-Host "GET monthly FAILED $($_.Exception.Message)" }
try {
  $a = Invoke-RestMethod -Uri "$base/products/$annualId" -Headers $h -Method Get -TimeoutSec 15
  Write-Host "GET annual 200 price=$($a.price.price) cur=$($a.price.currency) freq=$($a.price.payment_frequency_interval) id=$($a.product_id) name=$($a.name) recurring=$($a.is_recurring)"
} catch { Write-Host "GET annual FAILED $($_.Exception.Message)" }
$hJson=@{ Authorization="Bearer $api"; "Content-Type"="application/json" }
$bodyMonthly = @{ product_cart=@(@{ product_id=$monthlyId; quantity=1 }); return_url="https://toolsite-4q4w.vercel.app/account?checkout=success"; customer=@{ email="test+monthly@toolsite.local" }; metadata=@{ userId="test-user"; planId="PREMIUM_MONTHLY" } } | ConvertTo-Json -Depth 5
try {
  $r = Invoke-RestMethod -Uri "$base/checkouts" -Headers $hJson -Method Post -Body $bodyMonthly -TimeoutSec 15
  $url = $r.checkout_url; if (-not $url) { $url = $r.url }
  Write-Host "POST checkout MONTHLY 200 checkout_url=$url"
} catch {
  $resp=$_.Exception.Response; $code=""; $body=""
  if ($resp) { $code=[int]$resp.StatusCode; $s=$resp.GetResponseStream(); $rd=New-Object System.IO.StreamReader($s); $body=$rd.ReadToEnd() }
  Write-Host "POST checkout MONTHLY failed status $code body: $body err: $($_.Exception.Message)"
  try { $r2 = Invoke-RestMethod -Uri "$base/checkout_sessions" -Headers $hJson -Method Post -Body $bodyMonthly -TimeoutSec 15; Write-Host "POST checkout_sessions MONTHLY 200 url=$($r2.checkout_url)" } catch { $resp2=$_.Exception.Response; if ($resp2) { $s2=$resp2.GetResponseStream(); $rd2=New-Object System.IO.StreamReader($s2); Write-Host "checkout_sessions monthly failed: $($rd2.ReadToEnd())" } else { Write-Host "checkout_sessions monthly err $($_.Exception.Message)" } }
}
$bodyAnnual = @{ product_cart=@(@{ product_id=$annualId; quantity=1 }); return_url="https://toolsite-4q4w.vercel.app/account?checkout=success"; customer=@{ email="test+annual@toolsite.local" }; metadata=@{ userId="test-user"; planId="PREMIUM_ANNUAL" } } | ConvertTo-Json -Depth 5
try {
  $r = Invoke-RestMethod -Uri "$base/checkouts" -Headers $hJson -Method Post -Body $bodyAnnual -TimeoutSec 15
  $url = $r.checkout_url; if (-not $url) { $url = $r.url }
  Write-Host "POST checkout ANNUAL 200 checkout_url=$url"
} catch {
  $resp=$_.Exception.Response; $code=""; $body=""
  if ($resp) { $code=[int]$resp.StatusCode; $s=$resp.GetResponseStream(); $rd=New-Object System.IO.StreamReader($s); $body=$rd.ReadToEnd() }
  Write-Host "POST checkout ANNUAL failed status $code body: $body err: $($_.Exception.Message)"
  try { $r2 = Invoke-RestMethod -Uri "$base/checkout_sessions" -Headers $hJson -Method Post -Body $bodyAnnual -TimeoutSec 15; Write-Host "POST checkout_sessions ANNUAL 200 url=$($r2.checkout_url)" } catch { $resp2=$_.Exception.Response; if ($resp2) { $s2=$resp2.GetResponseStream(); $rd2=New-Object System.IO.StreamReader($s2); Write-Host "checkout_sessions annual failed: $($rd2.ReadToEnd())" } else { Write-Host "checkout_sessions annual err $($_.Exception.Message)" } }
}
$webhookUrl="https://toolsite-4q4w.vercel.app/api/payments/webhooks/dodo"
try { $r = Invoke-WebRequest -Uri $webhookUrl -Method Get -TimeoutSec 15 -UseBasicParsing; Write-Host "GET webhook $webhookUrl -> $($r.StatusCode) len $($r.Content.Length)" } catch { $resp=$_.Exception.Response; if ($resp) { Write-Host "GET webhook -> $([int]$resp.StatusCode) $($resp.StatusCode)"; $s=$resp.GetResponseStream(); $rd=New-Object System.IO.StreamReader($s); Write-Host $rd.ReadToEnd().Substring(0,600) } else { Write-Host "GET webhook err $($_.Exception.Message)" } }
try { $r = Invoke-WebRequest -Uri $webhookUrl -Method Post -Body '{}' -ContentType 'application/json' -TimeoutSec 15 -UseBasicParsing; Write-Host "POST webhook empty -> $($r.StatusCode)" } catch { $resp=$_.Exception.Response; if ($resp) { $code=[int]$resp.StatusCode; Write-Host "POST webhook empty -> $code $($resp.StatusCode)"; $s=$resp.GetResponseStream(); $rd=New-Object System.IO.StreamReader($s); $b=$rd.ReadToEnd(); Write-Host $b.Substring(0,800) } else { Write-Host "POST webhook err $($_.Exception.Message)" } }
