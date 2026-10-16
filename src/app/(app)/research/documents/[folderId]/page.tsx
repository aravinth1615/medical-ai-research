import type { Metadata } from "next";
import { Suspense } from "react";
import { FolderSkeleton } from "@/components/research/documents/folder-skeleton";
import { FolderView } from "@/components/research/documents/folder-view";

export const metadata: Metadata = { title: "Folder" };

/* Folders are created at runtime in the browser, so there are no static
   params. The page never awaits `params` itself: the route's shared App Shell
   (and this skeleton) prefetch instantly, and the folder streams in behind
   the Suspense boundary. */
export default function FolderPage({ params }: PageProps<"/research/documents/[folderId]">) {
  return (
    <Suspense fallback={<FolderSkeleton />}>
      <FolderParams params={params} />
    </Suspense>
  );
}

/** Resolves the folder id inside the boundary, then hands it to the client view. */
async function FolderParams({ params }: Pick<PageProps<"/research/documents/[folderId]">, "params">) {
  const { folderId } = await params;
  // Keyed so another folder's upload queue never carries over.
  return <FolderView key={folderId} folderId={folderId} />;
}
