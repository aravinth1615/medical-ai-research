import { wait } from "@/lib/utils";
import { DEMO_ACCOUNTS, SESSION_TTL_MS } from "./config";
import type { Credentials, Session } from "./types";

/**
 * Authentication service. Static for now — it checks the demo accounts in
 * `config.ts` and mints a local token. Swap these two functions for real API
 * calls when the backend lands; the store and every screen consume only this
 * contract.
 */

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function mintToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function signIn({ email, password }: Credentials): Promise<Session> {
  await wait(650);
  const account = DEMO_ACCOUNTS.find((a) => a.email === normalizeEmail(email));
  // One message for both cases, so the form doesn't reveal which emails exist.
  if (!account || account.password !== password) {
    throw new AuthError("That email and password don't match an account. Check both and try again.");
  }
  const { password: _omit, ...user } = account;
  void _omit;
  return { token: mintToken(), user, expiresAt: Date.now() + SESSION_TTL_MS };
}

export async function signOut(): Promise<void> {
  await wait(150);
}
