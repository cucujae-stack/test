import Link from "next/link";

export default function NewClosetItemPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* 헤더 */}
      <header className="border-b border-zinc-100 bg-white px-4 py-4 shadow-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link
            href="/closet"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-50"
            aria-label="뒤로 가기"
          >
            ←
          </Link>
          <h1 className="text-lg font-bold text-zinc-800">옷 추가하기</h1>
        </div>
      </header>

      {/* 본문 */}
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-12 text-center">
        <div className="mb-4 text-6xl">🚧</div>
        <h2 className="mb-2 text-lg font-semibold text-zinc-700">
          준비 중입니다
        </h2>
        <p className="mb-8 max-w-xs text-sm leading-relaxed text-zinc-500">
          다음 업데이트에서 사진 1장으로 자동 등록을 지원할 예정이에요.
          <br />
          AI가 옷의 색상, 카테고리, 소재를 자동으로 분석해드릴 거예요.
        </p>
        <Link
          href="/closet"
          className="rounded-2xl px-8 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#1F3864" }}
        >
          옷장으로 돌아가기
        </Link>
      </main>
    </div>
  );
}
