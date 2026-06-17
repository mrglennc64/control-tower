# Founder Control Tower

A private, local-first founder dashboard. v1 ships two modules:

- **Overview** — at-a-glance tiles (active products, outreach pipeline, next action due, deal temperature) plus the Product & IP inventory.
- **Acquisition Outreach** — a lightweight CRM for the NgineAgent sale: buyers, fit score, pipeline stage, next action, notes, and a funnel.
- **Deadlines & Reminders** — one due-soon view combining buyer next-action dates with manual reminders, bucketed Overdue / Today / This week / Later.
- **Document Vault** — tag-searchable references (IM, one-pagers, contracts, NDAs) pointing at files on disk or URLs.
- **Financial Snapshot** — a glance, not a ledger: cash on hand, monthly burn, computed runway, and revenue/expense entries by category.
- **Engineering Workboard** — a kanban board (Backlog / In progress / Blocked / Ready for test / Done) with two-click column moves.
- **Company Entities** — your legal structure: entity type, jurisdiction, purpose, ownership, assets, status, next filing date.
- **Timeline & Milestones** — a chronological, date-sorted milestone list across product, outreach, legal, banking and launch.

It is single-user, offline, zero-cost, and stores data as plain JSON. The app-version successor to the markdown [PAM](https://github.com/mrglennc64/PAM) dashboard.

## Stack
Next.js 16 · React 19 · TypeScript · Tailwind 4 · SWR. No database, no auth, no hosting.

## Data
Data lives as JSON files outside the repo so it can sync across machines via OneDrive:

- `products.json` — pre-seeded portfolio inventory (NgineAgent, PAM, Hunter, CRM, HeyRoya/auto, Kataloghub, CIP, Besiktning).
- `buyers.json` — outreach records.
- `reminders.json` — manual deadlines/reminders.
- `documents.json` — Document Vault references.
- `finance.json` — Financial Snapshot state.
- `tasks.json` — Engineering Workboard cards.
- `entities.json` — Company Entities.
- `milestones.json` — Timeline milestones.
- `meta.json` — app settings + last backup time.

Location defaults to `%USERPROFILE%\OneDrive\Dokument\mailman\data`. Override with `DATA_DIR` (see `.env.local.example`). On every server start, all data files are snapshotted to `data/backups/<timestamp>/`. Writes are atomic (temp file → rename) and serialized per file.

## Run
Double-click **`start.cmd`** — it installs dependencies on first run, starts the server, and opens the dashboard in your browser.

Or manually:
```bash
npm install
npm run dev
```
Then open http://localhost:3000.

## Modules
All ten planned modules now ship: Overview, Acquisition Outreach, Deadlines & Reminders, Document Vault, Financial Snapshot, Engineering Workboard, Company Entities, Timeline & Milestones — plus Export/Backup and the seeded Product & IP inventory. Section structure mirrors PAM's `dashboard/` markdown.
