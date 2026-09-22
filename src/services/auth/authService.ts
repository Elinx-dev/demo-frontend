// src/services/auth/authService.ts

import { UserRole } from "@/domain/enums/UserRole";
import { SecureStorage } from "../storage";
import { apiService } from "../api";
import { clearPermissionCache } from "@/hooks/usePermissions";

export type AuthSession = {
  role: UserRole;
  persona: string;
  userId?: string;
  authUserId?: number;
  authUserName?: string;
  phoneNumber?: string | null;
  tenantId?: number;
  roleId?: number;
  roleName?: string;
  parentTenantId?: number | null;
  uiMode: string | null;
  roleScope: "PLATFORM" | "USER" | null;
  designation: "super_admin" | "manager" | "analyst" | null;
  permissions: string[];
};

const AUTH_KEY = "auth.session";
const OTP_KEY = "auth.otp";
const OTP_METADATA_KEY = "auth.otpmetadata";
const OTP_VERIFIED_KEY = "auth.otp.verified";
const AUTH_ROLE_KEY = "auth.role";
const AUTH_MENU_KEY = "auth.menu";
const AUTH_TENANT_ID_KEY = "auth.tenantId";
const AUTH_CONTROL_KEY = "auth.control";

function extractControlIds(menuData: any[]): number[] {
  const ids: number[] = [];
  const traverse = (items: any[]) => {
    if (!Array.isArray(items)) return;
    items.forEach((item) => {
      if (Array.isArray(item.permissions)) {
        item.permissions.forEach((p: any) => {
          if (p && typeof p.controlId === "number") {
            ids.push(p.controlId);
          }
        });
      }
      if (Array.isArray(item.subMenu)) {
        traverse(item.subMenu);
      }
    });
  };
  traverse(menuData);
  return [...new Set(ids)];
}

const toNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

const unwrapResponse = (resp: any) => resp?.data?.data ?? resp?.data ?? resp;

const normalizeVerifyIdentity = (input: any) => {
  if (!input || typeof input !== "object") return null;

  const candidate =
    input?.data && typeof input.data === "object" ? input.data : input;

  const nestedData =
    candidate?.data && typeof candidate.data === "object"
      ? candidate.data
      : candidate;

  const source = nestedData;

  const identity = {
    authUserId: toNumber(
      source.authUserId ??
        source.auth_user_id ??
        source.userId ??
        source.user_id ??
        source.id,
    ),
    authUserName:
      source.authUserName ??
      source.auth_user_name ??
      source.sessionUserId ??
      source.username ??
      source.userName,
    phoneNumber: source.phoneNumber ?? source.phone_number ?? null,
    tenantId: toNumber(source.tenantId ?? source.tenant_id),
    roleId: toNumber(source.roleId ?? source.role_id),
    roleName: source.roleName ?? source.role_name ?? source.type,
    parentTenantId: toNumber(
      source.parentTenantId ?? source.parent_tenant_id,
    ) as number | undefined,
  };

  if (
    identity.authUserId === undefined &&
    identity.tenantId === undefined &&
    !identity.authUserName &&
    !identity.phoneNumber
  ) {
    return null;
  }

  return identity;
};

const mapRole = (roleName?: string): UserRole => {
  const normalized = (roleName ?? "").toLowerCase().trim();

  if (
    normalized === "super admin" ||
    normalized === "platform admin" ||
    normalized === "default role"
  ) {
    return UserRole.PlatformAdmin;
  }

  return UserRole.Operator;
};

