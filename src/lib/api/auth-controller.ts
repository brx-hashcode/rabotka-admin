import { AdminBaseController } from "./base-controller";


/** Seniority ladder: each one implies everything below it. */
export type HierarchicalRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "MANAGER"
  | "MODERATOR";

/**
 * Roles outside the ladder. They are not "more" or "less" than a MODERATOR —
 * they own a specific area of the product and nothing else.
 */
export type LateralRole = "FINANCE" | "SUPPORT";

export type AdminRole = HierarchicalRole | LateralRole;

export type Admin = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: AdminRole;
  phonePairedAt: string | null;
  phoneName: string | null;
  totpEnabled: boolean;
};

export type SendOTPResponse = {
  success: boolean;
  message?: string;
};

export type VerifyOTPResponse = {
  success: boolean;
  totpRequired?: boolean;
  pendingToken?: string;
};

export class AdminAuthController extends AdminBaseController {
  async sendOTP(email: string): Promise<SendOTPResponse> {
    try {
      return await this.post<SendOTPResponse>("/auth/admin/send-otp", { email });
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async verifyOTP(email: string, otp: string): Promise<VerifyOTPResponse> {
    try {
      return await this.post<VerifyOTPResponse>("/auth/admin/verify-otp", {
        email,
        otp,
      });
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async totpLogin(
    pendingToken: string,
    code: string,
  ): Promise<{ success: boolean }> {
    try {
      return await this.post("/auth/admin/totp/login", { pendingToken, code });
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async totpSetup(): Promise<{ secret: string; qrDataUrl: string }> {
    try {
      return await this.post("/auth/admin/totp/setup", {});
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async totpEnable(code: string): Promise<{ success: boolean }> {
    try {
      return await this.post("/auth/admin/totp/enable", { code });
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async totpDisable(code: string): Promise<{ success: boolean }> {
    try {
      return await this.post("/auth/admin/totp/disable", { code });
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async getMe(): Promise<Admin> {
    try {
      return await this.get<Admin>("/auth/admin/me");
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async updateMe(data: { firstName: string; lastName: string }): Promise<Admin> {
    try {
      return await this.patch<Admin>("/auth/admin/me", data);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async logout(): Promise<{ success: boolean }> {
    try {
      return await this.post<{ success: boolean }>("/auth/admin/logout", {});
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async initQrSession(): Promise<{
    sessionId: string;
    consumeNonce: string;
    qrUrl: string;
    expiresIn: number;
  }> {
    try {
      return await this.post("/auth/admin/qr/init", {});
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async pollQrSession(
    sessionId: string,
  ): Promise<{ status: "pending" | "confirmed" | "expired" }> {
    try {
      return await this.get(`/auth/admin/qr/poll/${sessionId}`);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async consumeQrSession(sessionId: string, consumeNonce: string): Promise<{ success: boolean; totpRequired?: boolean; pendingToken?: string }> {
    try {
      return await this.post("/auth/admin/qr/consume", { sessionId, consumeNonce });
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async confirmQrSessionFromPhone(
    sessionId: string,
  ): Promise<{ success: boolean }> {
    try {
      return await this.post("/auth/admin/qr/confirm", { sessionId });
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async unpairPhone(): Promise<{ success: boolean }> {
    try {
      return await this.delete("/auth/admin/phone/pair");
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async generatePhonePairingOtp(phoneName: string): Promise<{
    otp: string;
    expiresIn: number;
    userId: string;
  }> {
    try {
      return await this.post("/auth/admin/phone/pair/generate", { phoneName });
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async verifyPhonePairingOtp(
    userId: string,
    otp: string,
  ): Promise<{ success: boolean }> {
    try {
      return await this.post("/auth/admin/phone/pair/verify", { userId, otp });
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }
}

const controller = new AdminAuthController();

export const {
  sendOTP,
  verifyOTP,
  totpLogin,
  totpSetup,
  totpEnable,
  totpDisable,
  getMe,
  updateMe,
  logout,
  initQrSession,
  pollQrSession,
  consumeQrSession,
  confirmQrSessionFromPhone,
  unpairPhone,
  generatePhonePairingOtp,
  verifyPhonePairingOtp,
} = controller;
