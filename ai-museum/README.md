# AI Museum

**Where AI Art Becomes an Exhibition.**

An online museum for AI-generated art. Work is hung, not posted; exhibitions
open, they don't trend; and visitors walk rooms rather than scroll timelines.

## Stack

- **Next.js (App Router)** + **TypeScript** — server components, streaming, SEO
- **Tailwind CSS v4** — design tokens in `src/app/globals.css`
- **Framer Motion** — one easing curve, slow fades, restrained parallax
- **Supabase** — Postgres, Auth (email / Google / GitHub), Storage
- **Lucide** icons, **next/image** optimization
- Deploys to **Vercel**

## Running locally

```bash
npm install
npm run dev
```

The site runs fully in **demo mode** out of the box: a mock dataset
(`src/lib/data/mock.ts`) and generated placeholder artworks (`public/art`,
regenerable via `node scripts/generate-art.mjs`) power every page, so no
credentials are needed to browse.

## Connecting Supabase

1. Create a Supabase project and run `supabase/migrations/0001_initial_schema.sql`
   (tables, counters, RLS policies, and marketplace-ready schema).
2. Copy `.env.example` to `.env.local` and fill in
   `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Enable Google and GitHub providers in Supabase Auth; set the callback to
   `<site>/auth/callback`.
4. Swap the function bodies in `src/lib/data/index.ts` from mock reads to
   Supabase queries — signatures and types already match the schema.

## Architecture

```
src/
  app/                      # App Router pages
    page.tsx                # Landing: hero, today's exhibition, trending,
                            # newest exhibitions, categories, infinite feed
    gallery/                # Infinite masonry feed with filters & sorts
    artwork/[id]/           # Artwork page: fullscreen viewer (zoom, keyboard
                            # nav), prompt, palette, tags, comments, related
    artist/[username]/      # Profile: banner, bio, socials, tabbed works/
                            # collections/exhibitions/liked/saved
    artists/                # Artist directory
    rooms/ + rooms/[slug]/  # Immersive themed rooms with walk-through layout
    exhibitions/ + [slug]/  # Curated exhibitions
    collections/            # Public member collections
    categories/[slug]/      # Category wings
    search/                 # Instant search: artist, artwork, prompt, tag,
                            # model, style, colour ("warm", "blue", hex)
    auth/                   # Login / signup / OAuth callback
    dashboard/              # Creator studio: multi-image drag & drop upload,
                            # prompt/negative prompt/model/tags/category,
                            # visibility, scheduled publication
    admin/                  # Admin office: analytics, moderation queue,
                            # feature controls, member table
    api/artworks/           # Cursor-paginated feed API (infinite scroll)
  components/               # Reusable UI, grouped by domain
  lib/
    types.ts                # Domain types (mirror the SQL schema)
    data/                   # Data-access layer (mock now, Supabase later)
    supabase/               # Browser + server clients (@supabase/ssr)
supabase/migrations/        # Full schema: users/profiles, artworks, images,
                            # tags, likes, bookmarks, comments, follows,
                            # views, collections, exhibitions, rooms,
                            # notifications, reports + future marketplace
                            # (products, orders, licenses, commissions)
```

## Design language

Luxury-museum minimalism: `#F7F6F3` canvas, `#1A1A1A` ink, `#8C6A4A` bronze
accent; Cormorant Garamond display over Inter; wide letterspaced wayfinding
labels; large whitespace; slow transitions. Dark mode included (class-based,
persisted, no first-paint flash). Reduced-motion preferences respected.
