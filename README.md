# GS IdeaShare

A platform for local Girl Scout troop leaders to share, filter, and archive meeting plans across their area.

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Styling**: Tailwind CSS v4 with custom outdoorsy theme
- **Fonts**: Fredoka (headings) + Nunito (body) via `next/font/google`
- **Backend**: Supabase — Auth, PostgreSQL, Storage
- **Deployment**: Netlify (via `@netlify/plugin-nextjs`)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Copy `.env.local` (already present) — it contains:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

**Never commit `.env.local` to version control.**

## Pages

| Route | Description |
|---|---|
| `/` | Homepage feed — search, filter, sort meeting cards |
| `/meetings/[id]` | Meeting detail — upvote, favorite, mark done, comments |
| `/create` | Create meeting form (requires auth) |
| `/profile` | Leader dashboard — My Shared / Favorites / Completed |
| `/auth/login` | Sign in |
| `/auth/signup` | Two-step sign up with display name prompt |
| `/auth/callback` | Supabase email confirmation handler |

## Deploying to Netlify

1. Push to GitHub
2. Connect repo in Netlify
3. Set the same env vars in Netlify → Site Settings → Environment Variables
4. Deploy — Netlify auto-detects Next.js via `netlify.toml`

## Supabase Setup

Database tables, RLS policies, and the `meeting-media` public storage bucket are already provisioned. See the original spec for the full SQL schema.

Make sure **Email confirmation** is enabled in Supabase Auth settings and the **Site URL** is set to your deployed domain (or `http://localhost:3000` for local dev).
