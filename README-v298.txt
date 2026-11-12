Timberlite Schedule 2025 import
1. Copy src and public over the corresponding folders in your Timberlite project.
2. Open the existing Timberlite project in Supabase. In SQL Editor, open a new
   query, paste the entire import-schedule-2025-v298.sql file, then click Run.
3. Reload Schedule. In Sales select Calendar year and 2025 to check the total.

Expected for a first import with no existing job-number conflicts:
88 entries, including 4 To Review (563, 565, 596, 619).
2025 Calendar year net sales: 281,714.51 GBP across 84 sales.
If any job numbers are already in Schedule, the SQL skips them and reports
them as existing_job_numbers_skipped. It never updates existing rows.
A repeat run skips rows already imported.

The four To Review entries retain the original notes and amounts and are
excluded from sales while in review. Workbook net costs and sales are
preserved. Gross prices and payment balances without confirmed data stay
unknown; unlabelled payment notes are preserved in each relevant entry.
Only the Jan-Dec 2025 workbook tabs are included.
