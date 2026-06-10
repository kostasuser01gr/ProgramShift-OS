'use client';

import { FormEvent, useState } from 'react';
import { signIn } from 'next-auth/react';
import styles from './styles.module.css';

type Mode = 'signin' | 'signup';

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('signin');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage('');
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '').trim();
    const password = String(form.get('password') ?? '');

    try {
      if (mode === 'signup') {
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: String(form.get('name') ?? ''),
            email,
            password,
            website: String(form.get('website') ?? ''),
          }),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || 'Could not create account.');
      }

      const result = await signIn('credentials', {
        email,
        password,
        callbackUrl: '/',
        redirect: false,
      });
      if (!result?.ok) throw new Error('Incorrect email or password.');
      window.location.assign(result.url || '/');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Authentication failed.');
      setPending(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.mark}>Σ</div>
        <p className={styles.eyebrow}>Program Shift</p>
        <h1>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h1>
        <p className={styles.intro}>
          Sign in to view the live team schedule. New accounts start with employee access.
        </p>

        <button
          className={`${styles.button} ${styles.google}`}
          disabled={pending}
          onClick={() => signIn('google', { callbackUrl: '/' })}
          type="button"
        >
          Continue with Google
        </button>

        <div className={styles.divider}><span>or use email</span></div>

        <form onSubmit={submit}>
          {mode === 'signup' && (
            <label>
              Full name
              <input autoComplete="name" maxLength={80} name="name" required type="text" />
            </label>
          )}
          <label>
            Email
            <input autoComplete="email" maxLength={254} name="email" required type="email" />
          </label>
          <label>
            Password
            <input
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              maxLength={128}
              minLength={12}
              name="password"
              required
              type="password"
            />
          </label>
          <input aria-hidden="true" className={styles.trap} name="website" tabIndex={-1} type="text" />
          {mode === 'signup' && (
            <p className={styles.hint}>Use at least 12 characters with a letter and number.</p>
          )}
          {message && <p className={styles.error} role="alert">{message}</p>}
          <button className={`${styles.button} ${styles.primary}`} disabled={pending} type="submit">
            {pending ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <button
          className={styles.switch}
          disabled={pending}
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin');
            setMessage('');
          }}
          type="button"
        >
          {mode === 'signin' ? 'Need an account? Sign up' : 'Already registered? Sign in'}
        </button>
      </section>
    </main>
  );
}
