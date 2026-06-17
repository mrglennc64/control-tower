import type { Buyer, Product, Meta } from "./types";

// Pre-seeded inventory of the real portfolio (read-only list in v1).
// Sourced from the asset inventory of the existing repos.
export const SEED_PRODUCTS: Product[] = [
  {
    id: "ngineagent",
    name: "NgineAgent",
    status: "for sale",
    purpose: "CEO-engine / autonomous agent product — the active acquisition target.",
  },
  {
    id: "pam",
    name: "PAM",
    status: "active",
    purpose:
      "Personal Automation Machine — markdown 'operations brain' (CEO=Pam, VPs Aris/Vesta). The predecessor of this dashboard; its sections map to the v2 modules.",
    repo: "mrglennc64/PAM",
  },
  {
    id: "hunter",
    name: "Hunter",
    status: "active",
    purpose:
      "Python lead-intelligence & outreach pipeline — rights-holder/artist discovery, ISRC lookup, email & attorney finders, outreach PDF generation.",
    repo: "mrglennc64/hunter",
  },
  {
    id: "crm",
    name: "CRM (Trap Royalties Pro)",
    status: "active",
    purpose:
      "Trap Royalties Pro workspace — trapcrm, the traproyaltiespro site, content generator, HeyRoya design, and outreach assets.",
    repo: "mrglennc64/CRM",
  },
  {
    id: "heyroya-auto",
    name: "HeyRoya (auto)",
    status: "production",
    purpose: "Catalog analysis backend — FastAPI + Celery + Redis + Postgres.",
    repo: "mrglennc64/auto",
  },
  {
    id: "kataloghub-static",
    name: "Kataloghub (static)",
    status: "production",
    purpose: "White-label, validation-only catalog tool for music publishers.",
    repo: "mrglennc64/katolog",
  },
  {
    id: "kataloghub-app",
    name: "Kataloghub App",
    status: "production",
    purpose: "Partner-facing dashboard for catalog validation workflows.",
    repo: "mrglennc64/katalog-app",
  },
  {
    id: "northern-star-cip",
    name: "Northern Star / CIP",
    status: "active",
    purpose: "B2B marketing site for the Compliance Inspection Platform.",
    repo: "mrglennc64/CIP",
  },
  {
    id: "besiktning",
    name: "Besiktning",
    status: "pre-mvp",
    purpose: "B2B SaaS for Swedish building inspectors to author protocols.",
    repo: "mrglennc64/besiktning",
  },
];

// v1 ships with no real buyers yet — one example row to show the shape.
// Replace or delete via the UI (or edit buyers.json by hand).
export const SEED_BUYERS: Buyer[] = [
  {
    id: "example-buyer",
    name: "Example Buyer Inc. (delete me)",
    category: "strategic",
    fitScore: 3,
    stage: "Not contacted",
    lastActivity: null,
    nextAction: "Send one-pager",
    nextActionDate: null,
    notes: "Placeholder row. Edit or delete from the Outreach tab.",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

export const SEED_META: Meta = {
  appName: "Founder Control Tower",
  lastBackup: null,
};
