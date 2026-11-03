import { AdminBaseController } from "./base-controller";

/**
 * One day of jobs posted, split by the status those jobs are in TODAY (the
 * server keeps no status history to say what happened on that day).
 */
export type JobActivityDataPoint = {
  date: string;
  jobCreated: number;
  byStatus: Record<
    | "ACTIVE"
    | "PARTIALLY_FILLED"
    | "FILLED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED"
    | "EXPIRED",
    number
  >;
};

export type DashboardMetrics = {
  /**
   * Distinct employer↔worker pairs where the employer paid to make contact —
   * the same figure the Network graph draws as a "Contact payé" edge.
   */
  connectionsCount: number;
  connectionsTrend: number | null;
  assignmentsCount: number;
  assignmentsTrend: number | null;
  profilesCount: number;
  profilesTrend: number | null;
  jobsCount: number;
  jobsTrend: number | null;
  applicationsCount: number;
  applicationsTrend: number | null;
  /**
   * How many arrived in the last 30 days and in the 30 days before. What the
   * cards show next to the all-time totals. Absent from an older server.
   */
  last30Days?: Record<
    "connections" | "assignments" | "profiles" | "jobs" | "applications",
    PeriodCounts
  >;
};

export type PeriodCounts = { current: number; previous: number };

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
