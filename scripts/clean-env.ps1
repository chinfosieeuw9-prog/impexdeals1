param(
  [switch]$Force
)

Write-Host "== ImpexDeals Clean Environment Script ==" -ForegroundColor Cyan
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $root

# Detect if running inside bedrijf-site
if (!(Test-Path package.json)) {
  Write-Error "No package.json found in current directory. Run inside bedrijf-site folder."; exit 1
}

Write-Host "Removing node_modules ..."
if (Test-Path node_modules) { Remove-Item -Recurse -Force node_modules }

if (Test-Path package-lock.json) {
  Write-Host "Removing package-lock.json ..."
  Remove-Item package-lock.json -Force
}

# Optionally rename parent package.json to avoid module resolution walking up
$parent = Split-Path -Parent $root
$parentPkg = Join-Path $parent 'package.json'
$backup = Join-Path $parent 'package.json.impex.bak'
if (Test-Path $parentPkg) {
  if ($Force -and (Test-Path $backup)) { Remove-Item $backup -Force }
  if (!(Test-Path $backup)) {
    Write-Host "Backing up parent package.json to package.json.impex.bak to prevent duplicate React." -ForegroundColor Yellow
    Rename-Item $parentPkg 'package.json.impex.bak'
  } else {
    Write-Host "Parent backup already exists; skipping rename." -ForegroundColor DarkYellow
  }
}

Write-Host "Installing fresh dependencies ..."
npm install

Write-Host "Done. Start dev server met: npm start" -ForegroundColor Green
Pop-Location
