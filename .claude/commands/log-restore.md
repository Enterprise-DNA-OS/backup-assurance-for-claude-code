---
description: Record a restore that was actually performed. Outcome is passed or failed. Explain what was restored and checked in the evidence.
---

Record a restore that was actually performed. Outcome is passed or failed. Explain what was restored and checked in the evidence.

Read CLAUDE.md and the current record first. Within the operator's request, run:

```bash
npm run assurance -- log-restore --job=<job-code> --time=<ISO-time-with-zone> --outcome=passed --minutes=<elapsed-minutes> --evidence="<exercise report>" --actor="<operator>"
```

Replace every placeholder with a confirmed value. If a name matches several records, list the candidates and resolve the identity before writing. Read the affected record back, and show its code and evidence. Never send messages.
