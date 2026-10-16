import Link from "next/link";
import { Search } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shell/page-frame";

export default function NotFound() {
  return (
    <div className="grid min-h-full place-items-center p-6">
      <EmptyState
        icon={<Search />}
        title="This record isn't on file"
        description="The link may be out of date. Pick a record from the sidebar, or go back to Home."
        action={
          <Button asChild variant="primary" size="sm">
            <Link href="/research">Back to Home</Link>
          </Button>
        }
      />
    </div>
  );
}
