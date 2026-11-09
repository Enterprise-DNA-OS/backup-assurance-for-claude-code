# Verification

On 2026-11-09, [verification run 42715980426](https://github.com/Enterprise-DNA-OS/backup-assurance-for-claude-code/actions/runs/42715980426) passed all five jobs at commit 0331c3a:

- Windows, Node 20, embedded PGlite: 69 assertions and demo passed.
- Windows, Node 22, embedded PGlite: 69 assertions and demo passed.
- Linux, Node 20, embedded PGlite: 69 assertions and demo passed.
- Linux, Node 22, embedded PGlite: 69 assertions and demo passed.
- Linux, Node 22, PostgreSQL 16: 69 assertions passed.

The final document layout splits backup and restore evidence into separate sections. After that presentation change, the local Linux suite passed all 69 assertions again. The client review and morning view were opened in headless Chromium and inspected. Each client document section fits its desktop container without horizontal scrolling.

The tests cover all 25 CLI actions including help. There are 28 operator command recipes, including customise, new-view, view and docs. The three marketing examples are captured output from synthetic seed records, not invented answers.
