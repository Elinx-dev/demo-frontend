import type { UserRole } from "@/domain/enums/UserRole";

/* =========================
 * Auth Domain Types
 * =======================*/

/**
 * AuthSession
 * -----------
 * Canonical representation of an authenticated user
 * inside the frontend runtime.
 *
 * This is what AuthContext exposes to the UI.
 */
export type AuthSession = {
    role: UserRole;
    persona: string;
    permissions: string[];
};

/**
 * LoginRequest
 * ------------
 * Payload sent to auth service during login.
 * (Mock now, API-ready later)
 */
export type LoginRequest = {
    username: string;
    password: string;
};

/**
 * OtpVerifyRequest
 * ----------------
 * OTP verification payload.
 */
export type OtpVerifyRequest = {
    otp: string;
};

/**
 * AuthStatus
 * ----------
 * Lightweight auth state flags.
 * Useful for guards, bootstrapping, and tests.
 */
export type AuthStatus = {
    isAuthenticated: boolean;
    isOtpVerified: boolean;
};

/**
 * AuthServiceContract
 * -------------------
 * Formal contract for auth service.
 * Allows swapping mock → real API
 * without touching AuthContext.
 */
export type AuthServiceContract = {
    login: (req: LoginRequest) => void;
    verifyOtp: (req: OtpVerifyRequest) => boolean;
    getSession: () => AuthSession | null;
    logout: () => void;
    isAuthenticated: () => boolean;
    isOtpVerified: () => boolean;
};
