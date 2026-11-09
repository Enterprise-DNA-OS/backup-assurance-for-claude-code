---
description: Record the security review and retention decision. Intervals come from the client's requirements, not a legal default.
---

Record the security review and retention decision. Intervals come from the client's requirements, not a legal default.

Read CLAUDE.md and the current record first. Within the operator's request, run:

```bash
npm run assurance -- client-review --client=<client-code> --due=YYYY-MM-DD --retention-days=<days> --owner="<owner>" --evidence="<access review reference>" --actor="<operator>"
```

Replace every placeholder with a confirmed value. If a name matches several records, list the candidates and resolve the identity before writing. Read the affected record back, and show its code and evidence. Never send messages.
