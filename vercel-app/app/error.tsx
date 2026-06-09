'use client';

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="statepage">
      <h1>Schedule unavailable</h1>
      <p>The live Google Sheets data could not be loaded. Your data was not changed.</p>
      <button className="button primary" type="button" onClick={reset}>Try again</button>
    </main>
  );
}
