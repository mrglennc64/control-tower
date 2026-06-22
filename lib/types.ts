// Core data model for the Founder Control Tower (v1).

export const STAGES = [
  "Not contacted",
  "Contacted",
  "Replied",
  "NDA",
  "Tech review",
  "Offer",
  "Closed/Passed",
] as const;

export type Stage = (typeof STAGES)[number];

export const CATEGORIES = ["roll-up", "micro-PE", "strategic"] as const;
export type Category = (typeof CATEGORIES)[number];

export interface Buyer {
  id: string;
  name: string;
  category: Category;
  fitScore: number; // 1–5
  stage: Stage;
  lastActivity: string | null; // ISO date
  nextAction: string;
  nextActionDate: string | null; // ISO date
  notes: string;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

export interface Product {
  id: string;
  name: string;
  status: "active" | "production" | "pre-mvp" | "for sale" | "archived";
  purpose: string;
  category?: string; // e.g. "Rights & metadata"
  vertical?: string; // e.g. "Music rights"
  url?: string; // live product page
  repo?: string;
}

export interface Meta {
  appName: string;
  lastBackup: string | null;
}

export const REMINDER_TYPES = [
  "Follow-up",
  "Filing deadline",
  "Renewal",
  "Contract",
  "Custom",
] as const;
export type ReminderType = (typeof REMINDER_TYPES)[number];

export interface Reminder {
  id: string;
  title: string;
  dueDate: string | null; // YYYY-MM-DD
  type: ReminderType;
  done: boolean;
  notes: string;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

// --- Document Vault ------------------------------------------------------
export const DOC_TYPES = [
  "IM",
  "One-pager",
  "Technical",
  "Contract",
  "NDA",
  "Diagram",
  "Pricing",
  "Other",
] as const;
export type DocType = (typeof DOC_TYPES)[number];

// An uploaded file stored on the server (in DATA_DIR/uploads), viewable in-app.
export interface DocFile {
  stored: string; // filename on disk in uploads/
  name: string; // original filename
  mime: string;
  size: number; // bytes
}

export interface DocumentItem {
  id: string;
  title: string;
  type: DocType;
  location: string; // file path or URL (for reference-only docs)
  file?: DocFile | null; // an actual uploaded file (viewable in the app)
  tags: string[];
  notes: string;
  addedAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

// --- Financial Snapshot (minimal — a glance, not a ledger) ---------------
export const FINANCE_KINDS = [
  "Revenue",
  "Asset sale",
  "One-time expense",
  "Recurring expense",
] as const;
export type FinanceKind = (typeof FINANCE_KINDS)[number];

export interface FinanceEntry {
  id: string;
  label: string;
  amount: number; // positive magnitude; kind determines sign/meaning
  kind: FinanceKind;
  date: string | null; // YYYY-MM-DD
  notes: string;
}

export interface FinanceState {
  currency: string;
  cashOnHand: number;
  monthlyBurn: number;
  entries: FinanceEntry[];
  updatedAt: string; // ISO datetime
}

// --- Engineering Workboard (kanban) --------------------------------------
export const TASK_COLUMNS = [
  "Backlog",
  "In progress",
  "Blocked",
  "Ready for test",
  "Done",
] as const;
export type TaskColumn = (typeof TASK_COLUMNS)[number];

export const TASK_PRIORITIES = ["Low", "Medium", "High"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export interface Task {
  id: string;
  title: string;
  component: string;
  priority: TaskPriority;
  estimate: string; // free text, e.g. "2d"
  dependencies: string;
  repo: string;
  column: TaskColumn;
  notes: string;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

// --- Company Entities ----------------------------------------------------
export const ENTITY_STATUS = ["Active", "Planned", "Dormant", "Closed"] as const;
export type EntityStatus = (typeof ENTITY_STATUS)[number];

export interface Entity {
  id: string;
  name: string;
  entityType: string; // e.g. AB, LLC
  jurisdiction: string; // e.g. Sweden, Wyoming (US)
  purpose: string;
  ownership: string;
  assets: string;
  status: EntityStatus;
  nextFilingDate: string | null; // YYYY-MM-DD
  notes: string;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

// --- Timeline & Milestones -----------------------------------------------
export const MILESTONE_CATEGORIES = [
  "Product",
  "Outreach",
  "Legal",
  "Banking",
  "Launch",
  "Other",
] as const;
export type MilestoneCategory = (typeof MILESTONE_CATEGORIES)[number];

export interface Milestone {
  id: string;
  title: string;
  date: string | null; // YYYY-MM-DD
  category: MilestoneCategory;
  done: boolean;
  notes: string;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

// --- Contacts (with CSV import) ------------------------------------------
export interface Contact {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  tags: string[];
  notes: string;
  aiSummary?: string; // one-line AI summary
  aiScore?: number; // AI priority score 1–5 (5 = highest)
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

// Target fields a CSV column can be mapped to during import.
export const CONTACT_FIELDS = [
  "name",
  "email",
  "company",
  "phone",
  "tags",
  "notes",
] as const;
export type ContactField = (typeof CONTACT_FIELDS)[number];

// --- Chat (persistent conversations, like a normal AI site) --------------
export interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMsg[];
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

// --- Subscriptions / hosting (recurring services) ------------------------
export const BILLING_CYCLES = ["monthly", "quarterly", "yearly", "one-time"] as const;
export type BillingCycle = (typeof BILLING_CYCLES)[number];

export const SUBSCRIPTION_STATUS = ["active", "cancelled", "expired"] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUS)[number];

export interface Payment {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  notes: string;
}

export interface Subscription {
  id: string;
  name: string; // "KVM 4", ".COM Domain", "Business Web Hosting"
  provider: string; // "Hostinger"
  account: string; // domain / service identifier
  plan: string;
  amount: number; // price per cycle
  currency: string; // default "USD"
  cycle: BillingCycle;
  nextRenewal: string | null; // YYYY-MM-DD
  autoRenew: boolean;
  status: SubscriptionStatus;
  paymentMethod: string;
  payments: Payment[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// --- Strategy (growing knowledge base) -----------------------------------
export interface StrategyNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  source: string; // manual | paste | chat | ai
  pinned: boolean; // the AI synthesis is pinned to the top
  createdAt: string;
  updatedAt: string;
}

// --- Outreach email templates (editable in-browser) ----------------------
export interface EmailTemplate {
  id: string;
  title: string;
  category: string; // "Sales" | "Marketing" | "Other"
  body: string; // markdown / plain text, edited in the browser
  tags: string[];
  source: string; // "agent" | "manual"
  createdAt: string;
  updatedAt: string;
}

// --- Royalty recovery pipeline (TrapRoyaltiesPro / TrapLawPro) ------------
export const CLAIM_STAGES = [
  "Lead",
  "Verified",
  "Bundled",
  "Filed",
  "Recovered",
  "Paid",
  "Dead",
] as const;
export type ClaimStage = (typeof CLAIM_STAGES)[number];

export interface RoyaltyClaim {
  id: string;
  artist: string;
  track: string;
  isrc: string;
  estimatedRecovery: number; // expected $ recoverable
  recoveredAmount: number; // actual $ recovered
  feeRate: number; // your consultant fee, default 0.05 (5%)
  stage: ClaimStage;
  attorney: string;
  bundle: string;
  filedDate: string | null; // YYYY-MM-DD
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// --- Business Credit journey ---------------------------------------------
export const CREDIT_TIERS = [
  "Foundation",
  "Vendor (Net-30)",
  "Store card",
  "Bank card",
  "Credit line",
  "Corporate (no PG)",
] as const;
export type CreditTier = (typeof CREDIT_TIERS)[number];

export const CREDIT_STATUS = [
  "researching",
  "applied",
  "open",
  "closed",
  "denied",
] as const;
export type CreditStatus = (typeof CREDIT_STATUS)[number];

export interface CreditTask {
  id: string;
  phase: string;
  text: string;
  done: boolean;
}

export interface CreditAccount {
  id: string;
  name: string;
  tier: CreditTier;
  limit: number;
  balance: number;
  status: CreditStatus;
  reportsTo: string; // e.g. "D&B, Experian"
  opened: string | null; // YYYY-MM-DD
  notes: string;
}

export interface CreditProfile {
  ein: string;
  dunsNumber: string;
  paydex: number; // 0–100
  businessBank: boolean;
  notes: string;
  updatedAt: string;
}
