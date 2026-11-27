# SmartAttend — Offline-First School Attendance PWA

SmartAttend is a modern, responsive, offline-capable School Attendance Progressive Web Application (PWA) built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Dexie.js (IndexedDB)**, **Recharts**, and **Supabase**.

## Features (Phase 1)

- **Role-Based Login**: Teacher and Administrator demo sign-in with session persistence.
- **Teacher Dashboard**: KPIs, today's classes, weekly attendance chart, recent attendance, and pending sync queue.
- **5-Step Attendance Workflow**: Class/session selection, MediaDevices camera capture (plus demo fallback), replaceable AI-assisted identification (labeled demo matcher), teacher verification & manual override, and IndexedDB persistence.
- **Student Management**: Full CRUD, search, class/section filtering, pagination, guardian photo consent tracking, and student profile pages.
- **Attendance History & Analytics**: Multi-filter history table with inline edits, CSV export, and Recharts analytics.
- **Offline-First & PWA**: Dexie.js IndexedDB storage, service worker (`public/sw.js`), web app manifest (`public/manifest.json`), and `/offline` fallback.

## Local Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Deploying to Vercel

1. Push this repository to GitHub, GitLab, or Bitbucket.
2. Import the project in the [Vercel Dashboard](https://vercel.com/new).
3. Set the following **Environment Variables** in Vercel (Project Settings -> Environment Variables):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Keep the default **Next.js** framework preset (`npm run build`).
5. Deploy! Vercel automatically serves the app over **HTTPS**, which is required for the browser `MediaDevices` camera API and Service Worker registration.

### Healthcheck

Once deployed, verify `/api/health` returns `{ "ok": true, "service": "smartattend" }`.
