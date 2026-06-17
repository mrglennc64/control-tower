import type {
  Buyer,
  Product,
  Meta,
  Reminder,
  DocumentItem,
  FinanceState,
  Task,
  Entity,
  Milestone,
} from "./types";

const MAILMAN = "C:\\Users\\carin\\OneDrive\\Dokument\\mailman";

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

// Starts empty — add buyers from the Outreach tab.
export const SEED_BUYERS: Buyer[] = [];

export const SEED_META: Meta = {
  appName: "Founder Control Tower",
  lastBackup: null,
};

// Starts empty — add reminders from the Deadlines tab.
export const SEED_REMINDERS: Reminder[] = [];

// Document Vault — pre-seeded with the real artifacts in the mailman folder.
// "location" points at the file on disk; edit/add more from the Vault tab.
export const SEED_DOCUMENTS: DocumentItem[] = [
  {
    id: "ngineagent-im",
    title: "Information Memorandum — NgineAgent",
    type: "IM",
    location: `${MAILMAN}\\INFORMATION MEMORANDUM — NGINEAGENT.pdf`,
    tags: ["ngineagent", "sale"],
    notes: "Formal buyer-facing memorandum.",
    addedAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "ngineagent-overview",
    title: "NgineAgent — CEO Engine Overview",
    type: "One-pager",
    location: `${MAILMAN}\\NgineAgent-CEO-Engine-Overview (3).pdf`,
    tags: ["ngineagent", "sale"],
    notes: "Product overview / one-pager.",
    addedAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "ngineagent-engine-ref",
    title: "NgineAgent — Engine Reference",
    type: "Technical",
    location: `${MAILMAN}\\ngineagent-engine-reference (3).pdf`,
    tags: ["ngineagent", "technical"],
    notes: "Technical reference / appendix.",
    addedAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "northern-star",
    title: "Northern Star Systems",
    type: "Other",
    location: `${MAILMAN}\\Northern-Star-Systems (8).pdf`,
    tags: ["company"],
    notes: "Company / product overview.",
    addedAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "exitpreneur",
    title: "Exitpreneur's Playbook",
    type: "Other",
    location: `${MAILMAN}\\Exitpreneur's Playbook - Full Book.pdf`,
    tags: ["reference", "exit"],
    notes: "Reference reading on exit strategy.",
    addedAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

// Financial Snapshot — starts empty; fill in from the Finance tab.
export const SEED_FINANCE: FinanceState = {
  currency: "SEK",
  cashOnHand: 0,
  monthlyBurn: 0,
  entries: [],
  updatedAt: "2026-01-01T00:00:00.000Z",
};

// Starts empty — add cards from the Workboard tab.
export const SEED_TASKS: Task[] = [];

// Company Entities — pre-seeded with the known/planned entities.
export const SEED_ENTITIES: Entity[] = [
  {
    id: "perfect-hold-ab",
    name: "Perfect Hold AB",
    entityType: "AB",
    jurisdiction: "Sweden",
    purpose: "Primary operating / holding company.",
    ownership: "",
    assets: "",
    status: "Active",
    nextFilingDate: null,
    notes: "",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "wyoming-llc",
    name: "Wyoming LLC",
    entityType: "LLC",
    jurisdiction: "Wyoming (US)",
    purpose: "US entity.",
    ownership: "",
    assets: "",
    status: "Active",
    nextFilingDate: null,
    notes: "",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "swedish-record-label-ab",
    name: "Swedish record label AB",
    entityType: "AB",
    jurisdiction: "Sweden",
    purpose: "Record label.",
    ownership: "",
    assets: "",
    status: "Active",
    nextFilingDate: null,
    notes: "",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "ngineagent-ab",
    name: "NgineAgent AB",
    entityType: "AB",
    jurisdiction: "Sweden",
    purpose: "Entity for NgineAgent (if/when created).",
    ownership: "",
    assets: "NgineAgent IP",
    status: "Planned",
    nextFilingDate: null,
    notes: "",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

// Starts empty — add milestones from the Timeline tab.
export const SEED_MILESTONES: Milestone[] = [];
