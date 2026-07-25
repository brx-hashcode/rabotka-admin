import { AdminBaseController } from "./base-controller";

export type AdminUserListItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminUsersListResponse = {
  data: AdminUserListItem[];
  total: number;
  page: number;
  limit: number;
};

export type AdminUsersListParams = {
  page?: number;
  limit?: number;
  q?: string;
  role?: string[];
  deleted?: boolean;
};

export type CreateAdminUserParams = {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
};

export type UpdateAdminUserParams = {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
};

export class AdminUsersController extends AdminBaseController {
  async getList(params: AdminUsersListParams): Promise<AdminUsersListResponse> {
    const searchParams: Record<string, unknown> = {};
    if (params.page != null) searchParams.page = params.page;
    if (params.limit != null) searchParams.limit = params.limit;
    if (params.q) searchParams.q = params.q;
    if (params.role?.length) searchParams.role = params.role;
    if (params.deleted) searchParams.deleted = "true";

    const query = this.buildSearchParams(searchParams);
    const url = this.createURL("/user", query);
    return this.get<AdminUsersListResponse>(url);
  }

  async create(data: CreateAdminUserParams): Promise<AdminUserListItem> {
    const url = this.createURL("/user", new URLSearchParams());
    return this.post<AdminUserListItem>(url, data);
  }

  async update(
    id: string,
    data: UpdateAdminUserParams,
  ): Promise<AdminUserListItem> {
    const url = this.createURL(`/user/${id}`, new URLSearchParams());
    return this.patch<AdminUserListItem>(url, data);
  }

  async activate(id: string): Promise<AdminUserListItem> {
    const url = this.createURL(`/user/${id}/activate`, new URLSearchParams());
    return this.patch<AdminUserListItem>(url, {});
  }

  async deactivate(id: string): Promise<AdminUserListItem> {
    const url = this.createURL(`/user/${id}/deactivate`, new URLSearchParams());
    return this.patch<AdminUserListItem>(url, {});
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const url = this.createURL(`/user/${id}`, new URLSearchParams());
    return this.delete<{ success: boolean }>(url);
  }

  async bulkDelete(ids: string[]): Promise<{ count: number }> {
    const url = this.createURL("/user/bulk-delete", new URLSearchParams());
    return this.post<{ count: number }>(url, { ids });
  }
}

const controller = new AdminUsersController();
export const getUsersList = controller.getList.bind(controller);
export const bulkDeleteUsers = controller.bulkDelete.bind(controller);
export const createAdminUser = controller.create.bind(controller);
export const updateAdminUser = (id: string, data: UpdateAdminUserParams) =>
  controller.update(id, data);
export const activateAdminUser = (id: string) => controller.activate(id);
export const deactivateAdminUser = (id: string) => controller.deactivate(id);
export const deleteAdminUser = (id: string) => controller.remove(id);
