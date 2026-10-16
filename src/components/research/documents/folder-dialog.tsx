"use client";

import * as React from "react";
import { CircleAlert, Folder, FolderPlus, Pencil } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { DialogShell } from "@/components/research/ui/dialog";
import type { FolderRead } from "@/lib/research/types";

/** Create or rename a Documents folder. Mounted only while open, so every
 *  opening starts from the folder's current name. */
export function FolderDialog({
  open,
  onOpenChange,
  folder,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present → renaming that folder; absent → creating a new one. */
  folder?: FolderRead | null;
  /** Throws to keep the dialog open with the message shown. */
  onSubmit: (name: string) => Promise<void>;
}) {
  return open ? <FolderForm onOpenChange={onOpenChange} folder={folder ?? null} onSubmit={onSubmit} /> : null;
}

function FolderForm({
  onOpenChange,
  folder,
  onSubmit,
}: {
  onOpenChange: (open: boolean) => void;
  folder: FolderRead | null;
  onSubmit: (name: string) => Promise<void>;
}) {
  const editing = folder !== null;
  const [name, setName] = React.useState(folder?.name ?? "");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!name.trim()) return setError("Give it a short, searchable name.");
    setBusy(true);
    setError(null);
    try {
      await onSubmit(name.trim());
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn't go through. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <DialogShell
      open
      onOpenChange={onOpenChange}
      dismissable={!busy}
      width="28rem"
      top="10%"
      icon={<Folder />}
      title={editing ? "Rename folder" : "New folder"}
      description={
        editing
          ? "Files inside it stay exactly where they are."
          : "Drop lab PDFs or sensor exports onto it later, or upload straight into it."
      }
      footer={
        <>
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="folder-form" variant="primary" size="sm" loading={busy}>
            {!busy && (editing ? <Pencil /> : <FolderPlus />)}
            {editing ? "Save changes" : "Create folder"}
          </Button>
        </>
      }
    >
      <form id="folder-form" onSubmit={submit} noValidate className="space-y-4">
        <Field label="Name" htmlFor="folder-name">
          <Input
            id="folder-name"
            autoFocus
            maxLength={120}
            value={name}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "folder-name-error" : undefined}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            placeholder="e.g. Lipid panel follow-up"
          />
        </Field>

        {error && (
          <p
            id="folder-name-error"
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300"
          >
            <CircleAlert className="mt-0.5 size-3.5 shrink-0" />
            {error}
          </p>
        )}
      </form>
    </DialogShell>
  );
}
