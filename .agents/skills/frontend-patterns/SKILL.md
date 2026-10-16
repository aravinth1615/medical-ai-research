---
name: frontend-patterns
description: Use when building or editing React components in this Next.js App Router project — admin CRUD managers or storefront pages. Encodes the established component and state-management patterns so new UI matches existing code.
---

# Frontend Patterns

This project has **two separate frontend surfaces** that must never share conventions:

- **Storefront** (`app/`, `components/` outside `admin/`): Sofia Sans-styled type, red/black brand palette, `framer-motion`, storefront-specific Tailwind tokens (`bg-teritary`, `text-primary`/`text-secondary` — these are the storefront's own hijacked token names, not shadcn's).
- **Admin** (`app/admin/**`, `components/admin/**`): shadcn/ui (new-york style), Inter font, an OKLCH red/stone theme scoped under `[data-admin-theme]`, with `--color-admin-accent`/`--color-admin-accent-foreground` as the bridge tokens for hand-written files (use `bg-admin-accent`, not `bg-primary`, in admin JSX).

Know which surface you're in before writing a single class name. See [[design-consistency]] for the visual-quality side of this split.

## The admin CRUD-manager recipe

Every admin resource manager (`components/admin/*/*-manager.tsx`) follows the same shape — reuse it, don't reinvent it:

1. **List** → the shared `DataTable` (`components/admin/common/data-table.tsx`): TanStack Table + shadcn `Table`, **server-side pagination only** (no client sort/filter row models), wired to `PaginationControls` (a shadcn `Select` for page size, not a native `<select>`).
2. **Create/Edit** → shadcn `Dialog` for small forms, `Sheet` (`className="w-full sm:max-w-2xl overflow-y-auto p-0"`) for large ones (Products, Orders detail). Pick based on form size, not habit.
3. **Form state** → `react-hook-form` + `@hookform/resolvers/zod` + shadcn `Form`/`FormField`/`FormItem`/`FormLabel`/`FormControl`/`FormMessage`/`FormDescription`. Exception: forms with complex dynamic list widgets (image lists, spec key/value pairs, tag chips, product variants) use plain `useState` instead — don't force react-hook-form onto UI it fights with.
4. **Status/type fields** → shadcn `Select`. **Booleans** → `Switch` in forms, `Checkbox` in filter bars. **Status pills** → `Badge` with semantic color classes (`bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400`), never a raw styled `<span>`.

## Two gotchas that cause silent failures

- **Every Zod-required field needs a real `FormField`.** A field driven by local `useState` and never wired through `form.setValue(..., {shouldValidate: true})` will make the whole form's Zod validation fail on every submit with **zero visible error and zero network request** — it just looks like the button does nothing. If a submit silently no-ops, check that every schema field is actually registered with the form.
- **`.default()` fields need the split type.** `type Input = z.input<typeof schema>`, `type Output = z.output<typeof schema>`, `useForm<Input, unknown, Output>({resolver: zodResolver(schema)})`. Using a single `z.infer` type here is a real, recurring TypeScript error in this codebase.

## Minor recurring fixes

- `useEffect(() => { load() }, [load])` sometimes trips the `react-hooks/set-state-in-effect` ESLint rule as an error in new files (inconsistently — identical code elsewhere passes). Wrap in `setTimeout(load, 0)` as the established workaround.
- When resetting a react-hook-form with API data that has optional string fields, coalesce `undefined` → `""` before `form.reset()` — Mongoose omits unset optional fields from JSON entirely, and passing `undefined` into a controlled input flips it from controlled to uncontrolled (a real React warning, not cosmetic).
