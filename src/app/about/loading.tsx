export default function AboutLoading() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Loading">
      {/* Hero */}
      <div className="h-64 bg-primary/20" />
      {/* Stats */}
      <div className="h-24 bg-border/30" />
      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-16 space-y-8">
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <div className="h-4 w-24 bg-border rounded" />
            <div className="h-10 w-3/4 bg-border rounded-xl" />
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-4 bg-border/60 rounded w-full" />)}
            </div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-12 bg-border/40 rounded-xl" />)}
          </div>
        </div>
      </div>
    </div>
  );
}
