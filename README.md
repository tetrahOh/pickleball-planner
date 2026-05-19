# Family Pickleball Planner

A lightweight React + Vite app for a private family group to organise pickleball sessions through a shared link. Users log in by name, create sessions, RSVP for themselves or multiple family members, and see simple cost estimates.

## Features

- Name-only login with automatic local user creation
- LocalStorage persistence for users, current login, sessions, and RSVPs
- Create, edit, and delete sessions
- Creator-only edit/delete controls
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

Data is stored in the browser using localStorage. That keeps the app intentionally simple and easy to deploy, but each browser has its own data. The app is structured around simple user/session objects so it can later be upgraded to Supabase, Firebase, or another shared database.
