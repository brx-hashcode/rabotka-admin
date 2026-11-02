import { appConfig } from "#/config";
import { AdminBaseController } from "./base-controller";

export type ExternalApplicationStatus = "PENDING" | "RETAINED" | "REFUSED";

/** An application made from a business's public careers page (no Rabotka profile). */
export type AdminExternalApplication = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: ExternalApplicationStatus;
  source: string | null;
  knockedOut: boolean;
  answers: { label: string; value: string }[];
  hasCv: boolean;
  /** The CV's type, for the viewer (absent from an older backend). */
  cvMimeType?: string | null;
  score: number | null;
  createdAt: string;
  viewedAt: string | null;
  retainedAt: string | null;
  refusedAt: string | null;
  offer: { id: string; title: string };
  business: { profileId: string; name: string | null };
};

export type ExternalApplicationsParams = {
  page?: number;
  limit?: number;
  q?: string;
  status?: ExternalApplicationStatus[];
  jobOfferId?: string;
  employerId?: string;
};

class ExternalApplicationsController extends AdminBaseController {
  list(params: ExternalApplicationsParams): Promise<{ data: AdminExternalApplication[]; total: number; page: number; limit: number }> {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    if (params.q?.trim()) qs.set("q", params.q.trim());
    if (params.status?.length) qs.set("status", params.status.join(","));
    if (params.jobOfferId) qs.set("jobOfferId", params.jobOfferId);
    if (params.employerId) qs.set("employerId", params.employerId);
    return this.get(`/admin/external-applications${qs.size ? `?${qs}` : ""}`);
  }
}

const c = new ExternalApplicationsController();
export const listExternalApplications = c.list.bind(c);

/** The CV, behind the admin session; each opening is logged. */
export function externalApplicationCvUrl(id: string): string {
  return `${appConfig.apiUrl}/admin/external-applications/${encodeURIComponent(id)}/cv`;
}

export const EXTERNAL_STATUS_LABEL: Record<ExternalApplicationStatus, string> = {
  PENDING: "Pending",
  RETAINED: "Retained",
  REFUSED: "Refused",
};
