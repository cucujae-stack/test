import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "./actions";

interface ClothingItem {
  id: string;
  name: string | null;
  category: string | null;
  color: string | null;
  image_url: string | null;
}

export default async function ClosetPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: items } = await supabase
    .from("clothing_items")
    .select("id, name, category, color, image_url")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .returns<ClothingItem[]>();

  const clothingItems = items ?? [];

  return (
    <div className="flex min-h-screen flex-col">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 border-b border-zinc-100 bg-white px-4 py-4 shadow-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div>
            <h1 className="text-lg font-bold" style={{ color: "#1F3864" }}>
              나만의 옷장
            </h1>
            <p className="text-xs text-zinc-500">
              안녕하세요, {user.email}님
            </p>
          </div>
          <form>
            <button
              formAction={logout}
              className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
            >
              로그아웃
            </button>
          </form>
        </div>
      </header>

      {/* 본문 */}
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        {clothingItems.length === 0 ? (
          /* 빈 상태 */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 text-6xl">👗</div>
            <h2 className="mb-2 text-lg font-semibold text-zinc-700">
              아직 등록된 옷이 없어요
            </h2>
            <p className="mb-8 text-sm text-zinc-400">
              옷을 추가해서 나만의 옷장을 만들어보세요
            </p>
            <Link
              href="/closet/new"
              className="rounded-2xl px-8 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#1F3864" }}
            >
              옷 추가하기
            </Link>
          </div>
        ) : (
          /* 옷 그리드 */
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {clothingItems.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl bg-white p-3 shadow-sm"
              >
                {/* 이미지 */}
                <div className="mb-2 aspect-square w-full overflow-hidden rounded-xl bg-zinc-100">
                  {item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image_url}
                      alt={item.name ?? "옷 이미지"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl text-zinc-300">
                      👗
                    </div>
                  )}
                </div>

                {/* 칩 */}
                <div className="flex flex-wrap gap-1">
                  {item.category && (
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                      {item.category}
                    </span>
                  )}
                  {item.color && (
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                      {item.color}
                    </span>
                  )}
                </div>

                {/* 이름 */}
                {item.name && (
                  <p className="mt-1 truncate text-sm font-medium text-zinc-700">
                    {item.name}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 우하단 플로팅 버튼 */}
      <Link
        href="/closet/new"
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full text-2xl text-white shadow-lg transition-opacity hover:opacity-90"
        style={{ backgroundColor: "#1F3864" }}
        aria-label="옷 추가하기"
      >
        +
      </Link>
    </div>
  );
}
