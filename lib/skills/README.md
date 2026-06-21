# Marketing skill playbooks

These `*.md` files are vendored from **coreyhaines31/marketingskills**
(https://github.com/coreyhaines31/marketingskills), MIT License,
© 2025 Corey Haines.

They are injected as system-prompt context by `lib/skills.ts` to sharpen the
app's AI features:

- `cold-email.md` → `/api/ai/draft` (outreach drafting)
- `product-marketing.md` → `/api/strategy/synthesize` (strategy synthesis)

The rest are kept here as a reference library for future wiring (prospecting,
competitor-profiling, pricing, offers, sales-enablement, customer-research,
copywriting, copy-editing, marketing-psychology).

Vendored after a safety scan for prompt-injection / exfiltration / code-exec
directives — all clean (they are instructional marketing markdown).
