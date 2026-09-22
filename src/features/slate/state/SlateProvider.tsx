import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createInitialSlateData, type SlateData } from "../data/slateData";
import { randomPaymentRef } from "../utils/format";
import { defaultStampDutyCode } from "../utils/stampDuty";
import { slateApi, setAuthToken, getAuthToken, SlateApiError } from "../services/apiClient";
import type {
  RegisterDraft,
  SlatePortal,
  SlateUser,
  TxnDraft,
  TxnType,
} from "../types/slate.types";

/** Resolved live from the real backend's /me - role/permission/menu resolution
 * happens server-side from the actual IAM tables, so an IAM-admin edit (Role
 * Mapping, Menu Mapping) takes effect the next time this is refetched, without
 * needing the rest of the app's mock `data` to change. */
interface LiveIdentity {
  role: string;
  jurisdictionId: string | null;
  makerChecker: string | null;
  employeeId: string | null;
  permissions: string[];
  menus: { code: string; label: string; path: string; icon: string }[];
}

interface SlateSession {
  loggedIn: boolean;
  /** True only while restoring a session from a stored token on first load -
   * lets the route tree avoid flashing the login page for an already-valid
   * session, and avoid rendering protected pages before we know for sure. */
  restoring: boolean;
  /** Forced on admin-onboarded staff accounts until they set their own
   * password - the route tree shows a "Set New Password" screen instead of
   * the dashboard while this is true. */
  mustChangePassword: boolean;
  currentUserId: string | null;
  currentPortal: SlatePortal | null;
  officerMode: "maker" | "checker";
  sidebarCollapsed: boolean;
  txnDraft: TxnDraft | null;
  registerDraft: RegisterDraft;
  liveToken: string | null;
  liveIdentity: LiveIdentity | null;
}

const DEFAULT_REGISTER_DRAFT: RegisterDraft = { step: 1, name: "", aadhaar: "", mobile: "", email: "", gender: "", dob: "", address: "", consent: false };

function defaultTxnDraft(ulpin = "", type: TxnType = "sale"): TxnDraft {
  return {
    step: 1,
    ulpin,
    type,
    buyerName: "",
    buyerAadhaar: "",
    price: "",
    giftRelation: "",
    sharePercent: "",
    stampDutyCode: defaultStampDutyCode(type),
    paymentMethod: "upi",
    paymentDone: false,
    paymentRef: "",
    submitted: false,
    witnesses: [{ name: "", address: "" }, { name: "", address: "" }],
  };
}

interface SlateContextValue {
  data: SlateData;
  session: SlateSession;
  currentUser: SlateUser | null;

  /** Checks the live, server-resolved permission set from /me - the
   * authoritative source now that IAM admin edits must take effect without
   * a re-login. Falls back to allow-by-default while /me hasn't resolved
   * yet (e.g. immediately after verifyLoginOtp), so pages don't flash a
   * "no access" state during that brief window. */
  can: (permissionCode: string) => boolean;

  logout: () => void;
  toggleOfficerMode: () => void;
  toggleSidebar: () => void;

  /** Calls the real backend's OTP request endpoint - channel is whatever the
   * caller detected from the identifier's shape (email vs mobile/username).
   * The password is validated server-side before an OTP is even sent. */
  requestLoginOtp: (identifier: string, channel: "mobile" | "email", password: string) => Promise<{ devOtp?: string }>;
  /** Verifies against the real backend, stores the JWT, fetches live role/
   * permission/menu data, and builds the signed-in user entirely from that
   * response - no pre-known mock identity required. */
  verifyLoginOtp: (identifier: string, otp: string) => Promise<void>;

  /** Always requires the current password - see the backend's matching note. */
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateProfile: (patch: { fullName?: string; email?: string; gender?: string; dob?: string; address?: string }) => Promise<void>;

  startTxnDraft: (params?: { ulpin?: string; type?: TxnType }) => void;
  updateTxnDraft: (patch: Partial<TxnDraft>) => void;
  goToInitiateStep: (step: number) => void;
  payForTransaction: () => void;

