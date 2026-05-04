$files = @(
  "src\pages\solutions\[slug].astro",
  "src\pages\environments\[slug].astro"
)

foreach ($file in $files) {
  $content = Get-Content -LiteralPath $file -Raw

  if ($content -notmatch "export const prerender = true;") {
    $content = $content -replace "^---", "---`nexport const prerender = true;"
    Set-Content -LiteralPath $file -Value $content -Encoding UTF8
  }
}
