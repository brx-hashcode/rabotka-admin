import { AdminBaseController } from "./base-controller";

export const PHONE_TOKEN_KEY = "admin_phone_token";

export type AdminRole = "ADMIN" | "SUPER_ADMIN" | "MANAGER" | "MODERATOR";

export type Admin = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: AdminRole;
  phonePairedAt: string | null;
  phoneName: string | null;
};

export type SendOTPResponse = {
  success: boolean;
  message?: string;
};

export type VerifyOTPResponse = {
  success: boolean;
  message?: string;
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

  async consumeQrSession(sessionId: string): Promise<{ success: boolean }> {
    try {
      return await this.post("/auth/admin/qr/consume", { sessionId });
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async confirmQrSessionFromPhone(
    sessionId: string,
    phoneToken: string,
  ): Promise<{ success: boolean }> {
    try {
      return await this.post("/auth/admin/qr/confirm", {
        sessionId,
        phoneToken,
      });
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
  ): Promise<{ token: string }> {
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
  getMe,
  updateMe,
  logout,
  initQrSession,
  pollQrSession,
  consumeQrSession,
  confirmQrSessionFromPhone,
  generatePhonePairingOtp,
  verifyPhonePairingOtp,
} = controller;
