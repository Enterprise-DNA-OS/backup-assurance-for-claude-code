# Bring your Backup Radar evidence across

Checked 2026-11-09 against [ScalePad's device-history reference](https://developer.scalepad.com/reference/getv3clientsdevices).

## Export

An authorised account operator retrieves GET /backup-radar/v3/clients/devices using the correct tenant region. The reference allows page_size 1..200 and history_days 1..365. Follow next_cursor until it is null and keep every response intact. Use no filters when taking the full inventory. If records change while paging, repeat and reconcile the final inventory.

Use the region described in [ScalePad's regional documentation](https://developer.scalepad.com/docs/regional-endpoints-and-compliance). This repository does not request credentials or make vendor calls. The account operator supplies the completed export file.

Wrap the responses as an object with exported_at (ISO timestamp after export completes) and pages (the array of complete responses). Do not flatten away total_count or next_cursor. The included fixtures/backup-radar.json illustrates the wrapper with synthetic data.

```bash
npm run assurance -- import backup-radar --file=imports/devices.json --source=your-tenant --actor="Your name" --dry-run
npm run assurance -- import backup-radar --file=imports/devices.json --source=your-tenant --actor="Your name"
```

Use the same source name for every export from that tenant. Different tenants must have different source names. Repeating the same file is a no-op. Dry run executes validation and the import transaction, then rolls it back.

## Mapping

| Vendor field | Local evidence |
| --- | --- |
| client.client_id, otherwise client.br_company_name | Stable client identity within source tenant |
| client.br_company_name | Client name |
| br_device_id plus br_job_name | Stable job identity within source tenant |
| br_device_name | Device label |
| br_job_name | Job name |
| br_backup_classification | Classification |
| last_result[].date, status | Timestamped observations |
| history[].date, sla_status | Vendor daily assessment, kept separately per snapshot |
| Entire wrapped export | Original evidence in imports.payload, with checksum and actor |

The API model also includes mapped device_id/device_name fields that can be null. We use the original Backup Radar identifiers and labels, so unmapped devices still import. An owner must reconcile renames: a changed job name or previously unmapped client gaining a client_id is a changed source identity. Existing local labels and policies are not overwritten by later exports. The original snapshot retains the vendor values.

Supported observed statuses are success, failure/failed, warning, no result/no results/no-result and pending. Unrecognised statuses stop the import for explicit mapping. No empty list is treated as success. The API example documents success; the other accepted labels are explicit local mappings to be checked against your own export.

## Reconcile before relying on it

Check imports, clients, jobs and history. Match the inventory against the vendor, including devices excluded by any export filter. The importer checks pagination metadata, consistent counts, unique job keys, valid dates and final null cursor; it cannot prove that an operator included every vendor filter scope. A changed status at the same job, time and source stops the whole transaction. No earlier row from a failed batch remains.

Set each job's owner, rpo-hours, restore-days and policy evidence with set-policy. Record client security and retention decisions with client-review. Enter actual restore exercises with log-restore. Preserve original backups and existing monitoring while you run the evidence review in parallel.

## What does not carry over

This endpoint does not supply every historical run, backup content, schedules, alert rules, email parsers, ticket routes, credentials or proof that a restore succeeded. It supplies last results and daily vendor assessments for the requested window. Local recovery targets and restore exercises are separate operator records. Daily vendor compliance is never converted into invented success events.

The one-command import applies to an already exported, wrapped file. Collection, reconciliation and production integrations are separate work. Only retire a service after your replacement collection, alert delivery and recovery exercises have been tested end to end.
