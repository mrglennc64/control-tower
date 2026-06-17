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
  Contact,
  Conversation,
  StrategyNote,
  CreditTask,
  CreditAccount,
  CreditProfile,
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

// Contacts — seeded with well-known companies/marketplaces that ACQUIRE, buy,
// or roll up software / IP / online businesses. Starting points to verify and
// enrich (emails left blank — fill from their sites or an enrichment tool).
const acq = (
  id: string,
  name: string,
  tag: string,
  notes: string,
): Contact => ({
  id,
  name,
  email: "",
  company: name,
  phone: "",
  tags: ["acquirer", tag],
  notes,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
});

export const SEED_CONTACTS: Contact[] = [
  acq("acquire-com", "Acquire.com", "marketplace", "Marketplace to buy/sell startups & SaaS (formerly MicroAcquire). https://acquire.com"),
  acq("flippa", "Flippa", "marketplace", "Marketplace for buying/selling online businesses, apps & IP. https://flippa.com"),
  acq("empire-flippers", "Empire Flippers", "marketplace", "Curated marketplace for established online businesses. https://empireflippers.com"),
  acq("fe-international", "FE International", "M&A advisor", "M&A advisory for SaaS, e-commerce & content businesses. https://feinternational.com"),
  acq("quiet-light", "Quiet Light", "M&A advisor", "Brokerage for online businesses & digital assets. https://quietlight.com"),
  acq("tiny", "Tiny", "roll-up", "Acquires and holds wonderful internet businesses for the long term. https://tiny.com"),
  acq("constellation", "Constellation Software", "roll-up", "Acquires vertical-market software companies (public). https://csisoftware.com"),
  acq("saas-group", "saas.group", "roll-up", "Acquires and grows B2B SaaS companies. https://saas.group"),
  acq("sureswift", "SureSwift Capital", "micro-PE", "Acquires and operates bootstrapped SaaS. https://sureswiftcapital.com"),
  acq("xo-capital", "XO Capital", "micro-PE", "Micro-PE acquiring SaaS & software products. https://xo.capital"),
  acq("dura-software", "Dura Software", "roll-up", "Acquires niche/vertical SaaS to operate long-term. https://durasoftware.com"),
  acq("micro-acquire-funds", "Micro-PE / search funds", "micro-PE", "Category: individual acquirers & search funds buying small software/IP. Add specific firms here."),
];

// Chats — persistent AI conversations. Starts empty.
export const SEED_CHATS: Conversation[] = [];

// Strategy — grows as you add notes (paste, chat, manual). Starts empty.
export const SEED_STRATEGY: StrategyNote[] = [];

// Business Credit — roadmap checklist seeded from the 5-phase plan.
const ct = (phase: string, text: string): CreditTask => ({
  id: `${phase}-${text}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60),
  phase,
  text,
  done: false,
});

export const SEED_CREDIT_TASKS: CreditTask[] = [
  ct("Immediate", "Register a D-U-N-S number (free, mandatory) at Dun & Bradstreet"),
  ct("Immediate", "Audit spending — move personal card spend to the business bank account"),
  ct("Immediate", "Apply for 3 Net-30s (Uline, Quill, Grainger); spend $50–100, pay immediately"),
  ct("Phase 1 — Foundation", "LLC or Corp with an EIN"),
  ct("Phase 1 — Foundation", "Dedicated business phone line (listed in 411)"),
  ct("Phase 1 — Foundation", "Professional email (not @gmail) + business website"),
  ct("Phase 1 — Foundation", "Business checking account; route all spending through it"),
  ct("Phase 2 — Vendor Net-30s", "Open 3–5 Net-30 vendor accounts that report to D&B/Experian/Equifax"),
  ct("Phase 2 — Vendor Net-30s", "Buy small needed supplies; pay invoices before 30 days"),
  ct("Phase 2 — Vendor Net-30s", "Establish a Paydex score"),
  ct("Phase 3 — Store / small cards", "Open Amazon Business / Staples / Home Depot accounts"),
  ct("Phase 3 — Store / small cards", "Use for operations; keep utilization under 30%"),
  ct("Phase 4 — Unsecured high-limit", "Apply at big banks (Chase, Amex, BofA) using history + PG"),
  ct("Phase 4 — Unsecured high-limit", "Hold liquid cash in the bank to lift limits ($25k–$100k)"),
  ct("Phase 5 — Corporate (no PG)", "Build audited financials + strong annual revenue"),
  ct("Phase 5 — Corporate (no PG)", "Secure large lines based on company financials (no SSN/PG)"),
];

export const SEED_CREDIT_ACCOUNTS: CreditAccount[] = [];

export const SEED_CREDIT_PROFILE: CreditProfile = {
  ein: "",
  dunsNumber: "",
  paydex: 0,
  businessBank: false,
  notes: "",
  updatedAt: "2026-01-01T00:00:00.000Z",
};
