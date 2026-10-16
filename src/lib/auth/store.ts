"use client";

import { create } from "zustand";
import { clearSession, readSession, writeSession } from "./session";
import { signIn, signOut } from "./service";
import type { Credentials, Session, User } from "./types";

type Status = "loading" | "authenticated" | "anonymous";

interface SessionState {
  status: Status;
  session: Session | null;
  /** True once the user signed out on purpose — the guard then skips `?next=`. */
  signedOut: boolean;
  /** Reads the stored session. Safe to call repeatedly. */
  hydrate: () => void;
  login: (credentials: Credentials) => Promise<Session>;
  logout: () => Promise<void>;
}

/* Starts "loading" on the server and on first client render alike, so the
   markup matches; `hydrate()` runs in an effect and resolves it. */
export const useSessionStore = create<SessionState>((set) => ({
  status: "loading",
  session: null,
  signedOut: false,

  hydrate: () => {
    const session = readSession();
    set({ session, status: session ? "authenticated" : "anonymous" });
  },

  login: async (credentials) => {
    const session = await signIn(credentials);
    writeSession(session);
    set({ session, status: "authenticated", signedOut: false });
    return session;
  },

  logout: async () => {
    await signOut();
    clearSession();
    set({ session: null, status: "anonymous", signedOut: true });
  },
}));

export function useCurrentUser(): User | null {
  return useSessionStore((s) => s.session?.user ?? null);
}
