export const CATEGORY_IMAGE_MAP: Record<string, string> = {
  // Danh mục mới từ Tiki (Ảnh 1)
  "nha-sach-tiki": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=64&auto=format&fit=crop&q=60",
  "nha-cua-doi-song": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=64&auto=format&fit=crop&q=60",
  "dien-thoai-may-tinh-bang": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=64&auto=format&fit=crop&q=60",
  "do-choi-me-be": "https://images.unsplash.com/photo-1559251606-c623743a6d76?w=64&auto=format&fit=crop&q=60",
  "thiet-bi-so-phu-kien-so": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=64&auto=format&fit=crop&q=60",
  "dien-gia-dung": "https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=64&auto=format&fit=crop&q=60",
  "lam-dep-suc-khoe": "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=64&auto=format&fit=crop&q=60",
  "thoi-trang-nu": "https://images.unsplash.com/photo-1539008885759-c38865a8ffc4?w=64&auto=format&fit=crop&q=60",
  "bach-hoa-online": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=64&auto=format&fit=crop&q=60",
  "thoi-trang-nam": "https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=64&auto=format&fit=crop&q=60",
  "hang-quoc-te": "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?w=64&auto=format&fit=crop&q=60",
  "laptop-may-vi-tinh": "https://images.unsplash.com/photo-1496181130204-755241524eab?w=64&auto=format&fit=crop&q=60",

  // Danh mục cũ
  "cong-nghe": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=64&auto=format&fit=crop&q=60",
  "thoi-trang-phu-kien": "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=64&auto=format&fit=crop&q=60",
  "co-vat-suu-tam": "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=64&auto=format&fit=crop&q=60",
  "nghe-thuat": "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=64&auto=format&fit=crop&q=60",
  "xe-co": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=64&auto=format&fit=crop&q=60",
  "dong-ho-trang-suc": "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=64&auto=format&fit=crop&q=60",
  "ruou-vang-do-uong": "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=64&auto=format&fit=crop&q=60",
  "bat-dong-san": "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=64&auto=format&fit=crop&q=60",
  "nhac-cu": "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=64&auto=format&fit=crop&q=60",
  "the-thao-outdoor": "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=64&auto=format&fit=crop&q=60",
  "the-thao-da-ngoai": "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=64&auto=format&fit=crop&q=60",
  "sach-tai-lieu-quy": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=64&auto=format&fit=crop&q=60",
  "noi-that-decor": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=64&auto=format&fit=crop&q=60",
  "may-anh-ong-kinh": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=64&auto=format&fit=crop&q=60",
  "do-choi-mo-hinh": "https://images.unsplash.com/photo-1559251606-c623743a6d76?w=64&auto=format&fit=crop&q=60",
  "khac": "https://images.unsplash.com/photo-1572945289962-1459cfd7d32c?w=64&auto=format&fit=crop&q=60",
};

export function getCategoryImageUrl(slug: string): string | null {
  return CATEGORY_IMAGE_MAP[slug] || null;
}
