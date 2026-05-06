export default function AuctionDetailSkeleton() {
  const pulse = "animate-pulse bg-slate-200 dark:bg-slate-700 rounded";

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6">
      {/* Breadcrumb */}
      <div className="flex gap-2 mb-6">
        <div className={`${pulse} h-4 w-20`} />
        <div className={`${pulse} h-4 w-24`} />
        <div className={`${pulse} h-4 w-40`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left */}
        <div className="lg:col-span-7 space-y-6">
          <div className={`${pulse} aspect-[4/3] w-full`} />
          <div className="flex gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`${pulse} w-[72px] h-[72px] shrink-0`} />
            ))}
          </div>
          <div className={`${pulse} h-20 w-full`} />
        </div>

        {/* Right */}
        <div className="lg:col-span-5 space-y-6">
          <div className={`${pulse} h-8 w-3/4`} />
          <div className="border-2 border-slate-200 p-6 space-y-4">
            <div className={`${pulse} h-10 w-1/2`} />
            <div className={`${pulse} h-6 w-full`} />
            <div className={`${pulse} h-12 w-full`} />
            <div className={`${pulse} h-12 w-full`} />
          </div>
          <div className={`${pulse} h-[400px] w-full`} />
        </div>
      </div>
    </div>
  );
}
