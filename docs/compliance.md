# Evidence rules and sources

Checked 2026-11-09. These are review prompts for a service team, not a certification or a complete legal assessment. Local intervals are supplied by the operator. The software does not inspect backup storage, access permissions, encryption or recovered files.

| Rule | Check implemented | Basis and limit |
| --- | --- | --- |
| BACKUP-01 | Job policy missing, no result, stale result, failure, warning or pending observation | [ASD backup transition guidance](https://www.cyber.gov.au/publication/transitioning-from-the-essential-eight) describes defined schedules and protected storage. Our check examines recorded result age against the owner's interval; it does not verify the storage controls. |
| RESTORE-02 | Missing, failed or overdue latest restore exercise | The same ASD guidance calls for testing restoration against recovery objectives. The local cadence is an operator decision. We retain reported duration and evidence; we do not perform a restore or certify that an objective was met. |
| SECURITY-03 | Missing security evidence or missing/overdue client review | [NZ Privacy Principle 5](https://www.privacy.org.nz/privacy-principles/5/) requires reasonable safeguards for personal information. A recorded review reference is evidence for follow-up, not proof safeguards work. |
| RETENTION-04 | Missing client retention decision | [NZ Privacy Principle 9](https://www.privacy.org.nz/privacy-principles/9/) limits keeping personal information beyond its lawful purpose. There is no universal interval in this rule. The operator records a justified period and handles disposal separately. |

Recovery intervals compare observed timestamps to a UTC cutoff. Exactly at the interval boundary remains current; older is stale. Failure and warning remain exceptions even when recent. When two sources disagree at the same timestamp, the non-success takes priority in the review. An absent success stays unknown.

Restore status uses the latest exercise at or before the cutoff. A failed exercise stays failed until a later passing exercise is recorded. Its configured interval determines when a passed exercise becomes overdue. A pass alone does not establish recovery of all systems to a common point in time.

Use the client's actual jurisdiction, continuity requirements, contracts and record purpose when setting policy. Empty findings mean only that these limited evidence checks found no exception. No report is sent automatically and no records are deleted automatically.
