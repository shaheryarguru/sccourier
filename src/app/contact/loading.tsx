export default function ContactLoading() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="h-48 bg-primary/20" />
      <div className="h-32 bg-border/30" />
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-[1fr_380px] gap-12">
          <div className="space-y-5">
            <div className="h-4 w-24 bg-border rounded" />
            <div className="h-8 w-56 bg-border rounded-xl" />
            <div className="h-96 bg-border/40 rounded-2xl" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-40 bg-border/40 rounded-2xl" />)}
          </div>
        </div>
      </div>
    </div>
  );
}
