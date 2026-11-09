---
description: Export the complete evidence database to a new private JSON file.
---

Run `npm run assurance -- export --out=exports/backup-review.json`. Use a new filename each time. The export includes original vendor snapshots and the audit log, so it is private. Inspect the counts. This is a portable record export, not a restore command; use the database backup process in docs/operations.md for recovery.
