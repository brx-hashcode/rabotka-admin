import { AdminBaseController } from "./base-controller";

class MatchingController extends AdminBaseController {
  async reindex(): Promise<{ message: string }> {
    const url = this.createURL("/admin/matching/reindex", new URLSearchParams());
    return this.post<{ message: string }>(url, {});
  }
}

const controller = new MatchingController();
export const reindexMatching = controller.reindex.bind(controller);
