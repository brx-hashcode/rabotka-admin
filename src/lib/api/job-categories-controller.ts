import { AdminBaseController } from "./base-controller";

export type AdminJobCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  created_at: string;
  /** Open and closed offers posted in this domain. */
  jobOffersCount: number;
  /**
   * Distinct workers who list this domain, counted across both the legacy
   * single-category column and the many-to-many join, so nobody on both is
   * counted twice.
   */
  workersCount: number;
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
    return this.post<AdminJobCategory>(url, payload);
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
      payload,
    );
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const url = this.createURL(
      `/admin/job-categories/${id}`,
      new URLSearchParams(),
    );
    return this.delete<{ success: boolean }>(url);
  }
}

const controller = new JobCategoriesController();
export const listJobCategories = controller.list.bind(controller);
export const createJobCategory = controller.create.bind(controller);
export const updateJobCategory = controller.update.bind(controller);
export const deleteJobCategory = controller.remove.bind(controller);
