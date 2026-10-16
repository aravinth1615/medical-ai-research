---
name: design-consistency
description: Use when touching visual design, layout, or styling anywhere in this project. Keeps new UI from drifting into generic "AI-slop" defaults and from mixing the storefront and admin design languages.
---

# Design Consistency

This project already has two deliberate, finished design languages — the job when adding UI is almost never "invent a new look," it's "extend one of the two existing ones without drift or mixing."

## The two systems (don't cross-contaminate)

- **Storefront**: Sofia Sans-style type, red/black brand identity, `framer-motion` for interaction, hand-authored Tailwind (`bg-teritary`, `text-primary`/`text-secondary` as brand tokens).
- **Admin**: shadcn/ui new-york style, Inter, OKLCH red/stone "luma" theme under `[data-admin-theme]`, `--color-admin-accent` bridge tokens, TanStack Table + Dialog/Sheet + react-hook-form.

If you're editing an admin page, every new element should be indistinguishable in spirit from the dozen admin managers already built. If you're editing the storefront, match its existing motion/typography choices. Never introduce a third look, a second icon library, or a second animation library "because it looked nice" — see [[surgical-refactor]].

## Anti-slop checklist (apply before calling visual work done)

Generic AI-generated UI has recognizable tells. Check for them:

- **No unexplained purple/blue gradient-on-white default** — this project's brand color is red; don't default to a generic SaaS palette on a new page.
- **No second icon set.** `lucide-react` is the established icon library across both surfaces — don't add another one for "better" icons.
- **No placeholder-looking data** in anything a real user could see: no "Jane Doe," no suspiciously round fake numbers, no lorem-ipsum-shaped copy left in shipped UI.
- **Every interactive element needs its neighbor's states.** If sibling buttons have hover/disabled/loading treatment, a new one needs it too — don't ship a half-finished-looking control next to polished ones.
- **Every list/table needs a real empty state**, not a blank box — the `DataTable` component already supports `emptyMessage`/`emptyIcon`; use them rather than skipping the empty case.
- **Status colors must be semantic and consistent** with the existing palette (green = active/success, yellow = pending, red = error/destructive, blue/gray = neutral/informational) — don't invent a new color mapping for a status enum that already has established colors elsewhere.

## Workflow for improving existing UI

1. **Scan** the file(s) you're changing for their current tokens and patterns before writing anything — what font, what spacing scale, what component primitives does this file already use?
2. **Diagnose** concretely: name the specific inconsistency (not "make it nicer") — e.g., "this table doesn't use `DataTable` like its siblings," or "this badge uses a raw `<span>` instead of `Badge`."
3. **Fix** with the smallest change that resolves it, in the existing tech stack. Don't rewrite a working component from scratch to fix one inconsistency.

## Before calling a visual change done

- Check it in **both dark and light mode** (the admin theme toggle) — a color that only works in one mode is not done.
- If you touched the admin surface, confirm the **storefront is visually untouched**, and vice versa — the two must stay independently stylable.
- Mixing a shadcn component into the storefront (or a storefront-token class into an admin page) is a design-consistency bug even if it renders without errors.
