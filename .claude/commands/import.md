---
description: Preview, reconcile and import a complete Backup Radar device-history export.
---

Read docs/replace-backup-radar.md. Obtain a complete export already retrieved by the authorised account operator. This command never reads credentials or contacts the vendor.

```bash
npm run assurance -- import backup-radar --file=imports/devices.json --source=your-tenant --actor="Your name" --dry-run
```

Check the page count, total devices/jobs, source tenant and report window. Repeat without --dry-run only within the operator's request. Reconcile with clients, jobs, imports and history. Set job policies and client review decisions explicitly. Never treat the import as a substitute for working live collection.
