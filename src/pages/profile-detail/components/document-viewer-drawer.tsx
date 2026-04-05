import { Component, useState, useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import {
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  FileText,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import type { AdminKycDocumentItem } from "#/lib/api/profiles-controller";

import { Skeleton } from "#/components/ui/skeleton";
import { Button } from "#/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "#/components/ui/sheet";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import { docCategoryLabel, docTypeLabel, formatDate } from "../helpers";
import { appConfig } from "#/config";

function pdfDocumentUrl(fileUrl: string): string {
  const trimmed = fileUrl.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  if (globalThis.window === undefined) {
    return trimmed;
  }
  return new URL(trimmed, globalThis.location.origin).href;
}

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

async function downloadViaProxy(fileUrl: string, filename: string) {
  const proxyUrl = `${appConfig.apiUrl}/file/proxy?url=${encodeURIComponent(fileUrl)}`;
  const res = await fetch(proxyUrl, { credentials: "include" });
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = globalThis.document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(objectUrl);
}

function DocFallback({
  url,
  reason,
}: Readonly<{ url: string; reason: string }>) {
  return (
    <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4 text-center">
      <div className="bg-muted rounded-full p-4">
        <ExternalLink className="text-muted-foreground size-8" />
      </div>
      <div className="space-y-1">
        <p className="font-medium">Preview unavailable</p>
        <p className="text-muted-foreground text-sm max-w-xs">{reason}</p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
        >
          <ExternalLink className="size-4" />
          Open in new tab
        </Button>
        <Button
          onClick={() =>
            downloadViaProxy(url, url.split("/").pop() ?? "document")
          }
        >
          <Download className="size-4" />
          Download
        </Button>
      </div>
    </div>
  );
}

class ViewerErrorBoundary extends Component<
  { children: ReactNode; url: string },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <DocFallback
          url={this.props.url}
          reason="The file could not be rendered. It may be inaccessible or in an unsupported format."
        />
      );
    }
    return this.props.children;
  }
}

