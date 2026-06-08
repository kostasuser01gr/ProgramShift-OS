// lib/google.ts — server-only Google Sheets client (service account JWT).
import { google, sheets_v4 } from 'googleapis';

let cached: sheets_v4.Sheets | null = null;

export function sheetsClient(): sheets_v4.Sheets {
  if (cached) return cached;
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SA_EMAIL,
    // Vercel env vars store the key with literal \n — restore real newlines.
    key: (process.env.GOOGLE_SA_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  cached = google.sheets({ version: 'v4', auth });
  return cached;
}

// Column index (1=A) → A1 letters. Handles AA..AG.
export function colA1(idx: number): string {
  let s = '';
  while (idx > 0) {
    const m = (idx - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    idx = (idx - m - 1) / 26;
  }
  return s;
}
