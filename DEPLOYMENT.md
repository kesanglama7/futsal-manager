# Deploying Futsal Manager to Vercel + Switching to a New Supabase Account

A step-by-step guide. You are doing this on a **friend's laptop**, so this doc is written to be followed **without Claude Code** — just your terminal, browser, and this file. Read each section before running commands.

---

## What you need before you start

- The project code on the friend's laptop (copy the folder, or `git clone` from wherever you host it).
- A **GitHub account** (to connect Vercel).
- Access to your **new Supabase account**.
- Node.js installed on the laptop (v18+; v20/22/24 all fine). Check: `node -v`
- A code editor / terminal. On Windows use **Git Bash** or **PowerShell** (Git Bash recommended for this repo — the instructions below use it).

---

# PART 1 — Set up the new Supabase project

1. Go to https://supabase.com and sign in with your **new** account.
2. Create a **New project**:
   - Name it anything (e.g. `futsal-pro`).
   - Set a strong **Database Password** and **save it** — you'll need it.
   - Choose a region close to you. Click **Create new project**. Wait ~2 minutes for it to provision.
3. Once it's ready, click **Connect** (top of the project dashboard) → copy these two things:
   - **URI** — shows a connection string. Toggle to the **"Transaction"** pooler (port `6543`) → this is your `DATABASE_URL`.
   - **Direct connection** — the non-pooled one (port `5432`) → this is your `DIRECT_URL`.
4. Create a **storage bucket** (needed for team logos / player photos):
   - Left sidebar → **Storage** → **New bucket**.
   - Name it exactly: `futsal`
   - Click the bucket → **Edit bucket** → set **Public** = ON (or set it Public when creating). **Save.**

> ⚠️ **Do not** run any SQL or migrations inside Supabase yet — Part 3 does that for you.

---

# PART 2 — Set up the project on the friend's laptop

1. Open a terminal in the project folder:
   ```bash
   cd /path/to/futsal-manager
   ```

2. Create the `.env` file (copy from the example):
   ```bash
   cp .env.example .env
   ```

3. **Now fill in `.env` with your NEW Supabase values.** Open `.env` in an editor and set each line:

   ```env
   DATABASE_URL=postgresql://postgres.<ref>:<password>@aws-...pooler.supabase.com:6543/postgres?pgbouncer=true
   DIRECT_URL=postgresql://postgres.<ref>:<password>@aws-...pooler.supabase.com:5432/postgres

   JWT_SECRET=PUT_A_LONG_RANDOM_STRING_HERE
   # Generate one, e.g. run in terminal:  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   # then paste the output here.

   NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
   # The <ref> is the random string in your project's URL, e.g. abcdefghijklm.

   SUPABASE_S3_ACCESS_KEY=your_supabase_s3_access_key_here
   SUPABASE_S3_SECRET_KEY=your_supabase_s3_secret_key_here
   SUPABASE_S3_BUCKET=futsal
   ```

4. **Get the S3 access keys** (for the last two lines):
   - Supabase dashboard → **Storage** → **S3 Access Keys** → **Create new key** → copy the **Access Key** and **Secret Key** into `.env`.
   - The **region is always `us-east-1`** (the app handles it; don't change anything).

5. Install dependencies:
   ```bash
   npm install
   ```

6. **Stop here — do NOT run the app yet.** The database is empty; the app would still run, but there's no schema and no admin. Continue to Part 3.

---

# PART 3 — Push the database schema + create the admin (run ONCE)

This repo uses **Prisma** with an **offline migration workflow** because Supabase doesn't allow `prisma migrate dev` (it needs a shadow DB that Supabase won't create). Instead, we apply the already-written migration files with `prisma migrate deploy`, then create the admin user.

> Make sure `.env` is filled in correctly from Part 2 BEFORE this.

1. Verify the connection works:
   ```bash
   npx prisma validate
   ```
   You should see `The schema at prisma/schema.prisma is valid`.

2. **Apply all migrations** (this creates the tables + enums):
   ```bash
   npx prisma migrate deploy
   ```
   You should see it apply these 3 migrations:
   - `20260731000000_init_teams_formations`
   - `20260801000000_add_matches`
   - `20260801000001_add_player_stats`
   And finish with `All migrations have been successfully applied.`

   > If it errors with a password/connection error, re-check `DATABASE_URL` / `DIRECT_URL` in `.env`.

3. **Generate the Prisma client** (must be re-run after any schema change):
   ```bash
   npx prisma generate
   ```

