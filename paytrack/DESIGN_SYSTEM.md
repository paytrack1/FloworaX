# FloworaX Design System (v1)

The single source of truth for UI across the app. Tokens live in `tailwind.config.js`,
primitives live in `src/components/ui/`.

## 1. Colour

| Token | Value | Usage |
|---|---|---|
| `brand-500` | `#185FA5` | Primary actions, links, chart stroke — **the brand anchor** |
| `brand-600/700` | `#124E89` / `#0F3D6D` | Hover / pressed states |
| `brand-50` | `#EFF6FC` | Tinted chips, quiet highlights |
| `accent` | `#0EA5E9` | Sparingly — secondary interactive highlight |
| `surface` / `surface-muted` / `surface-sunken` | white / `#F6F8FB` / `#EEF2F7` | Page background, cards, inset wells |
| `ink` / `ink-secondary` / `ink-muted` / `ink-faint` | `#0F172A` → `#CBD5E1` | Text hierarchy |
| `positive` / `negative` / `warning` / `info` | green / red / amber / blue | Financial + status semantics, always paired with their `-soft` background |

**Rules**
- Never use gradients on surfaces — elevation and colour chips do the work.
- Green = money in / success. Red = money out / danger. Never decorative.
- One primary button per view. Everything else is `secondary` or `ghost`.

## 2. Typography

| Token | Size / Weight | Usage |
|---|---|---|
| `text-display` | 30px / 800 | Page titles, hero numbers |
| `text-title` | 20px / 700 | Screen section titles |
| `text-heading` | 16px / 600 | Card titles, list headers |
| `text-body` | 14px / 400 | Body copy, inputs |
| `text-caption` | 12px / 500 | Secondary labels |
| `text-micro` | 10px / 600, uppercase | Eyebrows, badges, overlines |

## 3. Spacing & shape
- 4px base grid; card padding `p-5` (20px), page gutters `px-5 lg:px-8`.
- Radii: `rounded-card` (16px) for surfaces, `rounded-field` (12px) for inputs/buttons, `rounded-full` for badges/avatars.
- Shadows: `xs → lg` scale, all navy-tinted (`rgb(15 23 42 / …)`), never black.

## 4. Components (`src/components/ui/`)

| Component | Notes |
|---|---|
| `Button` | variants `primary / secondary / ghost / danger`, sizes `sm / md / lg`, built-in loading spinner, icon slots, focus ring |
| `Card` | base surface; `interactive` prop adds hover lift |
| `StatCard` | KPI tile; `tone` maps semantics (`positive`, `negative`, `brand`, `neutral`); optional `trend` badge |
| `Badge` | status pill with dot; tones match semantic palette |
| `Input` | label + icon + hint/error slot; consistent focus ring |
| `EmptyState` | icon + title + description + action |
| `SectionHeader` | consistent block heading with optional "See all" action |

Import everything from the barrel: `import { Button, Card, StatCard, Badge, Input, EmptyState, SectionHeader } from './ui'`.

## 5. Patterns
- **Charts:** Recharts; brand `#185FA5` for revenue, `#DC2626` for expenses; navy tooltip; y-axis in `k` units.
- **Loading:** spinner inside buttons; `FSpinner` block for full views.
- **Errors:** inline `warning-soft` banner on dashboard; `negative-soft` alert box on forms.
- **Empty:** `EmptyState` with a one-click action that moves the user forward (e.g. "Record a sale").
- **Mobile:** touch targets ≥ 44px, bottom nav + FAB pattern, forms single-column.

## 6. Roadmap (next screens to migrate onto the kit)
1. `Expenses`, `SalesHistory` → Card + Badge + EmptyState tables
2. `Settings`, `TeamManagement` → Input + Button forms
3. `Welcome` (landing) → display type + brand tokens
4. `Reports` → shared chart patterns
