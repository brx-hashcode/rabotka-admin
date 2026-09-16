import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Download,
  RefreshCw,
} from "lucide-react";
import { appConfig } from "#/config";
import {
  IconFileTypePdf,
  IconFileTypeDocx,
  IconMarkdown,
  IconFile,
} from "@tabler/icons-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "#/components/ui/alert-dialog";
import { Button } from "#/components/ui/button";
import { Badge } from "#/components/ui/badge";
import {
  deleteDocument,
  DOCUMENT_CATEGORY_LABELS,
  type AdminDocumentItem,
  type DocumentCategory,
} from "#/lib/api/documents-controller";

const CATEGORY_BADGE_CLASS: Record<DocumentCategory, string> = {
  AGREEMENT: "bg-violet-600 text-white border-transparent",
  CONTRACT:  "bg-blue-500 text-white border-transparent",
  POLICY:    "bg-indigo-500 text-white border-transparent",
  INVOICE:   "bg-orange-500 text-white border-transparent",
  REPORT:    "bg-teal-600 text-white border-transparent",
  OTHER:     "bg-muted text-muted-foreground border-border",
};
import { DocumentViewerDrawer } from "#/pages/profile-detail/components/document-viewer-drawer";
import { RenameDocumentModal } from "./rename-document-modal";
import { ReplaceDocumentFileModal } from "./replace-document-file-modal";
import { useRole } from "#/hooks/use-role";
import { guardResponse } from "#/lib/auth/session";

function DocIcon({ mimeType }: Readonly<{ mimeType: string }>) {
  if (mimeType === "application/pdf")
    return <IconFileTypePdf className="text-red-500 size-10" />;
  if (mimeType.includes("wordprocessingml"))
    return <IconFileTypeDocx className="text-blue-500 size-10" />;
  if (mimeType === "text/markdown" || mimeType === "text/x-markdown")
    return <IconMarkdown className="text-purple-400 size-10" />;
  return <IconFile className="text-muted-foreground size-10" />;
}

function mimeToFileType(mimeType: string): string {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.includes("wordprocessingml") || mimeType.includes("msword"))
    return "docx";
  if (mimeType === "text/markdown" || mimeType === "text/x-markdown")
    return "md";
  if (mimeType.startsWith("image/")) {
    const sub = mimeType.split("/")[1]?.split("+")[0] ?? "";
    return sub || "image";
  }
  return "";
}

type DocumentCardProps = {
  document: AdminDocumentItem;
};

export function DocumentCard({ document }: Readonly<DocumentCardProps>) {
  const queryClient = useQueryClient();
  const { canManageContent } = useRole();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);

  const { mutate: doDelete, isPending: isDeleting } = useMutation({
    mutationFn: () => deleteDocument(document.id),
    onSuccess: () => {
      toast.success("Document deleted");
      queryClient.invalidateQueries({ queryKey: ["admin", "documents"] });
    },
    onError: () => toast.error("Failed to delete document"),
  });

  async function handleDownload() {
    try {
      if (document.fileUrl.startsWith("blob:")) {
        toast.error("This document was not properly saved. Please delete and re-upload it.");
        return;
      }
      const proxyUrl = `${appConfig.apiUrl}/file/proxy?url=${encodeURIComponent(document.fileUrl)}`;
      // Guarded: a raw media fetch bypasses the controller, so a 401 here
      // would otherwise never reach the session interceptor.
      const res = guardResponse(
        proxyUrl,
        await fetch(proxyUrl, { credentials: "include" }),
      );
      if (!res.ok) throw new Error("The file couldn't be downloaded. Try again.");
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = globalThis.document.createElement("a");
      a.href = objectUrl;
      const extMap: Record<string, string> = {
        "application/pdf": ".pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
        "text/markdown": ".md",
        "text/x-markdown": ".md",
      };
      const ext = extMap[document.mimeType] ?? "";
      const filename = document.title.includes(".") ? document.title : `${document.title}${ext}`;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      toast.error("Failed to download document");
    }
  }

  const viewerDoc =
    document.sourceMode === "GOOGLE_DOCS" && document.previewUrl
      ? {
          url: document.previewUrl,
          fileType: "google-docs",
          title: document.title,
          description: `${DOCUMENT_CATEGORY_LABELS[document.category]} — ${format(new Date(document.createdAt), "dd/MM/yyyy")}`,
        }
      : {
          url: document.fileUrl,
          fileType: mimeToFileType(document.mimeType),
          title: document.title,
          description: `${DOCUMENT_CATEGORY_LABELS[document.category]} — ${format(new Date(document.createdAt), "dd/MM/yyyy")}`,
        };

  return (
    <>
      <div className="bg-card border rounded-2xl overflow-hidden flex flex-col">
        <div className="flex-1 p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <DocIcon mimeType={document.mimeType} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 -mr-1 -mt-1"
                >
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">Options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => setViewOpen(true)}>
                  <Eye className="size-4" />
                  View
                </DropdownMenuItem>
                {canManageContent && (
                  <DropdownMenuItem onClick={() => setRenameOpen(true)}>
                    <Pencil className="size-4" />
                    Rename
                  </DropdownMenuItem>
                )}
                {canManageContent && (
                  <DropdownMenuItem onClick={() => setReplaceOpen(true)}>
                    <RefreshCw className="size-4" />
                    Replace file
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => handleDownload()}>
                  <Download className="size-4" />
                  Download
                </DropdownMenuItem>
                {canManageContent && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setDeleteOpen(true)}
                    >
                      <Trash2 className="size-4" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-1.5 min-w-0">
            <p className="font-medium text-sm leading-snug line-clamp-2">
              {document.title}
            </p>
            <Badge className={`text-xs uppercase ${CATEGORY_BADGE_CLASS[document.category]}`}>
              {DOCUMENT_CATEGORY_LABELS[document.category]}
            </Badge>
            {document.variables.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {document.variables.map((v) => (
                  <span
                    key={v}
                    className="inline-block bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px] font-mono leading-none"
                  >
                    [{v}]
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-4 py-2.5 border-t bg-muted/30">
          <p className="text-muted-foreground text-xs">
            {format(new Date(document.createdAt), "dd/MM/yyyy")}
          </p>
        </div>
      </div>

      <DocumentViewerDrawer
        open={viewOpen}
        onOpenChange={setViewOpen}
        document={viewerDoc}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{document.title}&rdquo; will be permanently deleted. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => doDelete()}
              disabled={isDeleting}
              variant="destructive"
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RenameDocumentModal
        open={renameOpen}
        onOpenChange={setRenameOpen}
        document={document}
      />

      <ReplaceDocumentFileModal
        open={replaceOpen}
        onOpenChange={setReplaceOpen}
        document={document}
      />
    </>
  );
}
