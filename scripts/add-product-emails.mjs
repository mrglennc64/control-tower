// Append one customer-outreach sequence per product into emails.json.
// Idempotent: skips any product whose title already exists. Preserves all
// existing entries (and in-app edits).
//
//   node scripts/add-product-emails.mjs <emailsJsonPath>

import { promises as fs } from "fs";
import crypto from "crypto";

const target = process.argv[2];
if (!target) {
  console.error("usage: add-product-emails.mjs <emailsJsonPath>");
  process.exit(1);
}

const SIGN = "Glenn Carter\nNorthern Star Systems";

// Each: [title, intro-pain email1, day-3 follow-up, day-7 breakup]
const PRODUCTS = [
  {
    title: "HeyRoya — rights validation (customer)",
    icp: "Music publishers, labels, rights administrators",
    e1: `**Subject:** rights-chain gaps

Hi {{FirstName}},

{{Company}} administers rights, so you know the quiet problem: when an ISRC, ISWC, or IPI is wrong or missing, the royalties just don't arrive — and you usually find out months later, if at all.

HeyRoya checks the rights chain and flags those gaps before they cost you. Worth a quick look?

${SIGN}`,
    e2: `**Subject:** re: rights-chain gaps

Hi {{FirstName}},

Quick follow-up. The reason this matters: a single bad identifier can route a work's royalties to nowhere, and nothing in your statements tells you it happened. HeyRoya surfaces those before a payout cycle, not after.

Happy to run a sample of your catalog. Worth 15 minutes?

${SIGN}`,
    e3: `**Subject:** closing the loop

Hi {{FirstName}},

Last note. If rights-chain validation isn't a priority right now, no problem — point me to a better time or the right person and I'll leave it there.

${SIGN}`,
  },
  {
    title: "VerseIQ — territory/coverage gaps (customer)",
    icp: "Larger publishers, catalog owners, sub-publishing/admin teams",
    e1: `**Subject:** territory gaps

Hi {{FirstName}},

For a catalog the size of {{Company}}'s, it's hard to know which works aren't registered or covered in every territory — and each gap is income you're simply not collecting.

VerseIQ surfaces those coverage and registration gaps across the whole catalog at once. Worth a look?

${SIGN}`,
    e2: `**Subject:** re: territory gaps

Hi {{FirstName}},

Following up. Most coverage gaps aren't errors anyone made — works just never got registered somewhere they earn. The money's owed; it's just not being claimed. VerseIQ shows you where.

I can run an intelligence pass on your catalog. Worth 15 minutes?

${SIGN}`,
    e3: `**Subject:** closing the loop

Hi {{FirstName}},

Circling back once. If now isn't the time to look at territory coverage, just tell me when — or who else I should talk to.

${SIGN}`,
  },
  {
    title: "TrapRoyaltiesPro — royalty recovery (customer)",
    icp: "Artists, managers, producers, indie labels",
    note: "TRACK PAUSED — recovery ops are on hold until attorney recovery metrics are in. Copy is ready for when you resume.",
    e1: `**Subject:** royalties you're owed

Hi {{FirstName}},

Most artists are owed back royalties they never see — black-box income, unmatched plays, misattributed splits. It adds up, and nobody hands it to you.

TrapRoyaltiesPro runs a forensic recovery on a catalog to find and reclaim what's owed. Want me to take a look at yours?

${SIGN}`,
    e2: `**Subject:** re: royalties you're owed

Hi {{FirstName}},

Quick follow-up. This isn't a guess-and-hope thing — it's twenty years of recovery methodology run as a fixed process against your catalog. If there's money sitting unclaimed, this finds it.

No upfront cost to look. Worth a short call?

${SIGN}`,
    e3: `**Subject:** closing the loop

Hi {{FirstName}},

Last note. If now's not the time, no problem — I'll leave the door open. If you'd rather I talk to your manager or label, just send me their way.

${SIGN}`,
  },
  {
    title: "CIP — compliance scan reports (customer)",
    icp: "Compliance / risk teams at regulated enterprises",
    e1: `**Subject:** scan noise

Hi {{FirstName}},

Compliance teams drown in scan alerts that are mostly noise — and the few real findings are the hard ones to defend when an auditor asks.

CIP delivers operator-reviewed scan reports: defensible findings, not a wall of false positives. Worth 15 minutes to see if it fits {{Company}}'s process?

${SIGN}`,
    e2: `**Subject:** re: scan noise

Hi {{FirstName}},

Following up. The difference with CIP is the human review step — every report is checked so what reaches your team is something you can act on and stand behind, not triage.

Happy to walk through a sample report. Worth a look?

${SIGN}`,
    e3: `**Subject:** closing the loop

Hi {{FirstName}},

Circling back once. If this isn't a priority this quarter, just tell me when to revisit — or who owns this at {{Company}}.

${SIGN}`,
  },
  {
    title: "MediReady — claims validation (customer)",
    icp: "Medical billing / RCM teams, practices, billing companies",
    e1: `**Subject:** claim denials

Hi {{FirstName}},

When claims go out with administrative errors, they come back as denials — and your team eats the rework.

MediReady validates the administrative side before submission (no PHI, no clinical logic) and leaves a clean RCM evidence trail. Worth a look at how it'd fit your workflow?

${SIGN}`,
    e2: `**Subject:** re: claim denials

Hi {{FirstName}},

Quick follow-up. The point isn't to add another tool to your stack — it's to catch the avoidable, administrative denials before they cost a cycle, with a record of every correction for audit.

I can show it on a batch of your claim types. Worth 15 minutes?

${SIGN}`,
    e3: `**Subject:** closing the loop

Hi {{FirstName}},

Last note. If denial rework isn't the fire right now, no problem — point me to a better time or the right person on your RCM side.

${SIGN}`,
  },
  {
    title: "Denial Engine — appeal packets (customer)",
    icp: "RCM teams, billing companies, practices with denial backlogs",
    note: "This is the painkiller-pilot wedge — lead with this one.",
    e1: `**Subject:** denial appeals

Hi {{FirstName}},

Every denied claim {{Company}} appeals is slow, manual work — read the denial, figure out the fix, write the appeal, hope it lands.

Denial Engine turns a denial into a structured analysis, a corrected claim, and a payer-ready appeal packet — grounded in the actual denial text. Want to see it run on one of your real denials?

${SIGN}`,
    e2: `**Subject:** re: denial appeals

Hi {{FirstName}},

Following up. Send me one denied claim (de-identified is fine) and I'll send back the appeal packet it produces — so you can judge it on your own work, not a demo.

Worth a quick look?

${SIGN}`,
    e3: `**Subject:** closing the loop

Hi {{FirstName}},

Last note. If your denial backlog isn't the priority right now, just tell me when to circle back — or who runs appeals at {{Company}}.

${SIGN}`,
  },
  {
    title: "PerfectBook — reconciliation (customer)",
    icp: "Finance / accounting teams, controllers, bookkeeping firms",
    e1: `**Subject:** reconciliation

Hi {{FirstName}},

Reconciliation eats {{Company}}'s month-end, and when something's off there's rarely a clean trail of how it got fixed — just someone's memory.

PerfectBook reconciles and validates with a replayable evidence chain behind every correction. Worth a look?

${SIGN}`,
    e2: `**Subject:** re: reconciliation

Hi {{FirstName}},

Quick follow-up. The evidence chain is the part finance teams tend to care about most — when an auditor (or a partner) asks "why is this number this number," you can replay exactly how it got there.

Happy to show it on a sample close. Worth 15 minutes?

${SIGN}`,
    e3: `**Subject:** closing the loop

Hi {{FirstName}},

Circling back once. If now isn't the time, just point me to a better month — or who owns the close at {{Company}}.

${SIGN}`,
  },
  {
    title: "Inspection — clean master files (customer)",
    icp: "Inspection firms, field-service, building/safety inspectors",
    e1: `**Subject:** inspection exports

Hi {{FirstName}},

Raw inspection exports take real time to turn into clean, compliant master files — and they have to be audit-ready when someone asks.

Inspection does that conversion in milliseconds, the moment the data lands. Worth a quick look at how it'd fit {{Company}}'s process?

${SIGN}`,
    e2: `**Subject:** re: inspection exports

Hi {{FirstName}},

Following up. The time savings is the obvious part; the bigger one is consistency — every file comes out in the same compliant shape, so nothing slips through because someone formatted it by hand.

I can run it on a sample export. Worth 15 minutes?

${SIGN}`,
    e3: `**Subject:** closing the loop

Hi {{FirstName}},

Last note. If this isn't a priority right now, just tell me when to revisit — or the right person to talk to at {{Company}}.

${SIGN}`,
  },
];

