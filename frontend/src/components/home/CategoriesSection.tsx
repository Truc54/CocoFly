import Image from "next/image";
import Link from "next/link";
import ScrollReveal from "@/components/shared/ScrollReveal";

const CATEGORIES = [
  {
    name: "Công nghệ",
    icon: "devices",
    isImage: false,
  },
  {
    name: "Thời trang",
    icon: "checkroom",
    isImage: false,
  },
  {
    name: "Cổ vật",
    icon: "account_balance",
    isImage: false,
  },
  {
    name: "Nghệ thuật",
    icon: "palette",
    isImage: false,
  },
  {
    name: "Khác",
    icon: "dashboard_customize",
    isImage: false,
  },
];

export default function CategoriesSection() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      <ScrollReveal>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <span className="text-primary material-symbols-outlined">category</span>
            Khám phá danh mục
          </h2>
        </div>
      </ScrollReveal>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        {CATEGORIES.map((category, index) => (
          <ScrollReveal key={index} delay={index * 100}>
            <Link
              href={`/category/${category.name.toLowerCase()}`}
              className="group flex flex-col items-center gap-4"
            >
              <div className="w-full aspect-square bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center group-hover:bg-primary/10 dark:group-hover:bg-slate-700 transition-all duration-300 overflow-hidden">
                <span className="material-symbols-outlined text-5xl md:text-6xl text-primary/60 group-hover:text-primary group-hover:scale-110 transition-all duration-500">
                  {category.icon}
                </span>
              </div>
              <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">
                {category.name}
              </span>
            </Link>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
