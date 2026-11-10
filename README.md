# Atelier Museum: 3D Virtual Art Gallery

A full stack virtual art museum. Visitors walk through 3D galleries in the browser, read each artwork's story, follow artists, and submit their own work. Curators review submissions from a dashboard. The data model is ready for print sales with a 50% artist revenue share.

## Features

- **3D walkthrough:** first-person navigation through themed halls and rooms with collision, lighting, post-processing, and clickable artworks (React Three Fiber, Three.js)
- **2D content site:** pages for halls, exhibits, artworks, and artist profiles, with per-page meta tags
- **Accounts:** Supabase email/password authentication, profile settings, favourites, and following artists
- **Membership gating:** public, member, premium, and private access levels on halls, exhibitions, and artworks (most restrictive wins)
- **Artwork submissions:** artists submit work, and curators approve or reject it from an admin-only dashboard
- **Analytics and newsletter:** event tracking and newsletter sign-ups stored in Postgres
- **Link previews:** a Supabase Edge Function (`supabase/functions/og-preview`) serves Open Graph previews for shared artwork links

## Tech Stack

| Layer | Tools |
|---|---|
| Frontend | React 18, TypeScript, Vite, Wouter (routing), Zustand (state), GSAP |
| 3D | Three.js, React Three Fiber, Drei, postprocessing |
| Backend | Supabase (PostgreSQL, Auth, Row Level Security, Edge Functions) |
| Database | SQL schema and migrations in `database_*.sql`, applied with `setup_db.js` (node-postgres) |
| Deployment | Vercel (`vercel.json`) |

## Architecture

```
src/
  pages/          route pages: halls, exhibits, artworks, artists, auth, settings, submit, curator
  components/     3D gallery (Gallery, Player, Museum3D), landing page, header, membership gate
  hooks/          data loading from Supabase, page meta
  data/           museum domain model: themes → halls → rooms → exhibitions → artworks
  lib/supabase.ts Supabase client
  store.ts        Zustand store (cart, modal, pointer lock)
supabase/functions/og-preview/   Edge Function for social link previews
database_*.sql                   tables, RLS policies, and admin roles
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for the content model, access levels, and route map.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in your Supabase URL, anon key, and DATABASE_URL
node setup_db.js             # create tables and RLS policies
npm run dev                  # http://localhost:5173
```

## 3D Controls

| Input | Action |
|---|---|
| **W A S D** / arrows | Move |
| Mouse | Look around |
| Shift | Run |
| Click an artwork | Open its details |
| Esc | Pause menu |

## Deployment

See [DEPLOY.md](DEPLOY.md) for deploying to Vercel.
