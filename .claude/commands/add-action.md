---
description: Record follow-up work with an owner and due date.
---

Record follow-up work with an owner and due date.

Read CLAUDE.md and the current record first. Within the operator's request, run:

```bash
npm run assurance -- add-action --code=<code> --job=<job-code> --name="<work>" --owner="<owner>" --due=YYYY-MM-DD --actor="<operator>"
```

Replace every placeholder with a confirmed value. If a name matches several records, list the candidates and resolve the identity before writing. Read the affected record back, and show its code and evidence. Never send messages.
