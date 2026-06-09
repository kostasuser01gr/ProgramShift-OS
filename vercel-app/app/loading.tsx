export default function Loading() {
  return (
    <main className="wrap" aria-busy="true" aria-live="polite">
      <div className="skeleton title" />
      <div className="skeleton block" />
      <span className="sr-only">Loading schedule…</span>
    </main>
  );
}