4. **Create the default admin user.** Run this command (uses a small Node script, no extra installs):
   ```bash
   node -e "
   require('dotenv').config();
   const { Pool } = require('pg');
   const bcrypt = require('bcrypt');
   (async () => {
     const pool = new Pool({ connectionString: process.env.DATABASE_URL });
     const email = 'admin@example.com';
     const existing = await pool.query('SELECT id FROM \"User\" WHERE email = \$1', [email]);
     if (existing.rows.length > 0) { console.log('admin already exists'); await pool.end(); return; }
     const hashed = await bcrypt.hash('Admin123', 10);
     const r = await pool.query(
       'INSERT INTO \"User\" (name, email, password, role, \"createdAt\", \"updatedAt\") VALUES (\$1,\$2,\$3,\$4, now(), now()) RETURNING id, email, role',
       ['Admin', email, hashed, 'ADMIN']
     );
     console.log('created admin:', r.rows[0]);
     await pool.end();
   })().catch(e => { console.error('failed:', e); process.exit(1); });
   "
   ```
   You should see `created admin: { id: 1, email: 'admin@example.com', role: 'ADMIN' }`.

   > **Change this password after first login.** Log in at `/login` with `admin@example.com` / `Admin123`, then update it via the CMS if you build that, or change it in the DB. (There is no password-change UI yet — see the note at the end.)

5. **(Optional) Check it worked** — run the dev server and open the site:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` → you should be redirected to `/matches` (public, no login needed). Then log in at `http://localhost:3000/login` with the admin credentials.

6. Stop the dev server (Ctrl+C) when done.

---

# PART 4 — Deploy to Vercel

## A. Push the code to GitHub

1. If the project isn't already a git repo, in the project folder:
   ```bash
   git init
   git add -A
   git commit -m "initial"
   ```
2. Create an **empty** repo on GitHub (no README — you already have one).
3. Connect and push:
   ```bash
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git branch -M main
   git push -u origin main
   ```

## B. Create the Vercel project

1. Go to https://vercel.com → sign in with **GitHub**.
2. **Add New… → Project** → import your GitHub repo.
3. Framework preset: Next.js should be auto-detected (it will read `package.json`).

## C. Set the environment variables in Vercel (CRITICAL)

In the Vercel project → **Settings → Environment Variables**, add **each** variable from your `.env` (same values). Use the **Production** scope (and Preview/Development if you want):

| Name | Value |
|---|---|
| `DATABASE_URL` | (your pooled `6543` string) |
| `DIRECT_URL` | (your direct `5432` string) |
| `JWT_SECRET` | (your long random string) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
| `SUPABASE_S3_ACCESS_KEY` | (your S3 access key) |
| `SUPABASE_S3_SECRET_KEY` | (your S3 secret key) |
| `SUPABASE_S3_BUCKET` | `futsal` |

> ⚠️ **Do not** commit `.env` to git — it's gitignored, and Vercel uses these env vars instead. Vercel does **not** read your local `.env`.

## D. Build & deploy

1. Click **Deploy**. Vercel will run `npm run build`. The build should pass.
2. If the build fails, common causes:
   - Missing env vars → double-check Part C, then **Redeploy**.
   - Prisma client not generated on Vercel → add a **Build Command** override:
     `prisma generate && next build`
     (Go to project → Settings → General → Build & Development Settings → override Build Command.)
3. Once deployed, you get a URL like `https://<project>.vercel.app`.

## E. First visit

- Open your Vercel URL → `/` redirects to `/matches` (public).
- Log in at `/login` with `admin@example.com` / `Admin123`.
- Upload a team logo → confirms storage works.

---

# PART 5 — When you switch Supabase accounts again (quick recap)

If you later change Supabase accounts (new project, same codebase):

1. Update `.env` locally with the new project's `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and new **S3 keys** (each Supabase project has its own S3 credentials).
2. Create the `futsal` public bucket in the new project.
3. Re-run the schema + admin:
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```
   Then re-run the **admin creation command** from Part 3 step 4.
4. Update the **same env vars in Vercel** → **Redeploy**.

---

# Troubleshooting

| Symptom | Fix |
|---|---|
| `prisma migrate deploy` can't connect | Re-check `DATABASE_URL`/`DIRECT_URL` — make sure the password is URL-safe (if it has special chars, they must be percent-encoded). |
| Admin login says wrong password / no user | The admin script didn't run, or ran against the wrong DB. Re-run Part 3 step 4. |
| Images/logos show a broken icon | S3 keys wrong, or the `futsal` bucket isn't public. Re-check Part 1 step 4 + env vars. |
| Vercel build fails on Prisma | Add the build command override: `prisma generate && next build`. |
| App runs but `/cms` redirects to `/login` even when logged in | The JWT is signed with `JWT_SECRET` — it must be the **same** in Vercel and local. If you changed it, log out and log in again. |

---

# Notes & caveats

- **Admin password**: the default is `Admin123`. There's currently **no change-password UI**, so to change it, either (a) add one later, or (b) update the hash directly in the Supabase SQL editor:
  ```sql
  UPDATE "User" SET password = '<bcrypt-hash>' WHERE email = 'admin@example.com';
  ```
  (Generate a bcrypt hash first, e.g. with `node -e "console.log(require('bcrypt').hashSync('NewPass', 10))"`.)
- **Media storage**: logos/avatars/player photos are stored in Supabase Storage and referenced by key. If you switch accounts, old image keys point at the old project's bucket — re-upload images after switching.
- **Public site**: `/matches` is public (no login). The CMS (`/cms`) requires the admin login.
- **Re-running the admin script** is safe — it skips if the admin already exists.
