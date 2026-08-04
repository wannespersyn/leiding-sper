# Staftracker

A PWA for tracking drink consumption points ("streepjes") for a scouting
group's staff over multi-month periods. Built with Next.js 16 (App Router),
Drizzle ORM + Postgres, and Tailwind 4.

See `docs/staftracker.md` for the original feature spec.

## Getting started

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL (Postgres, e.g. Supabase)
npx drizzle-kit push   # create/update the schema
npm run db:seed        # seed an initial roster, categories, and period
npm run dev
```

Open http://localhost:3000 - you'll land on the PIN login screen using the
roster from `drizzle/seed.ts` (edit that file with the real group before
seeding a fresh database).

## Layout

- `app/` - routes: Home (`/`), Overzicht (`/overzicht`), Profiel
  (`/person/[id]`), Beheer (`/admin`, admin-only), member registration
  (`/admin/add-member`, `/join?role=...`), and login (`/login`).
- `app/actions/` - server actions (mutations).
- `lib/data/` - read-side data layer (server-only).
- `lib/auth/` - PIN hashing + cookie session handling.
- `db/schema.ts` - Drizzle schema.

## Roles & auth

Each person logs in with a name + 4-digit PIN. `isAdmin` gates the Beheer
screens and member/period management actions. New members join either via
an admin-added account or by scanning a QR code (`/admin` → QR-registratie)
that lands on the public `/join?role=leiding|extern` self-registration form.
