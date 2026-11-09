# Operating the evidence database

Use a trusted operator's workstation for the local demo. Node 20+ is required. Run npm install, npm run demo, then the assurance commands. The seed is synthetic and idempotent; never load it into a customer database. Tests use a fresh temporary directory and ignore DATABASE_URL unless TEST_DATABASE_URL explicitly names an empty disposable PostgreSQL database.

## PostgreSQL

Provision a private PostgreSQL database and an owner role. Set DATABASE_URL through your secret manager, then run npm run migrate. Remote TLS certificate verification is enabled. Do not expose the connection URL to an agent transcript or source control. Do not use a public browser connection or anonymous database key.

Row level security is enabled with no public policies. The trusted database owner runs this CLI and can see all clients. Client separation in reports is enforced by ids, but this is not a multi-tenant application boundary. Give separate databases and operating-system access to teams needing isolation. Public roles receive no table, view or report-function grants. The audit trail records CLI operations but is not tamper-proof against the database owner.

## Backups and restoration

For local PGlite, stop all commands before copying the complete DATA_DIR directory to encrypted restricted storage. Restore into a new directory, point DATA_DIR there, and compare clients, jobs, imports and audit. Do not copy a live PGlite directory. For PostgreSQL, use your provider's backups or pg_dump and a tested restore into a separate database. Run migrations and compare counts and representative history after restoring.

The export command writes complete JSON, including raw vendor snapshots. It refuses to overwrite an existing path. JSON export is for portability and inspection; it is not a provided full-database restore path. Protect exports, drafts, rendered reports and the database as private client evidence. Apply your own retention and disposal procedure. The base does not delete evidence automatically.

## Collectors and freshness

The base has no service process, live poller, email parser, backup scheduler or notification sender. The team imports snapshots or logs observed results. A stale result can mean a failed collector rather than a failed backup. Keep the original monitoring and paging services until replacement connections and delivery have passed real end-to-end tests.

Agree an operator, daily review schedule, backup targets and restore cadence. Verify source clocks and tenant regions. Reconcile device renames before import. Run one writer at a time on the embedded database. Restore exercises are performed in the backup system, then their results are recorded here.

## Changes

Use a new numbered migration for each database change, including changes to report functions or views. Test it on disposable PGlite and PostgreSQL. Run npm test, npm run view and npm run docs. Check outputs before a production rollout. Real records and credentials never enter fixtures, source control or screenshots for the marketing page.
