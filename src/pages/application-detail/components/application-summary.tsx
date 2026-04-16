import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  IconMail,
  IconPhone,
  IconExternalLink,
  IconBriefcase,
  IconFileTypePdf,
} from "@tabler/icons-react";
import { toast } from "sonner";

import type { AdminApplicationDetailResponse } from "#/lib/api/applications-controller";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Separator } from "#/components/ui/separator";
import { Button, buttonVariants } from "#/components/ui/button";
import { appConfig } from "#/config";
import { getCsrfToken } from "#/lib/api/csrf-token";
import { DocumentViewerDrawer } from "#/pages/profile-detail/components/document-viewer-drawer";
import type { ViewerDocument } from "#/pages/profile-detail/components/document-viewer-drawer";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (
    ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase().slice(0, 2) ||
    "?"
  );
}

type Props = {
  application: AdminApplicationDetailResponse;
};

async function fetchAdminPdfBlob(path: string): Promise<Blob> {
  const token = getCsrfToken();
  const headers: Record<string, string> = token
    ? { "x-csrf-token": token }
    : {};
  const res = await fetch(`${appConfig.apiUrl}${path}`, {
    credentials: "include",
    headers,
  });
  if (!res.ok) throw new Error("Download failed");
  return res.blob();
}

export function ApplicationSummary({ application }: Readonly<Props>) {
  const [loading, setLoading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<ViewerDocument | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  async function handlePreview() {
    if (!application.contractId) return;
    setLoading(true);
    try {
      const blob = await fetchAdminPdfBlob(
        `/admin/contracts/${application.contractId}/download`,
      );
      const objectUrl = URL.createObjectURL(blob);
      const filename = `contrat_${application.workerName.replace(/\s+/g, "_")}.pdf`;
      setPreviewDoc({
        url: objectUrl,
        title: "Contract",
        description: filename,
        fileType: "pdf",
        onDownload: () => {
          const a = globalThis.document.createElement("a");
          a.href = objectUrl;
          a.download = filename;
          a.click();
        },
      });
      setDrawerOpen(true);
    } catch {
      toast.error("Failed to load contract");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(open: boolean) {
    setDrawerOpen(open);
    if (!open && previewDoc) {
      URL.revokeObjectURL(previewDoc.url);
      setPreviewDoc(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-sm">Worker</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              {application.workerAvatarUrl ? (
                <AvatarImage
                  src={application.workerAvatarUrl}
                  alt={application.workerName}
                  className="object-cover"
                />
              ) : null}
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                {getInitials(application.workerName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {application.workerName || "—"}
              </p>
              {application.workerReliabilityScore != null && (
                <p className="text-muted-foreground text-xs">
                  Reliability: {application.workerReliabilityScore}%
                </p>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <IconMail className="text-muted-foreground size-4 shrink-0" />
              <span className="truncate text-sm">
                {application.workerEmail || "—"}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <IconPhone className="text-muted-foreground size-4 shrink-0" />
              <span className="text-sm">{application.workerPhone || "—"}</span>
            </div>
          </div>

          <Link
            to="/profiles/$profileId"
            params={{ profileId: application.workerId }}
            className={buttonVariants({
              variant: "outline",
              className: "w-full",
            })}
          >
            <IconExternalLink className="size-3.5" />
            View Profile
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-sm">Employer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              {application.employerAvatarUrl ? (
                <AvatarImage
                  src={application.employerAvatarUrl}
                  alt={application.employerName}
                  className="object-cover"
                />
              ) : null}
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                {getInitials(application.employerName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {application.employerName || "—"}
              </p>
              <p className="text-muted-foreground truncate text-xs">
                {application.employerEmail || "—"}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Link
              to="/profiles/$profileId"
              params={{ profileId: application.employerId }}
              className={buttonVariants({
                variant: "outline",
                className: "w-full",
              })}
            >
              <IconExternalLink className="size-3.5" />
              View Profile
            </Link>
            <Link
              to="/jobs/$jobId"
              params={{ jobId: application.jobOfferId }}
              className={buttonVariants({
                variant: "outline",
                className: "w-full",
              })}
            >
              <IconBriefcase className="size-3.5" />
              View Job
            </Link>
          </div>
        </CardContent>
      </Card>

      {application.contractId && (
        <>
          <Button
            variant="outline"
            className="w-full"
            disabled={loading}
            onClick={handlePreview}
            title="Preview contract PDF"
          >
            <IconFileTypePdf className="size-4 text-red-500" />
            <span>{loading ? "Downloading..." : "contract"}</span>
          </Button>
          <DocumentViewerDrawer
            open={drawerOpen}
            onOpenChange={handleOpenChange}
            document={previewDoc}
          />
        </>
      )}
    </div>
  );
}
