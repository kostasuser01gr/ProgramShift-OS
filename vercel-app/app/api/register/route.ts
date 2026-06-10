import { NextResponse } from 'next/server';
import { AccountExistsError, createCredentialAccount } from '@/lib/accounts';
import { validateAccountInput } from '@/lib/account-validation';
import { allowRegistration } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || request.headers.get('x-real-ip') || 'unknown';
}

export async function POST(request: Request) {
  if (!allowRegistration(clientKey(request))) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  if (body && typeof body === 'object' && String((body as Record<string, unknown>).website ?? '')) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const parsed = validateAccountInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    await createCredentialAccount(parsed.data);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof AccountExistsError) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }
    console.error('Failed to register account', error);
    return NextResponse.json({ error: 'Account registration is temporarily unavailable.' }, { status: 503 });
  }
}
