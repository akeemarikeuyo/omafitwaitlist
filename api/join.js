// POST /omafit/api/join — adds someone to the omaFIT waitlist.
// Body (JSON): { email, platform: "ios" | "android", website } — `website` is a hidden field only bots fill in.
// Stores email + platform + time in Neon Postgres (DATABASE_URL, set by Vercel's Neon integration).
// Answers the same way whether or not the email was already on the list, so the form can't be used to check emails.
import { neon } from '@neondatabase/serverless';

const PLATFORMS = new Set(['ios', 'android']);
// Simple, permissive check; the real test is whether launch emails arrive
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

let tableReady = null;

function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return neon(url);
}

/** Creates the table on first use, so there's no separate setup step. */
function ensureTable(sql) {
  tableReady ??= sql`
    CREATE TABLE IF NOT EXISTS waitlist (
      id         BIGSERIAL PRIMARY KEY,
      email      TEXT NOT NULL UNIQUE,
      platform   TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`.catch(e => {
    tableReady = null;
    throw e;
  });
  return tableReady;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Use POST.' });
  }

  const body = typeof req.body === 'object' && req.body ? req.body : {};
  // Bots fill every field; people never see this one. Pretend it worked.
  if (typeof body.website === 'string' && body.website.trim()) return res.status(200).json({ ok: true });

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const platform = typeof body.platform === 'string' ? body.platform : '';
  if (!email || email.length > 254 || !EMAIL.test(email)) {
    return res.status(400).json({ ok: false, error: 'Please enter a valid email address.' });
  }
  if (!PLATFORMS.has(platform)) {
    return res.status(400).json({ ok: false, error: 'Please choose iPhone or Android.' });
  }

  try {
    const sql = db();
    await ensureTable(sql);
    // Joining again with the same email just updates the phone type
    await sql`
      INSERT INTO waitlist (email, platform) VALUES (${email}, ${platform})
      ON CONFLICT (email) DO UPDATE SET platform = EXCLUDED.platform`;
    return res.status(200).json({ ok: true });
  } catch (e) {
    // Log the failure, never the email
    console.error('waitlist insert failed:', e instanceof Error ? e.message : 'unknown error');
    return res.status(500).json({ ok: false, error: 'Something went wrong. Please try again in a minute.' });
  }
}
