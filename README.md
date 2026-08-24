# Spendly - Daily Expense Tracker

A responsive expense tracker built with Next.js 15. Log what you spend each day, see where the
money goes, and keep an eye on a monthly budget. Data is stored in a Postgres database (via
Prisma), so it follows a profile across devices and browsers.

## Features

- **Local-style profiles, backed by a real database.** Several people can share one app, each with
  their own expenses. A profile can optionally be locked with a 4-8 digit PIN.
- **Add, edit and delete expenses** with amount, category, date, payment method and a note.
- **Summary cards** for today, this week, this month and average spend per day, each compared with
  the previous period.
- **Monthly budget** with a progress bar that turns amber past 80% and red once you go over.
- **Charts.** A donut of spend by category for the selected period, and a daily bar chart over the
  last 7, 14 or 30 days.
- **Search and filters** by note, category and date range (this week, this month, last 30 days, all
  time).
- **CSV export** of the active profile, so you can keep a backup.
- **Light and dark themes**, following your system preference on first load.
- Mobile-first layout: bottom sheets and a floating add button on phones, a two-column dashboard on
  larger screens.

## Getting started

Requires Node.js 18.18 or newer (developed on Node 24), and a Postgres database (this project was
built against [Neon](https://neon.tech)).

1. Copy your connection string into `.env`:

   ```bash
   DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
   ```

2. Install dependencies and apply the schema:

   ```bash
   npm install
   npx prisma migrate deploy   # or `npx prisma migrate dev` while developing the schema
   ```

3. Run the app:

   ```bash
   npm run dev
   ```

Open http://localhost:3000 and create your first profile.

Other scripts:

```bash
npm run build          # production build
npm start               # serve the production build
npm run lint             # eslint
npx prisma studio       # browse the database in a GUI
npx prisma migrate dev  # create and apply a new migration after editing prisma/schema.prisma
```

## Where your data lives

Profiles, expenses and settings are stored in Postgres, defined by `prisma/schema.prisma`:

| Model      | Contents                                                    |
| ---------- | ------------------------------------------------------------ |
| `Profile`  | Name, colour, PIN hash + salt (nullable)                     |
| `Expense`  | Amount, category, date, payment method, note, owning profile |
| `Settings` | Currency and monthly budget, one row per profile              |

The app talks to this data exclusively through Next.js API routes under `src/app/api/`. Only two
small, non-sensitive preferences remain in the browser's `localStorage` (prefixed `et:v1:`):

| Key                   | Contents                     |
| ---------------------- | ----------------------------- |
| `et:v1:activeProfile` | Last opened profile id        |
| `et:v1:theme`          | Light or dark preference      |

Consequences worth knowing:

- Data **does** sync between devices and browsers, since it lives server-side.
- Deleting a profile removes its expenses and settings from the database permanently (cascading
  delete). Use **Settings -> Export CSV** first if you want a backup.
- If the server or database is unreachable, the app surfaces a dismissible error toast instead of
  crashing, and local edits are simply not saved until the connection is restored.

## About the PIN

The profile PIN is a **convenience lock, not authentication.** It exists so that people sharing a
device do not open each other's profile by accident.

The PIN itself is never stored, and — now that there is a backend — it never has to leave the
server either. What is stored is a SHA-256 hash of a random 16-byte salt plus the PIN
(`src/lib/pin.ts`), computed and verified inside the `/api/profiles/[id]/unlock` route. Unlocking
compares hashes in constant time. Even so, there is no session token, no rate limiting on unlock
attempts, and no account recovery flow behind it. Treat it accordingly:

- Do not reuse a real password or bank PIN.
- Do not store data here that would be damaging if someone else guessed or bypassed the PIN.

## Project structure

```
prisma/
  schema.prisma       Profile, Expense, Settings models
  migrations/         Generated SQL migrations
src/
  app/
    layout.tsx        Fonts, metadata, ProfileProvider
    page.tsx           Renders the app shell
    globals.css        Tailwind v4 theme tokens, light/dark palette, shared component classes
    api/
      profiles/                     GET (list), POST (create)
      profiles/[id]/                PATCH (rename/recolor), DELETE
      profiles/[id]/unlock/         POST (verify PIN server-side)
      profiles/[id]/expenses/       GET (list), POST (create)
      profiles/[id]/settings/       GET, PATCH
      expenses/[id]/                PATCH, DELETE
  components/
    AppShell.tsx      Boot skeleton, gate vs dashboard, error toast
    ProfileGate.tsx   First-run creation, profile picker, PIN entry
    Dashboard.tsx     Dashboard layout and dialog state
    ExpenseForm.tsx   Add and edit form (bottom sheet on mobile, dialog on desktop)
    ExpenseList.tsx   Expenses grouped by day, with per-day totals
    CategoryDonut.tsx TrendChart.tsx  Recharts visualisations
    ...
  context/
    ProfileContext.tsx  Profiles, unlock/lock, expense CRUD, settings, theme (calls src/lib/api.ts)
  lib/
    api.ts            Typed fetch wrappers for the API routes
    prisma.ts         Shared Prisma client (pg driver adapter, cached across dev reloads)
    serialize.ts      Prisma row -> public JSON shape (strips PIN hash/salt)
    storage.ts        Validated localStorage for theme + last-open-profile only
    pin.ts            Salted SHA-256 PIN hashing, used server-side
    expenses.ts       Dates, totals, filtering, formatting, CSV
    categories.ts     Category and payment-method metadata
    types.ts          Shared types
```

## Tech stack

Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Prisma 7 + Postgres (Neon),
Recharts, lucide-react.
