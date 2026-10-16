import type { DemoAccount } from "./types";

/** Cookie `proxy.ts` checks before any app route renders. Holds only the
 *  opaque token — the user record lives in localStorage. */
export const SESSION_COOKIE = "omr_session";

/** localStorage key for the full session record. */
export const SESSION_STORAGE_KEY = "omnimed.session";

/** Sessions last one clinic shift. */
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

/** Where a signed-in user lands when no `?next=` was carried through. */
export const DEFAULT_AUTHED_ROUTE = "/research";

/**
 * The one account that can sign in until the backend exists. Only
 * `lib/auth/service.ts` (sign-in) and `lib/auth/session.ts` (a stored session
 * must still belong to it) read this — replacing them with real API calls
 * needs no change anywhere else.
 */
export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: "usr_admin",
    name: "Super Admin",
    email: "admin@hubts.io",
    password: "Admin@123",
    role: "Administrator",
  },
];
