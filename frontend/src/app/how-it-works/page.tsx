export default function HowItWorksPage() {
  return (
    <>
      {/* Hero */}
      <section className="px-6 lg:px-20 py-10">
        <div className="max-w-7xl mx-auto">
          <div
            className="relative overflow-hidden rounded-xl bg-primary px-10 py-16 flex flex-col items-center justify-center text-center shadow-2xl"
            style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '24px 24px' }}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-primary via-primary/90 to-primary/80 opacity-90"></div>
            <div className="relative z-10 flex flex-col items-center gap-4 max-w-2xl">
              <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                Cách hoạt động
              </h1>
              <p className="text-white/90 text-lg font-medium leading-relaxed">
                Quy trình đơn giản, an toàn và minh bạch để bạn tham gia đấu giá chỉ trong vài bước.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-12 text-center">
          {/* Step 1 */}
          <div className="flex flex-col items-center gap-6 group">
            <div className="relative">
              <div className="w-24 h-24 bg-accent/20 rounded-full flex items-center justify-center text-primary group-hover:bg-accent/30 transition-colors duration-300">
                <span className="material-symbols-outlined text-5xl">inventory_2</span>
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                1
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-3">Chọn sản phẩm</h3>
              <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">
                Tìm kiếm và lựa chọn sản phẩm mong muốn trong các danh mục đa dạng của chúng tôi. Từ công nghệ, thời trang đến cổ vật và nghệ thuật.
              </p>
            </div>
          </div>

          {/* Connector (hidden on mobile) */}

          {/* Step 2 */}
          <div className="flex flex-col items-center gap-6 group">
            <div className="relative">
              <div className="w-24 h-24 bg-accent/20 rounded-full flex items-center justify-center text-primary group-hover:bg-accent/30 transition-colors duration-300">
                <span className="material-symbols-outlined text-5xl">gavel</span>
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                2
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-3">Đặt giá</h3>
              <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">
                Theo dõi và đặt giá theo thời gian thực. Mỗi lượt đặt giá sẽ kéo dài thời gian phiên, tạo cơ hội cho tất cả mọi người.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center gap-6 group">
            <div className="relative">
              <div className="w-24 h-24 bg-accent/20 rounded-full flex items-center justify-center text-primary group-hover:bg-accent/30 transition-colors duration-300">
                <span className="material-symbols-outlined text-5xl">emoji_events</span>
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                3
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-3">Thắng đấu giá</h3>
              <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">
                Người đặt giá cuối cùng khi hết giờ sẽ là người chiến thắng và nhận sản phẩm. Thanh toán an toàn và giao hàng nhanh chóng.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Steps */}
      <section className="bg-white dark:bg-slate-900 py-20 px-6 border-y border-primary/5">
        <div className="max-w-5xl mx-auto space-y-20">
          {/* Detail 1 */}
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-4">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary font-bold text-sm px-4 py-1.5 rounded-full">
                <span className="material-symbols-outlined text-base">looks_one</span>
                Bước 1
              </div>
              <h3 className="text-2xl font-bold">Đăng ký tài khoản miễn phí</h3>
              <p className="text-slate-500 leading-relaxed">
                Tạo tài khoản chỉ trong 30 giây với email hoặc số điện thoại. Xác minh danh tính để được tham gia đấu giá các sản phẩm giá trị cao.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-500 text-base">check_circle</span>
                  Đăng ký miễn phí, không mất phí duy trì
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-500 text-base">check_circle</span>
                  Xác minh nhanh qua OTP
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-500 text-base">check_circle</span>
                  Bảo mật thông tin cá nhân tuyệt đối
                </li>
              </ul>
            </div>
            <div className="flex-1 bg-background-light dark:bg-slate-800 rounded-2xl p-8 flex items-center justify-center aspect-video">
              <div className="text-center space-y-3">
                <span className="material-symbols-outlined text-6xl text-primary">person_add</span>
                <p className="text-sm font-bold text-slate-500">Đăng ký nhanh chóng</p>
              </div>
            </div>
          </div>

          {/* Detail 2 */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-12">
            <div className="flex-1 space-y-4">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary font-bold text-sm px-4 py-1.5 rounded-full">
                <span className="material-symbols-outlined text-base">looks_two</span>
                Bước 2
              </div>
              <h3 className="text-2xl font-bold">Khám phá & đặt giá realtime</h3>
              <p className="text-slate-500 leading-relaxed">
                Duyệt qua hàng ngàn sản phẩm đấu giá từ nhiều danh mục. Khi đã tìm thấy sản phẩm yêu thích, đặt giá ngay và theo dõi trực tiếp.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-500 text-base">check_circle</span>
                  Cập nhật giá theo thời gian thực
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-500 text-base">check_circle</span>
                  Thông báo khi bị vượt giá
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-500 text-base">check_circle</span>
                  Đặt giá tự động (Auto-bid)
                </li>
              </ul>
            </div>
            <div className="flex-1 bg-background-light dark:bg-slate-800 rounded-2xl p-8 flex items-center justify-center aspect-video">
              <div className="text-center space-y-3">
                <span className="material-symbols-outlined text-6xl text-primary">monitoring</span>
                <p className="text-sm font-bold text-slate-500">Theo dõi realtime</p>
              </div>
            </div>
          </div>

          {/* Detail 3 */}
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-4">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary font-bold text-sm px-4 py-1.5 rounded-full">
                <span className="material-symbols-outlined text-base">looks_3</span>
                Bước 3
              </div>
              <h3 className="text-2xl font-bold">Thanh toán & nhận hàng</h3>
              <p className="text-slate-500 leading-relaxed">
                Khi bạn chiến thắng, thanh toán an toàn qua nhiều phương thức. Sản phẩm sẽ được kiểm tra chất lượng và giao đến tận tay bạn.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-500 text-base">check_circle</span>
                  Thanh toán qua VNPay, MoMo, thẻ quốc tế
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-500 text-base">check_circle</span>
                  Bảo đảm chất lượng sản phẩm
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-500 text-base">check_circle</span>
                  Giao hàng toàn quốc trong 3-5 ngày
                </li>
              </ul>
            </div>
            <div className="flex-1 bg-background-light dark:bg-slate-800 rounded-2xl p-8 flex items-center justify-center aspect-video">
              <div className="text-center space-y-3">
                <span className="material-symbols-outlined text-6xl text-primary">local_shipping</span>
                <p className="text-sm font-bold text-slate-500">Giao hàng an toàn</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-primary py-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-white text-center">
          <div>
            <p className="text-4xl lg:text-5xl font-bold mb-2">12K+</p>
            <p className="text-sm uppercase tracking-widest opacity-80 font-semibold">Người dùng</p>
          </div>
          <div>
            <p className="text-4xl lg:text-5xl font-bold mb-2">4K+</p>
            <p className="text-sm uppercase tracking-widest opacity-80 font-semibold">Phiên đấu giá</p>
          </div>
          <div>
            <p className="text-4xl lg:text-5xl font-bold mb-2">98%</p>
            <p className="text-sm uppercase tracking-widest opacity-80 font-semibold">Hài lòng</p>
          </div>
          <div>
            <p className="text-4xl lg:text-5xl font-bold mb-2">24/7</p>
            <p className="text-sm uppercase tracking-widest opacity-80 font-semibold">Hỗ trợ</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Câu hỏi thường gặp</h2>
        <div className="space-y-4">
          {[
            {
              q: "Tôi có cần trả phí để tham gia đấu giá không?",
              a: "Không! Việc đăng ký và tham gia đấu giá hoàn toàn miễn phí. Bạn chỉ thanh toán khi chiến thắng phiên đấu giá.",
            },
            {
              q: "Làm sao để biết sản phẩm có đúng chất lượng?",
              a: "Tất cả sản phẩm trên COCOFLY đều được xác minh bởi đội ngũ chuyên gia. Chúng tôi cam kết hoàn tiền 100% nếu sản phẩm không đúng mô tả.",
            },
            {
              q: "Nếu tôi thắng đấu giá nhưng không muốn mua nữa?",
              a: "Bạn có 24 giờ để hủy sau khi thắng. Tuy nhiên, việc hủy nhiều lần sẽ ảnh hưởng đến điểm uy tín tài khoản của bạn.",
            },
            {
              q: "Phương thức thanh toán nào được hỗ trợ?",
              a: "COCOFLY hỗ trợ thanh toán qua VNPay, MoMo, ZaloPay, chuyển khoản ngân hàng và thẻ quốc tế (Visa, Mastercard).",
            },
          ].map((faq, i) => (
            <details key={i} className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <summary className="flex items-center justify-between p-5 cursor-pointer font-bold hover:text-primary transition-colors list-none">
                <span>{faq.q}</span>
                <span className="material-symbols-outlined text-slate-400 group-open:rotate-180 transition-transform duration-300">expand_more</span>
              </summary>
              <div className="px-5 pb-5 text-sm text-slate-500 leading-relaxed border-t border-slate-100 dark:border-slate-700 pt-4">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 pb-20 text-center">
        <div className="bg-gradient-to-r from-primary to-[#B78967] rounded-2xl p-12 shadow-2xl">
          <h2 className="text-3xl font-bold text-white mb-4">Sẵn sàng bắt đầu?</h2>
          <p className="text-white/80 mb-8 max-w-lg mx-auto">Tham gia cộng đồng hơn 12.000 người dùng đang săn deal mỗi ngày trên COCOFLY.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="px-8 py-4 bg-white text-primary font-bold rounded-xl shadow-lg hover:bg-accent hover:text-white transition-all">Đăng ký miễn phí</button>
            <button className="px-8 py-4 border-2 border-white/30 text-white font-bold rounded-xl hover:bg-white/10 transition-all">Xem phiên đấu giá</button>
          </div>
        </div>
      </section>
    </>
  );
}
