---
description: Add a backup job, then use set-policy to record the agreed recovery interval and restore cadence.
---

Add a backup job, then use set-policy to record the agreed recovery interval and restore cadence.

Read CLAUDE.md and the current record first. Within the operator's request, run:

```bash
npm run assurance -- add-job --code=<code> --client=<client-code> --name="<job>" --device="<device>" --owner="<owner>" --actor="<operator>"
```

Replace every placeholder with a confirmed value. If a name matches several records, list the candidates and resolve the identity before writing. Read the affected record back, and show its code and evidence. Never send messages.