  updateRegisterDraft: (patch: Partial<RegisterDraft>) => void;
  /** Sends a real registration OTP to the mobile number on the draft. */
  requestRegisterOtp: () => Promise<{ devOtp?: string }>;
  /** Verifies against the real backend - on success this creates the citizen
   * AuthUser server-side (purpose REGISTER), logs them in, and advances the
   * draft to step 3. Throws on incorrect/expired OTP. */
  verifyRegisterOtp: (otp: string, password: string) => Promise<void>;

  uploadProfilePhoto: (dataUrl: string) => Promise<void>;
  removeProfilePhoto: () => Promise<void>;
}

const SlateContext = createContext<SlateContextValue | null>(null);

const IDENTITY_PALETTE = ["#2a5a8c", "#8f6a26", "#5b3fa8", "#b0392f", "#1C7A4E", "#15375c", "#6b4f9e", "#1d6f8c"];

function initialsFor(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U"
  );
}

function colorForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash << 5) - hash + id.charCodeAt(i);
  return IDENTITY_PALETTE[Math.abs(hash) % IDENTITY_PALETTE.length];
}

export function SlateProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SlateData>(() => createInitialSlateData());
  const [session, setSession] = useState<SlateSession>({
    loggedIn: false,
    restoring: !!getAuthToken(),
    mustChangePassword: false,
    currentUserId: null,
    currentPortal: null,
    officerMode: "maker",
    sidebarCollapsed: false,
    txnDraft: null,
    registerDraft: { ...DEFAULT_REGISTER_DRAFT },
    liveToken: null,
    liveIdentity: null,
  });

  const currentUser = session.currentUserId ? data.users[session.currentUserId] ?? null : null;

  // Restore a session from a stored token on first load (e.g. after a page
  // refresh) - without this, a perfectly valid token would still bounce the
  // user back to the login page since `loggedIn` only ever lived in memory.
  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    slateApi
      .me()
      .then((me) => {
        const signedInUser: SlateUser = {
          id: me.user.id,
          name: me.user.name,
          role: me.role,
          portal: me.user.portal as SlatePortal,
          initials: initialsFor(me.user.name),
          color: colorForId(me.user.id),
          email: me.user.email ?? undefined,
          phone: me.user.phone ?? undefined,
          gender: me.user.gender ?? undefined,
          dob: me.user.dob ?? undefined,
          address: me.user.address ?? undefined,
          aadhaar: me.user.aadhaarMasked ?? undefined,
          photo: me.user.photoDataUrl ?? null,
          employeeId: me.employeeId ?? undefined,
          makerChecker: (me.makerChecker as SlateUser["makerChecker"]) ?? undefined,
          status: "active",
        };
        setData((prev) => ({ ...prev, users: { ...prev.users, [signedInUser.id]: signedInUser } }));
        setSession((s) => ({
          ...s,
          loggedIn: true,
          restoring: false,
          mustChangePassword: me.mustChangePassword,
          currentUserId: signedInUser.id,
          currentPortal: signedInUser.portal,
          liveToken: token,
          liveIdentity: { role: me.role, jurisdictionId: me.jurisdictionId, makerChecker: me.makerChecker, employeeId: me.employeeId, permissions: me.permissions, menus: me.menus },
        }));
      })
      .catch((err) => {
        const status = err instanceof SlateApiError ? err.statusCode : 0;
        if (status === 401 || status === 403) {
          // Token is actually invalid/expired - clear it and fall through to login.
          setAuthToken(null);
          setSession((s) => ({ ...s, loggedIn: false, restoring: false }));
        } else {
          // Transient network/server error - don't clear a valid token.
          setSession((s) => ({ ...s, restoring: false }));
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A 401 on an already-authenticated call (token expired/revoked mid-session)
  // drops the session the same way an explicit logout would, so the route
  // guard in SlateApp redirects to login instead of leaving a stale page up.
  useEffect(() => {
    const handleUnauthorized = () => {
      setSession((s) => ({
        ...s,
        loggedIn: false,
        mustChangePassword: false,
        currentUserId: null,
        currentPortal: null,
        txnDraft: null,
        registerDraft: { ...DEFAULT_REGISTER_DRAFT },
        liveToken: null,
        liveIdentity: null,
      }));
    };
    window.addEventListener("slate:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("slate:unauthorized", handleUnauthorized);
  }, []);

  const value = useMemo<SlateContextValue>(() => {
    return {
      data,
      session,
      currentUser,
      can: (permissionCode) => session.liveIdentity?.permissions.includes(permissionCode) ?? true,

      logout: () => {
        setAuthToken(null);
        setSession((s) => ({
          ...s,
          loggedIn: false,
          mustChangePassword: false,
          currentUserId: null,
          currentPortal: null,
          txnDraft: null,
          registerDraft: { ...DEFAULT_REGISTER_DRAFT },
          liveToken: null,
          liveIdentity: null,
        }));
      },

      requestLoginOtp: (identifier, channel, password) => slateApi.requestOtp({ identifier, channel, purpose: "LOGIN", password }),

      verifyLoginOtp: async (identifier, otp) => {
        const result = await slateApi.verifyOtp({ identifier, otp, purpose: "LOGIN" });
        setAuthToken(result.token);

        let liveIdentity: LiveIdentity | null = null;
        let profile: { email?: string; phone?: string; gender?: string; dob?: string; address?: string; aadhaar?: string; photo?: string | null } = {};
        try {
          const me = await slateApi.me();
          liveIdentity = {
            role: me.role,
            jurisdictionId: me.jurisdictionId,
            makerChecker: me.makerChecker,
            employeeId: me.employeeId,
            permissions: me.permissions,
            menus: me.menus,
          };
          profile = {
            email: me.user.email ?? undefined,
            phone: me.user.phone ?? undefined,
            gender: me.user.gender ?? undefined,
            dob: me.user.dob ?? undefined,
            address: me.user.address ?? undefined,
            aadhaar: me.user.aadhaarMasked ?? undefined,
            photo: me.user.photoDataUrl ?? null,
          };
        } catch {
          // /me failing after a successful verify shouldn't block sign-in -
          // the signed-in user is still built from the verify response below.
          liveIdentity = null;
        }

        const backendUser = result.user;
        const signedInUser: SlateUser = {
          id: backendUser.id,
          name: backendUser.name,
          role: backendUser.role,
          portal: backendUser.portal as SlatePortal,
          initials: initialsFor(backendUser.name),
          color: colorForId(backendUser.id),
          ...profile,
          employeeId: backendUser.employeeId ?? undefined,
          makerChecker: (backendUser.makerChecker as SlateUser["makerChecker"]) ?? undefined,
          status: "active",
        };

        setData((prev) => ({ ...prev, users: { ...prev.users, [signedInUser.id]: signedInUser } }));
        setSession((s) => ({
          ...s,
          loggedIn: true,
          mustChangePassword: backendUser.mustChangePassword,
          currentUserId: signedInUser.id,
          currentPortal: signedInUser.portal,
          liveToken: result.token,
          liveIdentity,
        }));
      },

      changePassword: async (currentPassword, newPassword) => {
        await slateApi.changePassword({ currentPassword, newPassword });
        setSession((s) => ({ ...s, mustChangePassword: false }));
      },

      updateProfile: async (patch) => {
        await slateApi.updateProfile(patch);
        const refreshed = await slateApi.me();
        if (!session.currentUserId) return;
        setData((prev) => ({
          ...prev,
          users: {
            ...prev.users,
            [session.currentUserId as string]: {
              ...prev.users[session.currentUserId as string],
              name: refreshed.user.name,
              email: refreshed.user.email ?? undefined,
              gender: refreshed.user.gender ?? undefined,
              dob: refreshed.user.dob ?? undefined,
              address: refreshed.user.address ?? undefined,
            },
          },
        }));
      },
      toggleOfficerMode: () =>
        setSession((s) => ({ ...s, officerMode: s.officerMode === "maker" ? "checker" : "maker" })),
      toggleSidebar: () => setSession((s) => ({ ...s, sidebarCollapsed: !s.sidebarCollapsed })),

      startTxnDraft: (params) =>
        setSession((s) => ({ ...s, txnDraft: defaultTxnDraft(params?.ulpin, params?.type) })),
      updateTxnDraft: (patch) =>
        setSession((s) => ({ ...s, txnDraft: s.txnDraft ? { ...s.txnDraft, ...patch } : null })),
      goToInitiateStep: (step) =>
        setSession((s) => ({ ...s, txnDraft: s.txnDraft ? { ...s.txnDraft, step } : null })),
      payForTransaction: () =>
        setSession((s) =>
          s.txnDraft
            ? { ...s, txnDraft: { ...s.txnDraft, paymentDone: true, paymentRef: randomPaymentRef() } }
            : s,
        ),

      updateRegisterDraft: (patch) =>
        setSession((s) => ({ ...s, registerDraft: { ...s.registerDraft, ...patch } })),

      requestRegisterOtp: () => slateApi.requestOtp({ identifier: session.registerDraft.mobile, channel: "mobile", purpose: "REGISTER" }),

      verifyRegisterOtp: async (otp, password) => {
        const r = session.registerDraft;
        const maskedAadhaar = "XXXX XXXX " + r.aadhaar.replace(/\D/g, "").slice(-4);
        const result = await slateApi.verifyOtp({
          identifier: r.mobile,
          otp,
          purpose: "REGISTER",
          fullName: r.name.trim(),
          email: r.email.trim() || undefined,
          gender: r.gender || undefined,
          dob: r.dob || undefined,
          address: r.address.trim() || undefined,
          aadhaarMasked: maskedAadhaar,
          password,
        });
        setAuthToken(result.token);

        const newUser: SlateUser = {
          id: result.user.id,
          name: result.user.name,
          role: "Citizen",
          portal: "citizen",
          initials: initialsFor(result.user.name),
          aadhaar: maskedAadhaar,
          phone: "+91 " + r.mobile,
          color: colorForId(result.user.id),
          gender: r.gender || "Not specified",
          email: r.email.trim(),
          dob: r.dob || "-",
          fatherName: "-",
          address: r.address.trim() || "-",
          photo: null,
        };

        let liveIdentity: LiveIdentity | null = null;
        try {
          const me = await slateApi.me();
          liveIdentity = { role: me.role, jurisdictionId: me.jurisdictionId, makerChecker: me.makerChecker, employeeId: me.employeeId, permissions: me.permissions, menus: me.menus };
        } catch {
          liveIdentity = null;
        }

        setData((prev) => ({ ...prev, users: { ...prev.users, [newUser.id]: newUser } }));
        setSession((s) => ({
          ...s,
          loggedIn: true,
          currentUserId: newUser.id,
          currentPortal: "citizen",
          liveToken: result.token,
          liveIdentity,
          registerDraft: { ...s.registerDraft, step: 3, newUserId: newUser.id },
        }));
      },

      uploadProfilePhoto: async (dataUrl) => {
        if (!session.currentUserId) return;
        await slateApi.updateProfile({ photoDataUrl: dataUrl });
        setData((prev) => ({
          ...prev,
          users: { ...prev.users, [session.currentUserId as string]: { ...prev.users[session.currentUserId as string], photo: dataUrl } },
        }));
      },
      removeProfilePhoto: async () => {
        if (!session.currentUserId) return;
        await slateApi.updateProfile({ photoDataUrl: null });
        setData((prev) => ({
          ...prev,
          users: { ...prev.users, [session.currentUserId as string]: { ...prev.users[session.currentUserId as string], photo: null } },
        }));
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, session, currentUser]);

  return <SlateContext.Provider value={value}>{children}</SlateContext.Provider>;
}

export function useSlateStore(): SlateContextValue {
  const ctx = useContext(SlateContext);
  if (!ctx) throw new Error("useSlateStore must be used inside SlateProvider");
  return ctx;
}
