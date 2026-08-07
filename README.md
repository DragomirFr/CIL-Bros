# CIL Bros Construction Site

Marketing site for CIL Bros Construction — a family-run building firm in
Northampton. Extensions, renovations, groundworks and brickwork across
Northamptonshire.

Brand colours: `#1B191A` (near-black), `#E9E3E0` (bone), `#943A1F` (rust).

## Stack

- [TanStack Start](https://tanstack.com/start) — file-based routing and SSR
- React 19, Vite 8, Tailwind CSS v4
- shadcn/ui components in `src/components/ui`
- Nitro build targeting Cloudflare Workers

## Development

Requires Node.js 20+.

```sh
npm install
npm run dev      # http://localhost:8080
```

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
  routes/       file-based routes (see src/routes/README.md)
  components/   site chrome + shadcn/ui
  data/site.ts  company details, services, areas, projects
  styles.css    Tailwind theme and brand tokens
```

Business details (phone, email, areas covered) live in `src/data/site.ts` —
edit there rather than in individual pages.

## Before going live

Still outstanding:

- `src/routes/privacy.tsx` — no data-retention section, and the data controller
  has no registered address or company number (both required under UK GDPR
  Article 13)
- No `og:image`, so shared links render without a preview image. `index.tsx`
  declares `twitter:card: summary_large_image` and needs one
- `og:url` values are page-relative; Open Graph requires absolute URLs
- The gallery lightbox has no next/prev — `gallery.index.tsx` tells users they
  can swipe or use arrows, and they can't
- Company name appears as both "CIL Bros Construction" and "... Ltd"; pick one
