param(
  [Parameter(Mandatory=$true)][string]$WinPmemExe,
  [Parameter(Mandatory=$true)][string]$Marker,
  [string]$OutputDirectory = 'D:\NetForge-Evidence'
)

$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
$image = Join-Path $OutputDirectory "memory-$Marker.raw"
$started = (Get-Date).ToUniversalTime().ToString('o')
& $WinPmemExe $image
if ($LASTEXITCODE -ne 0) { throw "WinPmem failed with exit code $LASTEXITCODE" }
$record = [ordered]@{
  marker = $Marker
  started_at = $started
  completed_at = (Get-Date).ToUniversalTime().ToString('o')
  image = (Split-Path $image -Leaf)
  image_bytes = (Get-Item $image).Length
  image_sha256 = (Get-FileHash $image -Algorithm SHA256).Hash.ToLower()
  capture_tool = (Split-Path $WinPmemExe -Leaf)
  capture_tool_sha256 = (Get-FileHash $WinPmemExe -Algorithm SHA256).Hash.ToLower()
}
$record | ConvertTo-Json | Set-Content (Join-Path $OutputDirectory 'memory-capture-manifest.json')
