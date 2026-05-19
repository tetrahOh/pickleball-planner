# Family Pickleball Planner

A lightweight React + Vite app for a private family group to organise pickleball sessions through a shared link. Users log in by name, create sessions, RSVP for themselves or multiple family members, and see simple cost estimates. Data is shared across phones and computers with Supabase.

## Features

- Name-only login with automatic shared user creation
- Supabase persistence for users, sessions, and RSVPs
- Create, edit, and delete sessions
- Creator-only edit/delete controls in the UI
- RSVP for yourself or multiple family members
- Duplicate attendee prevention
- Upcoming session cards with attendee lists and cost calculations
- Mobile-friendly responsive layout

## Local Setup

```bash
npm install
npm run dev
```

Open the local URL shown by Vite, usually `http://localhost:5173`.

## Supabase Setup

1. Open your Supabase project.
2. Go to SQL Editor.
3. Paste and run the contents of `supabase-schema.sql`.

The app currently includes the supplied Supabase URL and public key in `src/App.jsx`. For hosted deployments, you can also set these environment variables:

```bash
VITE_SUPABASE_URL=https://uiopgjahnzzabsfdfcts.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-key
```

## Build

```bash
npm run build
```

The production files will be generated in `dist/`.

## Deployment

This app is frontend-only and can be deployed to Vercel, Netlify, or GitHub Pages.

### Vercel

- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`

### Netlify

- Build command: `npm run build`
- Publish directory: `dist`

### GitHub Pages

Build with `npm run build` and publish the `dist` folder using your preferred GitHub Pages workflow.

## Data Notes

The app uses Supabase tables for shared family members, sessions, and attendee RSVPs. The current logged-in user is remembered in browser localStorage only so each device can stay logged in.
