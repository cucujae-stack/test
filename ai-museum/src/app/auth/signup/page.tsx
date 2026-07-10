import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <div className="flex min-h-svh items-center justify-center px-5 pt-24 pb-16 wall-texture">
      <AuthForm mode="signup" />
    </div>
  );
}
