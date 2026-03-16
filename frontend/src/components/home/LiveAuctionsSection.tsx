import Image from "next/image";
import Link from "next/link";

const LIVE_AUCTIONS = [
  {
    id: 1,
    title: "iPhone 15 Pro Max",
    price: "25.000.000đ",
    timeLeft: "04:22:15",
    activeBidders: 18,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA4a25dDQ7_BoHv9jPPsBrzK8pCoacotFh4rj2EbadQxLUZJb6cgm2WFrulnz_oKYWUlVRqhJe9VDK-qcvsbchTduj7uebB3DwpLruZAcw0v5XwX5ludpx35uPPsRWjFevZX7F9jPJZtqyt679m-wzBmEMQrmwKUnZn1-heHLZXIwSqyiX6AY15BkBf6oEajTicPzqGnNPTklzu3fwA90fP0zn0vCO6pZQpQFblj7XIjWuIDXeMNLv-Ws9z5eR_zVO0k7Oj-CKhRrbk",
  },
  {
    id: 2,
    title: "MacBook Pro M3",
    price: "45.000.000đ",
    timeLeft: "02:15:30",
    activeBidders: 12,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBYfyyLXiyVQPUR0qZVHlXkqxdAsOBOwe6p7_woDvvJRR8KbKSTiT4my1PLt7bE3ttDdAzIs4DaP5GV7j7mwc6sURi2Tl-GZ_8AWYf-eKXEtytJNrxHHrkrQdQXcQrdL9dl5v5aZK9PbMGZ5pdU_1zks08kqgIuhtPofoMVr9fZGR7j5SNJ5aSeb08mTV2pIWw-0-RpF_o5wFU2GkuovVYbyPIxLmLhvCvRZnOW04h0zVV8rdM-xH8BOFz1JwQJqkPVAngodA5A-V4R",
  },
];

const RECENT_BIDS = [
  { name: "Nguyễn Văn A", amount: "25.1tr", item: "iPhone", time: "2 phút trước" },
  { name: "Trần Thị B", amount: "45.2tr", item: "MacBook", time: "5 phút trước" },
  { name: "Lê Văn C", amount: "22.5tr", item: "iPad Pro", time: "12 phút trước" },
];

export default function LiveAuctionsSection() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-20">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <span className="text-red-500 material-symbols-outlined animate-pulse">
                local_fire_department
              </span>
              Đấu giá đang diễn ra
            </h2>
            <Link
              href="/live"
              className="text-primary font-bold hover:underline flex items-center gap-1"
            >
              Xem tất cả <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {LIVE_AUCTIONS.map((auction) => (
              <Link
                key={auction.id}
                href={`/auction/${auction.id}`}
                className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer block"
              >
                <div className="relative overflow-hidden rounded-lg mb-4 aspect-square">
                  <Image
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    alt={auction.title}
                    src={auction.image}
                    fill
                    unoptimized
                  />
                  <span className="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-red-600 flex items-center gap-1 shadow-sm">
                    <span className="material-symbols-outlined text-sm">groups</span> 🔥{" "}
                    {auction.activeBidders} người đang đấu
                  </span>
                </div>
                <div className="space-y-2 relative">
                  <h3 className="text-lg font-bold line-clamp-1">{auction.title}</h3>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Giá hiện tại</p>
                      <p className="text-xl font-bold text-primary">{auction.price}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-red-500 font-bold flex items-center justify-end gap-1">
                        <span className="material-symbols-outlined text-sm">schedule</span>{" "}
                        {auction.timeLeft}
                      </p>
                    </div>
                  </div>
                  <div className="w-full py-3 bg-primary text-white text-center font-bold rounded-lg mt-4 hover:bg-primary/90 active:scale-95 transition-all cursor-pointer">
                    Đặt giá
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Sidebar Activity Feed */}
        <aside className="w-full lg:w-80 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm self-start sticky top-24">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">sensors</span>
            Hoạt động mới nhất
          </h3>
          <div className="space-y-6">
            {RECENT_BIDS.map((bid, i) => (
              <div key={i} className="flex items-start gap-3 animate-in slide-in-from-right-4 fade-in duration-500" style={{ animationDelay: `${i * 150}ms`, animationFillMode: 'both' }}>
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined">person</span>
                </div>
                <div>
                  <p className="text-sm font-bold">{bid.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    vừa đặt <span className="text-primary font-bold">{bid.amount}</span> cho {bid.item}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 uppercase font-bold tracking-wider">
                    {bid.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
