# Menu Context Verifier Script
Write-Host "🔍 Analyzing menu context configurations..." -ForegroundColor Cyan

# Paths to the files
$contextMenuPath = "d:\Code\GitHub\testudoq3 - ori\pack\context-menu.mjs"
$chromeMenuBuilderPath = "d:\Code\GitHub\testudoq3 - ori\pack\chrome-menu-builder.mjs"
$firefoxMenuBuilderPath = "d:\Code\GitHub\testudoq3 - ori\pack\firefox-menu-builder.mjs"

# Check if files exist
Write-Host "✅ Reading context-menu.mjs: $(Test-Path $contextMenuPath)" -ForegroundColor Green
Write-Host "✅ Reading chrome-menu-builder.mjs: $(Test-Path $chromeMenuBuilderPath)" -ForegroundColor Green
Write-Host "✅ Reading firefox-menu-builder.mjs: $(Test-Path $firefoxMenuBuilderPath)" -ForegroundColor Green

# Read files
if (Test-Path $contextMenuPath) {
    $contextMenuContent = Get-Content -Path $contextMenuPath -Raw
    
    # Check for ALL_CONTEXTS definition
    if ($contextMenuContent -match "const\\s+ALL_CONTEXTS\\s*=\\s*\\[(.*?)\\]") {
        Write-Host "✅ ALL_CONTEXTS defined as: $($matches[1])" -ForegroundColor Green
    } else {
        Write-Host "❌ ALL_CONTEXTS not found in context-menu.mjs" -ForegroundColor Red
    }
    
    # Check for Customise menus and Help/Support entries
    if ($contextMenuContent -match "menuBuilder\\.menuItem\\('Customise menus',\\s*rootMenu,\\s*[^,]+,\\s*({[^}]+})") {
        Write-Host "✅ 'Customise menus' using contexts: $($matches[1])" -ForegroundColor Green
    } else {
        Write-Host "❌ Could not find context config for 'Customise menus'" -ForegroundColor Red
    }
    
    if ($contextMenuContent -match "menuBuilder\\.menuItem\\('Help\\/Support',\\s*rootMenu,\\s*[^,]+,\\s*({[^}]+})") {
        Write-Host "✅ 'Help/Support' using contexts: $($matches[1])" -ForegroundColor Green
    } else {
        Write-Host "❌ Could not find context config for 'Help/Support'" -ForegroundColor Red
    }
}

Write-Host "✅ Analysis complete!" -ForegroundColor Green
