# Content persistence

- Save all generated copy, charts, source snapshots, reports and previews inside this workspace's `outputs/`, `crypto-charting-data/`, or `research/`. Prefer dated YYYY-MM-DD subdirectories. Writing content databases remain in `x-finance-os/CONTENT_DB/`.
- After every completed generation or revision, run `python3 /Users/jss/Desktop/workspace/XCreator/scripts/archive_to_github.py`. Report failures; never manually prune unverified files.
- GitHub archive: https://github.com/HeySeeTech/Crypto-Charting . Historical content lives at `archive/YYYY-MM-DD/<workspace-relative-path>`. The archive is authoritative for history; missing local files do not mean missing historical data.
- Before historical comparisons, retrieve the required archived JSON/reports from GitHub using `gh api` or a temporary checkout. Clean up temporary checkouts after analysis. Do not fabricate history or use today's snapshot as an old baseline.
- The archive script verifies remote commit and committed bytes before removing prior-day generated local files (Asia/Shanghai). Today stays local. Rules, code, assets and references stay local. Content database files stay local for ongoing editing and are also archived.
