import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-16 pb-24 px-6">
      <div className="absolute inset-0 bg-gradient-to-br from-primary to-[#B78967] -z-10"></div>
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <div className="text-white space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
          <h1 className="text-5xl lg:text-7xl font-bold leading-[1.1]">
            Đấu giá realtime – Săn deal độc quyền mỗi phút
          </h1>
          <p className="text-lg opacity-90 max-w-lg">
            Khám phá những phiên đấu giá hấp dẫn nhất và sở hữu sản phẩm yêu thích với giá cực hời thông qua hệ thống đấu giá trực tuyến minh bạch.
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="px-8 py-4 bg-white text-primary font-bold rounded-xl shadow-xl hover:bg-accent hover:text-white transition-all">Tham gia đấu giá</button>
            <button className="px-8 py-4 border-2 border-white/30 text-white font-bold rounded-xl hover:bg-white/10 transition-all">Xem phiên HOT</button>
          </div>
        </div>
        
        <div className="relative hidden lg:block animate-in fade-in zoom-in-95 duration-1000 delay-200">
          <div className="w-full aspect-square bg-white/10 backdrop-blur-xl rounded-[3rem] border border-white/20 p-8 shadow-2xl overflow-hidden relative">
            <Image 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDgWX_hLRwnG2US5h86JGII1v6Cr8j5JWCFa81ZvkHE6n4wXx9zOMblmjmtgxmA-rdfOAvWWD9Nqn3MXxBwF3qK03LrR3_Miy0rBG0aMPkwPZh1o1ppb-gCyveG8BF5veheSSsXGQYKgCIQTl3GDnS0Y8zKjIPZ-guvHUZW_59_zixDsgDU_0T3D604AVAw5-Oct50e2QnuvOytKHT170XUE8aqTM673TdWFemRy-HzTjs2mgmR11NjlbyCg1bPQkqDog4OFyD4j-gf"
              alt="3D rendered electronic device in a premium auction display"
              fill
              className="object-cover rounded-2xl"
              unoptimized
            />
          </div>
          
          <div className="absolute -bottom-6 -left-6 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-bounce">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white shrink-0">
              <span className="material-symbols-outlined">trending_up</span>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Giá cao nhất hiện tại</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">45.000.000đ</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
