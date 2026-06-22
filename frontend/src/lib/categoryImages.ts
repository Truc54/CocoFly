export const CATEGORY_IMAGE_MAP: Record<string, string> = {
  // Bộ icon Color đồng nhất của Icons8 (w=96, png)
  "cong-nghe": "https://img.icons8.com/color/96/motherboard.png",
  "thoi-trang-phu-kien": "https://img.icons8.com/color/96/hanger.png",
  "co-vat-suu-tam": "https://img.icons8.com/color/96/antique-museum.png",
  "nghe-thuat": "https://img.icons8.com/color/96/palette.png",
  "xe-co": "https://img.icons8.com/color/96/car.png",
  "dong-ho-trang-suc": "https://img.icons8.com/color/96/diamond-ring.png",
  "ruou-vang-do-uong": "https://img.icons8.com/color/96/wine-bottle.png",
  "bat-dong-san": "https://img.icons8.com/color/96/real-estate.png",
  "nhac-cu": "https://img.icons8.com/color/96/guitar.png",
  "the-thao-outdoor": "https://img.icons8.com/color/96/sport.png",
  "sach-tai-lieu-quy": "https://img.icons8.com/color/96/book.png",
  "noi-that-decor": "https://img.icons8.com/color/96/armchair.png",
  "may-anh-ong-kinh": "https://img.icons8.com/color/96/camera.png",
  "do-choi-mo-hinh": "https://img.icons8.com/color/96/toy-car.png",
  "dien-thoai-may-tinh-bang": "https://img.icons8.com/color/96/iphone.png",
  "laptop-may-vi-tinh": "https://img.icons8.com/color/96/laptop.png",
  "hang-hieu-do-xa-xi": "https://img.icons8.com/color/96/purse.png",
  "dien-gia-dung": "https://img.icons8.com/color/96/appliances.png",
  "khac": "https://img.icons8.com/color/96/box.png"
};

export function getCategoryImageUrl(slug: string): string | null {
  return CATEGORY_IMAGE_MAP[slug] || null;
}
