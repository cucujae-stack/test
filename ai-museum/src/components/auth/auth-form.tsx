"use client";

/**
 * Shared login / signup form. Email + OAuth (Google, GitHub) through
 * Supabase Auth. In demo mode (no Supabase env) it explains itself instead
 * of failing silently.
 */
import Link from "next/link";
import { useState } from "react";
import { Mail } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const demoNote =
    "Demo mode: connect Supabase (NEXT_PUBLIC_SUPABASE_URL / ANON_KEY) to enable sign-in.";

  const withSupabase = async (fn: (sb: NonNullable<ReturnType<typeof createClient>>) => Promise<void>) => {
    const supabase = createClient();
    if (!supabase) {
      setMessage(demoNote);
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await fn(supabase);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const submitEmail = (e: React.FormEvent) => {
    e.preventDefault();
    void withSupabase(async (supabase) => {
      const { error } =
        mode === "signup"
          ? await supabase.auth.signUp({ email, password })
          : await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setMessage(mode === "signup" ? "Check your inbox to confirm your address." : "Welcome back.");
    });
  };

  const oauth = (provider: "google" | "github") => {
    void withSupabase(async (supabase) => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    });
  };

  return (
    <div className="w-full max-w-sm">
      <p className="museum-label text-center">
        {mode === "login" ? "Members entrance" : "Become a member"}
      </p>
      <h1 className="mt-3 text-center font-display text-4xl font-light tracking-wide">
        {mode === "login" ? "Sign in" : "Create account"}
      </h1>

      <div className="mt-10 space-y-3">
        <button
          onClick={() => oauth("google")}
          disabled={busy}
          className="flex w-full items-center justify-center gap-3 border border-ink/20 px-4 py-3.5 text-sm transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
        >
          {/* Google mark */}
          <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" aria-hidden>
            <path fill="currentColor" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81" />
          </svg>
          Continue with Google
        </button>
        <button
          onClick={() => oauth("github")}
          disabled={busy}
          className="flex w-full items-center justify-center gap-3 border border-ink/20 px-4 py-3.5 text-sm transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
        >
          {/* GitHub mark (brand icons were dropped from lucide) */}
          <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="currentColor" aria-hidden>
            <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.15c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.75 2.69 1.25 3.34.95.11-.74.4-1.25.73-1.53-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.16-1.18 3.16-1.18.63 1.59.24 2.76.12 3.05.74.81 1.18 1.83 1.18 3.09 0 4.41-2.68 5.38-5.24 5.66.41.36.78 1.05.78 2.12v3.15c0 .3.2.67.8.55A10.52 10.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
          </svg>
          Continue with GitHub
        </button>
      </div>

      <div className="my-8 flex items-center gap-4 text-[10px] tracking-[0.3em] text-muted uppercase">
        <span className="h-px flex-1 bg-line" />
        or with email
        <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={submitEmail} className="space-y-4">
        <label className="block">
          <span className="museum-label">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="mt-2 w-full border border-line bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-accent"
          />
        </label>
        <label className="block">
          <span className="museum-label">Password</span>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            className="mt-2 w-full border border-line bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-accent"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 bg-ink px-4 py-3.5 text-[12px] tracking-[0.2em] text-canvas uppercase transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          <Mail className="h-4 w-4" strokeWidth={1.5} />
          {mode === "login" ? "Sign in" : "Sign up"}
        </button>
      </form>

      {message && (
        <p role="status" className="mt-5 border border-accent/30 bg-accent/5 p-3.5 text-center text-xs leading-relaxed text-ink/80">
          {message}
        </p>
      )}
      {!isSupabaseConfigured() && !message && (
        <p className="mt-5 text-center text-[11px] leading-relaxed text-muted">{demoNote}</p>
      )}

      <p className="mt-8 text-center text-sm text-muted">
        {mode === "login" ? (
          <>
            New here?{" "}
            <Link href="/auth/signup" className="text-accent hover:underline">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already a member?{" "}
            <Link href="/auth/login" className="text-accent hover:underline">
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
