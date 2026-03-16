import Image from "next/image";
import ScrollReveal from "@/components/shared/ScrollReveal";
const TOP_AUCTIONS = [
  {
    rank: 1,
    name: "Tranh lụa Châu Âu thế kỷ 19",
    price: "2.500.000.000đ",
    creator: "Trần Văn B",
    winner: "Nguyễn Thị A",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDQ1_eZdI7SfaLzXHrLPFejTE5oq_79VOkahGxTCaX7UsFYdPij7bFQlF91NATxViIfo1_O54JfK8p4I44cmz_pjT8Up-6lKkCR5bCMGeUpoBNJL5hVjR7xlzeaF040eybKWaAqFd2OQ7Dz-Lp2UVGpt-w7HVHumwUlLHHTKkcjpY_8ZNwiGpy5ZGCK5Uqukw0KwlrXJzWm3SJDOOZAaT0yH0TcSo6563uyZmg4rrsecm12BEzT1PBiSTQBZLNBAWBnL5E_t0lH33ip"
  },
  {
    rank: 2,
    name: "Đồng hồ Rolex Daytona",
    price: "1.250.000.000đ",
    creator: "Luxury Store",
    winner: "Lê Hoàng C",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBYfyyLXiyVQPUR0qZVHlXkqxdAsOBOwe6p7_woDvvJRR8KbKSTiT4my1PLt7bE3ttDdAzIs4DaP5GV7j7mwc6sURi2Tl-GZ_8AWYf-eKXEtytJNrxHHrkrQdQXcQrdL9dl5v5aZK9PbMGZ5pdU_1zks08kqgIuhtPofoMVr9fZGR7j5SNJ5aSeb08mTV2pIWw-0-RpF_o5wFU2GkuovVYbyPIxLmLhvCvRZnOW04h0zVV8rdM-xH8BOFz1JwQJqkPVAngodA5A-V4R"
  },
  {
    rank: 3,
    name: "Tượng ngọc bích cổ",
    price: "850.000.000đ",
    creator: "Collector D",
    winner: "Phạm Văn E",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA4a25dDQ7_BoHv9jPPsBrzK8pCoacotFh4rj2EbadQxLUZJb6cgm2WFrulnz_oKYWUlVRqhJe9VDK-qcvsbchTduj7uebB3DwpLruZAcw0v5XwX5ludpx35uPPsRWjFevZX7F9jPJZtqyt679m-wzBmEMQrmwKUnZn1-heHLZXIwSqyiX6AY15BkBf6oEajTicPzqGnNPTklzu3fwA90fP0zn0vCO6pZQpQFblj7XIjWuIDXeMNLv-Ws9z5eR_zVO0k7Oj-CKhRrbk"
  },
  { rank: 4, name: "Maserati Quattroporte 2021", price: "5.800.000.000đ", creator: "Auto Group", winner: "Hoàng Minh", icon: "directions_car" },
  { rank: 5, name: "Nhẫn kim cương 5 Carat", price: "1.200.000.000đ", creator: "Diamond VN", winner: "Nguyễn K.", icon: "diamond" },
];

export default function LeaderboardSection() {
  return (
    <section className="bg-background-light dark:bg-background-dark py-20 px-6 border-y border-primary/5">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-3 mb-2">
              <span className="text-yellow-500 material-symbols-outlined">workspace_premium</span>
              Bảng Xếp Hạng Đấu Giá
            </h2>
            <p className="text-slate-500 font-medium">Top các phiên đấu giá có giá trị cao nhất</p>
          </div>
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl shadow-inner overflow-x-auto">
            <button className="px-6 py-2 rounded-lg text-sm font-bold bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm transition-all whitespace-nowrap">Hôm nay</button>
            <button className="px-6 py-2 rounded-lg text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all whitespace-nowrap">Tuần này</button>
            <button className="px-6 py-2 rounded-lg text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all whitespace-nowrap">Tháng này</button>
          </div>
        </div>
        </ScrollReveal>

        <ScrollReveal delay={200}>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-sm uppercase tracking-wider">
                  <th className="p-4 font-bold border-b border-slate-100 dark:border-slate-700 w-16 text-center">Hạng</th>
                  <th className="p-4 font-bold border-b border-slate-100 dark:border-slate-700">Tên đồ vật</th>
                  <th className="p-4 font-bold border-b border-slate-100 dark:border-slate-700">Giá trị đấu giá</th>
                  <th className="p-4 font-bold border-b border-slate-100 dark:border-slate-700">Người tạo</th>
                  <th className="p-4 font-bold border-b border-slate-100 dark:border-slate-700">Người thắng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm font-medium">
                {TOP_AUCTIONS.map((auction) => (
                  <tr key={auction.rank} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors group">
                    <td className="p-4 text-center">
                      {auction.rank === 1 && <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center font-bold mx-auto">1</div>}
                      {auction.rank === 2 && <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold mx-auto">2</div>}
                      {auction.rank === 3 && <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold mx-auto">3</div>}
                      {auction.rank > 3 && <div className="font-bold text-slate-500 text-center">{auction.rank}</div>}
                    </td>
                    <td className="p-4 group-hover:text-primary transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 overflow-hidden shrink-0 flex items-center justify-center relative">
                          {auction.image ? (
                            <Image alt="Item" className="object-cover" src={auction.image} fill unoptimized />
                          ) : (
                            <span className="material-symbols-outlined text-slate-400">{auction.icon}</span>
                          )}
                        </div>
                        <span className="font-bold text-base">{auction.name}</span>
                      </div>
                    </td>
                    <td className={`p-4 font-bold ${auction.rank <= 3 ? "text-primary text-base" : ""}`}>
                      {auction.price}
                    </td>
                    <td className="p-4">
                      {auction.rank <= 3 ? (
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-blue-500">verified</span>
                          {auction.creator}
                        </div>
                      ) : (
                        auction.creator
                      )}
                    </td>
                    <td className="p-4">
                      {auction.rank <= 3 ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-500">
                            <span className="material-symbols-outlined text-[14px]">person</span>
                          </div>
                          {auction.winner}
                        </div>
                      ) : (
                        auction.winner
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-slate-100 dark:border-slate-700 text-center">
            <button className="text-primary font-bold hover:underline text-sm inline-flex items-center gap-1">
              Xem toàn bộ bảng xếp hạng <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
