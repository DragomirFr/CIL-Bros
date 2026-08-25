# CIL Bros Construction Site

Marketing site for CIL Bros Construction — a family-run building firm in
Northampton. Extensions, renovations, groundworks and brickwork across
Northamptonshire.

Brand colours: `#1B191A` (near-black), `#E9E3E0` (bone), `#943A1F` (rust).

## Stack

- [TanStack Start](https://tanstack.com/start) — file-based routing and SSR
- React 19, Vite 8, Tailwind CSS v4
- shadcn/ui components in `src/components/ui`
- Supabase (Auth, Postgres, Storage) behind the `/admin` area
- Nitro build targeting Cloudflare Workers

## Development

Requires Node.js 20+.

```sh
npm install
npm run dev      # http://localhost:8080
```

The public site runs without any configuration. To work on the admin area, copy
`.env.example` to `.env.local` and fill in the Supabase URL and anon key — see
[docs/ADMIN.md](docs/ADMIN.md).

## Scripts

| Script              | Does                                    |
| ------------------- | --------------------------------------- |
| `npm run dev`       | Start the dev server                    |
| `npm run build`     | Production build                        |
| `npm run build:dev` | Debug build (readable names, dev React) |
| `npm run preview`   | Preview the production build            |
| `npm run lint`      | ESLint                                  |
| `npm run format`    | Prettier                                |

## Layout

```
src/
  routes/            file-based routes (see src/routes/README.md)
  routes/admin.*     the admin area — login, section editors, team
  components/        site chrome + shadcn/ui
  components/admin/  admin shell, list editors, media picker
  lib/               supabase, admin auth, permissions, content store
  data/site.ts       company details, areas — and the fallback content
  styles.css         Tailwind theme and brand tokens
supabase/schema.sql  tables, who may publish which section, the media bucket
docs/ADMIN.md        Supabase setup and how to use the admin area
```

Phone, email and the areas covered live in `src/data/site.ts` — edit there rather
than in individual pages.

## Admin area

`/admin` lets the owner edit the gallery, the recent jobs, the site videos and the
services without a deploy. Dragomir is the owner and decides, per person, which
of those sections anyone else can touch; the same permissions are enforced by
Postgres row-level security, not just hidden in the UI.

Content is read live from Supabase with `src/data/site.ts` as the fallback, so
the site keeps working if Supabase is unreachable or a section has never been
saved. `docs/ADMIN.md` covers the one-time Supabase setup, running
`supabase/schema.sql`, adding people, and what each section changes.

`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` must be set as build-time
variables in the Cloudflare Workers project for the admin area to work on the
live site. Both are public by design; the `service_role` key is not used anywhere
in this project and must never be added to it.

## Before going live

Still outstanding:

- The admin area needs its Supabase project created and `supabase/schema.sql`
  run before it will work anywhere — see [docs/ADMIN.md](docs/ADMIN.md)
- `src/routes/privacy.tsx` — no data-retention section, and the data controller
  has no registered address or company number (both required under UK GDPR
  Article 13)
- No `og:image`, so shared links render without a preview image. `index.tsx`
  declares `twitter:card: summary_large_image` and needs one
- `og:url` values are page-relative; Open Graph requires absolute URLs
- The gallery lightbox has no next/prev — `gallery.index.tsx` tells users they
  can swipe or use arrows, and they can't
- Company name appears as both "CIL Bros Construction" and "... Ltd"; pick one
