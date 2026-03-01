import type { TableHeaderToolbarFilterOption } from "#/components/table";
import type { Profile } from "./profile-columns";

export const statusOptions: readonly TableHeaderToolbarFilterOption[] = [
  { value: "Backlog", label: "Backlog" },
  { value: "Todo", label: "Todo" },
  { value: "In Progress", label: "In Progress" },
  { value: "Done", label: "Done" },
  { value: "Canceled", label: "Canceled" },
] as const;

export const priorityOptions: readonly TableHeaderToolbarFilterOption[] = [
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
] as const;


export const whatsappStatusOptions: readonly TableHeaderToolbarFilterOption[] = [
  { value: "Connected", label: "Connected" },
  { value: "Disconnected", label: "Disconnected" },
] as const;

export const mockProfiles: readonly Profile[] = [
  { id: "TASK-8782", title: "Documentation: Update API reference", status: "In Progress", priority: "Medium" },
  { id: "TASK-7878", title: "Bug: Fix login redirect loop", status: "Backlog", priority: "Medium" },
  { id: "TASK-7839", title: "Feature: Add export to CSV", status: "Todo", priority: "High" },
  { id: "TASK-5562", title: "Documentation: Add onboarding guide", status: "Backlog", priority: "Medium" },
  { id: "TASK-8686", title: "Feature: Dark mode support", status: "Canceled", priority: "Medium" },
  { id: "TASK-1280", title: "Bug: Resolve memory leak in chart", status: "Done", priority: "High" },
  { id: "TASK-7262", title: "Feature: Profile settings page", status: "Done", priority: "High" },
  { id: "TASK-1138", title: "Documentation: API changelog", status: "In Progress", priority: "Medium" },
  { id: "TASK-7184", title: "Feature: Batch actions", status: "Todo", priority: "Low" },
  { id: "TASK-5160", title: "Bug: Table sorting edge case", status: "In Progress", priority: "High" },
];
