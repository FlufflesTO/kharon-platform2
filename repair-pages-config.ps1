Set-Content -Encoding UTF8 -Path wrangler.toml -Value @"
name = "kharon-platform"
compatibility_date = "2024-11-01"
pages_build_output_dir = "dist/client"

[[d1_databases]]
binding = "DB"
database_name = "kharon"
database_id = "6e83a58f-9ea0-4d24-a7fa-fc8f8c13e32d"

[vars]
EMAIL_FROM = "Kharon SLA <noreply@kharon.co.za>"
"@
