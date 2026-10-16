import Link from "next/link";
import { Search } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shell/page-frame";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas p-6">
      <EmptyState
        icon={<Search />}
        title="This page doesn't exist"
        description="Check the address, or head back to the console."
        action={
          <Button asChild variant="primary" size="sm">
            <Link href="/research">Back to Home</Link>
          </Button>
        }
      />
    </main>
  );
}
