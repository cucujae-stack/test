import Link from "next/link";

export default function WearPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center min-h-screen px-6 py-12">
      <div className="w-full max-w-[480px] flex flex-col gap-8 items-center">
        <span className="text-7xl">👕</span>
        <h1 className="text-3xl font-bold text-center" style={{ color: "#1A2B4A" }}>
          뭐 입지
        </h1>
        <p className="text-lg text-center" style={{ color: "#1A2B4A", opacity: 0.6 }}>
          오늘 뭐 입을지 결정해드릴게요!
        </p>
        <Link
          href="/"
          className="text-base font-medium underline underline-offset-4"
          style={{ color: "#1A2B4A", opacity: 0.5 }}
        >
          ← 돌아가기
        </Link>
      </div>
    </main>
  );
}
