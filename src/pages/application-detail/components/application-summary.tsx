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

async function downloadAdminPdf(path: string, filename: string) {
  const token = getCsrfToken();
  const headers: Record<string, string> = token ? { "x-csrf-token": token } : {};
  const res = await fetch(`${appConfig.apiUrl}${path}`, { credentials: "include", headers });
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = globalThis.document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(objectUrl);
}

export function ApplicationSummary({ application }: Readonly<Props>) {
  const [isDownloadingContract, setIsDownloadingContract] = useState(false);

  async function handleDownloadContract() {
    if (!application.contractId) return;
    setIsDownloadingContract(true);
    try {
      await downloadAdminPdf(
        `/admin/contracts/${application.contractId}/download`,
        `contrat_${application.workerName.replace(/\s+/g, "_")}.pdf`,
      );
    } catch {
      toast.error("Failed to download contract");
    } finally {
      setIsDownloadingContract(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Worker card */}
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

      {/* Employer card */}
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
        <Button
          variant="outline"
          className="w-full"
          disabled={isDownloadingContract}
          onClick={handleDownloadContract}
        >
          <IconFileTypePdf className="size-4 text-red-500" />
          {isDownloadingContract ? "Downloading…" : "Download Contract PDF"}
        </Button>
      )}
    </div>
  );
}
