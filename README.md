# omaFIT waitlist

The waitlist page for [omaFIT](https://github.com/akeemarikeuyo/omaFIT), served at **akanniola.com/omafit**.

- `omafit/` — the page (plain HTML, CSS and JS; no framework, no trackers)
- `api/join.js` — saves a sign-up (email + iPhone/Android) to a Neon Postgres database
- `vercel.json` — routes `/omafit/api/join` to the function, plus security headers

## Deploy (once)

1. Push this folder to its own GitHub repo, e.g. `omafit-waitlist`.
2. In Vercel: **Add New → Project**, import the repo. Framework preset: **Other**. No build command.
3. In the new project: **Storage → Create Database → Neon** (free plan), and connect it to the project.
   This adds `DATABASE_URL` for you. Redeploy once so the function picks it up.
4. Open `https://<project>.vercel.app/omafit` and join with a test email.
   The `waitlist` table is created on the first sign-up.

## Serve it at akanniola.com/omafit

In the **akanniola.com** project, add these rewrites to its `vercel.json`
(replace `omafit-waitlist.vercel.app` with this project's domain):

```json
{
  "rewrites": [
    { "source": "/omafit", "destination": "https://omafit-waitlist.vercel.app/omafit" },
    { "source": "/omafit/:path*", "destination": "https://omafit-waitlist.vercel.app/omafit/:path*" }
  ]
}
```

If that site is built with Next.js, put the same entries in `next.config.js` under `async rewrites()`.

## See and export the list

Neon console → your database → **SQL Editor**:

```sql
SELECT email, platform, created_at FROM waitlist ORDER BY created_at;
SELECT platform, count(*) FROM waitlist GROUP BY platform;
```

Use the export button on the results to download a CSV.

## Privacy

The page promises sign-ups are used only to announce omaFIT's launch and never shared or sold. Keep it that way:
don't add analytics or third-party scripts (the Content-Security-Policy in `vercel.json` blocks them), and delete
anyone who asks: `DELETE FROM waitlist WHERE email = 'their@email.com';`

## Local preview

`npx vercel dev` (needs the Vercel CLI and the project's `DATABASE_URL`), then open `http://localhost:3000/omafit`.
