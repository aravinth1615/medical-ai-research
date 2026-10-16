import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/shell/app-shell";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
