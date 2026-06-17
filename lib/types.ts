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

export interface DocumentItem {
  id: string;
  title: string;
  type: DocType;
  location: string; // file path or URL
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
