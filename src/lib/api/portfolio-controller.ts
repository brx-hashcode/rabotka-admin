import { AdminBaseController } from "./base-controller";

export type AdminPortfolioImage = {
  id: string;
  imageUrl: string;
  position: number;
};

export type AdminPortfolioItem = {
  id: string;
  /** Null on an images-only publication. Publications have no title. */
  description: string | null;
  position: number;
  createdAt: string;
  images: AdminPortfolioImage[];
};

export type AdminUpdatePortfolioItemParams = {
  /** An empty string clears the text, leaving an images-only publication. */
  description?: string;
};

export class AdminPortfolioController extends AdminBaseController {
  async getPortfolio(profileId: string): Promise<AdminPortfolioItem[]> {
    const url = this.createURL(
      `/admin/profiles/${profileId}/portfolio`,
      new URLSearchParams(),
    );
    return this.get<AdminPortfolioItem[]>(url);
  }

  async updatePortfolioItem(
    profileId: string,
    itemId: string,
    data: AdminUpdatePortfolioItemParams,
  ): Promise<AdminPortfolioItem> {
    const url = this.createURL(
      `/admin/profiles/${profileId}/portfolio/${itemId}`,
      new URLSearchParams(),
    );
    return this.patch<AdminPortfolioItem>(url, data);
  }

  async deletePortfolioItem(
    profileId: string,
    itemId: string,
  ): Promise<{ success: boolean }> {
    const url = this.createURL(
      `/admin/profiles/${profileId}/portfolio/${itemId}`,
      new URLSearchParams(),
    );
    return this.delete<{ success: boolean }>(url);
  }

  async deletePortfolioImage(
    profileId: string,
    itemId: string,
    imageId: string,
  ): Promise<{ success: boolean }> {
    const url = this.createURL(
      `/admin/profiles/${profileId}/portfolio/${itemId}/images/${imageId}`,
      new URLSearchParams(),
    );
    return this.delete<{ success: boolean }>(url);
  }
}

const controller = new AdminPortfolioController();
export const getProfilePortfolio =
  controller.getPortfolio.bind(controller);
export const updatePortfolioItem =
  controller.updatePortfolioItem.bind(controller);
export const deletePortfolioItem =
  controller.deletePortfolioItem.bind(controller);
export const deletePortfolioImage =
  controller.deletePortfolioImage.bind(controller);
