# Backup Assurance for Claude Code

Own the evidence behind the morning backup review. Keep clients, backup results, recovery targets, restore exercises and follow-up work in one database. Start with synthetic records, then bring your Backup Radar device-history export across.

## Three ways to use it

- **Do it yourself:** free MIT source. Install it, import a complete export and run your own evidence review.
- **We customise it:** Enterprise DNA brings your records across and builds your fields, rules, collection connections and shared screens. One setup fee, then a retainer for ongoing work.
- **We run it for you:** installed, connected and operated through **Omni by Enterprise DNA**, for one setup fee then a retainer. [Talk to Sam](https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=backup-radar&utm_medium=readme).

## Start with the demo

```bash
npm install
npm run demo
npm run assurance -- morning-check
npm run assurance -- restore-due
npm run assurance -- weekly-review
npm run view
npm run docs
npm test
```

Node 20 or newer. Windows and Linux. PGlite runs locally without a database service; DATABASE_URL selects PostgreSQL. Claude Code, Codex, OpenCode and Cursor read the same operating instructions and command recipes. Install in a trusted operator environment. [Production operations](docs/operations.md).

## The team's daily and weekly jobs

/morning-check reviews the recorded results. /missing-results finds silent jobs. /restore-due checks exercise evidence. /client-health prepares the client review. /attention identifies overdue work. /weekly-review combines the first, third and fifth reports. /compliance links findings to the documented rules. /draft-report writes a private review to drafts, never sends it.

Reads accept --json. Use --at with an ISO timestamp to choose a result cutoff; this uses the current policy and is not a historical policy reconstruction. All database writes require --actor. Codes match exactly without regard to case; names and partial ids must identify one record. Ambiguous matches list candidates and exit 1. Run `npm run assurance -- help` for every command and flag.

## Bring your Backup Radar records

```bash
npm run assurance -- import backup-radar --file=fixtures/backup-radar.json --source=example-tenant --actor="Your name" --dry-run
```

The fixture is synthetic and follows the documented device-history response. For your own data, preserve all pages from the vendor's device-history export, wrap them with exported_at, then run the same command with your file. Repeat without --dry-run after reconciliation. [Export instructions and exact mapping](docs/replace-backup-radar.md).

The importer rejects incomplete pages, duplicate device/job keys, unknown statuses and conflicting observations. Repeating an identical snapshot adds nothing. New jobs stay unconfigured until their owner, recovery interval and restore cadence are recorded. Original snapshots and vendor daily assessments are retained separately. The export endpoint supplies latest results and daily assessments, not every historical backup run.

## Ten questions your own evidence review answers

1. Which jobs have no result or an old result? `missing-results`
2. Which failed result needs attention this morning? `morning-check`
3. Which jobs have never had a restore exercise? `restore-due`
4. Which latest restore exercise failed despite an earlier pass? `history --job=C-ERP`
5. Which client has the most backup and restore exceptions? `client-health`
6. Which imported jobs still need an owner and recovery target? `morning-check`
7. Which follow-up actions are overdue? `attention`
8. Which client lacks security review or retention evidence? `compliance`
9. What did the original vendor assessment say on a given day? `history --job=<imported-job-code>`
10. Who changed a recovery policy, and what evidence did they record? `audit`

These are supported queries, not claims that Backup Radar cannot answer equivalent questions. Your local restore evidence, decisions and follow-up records make the review specific to your business. The synthetic export provides the vendor-history example; recording a policy change provides its audit example.

## Documents and views in your name

Set business name, colours and logo in brand.json. `npm run docs` renders a client backup review and each job's restore exercise record. `npm run view` renders morning, client and attention snapshots. All are read-only HTML with escaped data. /new-view adds another report from the same database.

## Your first hour: ten things to ask for

1. Put our name on the client review.
2. Show the stale archive result in the demo.
3. Explain why a successful result is not a restore test.
4. Show the failed restore exercise and its open action.
5. Preview our complete export before importing.
6. Set our actual recovery interval for each job.
7. Set the restore exercise cadence from our continuity plan.
8. Record the next client security review and retention decision.
9. Draft the client review with its unresolved findings.
10. Add a service-tier field with /customise, a migration and a test.

## Scope and proof

The base is an evidence review system. It does not run backups, restore files, poll vendors, parse notification email, send alerts or create service tickets. Keep those existing controls running. Connections and delivery need to be built, tested and operated for your environment before any service is retired. [Why no front end](docs/why-no-front-end.md).

A current-success state means a recent successful observation is recorded. It does not establish actual recoverability, storage immutability, access control or legal compliance. Restore results are operator evidence, not a test this software performs. [Rules and sources](docs/compliance.md).

`npm test` uses a temporary database and exercises all commands, import pagination, idempotency, rollback, timestamp boundaries, conflicting source results, client separation, audit, exports and escaped reports. The manual verification workflow checks Linux, Windows and PostgreSQL. A workflow file alone is not a test result.

[Selection and research](docs/research.md). MIT. Not affiliated with ScalePad or Anthropic. Hosting, agent use and ongoing operation remain your costs.
