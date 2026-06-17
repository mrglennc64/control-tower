# Founder Control Tower

A private, local-first founder dashboard. v1 ships two modules:

- **Overview** — at-a-glance tiles (active products, outreach pipeline, next action due, deal temperature) plus the Product & IP inventory.
- **Acquisition Outreach** — a lightweight CRM for the NgineAgent sale: buyers, fit score, pipeline stage, next action, notes, and a funnel.
- **Deadlines & Reminders** — one due-soon view combining buyer next-action dates with manual reminders, bucketed Overdue / Today / This week / Later.
- **Document Vault** — tag-searchable references (IM, one-pagers, contracts, NDAs) pointing at files on disk or URLs.
- **Financial Snapshot** — a glance, not a ledger: cash on hand, monthly burn, computed runway, and revenue/expense entries by category.

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
- `meta.json` — app settings + last backup time.

Location defaults to `%USERPROFILE%\OneDrive\Dokument\mailman\data`. Override with `DATA_DIR` (see `.env.local.example`). On every server start, all data files are snapshotted to `data/backups/<timestamp>/`. Writes are atomic (temp file → rename) and serialized per file.

## Run
```bash
npm install
npm run dev
```
Then open http://localhost:3000.

## Roadmap (deferred)
Engineering Workboard, Company Entities, Timeline/Gantt. The section list mirrors PAM's `dashboard/` markdown. (Shipped so far: Deadlines & Reminders, Document Vault, Financial Snapshot.)
