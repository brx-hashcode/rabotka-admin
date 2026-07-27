import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "#/components/ui/dialog";
import { Button } from "#/components/ui/button";
import { appConfig } from "#/config";
import { fetchWithCsrfRetry } from "#/lib/api/csrf-token";
import {
  replaceDocumentFile,
  type AdminDocumentItem,
} from "#/lib/api/documents-controller";
import { DocumentUploadZone } from "./document-upload-zone";

/** Upload a file to storage via /file/upload and return its public URL. */
async function uploadToStorage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("files", file);
  const res = await fetchWithCsrfRetry(
    `${appConfig.apiUrl}/file/upload?is_multipl=true&access=public`,
    { method: "POST", body: formData, credentials: "include" },
  );
  if (!res.ok) throw new Error("File upload failed");
  const json = (await res.json()) as { files: { file_url: string }[] };
  const url = json.files[0]?.file_url;
  if (!url) throw new Error("No file URL returned");
  return url;
}

type Props = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: AdminDocumentItem;
}>;

export function ReplaceDocumentFileModal({
  open,
  onOpenChange,
  document,
}: Props) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);

  const { mutate: submit, isPending } = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Please select a file (.docx, .pdf, or .md)");
      const fileUrl = await uploadToStorage(file);
      return replaceDocumentFile(document.id, {
        file_url: fileUrl,
        mime_type: file.type,
      });
    },
    onSuccess: () => {
      toast.success("Document file replaced");
      queryClient.invalidateQueries({ queryKey: ["admin", "documents"] });
      handleClose();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to replace file");
    },
  });

  function handleClose() {
    onOpenChange(false);
    setFile(null);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => (v ? onOpenChange(true) : handleClose())}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Replace file</DialogTitle>
          <DialogDescription>
            Upload a new file for &ldquo;{document.title}&rdquo;. This repairs a
            document whose stored file is broken and re-detects its template
            variables.
          </DialogDescription>
        </DialogHeader>

        <DocumentUploadZone
          label="Replacement file"
          file={file}
          onAdd={setFile}
          onRemove={() => setFile(null)}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => submit()}
            disabled={isPending || !file}
          >
            {isPending ? "Replacing…" : "Replace file"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
