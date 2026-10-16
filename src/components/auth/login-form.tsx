"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Flask, Lock, Mail } from "@/lib/icons";
import { DEFAULT_AUTHED_ROUTE } from "@/lib/auth/config";
import { AuthError, normalizeEmail } from "@/lib/auth/service";
import { safeNext } from "@/lib/auth/session";
import { useSessionStore } from "@/lib/auth/store";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const login = useSessionStore((s) => s.login);
  const showToast = useToast((s) => s.show);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [reveal, setReveal] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const emailRef = React.useRef<HTMLInputElement>(null);

  const next = safeNext(search.get("next"), DEFAULT_AUTHED_ROUTE);
  const resuming = next !== DEFAULT_AUTHED_ROUTE;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const session = await login({ email: normalizeEmail(email), password });
      showToast(`Signed in as ${session.user.name}`);
      // Hold the spinner — the page is about to change.
      router.replace(next);
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "Sign-in didn't complete. Try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-sm animate-rise-in">
      <div className="mb-8 flex items-center gap-2.5 lg:hidden">
        <span className="grid size-8 place-items-center rounded-lg bg-linear-to-br/srgb from-indigo-500 to-sky-500">
          <Flask className="size-4 text-white" strokeWidth={2} />
        </span>
        <span className="text-sm font-bold tracking-wide text-white uppercase">Medical AI</span>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight text-white">Sign in</h1>
      <p className="mt-1.5 text-sm text-gray-400">
        {resuming
          ? "Sign in to continue where you were headed."
          : "Use your clinic account to open the console."}
      </p>

      <form className="mt-7 space-y-4" onSubmit={onSubmit}>
        {error && (
          <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-200">
            {error}
          </p>
        )}

        <Field label="Email" htmlFor="email">
          <Input
            ref={emailRef}
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="username"
            placeholder="you@clinic.com"
            icon={<Mail />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setEmail((v) => normalizeEmail(v))}
            aria-invalid={error ? true : undefined}
            required
            autoFocus
          />
        </Field>

        <Field label="Password" htmlFor="password">
          <Input
            id="password"
            name="password"
            type={reveal ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••••"
            icon={<Lock />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={error ? true : undefined}
            minLength={6}
            required
            trailing={
              <button
                type="button"
                onClick={() => setReveal((v) => !v)}
                aria-label={reveal ? "Hide password" : "Show password"}
                aria-pressed={reveal}
                className="grid size-7 place-items-center rounded-md text-gray-500 transition-colors hover:bg-white/[0.06] hover:text-gray-200"
              >
                {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            }
          />
        </Field>

        <Button type="submit" variant="primary" size="lg" className="w-full" loading={submitting}>
          {submitting ? (
            "Signing in…"
          ) : (
            <>
              Sign in
              <ArrowRight />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
