import { AdminBaseController } from "./base-controller";

export type OAuthAppStatus = "ACTIVE" | "SUSPENDED";

export type OAuthApp = {
  id: string;
  name: string;
  description: string;
  logoUrl: string | null;
  clientId: string;
  /**
   * Last four characters of the current secret. For a real application the
   * secret itself is stored as a hash and cannot be read back by anyone, so
   * this is the only way to tell which one a partner is using. A SANDBOX app
   * is the exception — see `canCopySecret`.
   */
  clientSecretHint: string;
  /**
   * Whether this app's secret can be read back, which is true only for a
   * sandbox app that has one stored.
   *
   * Optional because a bundle can outlive the backend it talks to: against an
   * older API this is `undefined` and the card renders exactly as it did
   * before. Not derivable from `isSandbox` alone — a sandbox app registered
   * before the server started keeping the plaintext is `isSandbox: true` with
   * nothing to copy, and that is the "rotate once to enable" case.
   */
  canCopySecret?: boolean;
  secretRotatedAt: string | null;
  /** Non-null while a rotated-out secret is still inside its grace window. */
  previousSecretExpiresAt: string | null;
  redirectUris: string[];
  allowedScopes: string[];
  status: OAuthAppStatus;
  /**
   * A sandbox application: it signs in only the two hardcoded Rabotka sandbox
   * users, with a fixed code, and never a real person. Set once at
   * registration — there is no endpoint that changes it.
   */
  isSandbox: boolean;
  contactEmail: string;
  createdBy: string | null;
  /**
   * How many Rabotka users are currently signed in to this application.
   *
   * Live consents only — somebody who has revoked the app is not counted, which
   * is the number an admin is actually reading this for. Always 0 for a sandbox
   * app, which writes no consent records at all.
   */
  userCount: number;
  /** Most recent token exchange across those consents, or null if never used. */
  lastUsedAt: string | null;
  createdAt: string;
};

/** The two sandbox users and their fixed code, as the API publishes them. */
export type SandboxUsers = {
  otp: string;
  users: { phone: string; name: string; rabotkaVerified: boolean }[];
};

/**
 * A newly MINTED secret, from creating an app or rotating its key. Shown once
 * and then unrecoverable, which is what `SecretRevealDialog`'s acknowledgement
 * flow exists for.
 */
export type MintedSecret = {
  clientId: string;
  clientSecret: string;
  warning: string;
};

/**
 * A sandbox secret read back from storage.
 *
 * Deliberately WITHOUT a `warning` field, so it is structurally distinct from
 * `MintedSecret` and cannot be handed to `SecretRevealDialog` — that dialog
 * says "copy it now, it will never be shown again", which is false here.
 */
export type SandboxSecret = {
  clientId: string;
  clientSecret: string;
};

export type CreateOAuthAppPayload = {
  name: string;
  description: string;
  contactEmail: string;
  logoUrl?: string;
  redirectUris: string[];
  allowedScopes?: string[];
  isSandbox?: boolean;
};

/**
 * `isSandbox` is deliberately not updatable. The API rejects a PATCH carrying
 * it outright, so it is omitted here rather than left to be discovered at
 * runtime.
 */
export type UpdateOAuthAppPayload = Partial<
  Omit<CreateOAuthAppPayload, "isSandbox">
>;

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

  /** The sandbox users, served by the API for the same reason as the scopes. */
  async sandboxUsers(): Promise<SandboxUsers> {
    const url = this.createURL(
      "/admin/oauth-apps/sandbox-users",
      new URLSearchParams(),
    );
    return this.get<SandboxUsers>(url);
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

  /**
   * Reads a SANDBOX app's secret back. Refused for every real application.
   *
   * Fetched on demand rather than carried in the list: the server writes an
   * audit row per read, so this must happen once per click and not on every
   * page load.
   */
  async readSandboxSecret(id: string): Promise<SandboxSecret> {
    const url = this.createURL(
      `/admin/oauth-apps/${id}/secret`,
      new URLSearchParams(),
    );
    return this.get<SandboxSecret>(url);
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
export const listSandboxUsers = controller.sandboxUsers.bind(controller);
export const createOAuthApp = controller.create.bind(controller);
export const updateOAuthApp = controller.update.bind(controller);
export const rotateOAuthAppSecret = controller.rotateSecret.bind(controller);
export const readSandboxAppSecret =
  controller.readSandboxSecret.bind(controller);
export const revokePreviousOAuthSecret =
  controller.revokePreviousSecret.bind(controller);
export const suspendOAuthApp = controller.suspend.bind(controller);
export const reactivateOAuthApp = controller.reactivate.bind(controller);
export const deleteOAuthApp = controller.remove.bind(controller);
