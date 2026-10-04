import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  IconCamera,
  IconEye,
  IconFileText,
  IconLoader2,
  IconUpload,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import { agentsQueryKey } from "#/hooks/use-agents";
import {
  agentKycDocumentRawUrl,
  replaceAgentKycDocument,
  uploadAgentKycFile,
  type AdminAgentDetail,
  type AdminAgentKycDocument,
  type AgentKycCategory,
} from "#/lib/api/agents-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import type { ViewerDocument } from "#/pages/profile-detail/components/document-viewer-drawer";
import { formatDate } from "#/pages/profile-detail/helpers";
import {
  DOCUMENT_TYPE_OPTIONS,
  KYC_ACCEPT,
  KYC_CATEGORY_LABELS,
  KYC_MAX_BYTES,
  cameraFor,
  requiredKycCategories,
} from "../agent-rules";
import { CameraCaptureDialog, canUseLiveCamera } from "./camera-capture-dialog";

type Props = {
  readonly agent: AdminAgentDetail;
  readonly canEdit: boolean;
  readonly onPreviewDoc: (doc: ViewerDocument) => void;
};

function InfoCard({
  label,
  children,
}: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <Card className="gap-2 py-4">
      <CardContent className="px-4">
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          {label}
        </p>
        <div className="mt-2 text-sm font-medium">{children}</div>
      </CardContent>
    </Card>
  );
}

/**
 * The Identity tab, laid out like the profile's: the facts of the document on
 * top, then one card per file. A file opens in the shared document viewer
 * (zoom, rotate, PDF) — every view is logged server-side.
 */
export function AgentKycContent({ agent, canEdit, onPreviewDoc }: Props) {
  const documentType =
    DOCUMENT_TYPE_OPTIONS.find((o) => o.value === agent.idDocumentType)
      ?.label ?? agent.idDocumentType;
  const categories = requiredKycCategories(agent.idDocumentType);
  const complete = categories.every((c) =>
    agent.kycDocuments.some((d) => d.category === c),
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard label="Document">{documentType}</InfoCard>
        <InfoCard label="Document number">
          <span className="font-mono">{agent.idDocumentNumber}</span>
        </InfoCard>
        <InfoCard label="Identity file">
          <Badge
            className={
              complete
                ? "bg-emerald-500 text-white border-transparent"
                : "bg-amber-500 text-white border-transparent"
            }
          >
            {complete ? "Complete" : "Incomplete"}
          </Badge>
        </InfoCard>
        <InfoCard label="Checked by">
          {agent.createdByName ?? "Unknown"}
          <span className="text-muted-foreground block text-xs font-normal">
            at creation, {formatDate(agent.createdAt)}
          </span>
        </InfoCard>
      </div>

      <div>
        <h3 className="mb-4 text-sm font-semibold uppercase">Documents</h3>
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <AgentDocumentCard
              key={category}
              agent={agent}
              category={category}
              doc={agent.kycDocuments.find((d) => d.category === category)}
              canEdit={canEdit}
              onPreviewDoc={onPreviewDoc}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function AgentDocumentCard({
  agent,
  category,
  doc,
  canEdit,
  onPreviewDoc,
}: Readonly<{
  agent: AdminAgentDetail;
  category: AgentKycCategory;
  doc: AdminAgentKycDocument | undefined;
  canEdit: boolean;
  onPreviewDoc: (doc: ViewerDocument) => void;
}>) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const captureRef = useRef<HTMLInputElement>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const label = KYC_CATEGORY_LABELS[category];

  // Versioned by `updatedAt`: a replacement keeps the document id, so without
  // it the browser would keep showing the file that was just replaced.
  const url = doc
    ? `${agentKycDocumentRawUrl(agent.id, doc.id)}?v=${encodeURIComponent(doc.updatedAt)}`
    : null;
  const isImage = !!url && doc?.contentKind === "image" && !failed;

  const replace = useMutation({
    mutationFn: async (file: File) => {
      if (file.size > KYC_MAX_BYTES) {
        throw new Error("File too large (max 10 MB).");
      }
      const { key } = await uploadAgentKycFile(file);
      return replaceAgentKycDocument(agent.id, category, key);
    },
    onSuccess: () => {
      setFailed(false);
      toast.success(`${label} replaced.`);
      void queryClient.invalidateQueries({ queryKey: agentsQueryKey });
    },
    onError: (err) =>
      toast.error(friendlyError(err, "Couldn't replace the document.")),
  });

  const preview = () => {
    if (!url || !doc) return;
    onPreviewDoc({
      url,
      title: label,
      description: `${agent.firstName} ${agent.lastName} — updated ${formatDate(doc.updatedAt)}`,
      // The stream url has no extension; without the kind a PDF would fall
      // through to the viewer's "unsupported" branch.
      fileType: doc.contentKind === "other" ? undefined : doc.contentKind,
    });
  };

  const takePhoto = () => {
    if (canUseLiveCamera()) setCameraOpen(true);
    else captureRef.current?.click();
  };

  return (
    <Card className="min-w-0 gap-0 overflow-hidden py-0">
      <button
        type="button"
        onClick={preview}
        disabled={!url}
        className="bg-muted group relative flex h-48 w-full items-center justify-center enabled:cursor-zoom-in"
        aria-label={url ? `Preview ${label}` : undefined}
      >
        {isImage ? (
          <img
            src={url}
            alt={label}
            className="h-full w-full object-cover"
            onError={() => setFailed(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-1">
            <IconFileText className="text-muted-foreground size-12" />
            <span className="text-muted-foreground text-xs">
              {url ? (doc?.contentKind === "pdf" ? "PDF" : "File") : "Missing"}
            </span>
          </div>
        )}
        {replace.isPending && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/40">
            <IconLoader2 className="size-8 animate-spin text-white" />
          </span>
        )}
        {!doc && (
          <Badge className="absolute top-2 right-2 bg-amber-500 text-white border-transparent">
            Missing
          </Badge>
        )}
      </button>

      <div className="space-y-2 p-3">
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-muted-foreground text-xs">
            {doc ? `Updated ${formatDate(doc.updatedAt)}` : "Not uploaded"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={preview}
            disabled={!url}
          >
            <IconEye className="size-4" />
            Preview
          </Button>
          {canEdit && (
            <>
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => fileRef.current?.click()}
                disabled={replace.isPending}
              >
                <IconUpload className="size-4" />
                Replace
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={takePhoto}
                disabled={replace.isPending}
              >
                <IconCamera className="size-4" />
                Camera
              </Button>
            </>
          )}
        </div>
      </div>

      {canEdit && (
        <>
          <input
            ref={fileRef}
            type="file"
            accept={KYC_ACCEPT}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) replace.mutate(file);
              e.target.value = "";
            }}
          />
          <input
            ref={captureRef}
            type="file"
            accept="image/*"
            capture={cameraFor(category)}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) replace.mutate(file);
              e.target.value = "";
            }}
          />
          <CameraCaptureDialog
            open={cameraOpen}
            onOpenChange={setCameraOpen}
            title={label}
            facing={cameraFor(category)}
            onCapture={(file) => replace.mutate(file)}
          />
        </>
      )}
    </Card>
  );
}
