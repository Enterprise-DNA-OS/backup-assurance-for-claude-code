---
description: Record an observed result. Status is success, failure, warning, no-result or pending. Do not invent a success to clear an exception.
---

Record an observed result. Status is success, failure, warning, no-result or pending. Do not invent a success to clear an exception.

Read CLAUDE.md and the current record first. Within the operator's request, run:

```bash
npm run assurance -- log-result --job=<job-code> --time=<ISO-time-with-zone> --status=success --evidence="<source reference>" --actor="<operator>"
```

Replace every placeholder with a confirmed value. If a name matches several records, list the candidates and resolve the identity before writing. Read the affected record back, and show its code and evidence. Never send messages.
