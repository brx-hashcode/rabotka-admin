import { AdminBaseController } from "./base-controller";

export type DocumentCategory =
  | "AGREEMENT"
  | "CONTRACT"
  | "POLICY"
  | "INVOICE"
  | "REPORT"
  | "OTHER";

export type DocumentSourceMode = "UPLOAD" | "GOOGLE_DOCS";

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  AGREEMENT: "AGREEMENT",
  CONTRACT: "CONTRACT",
  POLICY: "POLICY",
  INVOICE: "INVOICE",
  REPORT: "REPORT",
  OTHER: "OTHER",
};

export type AdminDocumentItem = {
  id: string;
  title: string;
  category: DocumentCategory;
  fileUrl: string;
  mimeType: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  sourceMode: DocumentSourceMode;
  googleDocsUrl: string | null;
  googleDocsId: string | null;
  previewUrl: string | null;
  variables: string[];
};

export type AdminDocumentsListParams = {
  page?: number;
  limit?: number;
  category?: DocumentCategory;
};

export type AdminDocumentsListResponse = {
  data: AdminDocumentItem[];
  total: number;
  page: number;
  limit: number;
};

export type CreateDocumentFromUrlPayload = {
  title: string;
  category: DocumentCategory;
  google_docs_url: string;
};

export type CreateDocumentFromUploadPayload = {
  title: string;
  category: DocumentCategory;
  file_url: string;
  mime_type: string;
};

export type UpdateDocumentPayload = {
  title?: string;
  category?: DocumentCategory;
};

class AdminDocumentsController extends AdminBaseController {
  async createFromUrl(
    payload: CreateDocumentFromUrlPayload,
  ): Promise<AdminDocumentItem> {
    const url = this.createURL(
      "/admin/documents/from-url",
      new URLSearchParams(),
    );
    return this.post<AdminDocumentItem>(
      url,
      payload as Record<string, unknown>,
    );
  }

  async createFromUpload(
    payload: CreateDocumentFromUploadPayload,
  ): Promise<AdminDocumentItem> {
    const url = this.createURL(
      "/admin/documents/from-upload",
      new URLSearchParams(),
    );
    return this.post<AdminDocumentItem>(
      url,
      payload as Record<string, unknown>,
    );
  }

  async listDocuments(
    params: AdminDocumentsListParams,
  ): Promise<AdminDocumentsListResponse> {
    const searchParams: Record<string, unknown> = {};
    if (params.page != null) searchParams.page = params.page;
    if (params.limit != null) searchParams.limit = params.limit;
    if (params.category) searchParams.category = params.category;

    const query = this.buildSearchParams(searchParams);
    const url = this.createURL("/admin/documents", query);
    return this.get<AdminDocumentsListResponse>(url);
  }

  async updateDocument(
    id: string,
    payload: UpdateDocumentPayload,
  ): Promise<AdminDocumentItem> {
    const url = this.createURL(`/admin/documents/${id}`, new URLSearchParams());
    return this.patch<AdminDocumentItem>(
      url,
      payload as Record<string, unknown>,
    );
  }

  async deleteDocument(id: string): Promise<{ success: boolean }> {
    const url = this.createURL(`/admin/documents/${id}`, new URLSearchParams());
    return this.delete<{ success: boolean }>(url);
  }
}

const controller = new AdminDocumentsController();
export const listDocuments = controller.listDocuments.bind(controller);
export const createDocumentFromUrl = controller.createFromUrl.bind(controller);
export const createDocumentFromUpload =
  controller.createFromUpload.bind(controller);
export const updateDocument = controller.updateDocument.bind(controller);
export const deleteDocument = controller.deleteDocument.bind(controller);
