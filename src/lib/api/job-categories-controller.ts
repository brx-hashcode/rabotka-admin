import { AdminBaseController } from "./base-controller";

export type AdminJobCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  created_at: string;
};

export type CreateJobCategoryPayload = {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
};

export type UpdateJobCategoryPayload = {
  name?: string;
  slug?: string;
  description?: string;
  icon?: string;
};

class JobCategoriesController extends AdminBaseController {
  async list(): Promise<AdminJobCategory[]> {
    const url = this.createURL("/admin/job-categories", new URLSearchParams());
    return this.get<AdminJobCategory[]>(url);
  }

  async create(payload: CreateJobCategoryPayload): Promise<AdminJobCategory> {
    const url = this.createURL("/admin/job-categories", new URLSearchParams());
    return this.post<AdminJobCategory>(url, payload as Record<string, unknown>);
  }

  async update(
    id: string,
    payload: UpdateJobCategoryPayload,
  ): Promise<AdminJobCategory> {
    const url = this.createURL(
      `/admin/job-categories/${id}`,
      new URLSearchParams(),
    );
    return this.patch<AdminJobCategory>(
      url,
      payload as Record<string, unknown>,
    );
  }

  async remove(id: string): Promise<void> {
    const url = this.createURL(
      `/admin/job-categories/${id}`,
      new URLSearchParams(),
    );
    return this.delete<void>(url);
  }
}

const controller = new JobCategoriesController();
export const listJobCategories = controller.list.bind(controller);
export const createJobCategory = controller.create.bind(controller);
export const updateJobCategory = controller.update.bind(controller);
export const deleteJobCategory = controller.remove.bind(controller);
