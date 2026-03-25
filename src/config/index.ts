/**
 * App configuration (env, constants, feature flags).
 * Extend as needed for admin-specific config.
 */

export const appConfig = {
  appName: "Rabotka Admin",
  apiUrl: "/api/v1",
  defaultPaginationLimit: 12,
  defaultRecentPageSize: 8,
} as const;
