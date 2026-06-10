export type AccountInput = {
  email: string;
  name: string;
  password: string;
};

export type AccountValidation =
  | { ok: true; data: AccountInput }
  | { ok: false; error: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateAccountInput(value: unknown): AccountValidation {
  if (!value || typeof value !== 'object') {
    return { ok: false, error: 'Invalid account details.' };
  }

  const body = value as Record<string, unknown>;
  const email = String(body.email ?? '').trim().toLowerCase();
  const name = String(body.name ?? '').trim().replace(/\s+/g, ' ');
  const password = String(body.password ?? '');

  if (!EMAIL.test(email) || email.length > 254) {
    return { ok: false, error: 'Enter a valid email address.' };
  }
  if (name.length < 2 || name.length > 80) {
    return { ok: false, error: 'Name must be between 2 and 80 characters.' };
  }
  if (password.length < 12 || password.length > 128) {
    return { ok: false, error: 'Password must be between 12 and 128 characters.' };
  }
  if (!/[a-z]/i.test(password) || !/\d/.test(password)) {
    return { ok: false, error: 'Password must include a letter and a number.' };
  }

  return { ok: true, data: { email, name, password } };
}

export function validateCredentials(value: unknown): Pick<AccountInput, 'email' | 'password'> | null {
  if (!value || typeof value !== 'object') return null;
  const body = value as Record<string, unknown>;
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');
  if (!EMAIL.test(email) || email.length > 254 || password.length > 128) return null;
  return { email, password };
}
