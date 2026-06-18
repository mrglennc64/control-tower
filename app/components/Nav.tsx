"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Overview" },
  { href: "/outreach", label: "Outreach" },
  { href: "/contacts", label: "Contacts" },
  { href: "/deadlines", label: "Deadlines" },
  { href: "/vault", label: "Vault" },
  { href: "/finance", label: "Finance" },
  { href: "/workboard", label: "Workboard" },
  { href: "/entities", label: "Entities" },
  { href: "/timeline", label: "Timeline" },
  { href: "/credit", label: "Business Credit" },
  { href: "/subscriptions", label: "Subscriptions" },
  { href: "/strategy", label: "Strategy" },
  { href: "/agents", label: "Agents" },
  { href: "/chat", label: "Chat" },
  { href: "/ask", label: "Ask AI" },
  { href: "/settings", label: "Settings" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <aside
      className="w-56 shrink-0 border-r px-4 py-6"
      style={{ background: "var(--ct-surface)" }}
    >
      <div className="mb-8 px-2">
        <div className="text-sm font-semibold" style={{ color: "var(--ct-accent)" }}>
          Founder
        </div>
        <div className="text-lg font-bold leading-tight">Control Tower</div>
      </div>
      <nav className="flex flex-col gap-1">
        {links.map((l) => {
          const active =
            l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-2 text-sm transition-colors"
              style={{
                background: active ? "var(--ct-surface-2)" : "transparent",
                color: active ? "var(--ct-text)" : "var(--ct-muted)",
              }}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
      <div
        className="mt-8 border-t pt-4 text-xs"
        style={{ color: "var(--ct-muted)" }}
      >
        Local-first · data in OneDrive
      </div>
    </aside>
  );
}
