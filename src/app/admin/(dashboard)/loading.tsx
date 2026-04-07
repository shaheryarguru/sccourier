// Admin loading skeleton — shown while admin server components stream in.
// The AdminShell layout is already rendered; this fills the main content area.
export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse max-w-screen-xl" aria-busy="true" aria-label="Loading dashboard">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-40 bg-border rounded-xl" />
          <div className="h-4 w-56 bg-border/60 rounded-lg" />
        </div>
        <div className="h-9 w-28 bg-border rounded-xl" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-28 bg-border/60 rounded-2xl" />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="h-5 w-36 bg-border rounded-lg" />
          <div className="h-4 w-16 bg-border/60 rounded" />
        </div>

        {/* Table rows */}
        <div className="divide-y divide-border">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="px-5 py-3.5 flex items-center gap-4">
              <div className="h-4 w-28 bg-border/60 rounded" />
              <div className="h-4 w-24 bg-border/40 rounded" />
              <div className="h-4 w-20 bg-border/40 rounded" />
              <div className="h-4 w-20 bg-border/40 rounded hidden sm:block" />
              <div className="h-5 w-20 bg-border/40 rounded-full ml-auto" />
              <div className="h-4 w-16 bg-border/60 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
