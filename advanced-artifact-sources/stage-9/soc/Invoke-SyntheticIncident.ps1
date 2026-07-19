param(
  [Parameter(Mandatory=$true)][string]$Marker,
  [Parameter(Mandatory=$true)][string]$SyntheticCsv,
  [string]$WorkRoot = 'C:\NetForge-Case'
)

$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Path $WorkRoot -Force | Out-Null
Copy-Item $SyntheticCsv "$WorkRoot\synthetic-records.csv" -Force
$Marker | Set-Content "$WorkRoot\evidence-marker.txt"
Compress-Archive -Path "$WorkRoot\synthetic-records.csv","$WorkRoot\evidence-marker.txt" -DestinationPath "$WorkRoot\case-export.zip" -Force
$bytes = [System.IO.File]::ReadAllBytes("$WorkRoot\case-export.zip")
$global:NetForgeResidentArchive = [Convert]::ToBase64String($bytes)
$global:NetForgeEvidenceMarker = $Marker
Register-ScheduledTask -TaskName 'Northstar Support Sync' -Action (New-ScheduledTaskAction -Execute 'cmd.exe' -Argument '/c exit 0') -Trigger (New-ScheduledTaskTrigger -Once -At ((Get-Date).AddHours(6))) -User $env:USERNAME -Force | Out-Null
Get-FileHash "$WorkRoot\case-export.zip" -Algorithm SHA256 | ConvertTo-Json | Set-Content "$WorkRoot\archive-hash.json"
Write-Host 'Synthetic archive is resident in this PowerShell process. Capture memory now, before closing this window.'
Read-Host 'Press Enter only after Capture-Memory.ps1 finishes'
