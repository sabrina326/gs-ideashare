export function MeetingCardSkeleton() {
  return (
    <div className="card overflow-hidden animate-pulse" aria-hidden="true">
      {/* Thumbnail placeholder */}
      <div className="h-44 bg-[#e8f5ee]" />

      <div className="p-4 space-y-2.5">
        {/* Level badges */}
        <div className="flex gap-1.5">
          <div className="h-5 w-16 rounded-full bg-[#e5ddd3]" />
          <div className="h-5 w-14 rounded-full bg-[#e5ddd3]" />
        </div>

        {/* Title */}
        <div className="h-4 w-4/5 rounded bg-[#e5ddd3]" />
        <div className="h-4 w-3/5 rounded bg-[#e5ddd3]" />

        {/* Description */}
        <div className="h-3 w-full rounded bg-[#ece5da]" />
        <div className="h-3 w-2/3 rounded bg-[#ece5da]" />

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[#f0e8da]">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-[#e5ddd3]" />
            <div className="h-3 w-20 rounded bg-[#e5ddd3]" />
          </div>
          <div className="h-3 w-8 rounded bg-[#e5ddd3]" />
        </div>
      </div>
    </div>
  )
}

export function MeetingCardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <MeetingCardSkeleton key={i} />
      ))}
    </div>
  )
}
