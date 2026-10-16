import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    // The form reads `?next=`, which only exists at request time — the
    // boundary lets the rest of the page prerender around it.
    <Suspense fallback={<div className="mx-auto h-[420px] w-full max-w-sm" aria-hidden />}>
      <LoginForm />
    </Suspense>
  );
}
