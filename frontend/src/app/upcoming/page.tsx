import Image from "next/image";

const UPCOMING_AUCTIONS = [
  {
    id: 1,
    title: "MacBook Pro M3 Max",
    startPrice: "vnđ 45,000,000",
    startTime: "Bắt đầu lúc 20:00 - 20/10",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDQ1_eZdI7SfaLzXHrLPFejTE5oq_79VOkahGxTCaX7UsFYdPij7bFQlF91NATxViIfo1_O54JfK8p4I44cmz_pjT8Up-6lKkCR5bCMGeUpoBNJL5hVjR7xlzeaF040eybKWaAqFd2OQ7Dz-Lp2UVGpt-w7HVHumwUlLHHTKkcjpY_8ZNwiGpy5ZGCK5Uqukw0KwlrXJzWm3SJDOOZAaT0yH0TcSo6563uyZmg4rrsecm12BEzT1PBiSTQBZLNBAWBnL5E_t0lH33ip"
  },
  {
    id: 2,
    title: "iPhone 15 Pro Max",
    startPrice: "vnđ 28,000,000",
    startTime: "Bắt đầu lúc 09:00 - 21/10",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAbZbZhHzJfOF8mkjtpCNGgFz9N_NW80stwh0Os0lT6cLlYbq8xTT9kVUszUf9Ijrpw7xExty70sxJnDdmyxUoKa81byc5-NTlDlKFqiMaRaFxGFTfRJBNwZe1aG2iLlILRXLJ7bm2iAcNJ0q3zU-egL6BByZgbnKbjiP22qGNOucnBbjhAzY38ZoFA3L9d5Q1r76qWA_fqWPRv6WLrpVU0dm8Lp-9BOLhn31yTae1Dk6ARXx-P1gvGJcud16WumgW1ib5mYx3TfwNQ"
  },
  {
    id: 3,
    title: "Sony WH-1000XM5",
    startPrice: "vnđ 6,500,000",
    startTime: "Bắt đầu lúc 15:00 - 22/10",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCQfvUXFE65sSLZ2IXh0jKTKiqGW4HteCjaoIn7nPOkGZNb5QY7sWC3sRN6dOcsj5qxLrv8pzi1X7AF5OY1aIWG7fDhdEeatxkhBwU6WZ6lHdl3ftwotVAah-JW87rkNkasem5pseRcGFB4iHteLu0lYk_45v9JdomFCJxhFTq1UAfSQs8Z5V8-6FS8fEG7TUwUGd8OrflCQ2-fvL7ivCoTYN_yQf38Vv92l5MqfYrrdzlQxJbKmP1X4FMc7ze2KHtfqgPQuW-94k00"
  },
  {
    id: 4,
    title: "iPad Pro M2",
    startPrice: "vnđ 21,000,000",
    startTime: "Bắt đầu lúc 10:00 - 23/10",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAnvG5fYlLmLJJlsp9bXEmy5QaY0mqQiuVFblIINfb6j9XePA6VqUAt7EzZA-KPdbKKunhYbtAD5zcTdHVusRnEKFjZ2opagufdYEnepBK9KTGaFHk1O3WnbJHTDjYjNvmVDe_h3C8o44B2rsBggtYUxkXdHZMMAA0MsFBBdeu_nLCrmtYBC2nX3e1iG_Jx8qZfkdr7eXCrFMFu9hKa46c5Fzfr_PBaxEAwvDRaR8u6VwbWvxYCXN_V0qH3c9xU8XIabKDiKi-ycCtR"
  },
  {
    id: 5,
    title: "Apple Watch Series 9",
    startPrice: "vnđ 9,500,000",
    startTime: "Bắt đầu lúc 08:00 - 24/10",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBSOTZ45dJyx3H9gwXSwtQtZE_M9HJk2zH2zJO6qjoCiNMXcFBIHMfgFWaSJJd_SUrcPBWZd0GBD-5mAimopqK7gmfm0XhNrtB2euCIQiuIs7H4e6lWkt5W1_uVaSUc7-A6h-MCkq5bRngTt0nYBsXUoCrrCrEbODea75-EDxoexj_kmL5ELFBh6XLfFMz27H0NPe4ty0AE1QmuAe3DRq4-C3n0V55LfCfCfaUra_6gAtQBe0DVlicHWPvGxHGjf-BFm-3jHZAii7s3"
  },
  {
    id: 6,
    title: "Beats Studio Pro",
    startPrice: "vnđ 7,200,000",
    startTime: "Bắt đầu lúc 14:00 - 25/10",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD6jJdPxjByIDlBcKwlRFLQWfuFi12VQMnp88r9WFnXCg2w67tFkGjvQTD4Up2pBba4iNXhFtWU7OzP7AzXntAe-FWrLcMtvLoIRozspdQqAaKMrUzy8N4kQzDmcGKmQap0DBsSNZaN_hygXkt0qi0sqBH-SZJ12eLQ5z5xbP779DTm-bK_GemeLNUOdCIr0rBJuSOSz8aCvVulyi5LEK7DXLuKWKNWHfBgstDGXzsxy-GGXLiglzlLn3M3NuvFrLwe-QQUCl06Ic6R"
  },
  {
    id: 7,
    title: "Canon EOS R5",
    startPrice: "vnđ 82,000,000",
    startTime: "Bắt đầu lúc 11:00 - 26/10",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDMhTwnzOtPaS7lh-P0RPx1NqyN2L3y3FNKCXtSnn3IHVnsxEKBUSN-BL5Grv2T-JbWbhhAYpSEa-tKFzAtCWxf6VQg9dS6PuIBf7dcP-zKo6IQy3HasuIZkE03qDqS3iR0g1zjfTUn1SrtkuJTOVDhe5vHIj9WFxLMJEy-wPDI1iRchW8RCwrcd-pmOotmZ0K9HlwmkbgTtNSkV450rltmU2IkRXeqP2i5tEgyfddFH2tu0rPEvVmOZhqUuZ_3_-_5Dh-zOJPGYmDU"
  },
  {
    id: 8,
    title: "Dell UltraSharp 40",
    startPrice: "vnđ 35,500,000",
    startTime: "Bắt đầu lúc 19:30 - 27/10",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDNV1sxmWooGJfzm4dzG9tx2ff6SRtKhzZCYS732G-eCRNp2nyUdvZNLO-P_YceZPttkJKsFiomN822mKKoC9ZwRqOiVRUCUXCwUuUIwvc61Wvdt8rwX3OvPIUWd6eUinWmivrVtzzhKaH9vxTIEVr5ZVnaZWJnrJ2P2IivnoBkhpVCHK1324cFdxBOP60FbASnz7WZstFnvebN14Vi_CsM7BioPjBMR7WVROK9tF6iUwAlZdC3Ls3f9nIm8iuudZzby6658TETHjkI"
  }
];

