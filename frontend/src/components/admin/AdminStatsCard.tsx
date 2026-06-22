"use client";

interface AdminStatsCardProps {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  trendValue?: number | string;
  loading?: boolean;
  colorClass?: string;
}

export default function AdminStatsCard({
  label,
  value,
  trend,
  trendValue,
  loading = false,
  colorClass = "text-slate-800",
}: AdminStatsCardProps) {
  if (loading) {
    return (
      <div className="bg-white border border-slate-200/80 p-6 h-32 flex flex-col justify-between animate-pulse shadow-sm rounded-2xl">
        <div className="h-4 bg-slate-100 w-24 rounded-sm" />
        <div className="h-8 bg-slate-100 w-32 rounded-sm" />
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/80 p-6 flex flex-col justify-between hover:shadow-md transition-all duration-300 group select-none shadow-sm relative overflow-hidden rounded-2xl h-32">
      {/* Top line decoration */}
      <div className="absolute top-0 left-0 w-full h-[3px] bg-slate-100 group-hover:bg-slate-200 transition-colors duration-300" />
      
      <div className="space-y-0.5">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">{label}</p>
        <h3 className={`text-2xl font-bold tracking-tight font-sans ${colorClass}`}>
          {value}
        </h3>
      </div>

      {trend && trendValue !== undefined && (
        <div className="flex items-center gap-1.5 mt-1">
          <span
            className={`inline-flex items-center text-[10px] font-mono font-bold px-1.5 py-0.5 border rounded-sm ${
              trend === "up"
                ? "text-emerald-600 bg-emerald-50 border-emerald-100"
                : trend === "down"
                ? "text-rose-600 bg-rose-50 border-rose-100"
                : "text-slate-500 bg-slate-50 border-slate-100"
            }`}
          >
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "•"} {trendValue}%
          </span>
          <span className="text-[10px] text-slate-400 font-sans">so với tháng trước</span>
        </div>
      )}
    </div>
  );
}
