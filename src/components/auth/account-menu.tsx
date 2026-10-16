"use client";

import * as React from "react";
import * as Menu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, Loader, LogOut, ShieldCheck } from "@/lib/icons";
import { useCurrentUser, useSessionStore } from "@/lib/auth/store";
import { cn, initialsOf } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

function Avatar({ name, className }: { name: string | null; className?: string }) {
  return (
    <span
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-lg bg-linear-to-br from-indigo-500/30 to-sky-500/20 text-[11px] font-semibold text-indigo-100 ring-1 ring-indigo-400/30",
        className
      )}
    >
      {name ? initialsOf(name) : <span className="size-3 animate-pulse rounded-full bg-white/15" />}
    </span>
  );
}

/**
 * The signed-in user and the way out. `variant="card"` is the sidebar footer
 * row; `variant="avatar"` is the compact top-bar trigger.
 */
export function AccountMenu({ variant = "avatar" }: { variant?: "avatar" | "card" }) {
  const user = useCurrentUser();
  const logout = useSessionStore((s) => s.logout);
  const showToast = useToast((s) => s.show);
  const [signingOut, setSigningOut] = React.useState(false);

  const onSignOut = async (event: Event) => {
    // Keep the menu open on the spinner until the session is gone.
    event.preventDefault();
    setSigningOut(true);
    await logout();
    // AuthGuard sees the session end and takes the user to sign in.
    showToast("Signed out");
  };

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        {variant === "card" ? (
          <button
            type="button"
            className="group flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors hover:bg-white/[0.05] data-[state=open]:bg-white/[0.05]"
          >
            <Avatar name={user?.name ?? null} />
            <span className="min-w-0 flex-1">
              {user ? (
                <>
                  <span className="block truncate text-sm font-medium text-gray-100">{user.name}</span>
                  <span className="block truncate text-xs text-gray-500">{user.email}</span>
                </>
              ) : (
                <>
                  <span className="block h-3.5 w-24 animate-pulse rounded bg-white/10" />
                  <span className="mt-1.5 block h-3 w-32 animate-pulse rounded bg-white/5" />
                </>
              )}
            </span>
            <ChevronDown className="size-4 shrink-0 text-gray-500 transition-transform duration-200 ease-(--ease-out) group-data-[state=open]:rotate-180" />
          </button>
        ) : (
          <button
            type="button"
            aria-label={user ? `Account: ${user.name}` : "Account"}
            className="rounded-lg transition-transform duration-150 ease-(--ease-out) active:scale-[0.97]"
          >
            <Avatar name={user?.name ?? null} />
          </button>
        )}
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Content
          align={variant === "card" ? "start" : "end"}
          side={variant === "card" ? "top" : "bottom"}
          sideOffset={8}
          collisionPadding={8}
          className="anim-pop surface-raised z-popover w-64 rounded-xl p-1.5"
        >
          <div className="flex items-center gap-2.5 px-2 py-2">
            <Avatar name={user?.name ?? null} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-100">{user?.name ?? "Signed in"}</p>
              <p className="truncate text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
          {user && (
            <div className="mx-2 mb-1.5 flex items-center gap-1.5 text-[11px] text-indigo-300">
              <ShieldCheck className="size-3.5" />
              {user.role}
            </div>
          )}
          <Menu.Separator className="my-1 h-px bg-white/[0.08]" />
          <Menu.Item
            onSelect={onSignOut}
            disabled={signingOut}
            className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-gray-300 outline-none transition-colors select-none data-[disabled]:opacity-60 data-[highlighted]:bg-red-500/10 data-[highlighted]:text-red-200"
          >
            {signingOut ? <Loader className="size-4 animate-spin" /> : <LogOut className="size-4" />}
            {signingOut ? "Signing out…" : "Sign out"}
          </Menu.Item>
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}
