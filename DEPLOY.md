# Deploying to Vercel

This project is a Vite + React app backed by Supabase. `vercel.json` already sets the
framework, build command, output directory, SPA rewrite, and asset caching —
so both deploy paths below are zero-config.

## Option A — GitHub + Vercel dashboard (recommended)

1. Create a new empty repo on GitHub (e.g. `virtual-art-museum`).
2. Push this folder:
   ```bash
   cd virtual-art-museum
   git remote add origin https://github.com/<you>/virtual-art-museum.git
   git push -u origin main
   ```
3. Go to https://vercel.com → **Add New… → Project** → import the repo.
4. Vercel auto-detects Vite. Leave the defaults:
   - Build command: `npm run build`
   - Output directory: `dist`
5. Click **Deploy**. You get a live `*.vercel.app` URL in ~1–2 min.
6. Every future `git push` to `main` auto-deploys.

## Option B — Vercel CLI (fastest, no GitHub needed)

```bash
npm i -g vercel
cd virtual-art-museum
vercel            # first run: link/create project, follow prompts
vercel --prod     # promote to the production URL
```

## Custom domain

In the Vercel project → **Settings → Domains**, add e.g. `museum.yourdomain.com`
and follow the DNS instructions (a CNAME record). HTTPS is automatic.

## Notes

- Node 18+ is required (pinned via `engines` in `package.json`).
- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the Vercel project
  settings (Settings → Environment Variables) before deploying.
- The ~1 MB `three.js` chunk triggers a Vite size warning at build time — this
  is expected and not an error.
