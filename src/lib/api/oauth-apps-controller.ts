import { AdminBaseController } from "./base-controller";

export type OAuthAppStatus = "ACTIVE" | "SUSPENDED";

export type OAuthApp = {
  id: string;
  name: string;
  description: string;
  logoUrl: string | null;
  clientId: string;
  /**
   * Last four characters of the current secret. The secret itself is stored as
   * a hash and cannot be read back by anyone — this is only here so an admin
   * can tell which one a partner is using.
   */
  clientSecretHint: string;
  secretRotatedAt: string | null;
  /** Non-null while a rotated-out secret is still inside its grace window. */
  previousSecretExpiresAt: string | null;
  redirectUris: string[];
  allowedScopes: string[];
  status: OAuthAppStatus;
  contactEmail: string;
  createdBy: string | null;
  /** How many Rabotka users have signed in to this application. */
  userCount: number;
  createdAt: string;
};

/**
 * The only shape that ever carries a secret, and only in the response to
 * creating or rotating one. There is no endpoint that reads a secret back.
 */
export type MintedSecret = {
  clientId: string;
  clientSecret: string;
  warning: string;
};

export type CreateOAuthAppPayload = {
  name: string;
  description: string;
  contactEmail: string;
  logoUrl?: string;
  redirectUris: string[];
  allowedScopes?: string[];
};

export type UpdateOAuthAppPayload = Partial<CreateOAuthAppPayload>;

class OAuthAppsController extends AdminBaseController {
  async list(): Promise<OAuthApp[]> {
    const url = this.createURL("/admin/oauth-apps", new URLSearchParams());
    return this.get<OAuthApp[]>(url);
  }

  /** The scope catalogue, served by the API so this UI never forks its own. */
  async scopes(): Promise<{ scopes: string[] }> {
    const url = this.createURL(
      "/admin/oauth-apps/scopes",
      new URLSearchParams(),
    );
    return this.get<{ scopes: string[] }>(url);
  }

  async create(payload: CreateOAuthAppPayload): Promise<MintedSecret> {
    const url = this.createURL("/admin/oauth-apps", new URLSearchParams());
    return this.post<MintedSecret>(url, payload);
  }

  async update(id: string, payload: UpdateOAuthAppPayload): Promise<OAuthApp> {
    const url = this.createURL(
      `/admin/oauth-apps/${id}`,
      new URLSearchParams(),
    );
    return this.patch<OAuthApp>(url, payload);
  }

  async rotateSecret(id: string): Promise<MintedSecret> {
    const url = this.createURL(
      `/admin/oauth-apps/${id}/rotate-secret`,
      new URLSearchParams(),
    );
    return this.post<MintedSecret>(url, {});
  }

  /** Ends the 24h grace window now, for a secret believed to be leaked. */
  async revokePreviousSecret(id: string): Promise<{ success: boolean }> {
    const url = this.createURL(
      `/admin/oauth-apps/${id}/revoke-previous-secret`,
      new URLSearchParams(),
    );
    return this.post<{ success: boolean }>(url, {});
  }

  async suspend(id: string): Promise<{ success: boolean }> {
    const url = this.createURL(
      `/admin/oauth-apps/${id}/suspend`,
      new URLSearchParams(),
    );
    return this.post<{ success: boolean }>(url, {});
  }

  async reactivate(id: string): Promise<{ success: boolean }> {
    const url = this.createURL(
      `/admin/oauth-apps/${id}/reactivate`,
      new URLSearchParams(),
    );
    return this.post<{ success: boolean }>(url, {});
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const url = this.createURL(
      `/admin/oauth-apps/${id}`,
      new URLSearchParams(),
    );
    return this.delete<{ success: boolean }>(url);
  }
}

const controller = new OAuthAppsController();

export const listOAuthApps = controller.list.bind(controller);
export const listOAuthScopes = controller.scopes.bind(controller);
export const createOAuthApp = controller.create.bind(controller);
export const updateOAuthApp = controller.update.bind(controller);
export const rotateOAuthAppSecret = controller.rotateSecret.bind(controller);
export const revokePreviousOAuthSecret =
  controller.revokePreviousSecret.bind(controller);
export const suspendOAuthApp = controller.suspend.bind(controller);
export const reactivateOAuthApp = controller.reactivate.bind(controller);
export const deleteOAuthApp = controller.remove.bind(controller);
