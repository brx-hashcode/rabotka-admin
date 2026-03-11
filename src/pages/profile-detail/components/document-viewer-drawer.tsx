import { useState, useEffect, lazy, Suspense } from "react";

import type { AdminKycDocumentItem } from "#/lib/api/profiles-controller";

import { Skeleton } from "#/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "#/components/ui/sheet";

import { docCategoryLabel, docTypeLabel, formatDate, getFileType } from "../helpers";

const LazyDocViewer = lazy(() =>
  import("@cyntler/react-doc-viewer").then((mod) => ({
    default: mod.default,
  })),
);
const getDocViewerRenderers = () =>
  import("@cyntler/react-doc-viewer").then((mod) => mod.DocViewerRenderers);

export type ViewerDocument = {
  url: string;
  title: string;
  description: string;
};

export function toKycViewerDoc(doc: AdminKycDocumentItem): ViewerDocument {
  return {
    url: doc.documentUrl,
    title: docCategoryLabel(doc.documentCategory),
    description: `${docTypeLabel(doc.documentType)} — Uploaded ${formatDate(doc.createdAt)}`,
  };
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: ViewerDocument | null;
};

export function DocumentViewerDrawer({
  open,
  onOpenChange,
  document,
}: Props) {
  const [renderers, setRenderers] = useState<unknown[]>([]);

  useEffect(() => {
    if (open) {
      getDocViewerRenderers().then(setRenderers);
    }
  }, [open]);

  if (!document) return null;

  const docs = [
    { uri: document.url, fileType: getFileType(document.url) },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[50vw]">
        <SheetHeader>
          <SheetTitle>{document.title}</SheetTitle>
          <SheetDescription>{document.description}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-auto px-4 pb-4">
          <Suspense
            fallback={
              <div className="flex h-[400px] items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            }
          >
            <LazyDocViewer
              documents={docs}
              pluginRenderers={renderers as never}
              style={{ height: "100%", minHeight: 400 }}
              config={{
                header: { disableHeader: true },
              }}
            />
          </Suspense>
        </div>
      </SheetContent>
    </Sheet>
  );
}
