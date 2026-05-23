"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const message = encodeURIComponent(
      error.message.includes("Invalid login credentials")
        ? "이메일 또는 비밀번호가 올바르지 않습니다."
        : "로그인 중 오류가 발생했습니다. 다시 시도해주세요."
    );
    redirect(`/login?error=${message}`);
  }

  redirect("/closet");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(".supabase.co", "")}/auth/confirm`,
    },
  });

  if (error) {
    const message = encodeURIComponent(
      error.message.includes("already registered")
        ? "이미 가입된 이메일입니다. 로그인을 시도해보세요."
        : "회원가입 중 오류가 발생했습니다. 다시 시도해주세요."
    );
    redirect(`/login?error=${message}`);
  }

  redirect(`/login?message=${encodeURIComponent("가입 확인 이메일을 발송했습니다. 이메일을 확인해주세요.")}`);
}