export default function UpcomingPage() {
  return (
    <>
      <section className="px-6 lg:px-20 py-10">
        <div className="max-w-7xl mx-auto">
          <div 
            className="relative overflow-hidden rounded-xl bg-primary px-10 py-16 flex flex-col items-center justify-center text-center shadow-2xl" 
            style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '24px 24px' }}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-primary via-primary/90 to-primary/80 opacity-90"></div>
            <div className="relative z-10 flex flex-col items-center gap-4 max-w-2xl animate-in fade-in zoom-in-95 duration-700">
              <h2 className="font-display text-4xl md:text-5xl font-bold text-white tracking-tight">Sắp diễn ra</h2>
              <p className="text-white/90 text-lg font-medium leading-relaxed">
                  Đừng bỏ lỡ những siêu phẩm sắp lên sàn. Đặt lịch nhắc nhở ngay để trở thành người sở hữu đầu tiên!
              </p>
              <div className="mt-4 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/80 text-sm">
                <span className="material-symbols-outlined text-sm">schedule</span>
                <span>Cập nhật liên tục mỗi giờ</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 lg:px-20 pb-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 border-b border-primary/10 pb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
          <div className="flex items-center bg-white dark:bg-background-dark p-1.5 rounded-xl shadow-sm border border-primary/5">
            <button className="px-6 py-2 rounded-lg text-sm font-bold text-slate-500 hover:text-primary transition-all">Hôm nay</button>
            <button className="px-6 py-2 rounded-lg text-sm font-bold text-slate-500 hover:text-primary transition-all">Ngày mai</button>
            <button className="px-6 py-2 rounded-lg text-sm font-bold text-slate-500 hover:text-primary transition-all">Tuần này</button>
            <button className="px-6 py-2 rounded-lg text-sm font-bold bg-primary text-white shadow-md transition-all">Tất cả</button>
          </div>
          <div className="w-full md:w-96 relative group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">search</span>
            <input 
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white dark:bg-background-dark border border-primary/10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm focus:shadow-md" 
              placeholder="Tìm kiếm sản phẩm, thương hiệu..." 
              type="text"
            />
          </div>
        </div>
      </section>

      <section className="px-6 lg:px-20 pb-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {UPCOMING_AUCTIONS.map((auction, idx) => (
            <div 
              key={auction.id} 
              className="group bg-white dark:bg-background-dark rounded-xl overflow-hidden border border-primary/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-in fade-in zoom-in-95 cursor-pointer"
              style={{ animationDelay: `${200 + idx * 50}ms`, animationFillMode: 'both' }}
            >
              <div className="relative aspect-square overflow-hidden bg-slate-100">
                <Image 
                  alt={auction.title} 
                  className="object-cover group-hover:scale-110 transition-transform duration-500" 
                  src={auction.image}
                  fill
                  unoptimized
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-primary/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-lg">
                      {auction.startTime}
                  </span>
                </div>
              </div>
              <div className="p-5 flex flex-col gap-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{auction.title}</h3>
                <p className="text-sm font-medium text-slate-500">Giá khởi điểm:</p>
                <p className="text-lg font-extrabold text-primary">{auction.startPrice}</p>
                <button className="mt-4 w-full flex items-center justify-center gap-2 py-3 border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary hover:text-white transition-all">
                  <span className="material-symbols-outlined text-[20px]">notifications_active</span>
                  Nhắc tôi
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
