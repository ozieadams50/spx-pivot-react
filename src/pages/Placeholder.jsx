export default function Placeholder({ title, description }) {
  return (
    <div className="mx-auto max-w-7xl p-4 lg:p-8">
      <div className="rounded-3xl border border-[var(--c-border)] bg-[var(--c-bg-card)] p-12 text-center">
        <div className="mb-4 inline-flex rounded-full border border-[var(--c-border)] bg-[var(--c-hover)] px-4 py-1 text-xs uppercase tracking-[0.2em] text-[var(--c-text-dimmed)]">
          Coming Soon
        </div>
        <h2 className="text-2xl font-bold text-[var(--c-text-primary)]">{title}</h2>
        {description && (
          <p className="mt-3 text-[var(--c-text-dimmed)]">{description}</p>
        )}
      </div>
    </div>
  );
}
