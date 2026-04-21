import Link from "next/link";

const categories = [
  { emoji: "🍚", label: "뭐 먹지", href: "/eat" },
  { emoji: "👕", label: "뭐 입지", href: "/wear" },
  { emoji: "🎲", label: "그냥 결정해줘", href: "/decide" },
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center min-h-screen px-6 py-12">
      <div className="w-full max-w-[480px] flex flex-col gap-10">
        <h1 className="text-4xl font-bold text-center tracking-tight" style={{ color: "#1A2B4A" }}>
          오늘은 이거다
        </h1>

        <div className="flex flex-col gap-5">
          {categories.map(({ emoji, label, href }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center justify-center gap-3 w-full py-6 rounded-2xl text-2xl font-semibold text-white transition-opacity hover:opacity-90 active:opacity-75"
              style={{ backgroundColor: "#1A2B4A" }}
            >
              <span>{emoji}</span>
              <span>{label}</span>
            </Link>
          ))}
        </div>

        <p className="text-center text-base" style={{ color: "#1A2B4A", opacity: 0.5 }}>
          오늘 3회 남음
        </p>
      </div>
    </main>
  );
}