export const authService = {
  async login(username: string, password: string): Promise<any> {
    const FCM_Token = localStorage.getItem("FCM Token");

    if (!username || !password) {
      throw new Error("Invalid credentials");
    }

    try {
      const response = await apiService.callEndpoint<any>("login", {
        data: {
          authUserName: username,
          password,
          FCM_Token,
        },
      });

      const payloadData = response?.data;

      if (response?.isSuccess || payloadData?.isLoginSuccess) {
        // Persist JWT from login response (if present) and set on apiService
        const jwtToken =
          payloadData?.jwt ??
          payloadData?.data?.jwt ??
          payloadData?.data?.data?.jwt ??
          null;
        if (jwtToken) {
          try {
            localStorage.setItem("auth.jwt", jwtToken);
          } catch {
            /* ignore storage errors */
          }
          apiService.setAuthToken(String(jwtToken));
        }
        const otp =
          payloadData?.otpInfo?.otp_code ||
          Math.floor(100000 + Math.random() * 900000).toString();
        const expiresInMinutes = payloadData?.otpInfo?.expires_in_minutes || 5;
        const authRole = payloadData?.roleName;
        const tenantId = payloadData?.tenantId;
        const uiMode = payloadData?.uiMode;
        const roleScope = payloadData?.roleScope;
        const designation = payloadData?.designation;
        const permissions: string[] = payloadData?.permissions ?? [];

        SecureStorage.set(OTP_KEY, otp, expiresInMinutes * 60_000);
        SecureStorage.set(AUTH_ROLE_KEY, authRole);
        SecureStorage.set(AUTH_TENANT_ID_KEY, tenantId);

        if (payloadData?.otpInfo) {
          SecureStorage.set(
            OTP_METADATA_KEY,
            payloadData.otpInfo,
            expiresInMinutes * 60_000,
          );
        }

        SecureStorage.set<AuthSession>(AUTH_KEY, {
          role: mapRole(authRole),
          persona: "internal",
          userId: username,
          authUserName: username,
          tenantId,
          roleName: authRole,
          uiMode: uiMode ?? null,
          roleScope: roleScope ?? null,
          designation: designation ?? null,
          permissions,
        });

        apiService.setSessionUser(username);

        return payloadData;
      } else {
        throw new Error("Invalid Credentials");
      }
    } catch (error: any) {
      throw new Error(error.message || "Login failed");
    }
  },

  async verifyOtp(otp: string): Promise<any> {
    try {
      const session = this.getSession();
      const username = session?.authUserName || session?.userId || "";
      const otpMetadata = SecureStorage.get<any>(OTP_METADATA_KEY);

      const response = await apiService.callEndpoint<any>("verify_otp", {
        data: {
          authUserName: username,
          otp_code: otp,
          otp_id: otpMetadata?.otp_id,
        },
      });

      const payload = unwrapResponse(response);
      //alert(JSON.stringify(payload));
      const verifyStatus = payload?.status ?? payload?.data?.status;
      const identity = normalizeVerifyIdentity(payload);

      if (
        verifyStatus === true ||
        identity?.authUserName ||
        identity?.authUserId
      ) {
        //alert(JSON.stringify(identity));
        SecureStorage.remove(OTP_KEY);
        SecureStorage.remove(OTP_METADATA_KEY);
        SecureStorage.set(OTP_VERIFIED_KEY, true);

        const tokenToSet =
          payload?.token ||
          payload?.accessToken ||
          payload?.data?.token ||
          payload?.data?.accessToken ||
          null;

        if (tokenToSet) {
          apiService.setAuthToken(tokenToSet);
        }

        if (identity) {
          const existingSession = SecureStorage.get<AuthSession>(AUTH_KEY);
          const nextSession: AuthSession = {
            role: mapRole(identity.roleName ?? session?.roleName),
            persona: session?.persona ?? "internal",
            userId: identity.authUserName ?? session?.userId,
            authUserId: identity.authUserId,
            authUserName: identity.authUserName ?? session?.authUserName,
            phoneNumber: identity.phoneNumber,
            tenantId: identity.tenantId,
            roleId: identity.roleId,
            roleName: identity.roleName,
            parentTenantId: identity.parentTenantId,
            uiMode: existingSession?.uiMode ?? null,
            roleScope: existingSession?.roleScope ?? null,
            designation: existingSession?.designation ?? null,
            permissions: existingSession?.permissions ?? [],
          };

          SecureStorage.set<AuthSession>(AUTH_KEY, nextSession);
          SecureStorage.set(AUTH_ROLE_KEY, identity.roleName ?? "");
          SecureStorage.set(AUTH_TENANT_ID_KEY, identity.tenantId ?? 0);
          sessionStorage.setItem("verifyOtpResponse", JSON.stringify(identity));

          if (identity.authUserName) {
            apiService.setSessionUser(identity.authUserName);
          }
        }

        // Intentionally do NOT fetch get_user_menu here.
        // Post-login routing/bootstrap is handled by OtpPage for tenant > 1.
        // Platform/default tenants (0/1) will continue with their normal route flow.
        return payload;
      }

      throw new Error(
        payload?.message || payload?.error_msg || "Invalid or expired OTP",
      );
    } catch (error: any) {
      throw new Error(error.message || "OTP verification failed");
    }
  },

  getSession(): AuthSession | null {
    return SecureStorage.get<AuthSession>(AUTH_KEY);
  },

  getVerifyOtpResult(): any | null {
    const raw = sessionStorage.getItem("verifyOtpResponse");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return SecureStorage.get<AuthSession>(AUTH_KEY) !== null;
  },

  isOtpVerified(): boolean {
    return SecureStorage.get<boolean>(OTP_VERIFIED_KEY) == true;
  },

  logout(): void {
    clearPermissionCache();
    apiService.setAuthToken(null);
    apiService.setSessionUser(null);
    SecureStorage.clear();
    sessionStorage.removeItem("verifyOtpResponse");
    sessionStorage.removeItem("ipc_post_login_bootstrap");
    sessionStorage.removeItem("ipc_login_identity");
    // localStorage.removeItem("uiMode");
    localStorage.removeItem("auth.tenantProfileId");
    localStorage.removeItem("auth.ownerAuthUserId");
    try {
      localStorage.removeItem("auth.jwt");
    } catch {
      // ignore
    }
    import("@/ui-policy").then((m) => m.resetControls());
  },

  restoreSession(): void {
    const session = SecureStorage.get<AuthSession>(AUTH_KEY);
    if (session?.authUserName || session?.userId) {
      apiService.setSessionUser(session.authUserName ?? session.userId ?? null);
    }

    const token = SecureStorage.get<string>("auth.token");
    if (token) {
      apiService.setAuthToken(token);
    }

    const menuData = SecureStorage.get<any[]>(AUTH_MENU_KEY);
    const existingControls = SecureStorage.get<number[]>(AUTH_CONTROL_KEY);

    if (menuData && (!existingControls || existingControls.length === 0)) {
      const restored = extractControlIds(menuData);
      SecureStorage.set(AUTH_CONTROL_KEY, restored);
    }
  },

  getOtp(): string | null {
    return SecureStorage.get<string>(OTP_KEY) ?? null;
  },

  getTenantId(): number {
    return SecureStorage.get<number>(AUTH_TENANT_ID_KEY) ?? 0;
  },
  getAuthUserId(): number | null {
    return SecureStorage.get<AuthSession>(AUTH_KEY)?.authUserId ?? null;
  },

  getOtpMetadata(): any | null {
    return SecureStorage.get<any>(OTP_METADATA_KEY) ?? null;
  },
};
