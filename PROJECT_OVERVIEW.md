# Spendly — How This Project Was Built

A walkthrough document you can use to explain the app: what it does, how it's built, and why it
was built that way. Written so you can present it without needing to read the source code.

---

## 1. Elevator pitch

**Spendly** is a responsive daily-expense tracker. Multiple people can use the same app, each with
their own private "profile" (optionally locked with a PIN). Inside a profile you can log expenses,
see spending summaries, track a monthly budget, view charts, and export your data as CSV. Everything
is saved to a real database, so it follows you across devices and browsers — it's not just a local
demo.

---

## 2. Tech stack (and why each piece was chosen)

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | **Next.js 15** (App Router) | One project for both the UI and the backend API — no separate server to run or deploy. |
| Language | **TypeScript** | Catches mistakes (wrong field names, wrong types) before the code ever runs. |
| UI library | **React 19** | Comes bundled with Next.js; component model fits a dashboard-style UI well. |
| Styling | **Tailwind CSS v4** | Fast to build a consistent, responsive design without hand-writing CSS files per component. |
| Charts | **Recharts** | Ready-made, accessible chart components (donut + bar) that are easy to theme. |
| Icons | **lucide-react** | Lightweight, consistent icon set. |
| Database | **PostgreSQL**, hosted on **Neon** | A real, durable, cloud database reachable from anywhere — needed once we moved past "just a browser demo." |
| Database access | **Prisma ORM** (with the `@prisma/adapter-pg` driver adapter) | Lets us describe the database tables in one readable file (`schema.prisma`) and get type-safe, auto-completed database queries in TypeScript instead of writing raw SQL by hand. |

---

## 3. The two "eras" of this project

It's useful to explain the app in two stages, because that mirrors how it was actually built and
shows a real architecture decision:

### Stage 1 — Browser-only prototype
The first version stored everything in the browser's `localStorage`: profiles, expenses, settings,
even the "which profile is currently open" state. This is fast to build and needs zero
infrastructure, but it has an obvious limitation — the data is trapped in one browser, on one
device. If you clear your browser data, everything is gone.

### Stage 2 — Real backend added
To fix that, a proper backend was added:
- A **Postgres database** (via Neon) now stores profiles, expenses, and settings permanently.
- **Next.js API routes** (`src/app/api/...`) sit between the browser and the database, doing
  validation and talking to Postgres through Prisma.
- The browser now only keeps two small, non-sensitive preferences locally: which theme (light/dark)
  and which profile was last open — everything that matters lives in the database.

This is a common real-world pattern: **start local and simple, then add a backend once you need
data to persist and sync properly.**

---

## 4. Architecture, in one picture

```
┌─────────────────────┐        HTTP fetch        ┌──────────────────────────┐        SQL         ┌────────────┐
│   React components   │ ───────────────────────▶ │  Next.js API routes      │ ─────────────────▶ │  Postgres  │
│  (src/components/*)  │                          │  (src/app/api/**/*.ts)   │   via Prisma ORM    │   (Neon)   │
│                       │ ◀─────────────────────── │                          │ ◀───────────────── │            │
└─────────────────────┘        JSON response       └──────────────────────────┘                     └────────────┘
          ▲
          │ reads/writes only two small prefs
          ▼
   Browser localStorage
   (theme, last-open-profile)
```

- **Components** never talk to the database directly. They call functions in `src/lib/api.ts`,
  which does `fetch()` calls to the API routes.
- **API routes** never trust the browser blindly — every route validates and sanitizes what comes
  in (amount is a real number, category is a known category, PIN is the right length, etc.) before
  touching the database.
- **Prisma** turns the schema in `prisma/schema.prisma` into a type-safe client, so a typo in a
  field name is caught while writing the code, not at 2am in production.

---

## 5. Data model (the 3 database tables)

Defined in `prisma/schema.prisma`:

| Table | What it stores | Key relationships |
| --- | --- | --- |
| `profiles` | Name, colour, optional PIN hash + salt, created date | Has many `expenses`, has one `settings` |
| `expenses` | Amount, category, date, payment method, note, which profile owns it | Belongs to one `profile` |
| `settings` | Currency, monthly budget | Belongs to one `profile` (one row per profile) |

Deleting a profile **cascades**: its expenses and settings are automatically deleted too, so there's
never orphaned data left behind.

---

## 6. How a PIN "lock" works (and why it's not a password)

Profiles can optionally have a 4–8 digit PIN so that if two people share the same laptop, one
person doesn't accidentally open the other's expenses. It is explicitly **not** meant to be treated
like a bank PIN or a real login system — there's no session, no rate-limiting, no "forgot PIN"
recovery.

