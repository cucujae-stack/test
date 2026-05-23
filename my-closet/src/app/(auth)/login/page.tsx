import { login, signup } from "./actions";

interface LoginPageProps {
  searchParams: Promise<{ error?: string; message?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, message } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* 로고 / 타이틀 */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold" style={{ color: "#1F3864" }}>
            나만의 옷장
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            AI로 스마트하게 옷장을 관리하세요
          </p>
        </div>

        {/* 폼 */}
        <div className="rounded-2xl bg-white px-8 py-8 shadow-sm">
          <form className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-zinc-700"
              >
                이메일
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="example@email.com"
                className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-[#1F3864] focus:ring-1 focus:ring-[#1F3864]"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-zinc-700"
              >
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="6자 이상 입력"
                className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-[#1F3864] focus:ring-1 focus:ring-[#1F3864]"
              />
            </div>

            {/* 에러 / 안내 메시지 */}
            {error && (
              <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
                {decodeURIComponent(error)}
              </p>
            )}
            {message && (
              <p className="rounded-xl bg-blue-50 px-4 py-2.5 text-sm text-blue-700">
                {decodeURIComponent(message)}
              </p>
            )}

            {/* 버튼 */}
            <div className="mt-2 flex flex-col gap-3">
              <button
                formAction={login}
                className="w-full rounded-2xl py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 active:opacity-80"
                style={{ backgroundColor: "#1F3864" }}
              >
                로그인
              </button>
              <button
                formAction={signup}
                className="w-full rounded-2xl border border-zinc-200 bg-white py-3 text-sm font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 active:bg-zinc-100"
              >
                회원가입
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
