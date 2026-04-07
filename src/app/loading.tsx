// Root-level loading skeleton — shown for the home page and any route without
// its own loading.tsx while server components are streaming.
export default function RootLoading() {
  return (
    <div className="min-h-screen animate-pulse" aria-busy="true" aria-label="Loading page">
      {/* Hero skeleton */}
      <div className="h-[560px] bg-primary/10" />

      {/* Stats strip */}
      <div className="h-20 bg-border/40" />

      {/* Content blocks */}
      <div className="max-w-6xl mx-auto px-4 py-16 space-y-8">
        <div className="h-6 bg-border rounded-xl w-32 mx-auto" />
        <div className="h-10 bg-border rounded-xl w-96 mx-auto" />
        <div className="grid sm:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-border/60 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
