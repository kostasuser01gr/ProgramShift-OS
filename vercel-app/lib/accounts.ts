import { compare, hash } from 'bcryptjs';
import { sheetsClient } from './google';
import { SHEET_ID, TABS } from './config';

const HEADER = ['email', 'name', 'password_hash', 'created_at', 'status'];
const HASH_ROUNDS = 11;
let usersSheetReady: Promise<void> | null = null;

export class AccountExistsError extends Error {}

export type CredentialAccount = {
  email: string;
  name: string;
  passwordHash: string;
  status: string;
};

async function prepareUsersSheet(): Promise<void> {
  const api = sheetsClient();
  const workbook = await api.spreadsheets.get({
    spreadsheetId: SHEET_ID,
    fields: 'sheets.properties.title',
  });
  const exists = workbook.data.sheets?.some((sheet) => sheet.properties?.title === TABS.users);

  let created = false;
  if (!exists) {
    try {
      await api.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: { requests: [{ addSheet: { properties: { title: TABS.users, hidden: true } } }] },
      });
      created = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (!message.includes('already exists')) throw error;
    }
  }

  if (!created) {
    const header = await api.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${TABS.users}!A1:E1`,
      valueRenderOption: 'UNFORMATTED_VALUE',
    });
    const current = (header.data.values?.[0] ?? []).map(String);
    if (HEADER.every((value, index) => current[index] === value)) return;
  }

  await api.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${TABS.users}!A1:E1`,
    valueInputOption: 'RAW',
    requestBody: { values: [HEADER] },
  });
}

async function ensureUsersSheet(): Promise<void> {
  if (!usersSheetReady) {
    usersSheetReady = prepareUsersSheet().catch((error) => {
      usersSheetReady = null;
      throw error;
    });
  }
  return usersSheetReady;
}

async function findAccount(email: string): Promise<CredentialAccount | null> {
  await ensureUsersSheet();
  const api = sheetsClient();
  const result = await api.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${TABS.users}!A2:E`,
    valueRenderOption: 'UNFORMATTED_VALUE',
  });
  const normalized = email.trim().toLowerCase();
  const row = (result.data.values ?? []).find(
    (candidate) => String(candidate[0] ?? '').trim().toLowerCase() === normalized,
  );
  if (!row) return null;
  return {
    email: normalized,
    name: String(row[1] ?? '').trim() || normalized,
    passwordHash: String(row[2] ?? ''),
    status: String(row[4] ?? 'active').trim().toLowerCase(),
  };
}

export async function createCredentialAccount(input: {
  email: string;
  name: string;
  password: string;
}): Promise<void> {
  if (await findAccount(input.email)) throw new AccountExistsError('Account already exists.');

  const passwordHash = await hash(input.password, HASH_ROUNDS);
  await sheetsClient().spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${TABS.users}!A:E`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [[input.email, input.name, passwordHash, new Date().toISOString(), 'active']],
    },
  });
}

export async function authenticateCredentialAccount(
  email: string,
  password: string,
): Promise<{ id: string; email: string; name: string } | null> {
  const account = await findAccount(email);
  if (!account || account.status !== 'active' || !account.passwordHash) return null;
  if (!(await compare(password, account.passwordHash))) return null;
  return { id: account.email, email: account.email, name: account.name };
}
