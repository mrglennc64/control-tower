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