export type ViewerDocument = {
  url: string;
  title: string;
  description: string;
  fileType?: string;
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

const ZOOM_MIN = 0.75;
const ZOOM_MAX = 2.25;
const ZOOM_STEP = 0.25;

function PdfViewer({ url }: Readonly<{ url: string }>) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [width, setWidth] = useState(600);
  const [zoom, setZoom] = useState(1);

  const pdfFile = useMemo(() => {
    const absolute = pdfDocumentUrl(url);
    return { url: absolute };
  }, [url]);

  const pdfOptions = useMemo(() => {
    const base = {
      disableRange: true,
      disableStream: true,
    };
    if (globalThis.window === undefined) {
      return { ...base, withCredentials: false };
    }
    try {
      const docOrigin = new URL(pdfFile.url).origin;
      const crossOrigin = docOrigin !== globalThis.location.origin;
      return {
        ...base,
        withCredentials: !crossOrigin,
      };
    } catch {
      return { ...base, withCredentials: false };
    }
  }, [pdfFile.url]);

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) setWidth(node.clientWidth - 32);
  }, []);

  return (
    <ViewerErrorBoundary url={url}>
      <div
        className="flex flex-col h-full min-h-0"
        style={{ minHeight: "calc(100vh - 160px)" }}
      >
        {numPages > 0 && (
          <div className="mb-4 flex shrink-0 flex-col gap-3 rounded-xl border bg-muted/30 p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex items-center justify-center gap-1 sm:justify-start">
              <div className="inline-flex items-center rounded-lg border bg-background p-0.5 shadow-xs">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  disabled={pageNumber <= 1}
                  onClick={() => setPageNumber((p) => p - 1)}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="min-w-22 px-2 text-center text-sm font-medium tabular-nums text-foreground">
                  {pageNumber}
                  <span className="text-muted-foreground"> / </span>
                  {numPages}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  disabled={pageNumber >= numPages}
                  onClick={() => setPageNumber((p) => p + 1)}
                  aria-label="Next page"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
              <div className="inline-flex items-center rounded-lg border bg-background p-0.5 shadow-xs">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  disabled={zoom <= ZOOM_MIN}
                  onClick={() =>
                    setZoom((z) =>
                      Math.max(
                        ZOOM_MIN,
                        Math.round((z - ZOOM_STEP) * 100) / 100,
                      ),
                    )
                  }
                  aria-label="Zoom out"
                >
                  <ZoomOut className="size-4" />
                </Button>
                <span className="min-w-13 px-1 text-center text-xs font-medium tabular-nums text-muted-foreground">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  disabled={zoom >= ZOOM_MAX}
                  onClick={() =>
                    setZoom((z) =>
                      Math.min(
                        ZOOM_MAX,
                        Math.round((z + ZOOM_STEP) * 100) / 100,
                      ),
                    )
                  }
                  aria-label="Zoom in"
                >
                  <ZoomIn className="size-4" />
                </Button>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5"
                onClick={() =>
                  globalThis.open(url, "_blank", "noopener,noreferrer")
                }
              >
                <ExternalLink className="size-3.5" />
                Open
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                className="h-8 gap-1.5"
                onClick={() =>
                  downloadViaProxy(url, url.split("/").pop() ?? "document")
                }
              >
                <Download className="size-3.5" />
                Download
              </Button>
            </div>
          </div>
        )}

        <div
          ref={containerRef}
          className="flex min-h-0 flex-1 justify-center overflow-auto"
        >
          <Document
            file={pdfFile}
            options={pdfOptions}
            onLoadSuccess={({ numPages: n }) => {
              setNumPages(n);
              setPageNumber(1);
              setZoom(1);
            }}
            onLoadError={() => {}}
            loading={
              <div className="flex items-center justify-center py-20">
                <Skeleton className="h-[700px] w-full rounded-lg" />
              </div>
            }
            error={
              <DocFallback
                url={url}
                reason="Failed to load PDF. The file may be inaccessible or corrupted."
              />
            }
          >
            <Page
              pageNumber={pageNumber}
              width={Math.max(240, width * zoom)}
              renderAnnotationLayer
              renderTextLayer
            />
          </Document>
        </div>
      </div>
    </ViewerErrorBoundary>
  );
}

function DocxViewer({ url }: Readonly<{ url: string }>) {
  const [failed, setFailed] = useState(false);
  const officeUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;

  if (failed) {
    return (
      <DocFallback
        url={url}
        reason="The document could not be previewed. The file may not be publicly accessible."
      />
    );
  }

  return (
    <iframe
      src={officeUrl}
      title="Document preview"
      className="w-full"
      style={{ height: "calc(100vh - 140px)" }}
      sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-downloads"
      onError={() => setFailed(true)}
    />
  );
}

export function DocumentViewerDrawer({
  open,
  onOpenChange,
  document,
}: Readonly<Props>) {
  if (!document) return null;

  const fileType = document.fileType ?? "";
  const isPdf = fileType === "pdf" || document.url.includes(".pdf");
  const isDocx =
    fileType === "docx" ||
    fileType === "doc" ||
    document.url.includes(".docx") ||
    document.url.includes(".doc");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[55vw] flex flex-col gap-0 p-0"
      >
        <SheetHeader className="shrink-0 space-y-0 border-b bg-muted/15 px-5 py-4 sm:px-6">
          <div className="flex gap-3 sm:gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20">
              <FileText className="size-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 space-y-1 pr-8 text-left">
              <SheetTitle className="line-clamp-2 text-lg font-semibold leading-snug tracking-tight">
                {document.title}
              </SheetTitle>
              <SheetDescription className="text-xs leading-relaxed sm:text-sm">
                {document.description}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-auto p-4 pt-5">
          {open && isPdf && <PdfViewer url={document.url} />}
          {open && isDocx && <DocxViewer url={document.url} />}
          {open && !isPdf && !isDocx && (
            <DocFallback
              url={document.url}
              reason="This file format cannot be previewed in the browser."
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
