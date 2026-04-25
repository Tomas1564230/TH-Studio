# strip-contact.ps1
# Copies dist/ to dist-jaspravim/ and removes all contact info from the HTML.
# Run from the project root: .\strip-contact.ps1

$jaspravimProfile = 'https://www.jaspravim.sk/profil/tomas1412'

$src  = ".\dist"
$dest = ".\dist-jaspravim"

# ── 1. Fresh copy ────────────────────────────────────────────────────────────
if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
Copy-Item $src $dest -Recurse -Force
Write-Host "[1/9] Copied dist → dist-jaspravim" -ForegroundColor Cyan

# ── 2. Rewrite /TH-Studio/ base paths → / for Netlify ───────────────────────
# Vite bakes in base:'/TH-Studio/' for GitHub Pages. Netlify serves from root.
Get-ChildItem $dest -Filter "*.html" -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName -Raw -Encoding UTF8
    $fixed   = $content -replace '/TH-Studio/', '/'
    Set-Content $_.FullName -Value $fixed -Encoding UTF8 -NoNewline
    Write-Host "    Rewritten: $($_.Name)" -ForegroundColor DarkCyan
}
Write-Host "[2/9] Rewrote /TH-Studio/ → / in all HTML files" -ForegroundColor Cyan

# ── 3. Locate the compiled index.html ────────────────────────────────────────
$htmlPath = Get-ChildItem $dest -Filter "index.html" -Recurse |
            Select-Object -First 1 -ExpandProperty FullName

if (-not $htmlPath) {
    Write-Error "index.html not found in $dest"; exit 1
}
Write-Host "[3/9] Editing contact info: $htmlPath" -ForegroundColor Cyan

$html = Get-Content $htmlPath -Raw -Encoding UTF8

# ── 4. Strip email from JSON-LD schema ───────────────────────────────────────
$html = $html -replace '(?m)^\s*"email"\s*:\s*"[^"]*",?\s*\r?\n', ''
Write-Host "[4/9] Removed email from JSON-LD schema" -ForegroundColor Cyan

# ── 5. Replace contact section with TOS notice ───────────────────────────────
# Loaded from a separate UTF-8 file to avoid PowerShell 5 encoding issues
# with non-ASCII characters in here-strings.
$noticePath = Join-Path $PSScriptRoot "_jaspravim-notice.html"
$notice = Get-Content $noticePath -Raw -Encoding UTF8

$html = $html -replace '(?s)<section[^>]*id=["\x27]kontakt["\x27][^>]*>.*?</section>', $notice

Write-Host "[5/9] Replaced #kontakt section with TOS notice" -ForegroundColor Cyan

# ── 6. Clean up nav & button links that point to #kontakt ────────────────────
$html = $html -replace '(?s)<li[^>]*>\s*<a[^>]*class=["\x27][^"\x27]*nav-cta[^"\x27]*["\x27][^>]*>.*?</a>\s*</li>', ''
$html = $html -replace 'href=["\x27]#kontakt["\x27]', 'href="#"'
Write-Host "[6/9] Cleaned up #kontakt href references" -ForegroundColor Cyan

# ── 7. Relink hero 'Bezplatná konzultácia' ghost button to jaspravim profile ─
# Use a lookahead so we can match href="#" when the Bezplatna title appears
# anywhere later in the same opening tag — avoids attribute-order issues.
$html = $html -replace '(href=["\x27]#["\x27])(?=[^>]*title=["\x27]Bezplatn)', "href=`"$jaspravimProfile`" target=`"_blank`" rel=`"noopener`""
Write-Host "[7/9] Relinked hero CTA to jaspravim profile" -ForegroundColor Cyan

# ── 8. Remove footer entirely ────────────────────────────────────────────────
$html = $html -replace '(?s)<footer[^>]*>.*?</footer>', ''
Write-Host "[8/9] Removed footer" -ForegroundColor Cyan

# ── 9. Write back ────────────────────────────────────────────────────────────
Set-Content -Path $htmlPath -Value $html -Encoding UTF8 -NoNewline
Write-Host "[9/9] Saved index.html" -ForegroundColor Cyan

Write-Host "`n✅  Done! dist-jaspravim is ready to drag onto Netlify." -ForegroundColor Green
Write-Host "    Folder: $(Resolve-Path $dest)" -ForegroundColor Gray

