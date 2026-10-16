import { DEMO_ACCOUNTS, SESSION_COOKIE, SESSION_STORAGE_KEY } from "./config";
import type { Session } from "./types";

/* Browser-side session persistence. Every accessor is guarded: storage can be
   unavailable (private mode, blocked site data) and these run during render
   paths that must never throw. */

function isSession(value: unknown): value is Session {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<Session>;
  return (
    typeof v.token === "string" &&
    typeof v.expiresAt === "number" &&
    !!v.user &&
    typeof v.user.email === "string" &&
    typeof v.user.name === "string"
  );
}

function writeCookie(token: string, expiresAt: number) {
  const maxAge = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

function eraseCookie() {
  document.cookie = `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

/** A session minted for an account that can no longer sign in (one of the
 *  earlier demo logins) is signed out rather than kept until it expires. */
function isKnownAccount(session: Session): boolean {
  return DEMO_ACCOUNTS.some((a) => a.email === session.user.email);
}

/** The stored session, or null when absent, malformed, expired or for an
 *  account that can't sign in. Such a record is cleared as a side effect. */
export function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      eraseCookie();
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!isSession(parsed) || parsed.expiresAt <= Date.now() || !isKnownAccount(parsed)) {
      clearSession();
      return null;
    }
    // Keep the cookie in step with storage (e.g. it was cleared by hand), so
    // proxy.ts and the client never disagree about whether you're signed in.
    writeCookie(parsed.token, parsed.expiresAt);
    return parsed;
  } catch {
    return null;
  }
}

export function writeSession(session: Session) {
  try {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage blocked (private mode, site data disabled): the session can't
    // persist, so AuthGuard will send the user back to sign in.
  }
  writeCookie(session.token, session.expiresAt);
}

export function clearSession() {
  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
  eraseCookie();
}

/** Only same-origin paths are honoured, so `?next=https://evil.example` can't
 *  turn the login page into an open redirect. */
export function safeNext(next: string | null | undefined, fallback: string): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/login")) return fallback;
  return next;
}