function bodyFor(p) {
  const head = [
    `**ICP:** ${p.icp}`,
    p.note ? `> ${p.note}` : null,
    "**Personalize:** `{{FirstName}}`, `{{Company}}`. Email 1 → day 3 → day 7. Stop on reply.",
  ]
    .filter(Boolean)
    .join("\n");
  return [
    head,
    "\n---\n\n## Email 1 — intro\n\n" + p.e1,
    "\n---\n\n## Email 2 — follow-up (Day 3)\n\n" + p.e2,
    "\n---\n\n## Email 3 — breakup (Day 7)\n\n" + p.e3,
  ].join("\n");
}

const existing = JSON.parse(await fs.readFile(target, "utf8"));
const have = new Set(existing.map((e) => e.title));
const now = new Date().toISOString();
let added = 0;
for (const p of PRODUCTS) {
  if (have.has(p.title)) continue;
  existing.push({
    id: crypto.randomUUID(),
    title: p.title,
    category: "Product",
    body: bodyFor(p),
    tags: ["product", "customer"],
    source: "agent",
    createdAt: now,
    updatedAt: now,
  });
  added++;
}
await fs.writeFile(target, JSON.stringify(existing, null, 2), "utf8");
console.log(`added ${added} product emails; total now ${existing.length}`);
