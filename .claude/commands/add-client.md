---
description: Add a client. Obtain the exact client identity and owner from the operator.
---

Add a client. Obtain the exact client identity and owner from the operator.

Read CLAUDE.md and the current record first. Within the operator's request, run:

```bash
npm run assurance -- add-client --code=<code> --name="<client>" --owner="<owner>" --actor="<operator>"
```

Replace every placeholder with a confirmed value. If a name matches several records, list the candidates and resolve the identity before writing. Read the affected record back, and show its code and evidence. Never send messages.
