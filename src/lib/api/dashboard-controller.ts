import { AdminBaseController } from "./base-controller";

export type JobActivityDataPoint = {
  date: string;
  jobCreated: number;
  jobFilled: number;
};

export type JobActivityParams = {
  range?: "90d" | "30d" | "7d";
};

export class AdminDashboardController extends AdminBaseController {
  async getJobActivity(
    params: JobActivityParams,
  ): Promise<JobActivityDataPoint[]> {
    const searchParams: Record<string, unknown> = {};
    if (params.range) searchParams.range = params.range;

    const query = this.buildSearchParams(searchParams);
    const url = this.createURL("/admin/dashboard/job-activity", query);
    return this.get<JobActivityDataPoint[]>(url);
  }
}

const controller = new AdminDashboardController();
export const getJobActivity = controller.getJobActivity.bind(controller);
