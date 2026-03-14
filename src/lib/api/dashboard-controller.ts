import { AdminBaseController } from "./base-controller";

export type JobActivityDataPoint = {
  date: string;
  jobCreated: number;
  jobFilled: number;
};

export type DashboardMetrics = {
  revenue: number;
  revenueTrend: number;
  profilesCount: number;
  profilesTrend: number;
  jobsCount: number;
  jobsTrend: number;
  applicationsCount: number;
  applicationsTrend: number;
};

export type JobActivityParams = {
  range?: "90d" | "30d" | "7d";
};

export type JobStatusDataPoint = {
  status: string;
  count: number;
};

export class AdminDashboardController extends AdminBaseController {
  async getMetrics(): Promise<DashboardMetrics> {
    const url = this.createURL(
      "/admin/dashboard/metrics",
      new URLSearchParams(),
    );
    return this.get<DashboardMetrics>(url);
  }

  async getJobActivity(
    params: JobActivityParams,
  ): Promise<JobActivityDataPoint[]> {
    const searchParams: Record<string, unknown> = {};
    if (params.range) searchParams.range = params.range;

    const query = this.buildSearchParams(searchParams);
    const url = this.createURL("/admin/dashboard/job-activity", query);
    return this.get<JobActivityDataPoint[]>(url);
  }

  async getJobStatusDistribution(
    params: JobActivityParams,
  ): Promise<JobStatusDataPoint[]> {
    const searchParams: Record<string, unknown> = {};
    if (params.range) searchParams.range = params.range;

    const query = this.buildSearchParams(searchParams);
    const url = this.createURL("/admin/dashboard/job-status-distribution", query);
    return this.get<JobStatusDataPoint[]>(url);
  }
}

const controller = new AdminDashboardController();
export const getMetrics = controller.getMetrics.bind(controller);
export const getJobActivity = controller.getJobActivity.bind(controller);
export const getJobStatusDistribution = controller.getJobStatusDistribution.bind(controller);
