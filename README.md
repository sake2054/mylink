# MyLink

Self-hosted single-owner Linktree-style web app built with Next.js App Router, Tailwind CSS, shadcn/ui-style local components, SQLite, Prisma, NextAuth.js Google OAuth, PM2, and Nginx.

## Setup

Node 22 LTS is recommended. Prisma schema-engine migration commands can fail on some Node 24 environments.

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example` and fill in Google OAuth credentials:

```bash
cp .env.example .env
```

3. Apply the included SQLite migration:

```bash
npm run prisma:migrate
```

When you intentionally change `prisma/schema.prisma`, create a new migration with `npm run prisma:migrate -- --name <name>`.

4. Start development:

```bash
npm run dev
```

Open `http://localhost:3000`.

The root URL `/` is the public profile page for the first Google account that signs in. Manage the profile and links at `/mypage`; unauthenticated access redirects to the Google sign-in flow.

## Google OAuth Callback

Use this callback URL in the Google Cloud OAuth client:

```text
http://localhost:3000/api/auth/callback/google
```

For production, replace the origin with your domain and set `NEXTAUTH_URL` accordingly.

## Production

```bash
npm run build
pm2 start ecosystem.config.js
```

Use `nginx.conf` as the reverse proxy server block example and replace `server_name mylink.example.com` with your domain.
