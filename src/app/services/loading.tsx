export default function ServicesLoading() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="h-56 bg-primary/20" />
      <div className="max-w-7xl mx-auto px-4 py-16 space-y-8">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="h-4 w-24 bg-border rounded" />
          <div className="h-9 w-72 bg-border rounded-xl" />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-80 bg-border/50 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
