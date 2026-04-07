export default function BookingLoading() {
  return (
    <div className="min-h-screen bg-surface pt-20 pb-24 lg:pb-10 animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6">
        {/* Page header */}
        <div className="space-y-2 mb-8">
          <div className="h-8 w-48 bg-border rounded-xl" />
          <div className="h-4 w-80 bg-border/60 rounded" />
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-2 flex-1 min-w-0">
              <div className="size-8 rounded-full bg-border shrink-0" />
              {i < 5 && <div className="h-0.5 flex-1 bg-border/40" />}
            </div>
          ))}
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-6 space-y-5">
          <div className="h-6 w-36 bg-border rounded-lg" />
          <div className="grid sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-1.5">
                <div className="h-3.5 w-20 bg-border/60 rounded" />
                <div className="h-10 bg-border/40 rounded-xl" />
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            <div className="h-3.5 w-24 bg-border/60 rounded" />
            <div className="h-10 bg-border/40 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3.5 w-20 bg-border/60 rounded" />
            <div className="h-10 bg-border/40 rounded-xl" />
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between mt-6">
          <div className="h-10 w-24 bg-border/40 rounded-xl" />
          <div className="h-10 w-28 bg-border rounded-xl" />
        </div>
      </div>
    </div>
  );
}
