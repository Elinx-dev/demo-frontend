import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/auth/authService";
import type { UserRole } from "@/domain/enums/UserRole";

export type AuthUser = {
  role: UserRole;
  persona: string;
  authUserId?: number;
  authUserName?: string;
  phoneNumber?: string | null;
  tenantId?: number;
  roleId?: number;
  roleName?: string;
  parentTenantId?: number | null;
};

type VerifyOtpResult = any;

type AuthContextType = {
  isAuthenticated: boolean;
  isOtpVerified: boolean;
  user: AuthUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<any>;
  verifyOtp: (otp: string) => Promise<VerifyOtpResult>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const toNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

const unwrapResponse = (resp: any) => resp?.data?.data ?? resp?.data ?? resp;

const isVerifySuccess = (result: any): boolean => {
  if (typeof result === "boolean") return result;

  const payload = unwrapResponse(result);

  if (typeof payload === "boolean") return payload;
  if (payload?.status === "success") return true;
  if (payload?.data?.status === "success") return true;
  if (payload?.success === true && payload?.data?.status !== "error")
    return true;

  return false;
};

const normalizeIdentity = (input: any) => {
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

const buildAuthUser = (
  identity: ReturnType<typeof normalizeIdentity>,
): AuthUser | null => {
  if (!identity) return null;

  return {
    role: ((identity.roleName as unknown) ?? "Default Role") as UserRole,
    persona: identity.roleName ?? identity.authUserName ?? "Authenticated User",
    authUserId: identity.authUserId,
    authUserName: identity.authUserName,
    phoneNumber: identity.phoneNumber,
    tenantId: identity.tenantId,
    roleId: identity.roleId,
    roleName: identity.roleName,
    parentTenantId: identity.parentTenantId,
  };
};

const persistVerifyIdentity = (
  identity: ReturnType<typeof normalizeIdentity>,
) => {
  if (!identity) return;
  sessionStorage.setItem("verifyOtpResponse", JSON.stringify(identity));
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setAuth] = useState(false);
  const [isOtpVerified, setOtpVerified] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    authService.restoreSession();
    setAuth(authService.isAuthenticated());
    setOtpVerified(authService.isOtpVerified());

    const restoredUser =
      (authService.getSession?.() as AuthUser | null) ??
      buildAuthUser(
        normalizeIdentity(
          sessionStorage.getItem("verifyOtpResponse")
            ? JSON.parse(sessionStorage.getItem("verifyOtpResponse") as string)
            : null,
        ),
      );

    setUser(restoredUser ?? null);
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const response = await authService.login(username, password);
    const isKycVerified = response?.isKycVerified;
    console.log("Login response:", response?.isKycVerified);
    if (isKycVerified !== undefined) {
      localStorage.setItem("isKycVerified", JSON.stringify(isKycVerified));
    }

    setAuth(true);
    setOtpVerified(false);
    setUser((authService.getSession?.() as AuthUser | null) ?? null);
    return response;
  };
  const verifyOtp = async (otp: string): Promise<VerifyOtpResult> => {
    const result = await authService.verifyOtp(otp);
    const ok = isVerifySuccess(result);
    const identity = normalizeIdentity(result);

    if (identity) {
      persistVerifyIdentity(identity);
      const authUser = buildAuthUser(identity);
      if (authUser) setUser(authUser);
    } else {
      const serviceSession = authService.getSession?.() as AuthUser | null;
      if (serviceSession) setUser(serviceSession);
    }

    if (ok) {
      setOtpVerified(true);
      setAuth(true);
    }

    return result;
  };

  const logout = () => {
    authService.logout();
    sessionStorage.removeItem("verifyOtpResponse");
    sessionStorage.removeItem("ipc_post_login_bootstrap");
    sessionStorage.removeItem("ipc_login_identity");
    setAuth(false);
    setOtpVerified(false);
    setUser(null);
    navigate("/login", { replace: true });
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isOtpVerified,
        user,
        isLoading,
        login,
        verifyOtp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};
