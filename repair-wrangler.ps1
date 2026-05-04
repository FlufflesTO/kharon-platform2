Set-Content -Encoding UTF8 -Path wrangler.toml -Value @"
name = "kharon-platform"
compatibility_date = "2024-11-01"

[[d1_databases]]
binding = "DB"
database_name = "kharon"
database_id = "6e83a58f-9ea0-4d24-a7fa-fc8f8c13e32d"

[vars]
EMAIL_FROM = "Kharon SLA <noreply@kharon.co.za>"
INTERNAL_ACCESS_TOKEN = "4Pd3x0cTI2sgHjmaASE1lJeGDzVXoBNK6Fk8Z9OtwM7yuYpr"
"@
