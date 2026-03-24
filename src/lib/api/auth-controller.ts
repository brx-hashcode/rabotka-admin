import { AdminBaseController } from "./base-controller";

export type AdminRole = "ADMIN" | "SUPER_ADMIN";

export type Admin = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: AdminRole;
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
    }
  }

  async getMe(): Promise<Admin> {
    try {
      return await this.get<Admin>("/auth/admin/me");
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateMe(data: { firstName: string; lastName: string }): Promise<Admin> {
    try {
      return await this.patch<Admin>("/auth/admin/me", data);
    } catch (error) {
      this.handleError(error);
    }
  }

  async logout(): Promise<{ success: boolean }> {
    try {
      return await this.post<{ success: boolean }>("/auth/admin/logout", {});
    } catch (error) {
      this.handleError(error);
    }
  }
}

const controller = new AdminAuthController();

export const { sendOTP, verifyOTP, getMe, updateMe, logout } = controller;
