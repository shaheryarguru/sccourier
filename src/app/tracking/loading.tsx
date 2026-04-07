export default function TrackingLoading() {
  return (
    <div className="min-h-screen bg-surface pt-20 pb-24 lg:pb-10 animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-10">

        {/* Header */}
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-56 bg-border rounded-xl" />
          <div className="h-4 w-72 bg-border/60 rounded" />
        </div>

        {/* Search card */}
        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-4">
          <div className="h-12 bg-border/40 rounded-xl" />
          <div className="h-10 w-32 bg-border rounded-xl" />
        </div>

        {/* ID explainer */}
        <div className="space-y-3">
          <div className="h-3.5 w-40 bg-border/60 rounded mx-auto" />
          <div className="bg-white rounded-xl border border-border p-4 space-y-2">
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-8 w-14 bg-border/40 rounded-lg" />
              ))}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-3 bg-border/30 rounded" />
              ))}
            </div>
          </div>
        </div>

        {/* FAQ skeleton */}
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-12 bg-border/40 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
