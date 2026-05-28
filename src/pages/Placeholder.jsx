export default function Placeholder({ title, description }) {
  return (
    <div className="mx-auto max-w-7xl p-4 lg:p-8">
      <div className="rounded-3xl border border-white/10 bg-[#0b1420] p-12 text-center">
        <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.2em] text-slate-500">
          Coming Soon
        </div>
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        {description && (
          <p className="mt-3 text-slate-500">{description}</p>
        )}
      </div>
    </div>
  );
}
