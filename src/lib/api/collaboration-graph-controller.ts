import { AdminBaseController } from "./base-controller";

export type GraphNode = {
  id: string;
  name: string;
  type: "WORKER" | "EMPLOYER";
  avatarUrl: string | null;
  /** Missions actually worked together. */
  collaborations: number;
  /** Applications that never became a mission. */
  applications: number;
  /** Contacts the recruiter paid to unlock. */
  contacts: number;
  /** Distinct counterparties — what the node is sized by. */
  degree: number;
};

export type GraphEdge = {
  source: string;
  target: string;
  collaborations: number;
  applications: number;
  contacts: number;
};

export type CollaborationGraph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: {
    profiles: number;
    edges: number;
    collaborations: number;
    applications: number;
    contacts: number;
    truncated: boolean;
  };
};

export type GraphFilters = {
  minCollaborations?: number;
  includeApplications?: boolean;
  includeContacts?: boolean;
  limit?: number;
};

class AdminCollaborationGraphController extends AdminBaseController {
  async getGraph(filters: GraphFilters = {}): Promise<CollaborationGraph> {
    const params = new URLSearchParams();
    if (filters.minCollaborations != null) {
      params.set("minCollaborations", String(filters.minCollaborations));
    }
    if (filters.includeApplications != null) {
      params.set("includeApplications", String(filters.includeApplications));
    }
    if (filters.includeContacts != null) {
      params.set("includeContacts", String(filters.includeContacts));
    }
    if (filters.limit != null) params.set("limit", String(filters.limit));

    const url = this.createURL("/admin/collaboration-graph", params);
    return this.get<CollaborationGraph>(url);
  }
}

const controller = new AdminCollaborationGraphController();
export const getCollaborationGraph = controller.getGraph.bind(controller);