How it's implemented:
1. When a PIN is set, the server generates a random 16-byte **salt**, mixes it with the PIN, and
   runs it through **SHA-256** to get a **hash**. Only the hash + salt are stored — never the PIN
   itself.
2. When unlocking, the browser sends the typed PIN to `/api/profiles/[id]/unlock`. The **server**
   re-hashes it with the stored salt and compares the two hashes using a constant-time comparison
   (so an attacker can't learn anything from how fast/slow the check responds).
3. The browser never receives the hash or salt — the comparison happens entirely server-side.

This is a good talking point: it shows understanding of *why* you salt and hash secrets, and why
comparison timing matters, even for a low-stakes feature like this.

---

## 7. Key features to demo

- **Multiple profiles** on one app, switchable from the header, each with isolated data.
- **Add / edit / delete expenses** — amount, category, date, payment method, optional note.
- **Summary cards**: today, this week, this month, and average per day, each compared against the
  previous period with an up/down percentage.
- **Monthly budget bar** that turns amber near the limit and red once over, with days remaining in
  the month.
- **Search & filter**: by text, category, and date range (this week / month / last 30 days / all
  time).
- **Charts**: a donut chart of spend-by-category and a 7/14/30-day bar chart of daily totals, both
  built with Recharts and themed to match light/dark mode.
- **CSV export** of the active profile's expenses, for backups or spreadsheets.
- **Light/dark theme**, following the system preference on first load.
- **Fully responsive**: bottom-sheet forms and a floating add button on phones, a two-column
  dashboard layout on desktop.

---

## 8. Project structure (what lives where)

```
prisma/
  schema.prisma          The 3 database tables and their fields/relationships
  migrations/            Auto-generated SQL that created those tables in Postgres

src/
  app/
    api/                 Backend endpoints (list/create/update/delete profiles, expenses, settings)
    layout.tsx           Page shell: fonts, metadata, wraps everything in ProfileProvider
    page.tsx             Just renders <AppShell />
    globals.css          Design tokens (colours for light/dark) + shared button/card/animation styles

  components/             One React component per UI piece (forms, lists, charts, modals, etc.)

  context/
    ProfileContext.tsx    The "brain" of the frontend: holds the current profile, expenses and
                          settings in memory, and exposes functions like addExpense() /
                          unlockProfile() that call the API and update the UI

  lib/
    api.ts                Typed fetch() wrappers — the only place the frontend talks to the network
    prisma.ts             One shared, reused database connection (avoids opening a new one per request)
    serialize.ts          Converts raw database rows into the safe shape sent to the browser
                          (this is where the PIN hash gets stripped out before it leaves the server)
    pin.ts                PIN hashing/verification logic (SHA-256 + salt), used only on the server
    expenses.ts           Date math, currency formatting, filtering/sorting, CSV export
    categories.ts         The fixed list of categories, payment methods, and profile colours
    types.ts              Shared TypeScript types used by both frontend and backend
    storage.ts            The tiny bit of localStorage that's left (theme + last-open-profile)
```

---

## 9. Design decisions worth mentioning if asked

- **Why Next.js API routes instead of a separate backend (e.g. Express)?**
  Keeps the whole app in one codebase and one deployment — simpler to build, test, and reason about
  for a project this size.

- **Why Prisma instead of writing raw SQL?**
  Prisma catches typos and type mismatches at compile time, auto-generates the migration SQL, and
  makes relationships (like "delete a profile's expenses when the profile is deleted") declarative
  instead of manual.

- **Why keep *any* data in localStorage after adding a backend?**
  Only UI preferences remain there (theme, last-open-profile) — nothing that would be lost if the
  browser's storage were cleared actually matters anymore. It's a small optimization so the app can
  skip straight to the right screen without waiting on a network request first.

- **Why hash the PIN server-side instead of in the browser?**
  Before the backend existed, PIN hashing happened in the browser using the Web Crypto API. Once a
  server existed, moving the hashing there meant the hash and salt never need to be sent to the
  browser at all — a strictly smaller attack surface.

---

## 10. A 30-second summary you can say out loud

> "Spendly is a full-stack expense tracker built with Next.js and TypeScript. The frontend is a
> responsive React dashboard with charts, filters, and forms. It talks to a set of Next.js API
> routes, which use Prisma to read and write a PostgreSQL database hosted on Neon. Each user has a
> profile that can optionally be PIN-locked — the PIN is salted, hashed, and verified entirely on
> the server, so the hash never has to reach the browser. I started with a localStorage-only
> version and migrated it to a real backend once persistence and cross-device access became a
> requirement."
