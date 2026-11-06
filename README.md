# Uyvo

Uyvo is a 7-day blood-building habit game. The player is a Hemo-Hero. Iron foods mint Iron Shards, water and movement mint Flow Points, and a tea monster locks iron for 60 minutes after lunch.

The app is Expo SDK 56, TypeScript, and Expo Router. Android is the later APK target (`com.sudarvel.uyvo`). This repo is the product foundation: onboarding, the Daily Blood Forge, the Vein Train, and Settings. Progress is stored in on-device SQLite and syncs to Supabase when a project is connected.

## Run

```bash
npm install
npx expo start
```

Web: `npx expo start --web`. Domain rules: `npm run test:domain`.

Copy `.env.example` to `.env` when a Supabase project exists. The client reads only `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Do not put a service role key in the app.

Until those values exist, the sign-in screen offers **Practice on this device**. Practice uses the same forge and never calls the network.

## Supabase

Schema: `supabase/migrations/20261106183000_uyvo_init.sql`.

A Uyvo project in SUDARVEL's org (`zojqjdtokfapcpjycpin`) was not created. `create_project` asked for a cost confirmation. `get_cost` returned type `project`, recurrence `monthly`, amount `10`. Creating it requires an explicit yes to that cost, then `confirm_cost` with those fields, then `create_project` with the returned confirmation id. The migration stays in the repo until that project exists.

## Docs

Product stories, screen flow, and the data model live with the project notes, not in this repo.
