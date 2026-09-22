/**
 * Lightweight, self-contained API client for the real SLATE backend
 * (Backend 1 - see slate_iam / slate_ledger / slate_token_registry).
 * Deliberately separate from src/services/api/api.config.ts (that registry is
 * the legacy IP-Climb endpoint catalogue, tied to a different base path
 * convention and a hard-required env var) - SLATE stays a self-contained
 * mini-app, consistent with how it's mounted as its own route tree.
 */
import type {
  SlateToken,
  OfficerQueueItem,
  SlateException,
  SlateMortgage,
  SlateDispute,
  ConsentRequest,
  SlateAuditRow,
  SlateDocument,
  SiteVisitTask,
  TxnType,
} from "../types/slate.types";

const API_BASE = `${(import.meta.env.VITE_DEFAULT_API_BASE_URL || "http://localhost:8080").replace(/\/+$/, "")}/api/v1`;
const TOKEN_STORAGE_KEY = "slate_auth_token";

let authToken: string | null = (() => {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
})();

export function setAuthToken(token: string | null) {
  authToken = token;
  try {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // localStorage unavailable (e.g. private mode) - token still works for this session.
  }
}

export function getAuthToken() {
  return authToken;
}

export class SlateApiError extends Error {
  statusCode: number;
  code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.name = "SlateApiError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  // Always read the freshest token: in-memory first, localStorage as fallback.
  // This guards against edge cases (StrictMode double-invoke, module re-init)
  // where the in-memory variable may lag behind what was last persisted.
  const token = authToken || (() => {
    try { return localStorage.getItem(TOKEN_STORAGE_KEY); } catch { return null; }
  })();

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new SlateApiError("Could not reach the SLATE backend. Is it running?", 0);
  }

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    // A 401 on an OTP endpoint means "wrong/expired code", and on
    // change-password means "wrong current password" - neither is a
    // rejected session token, so neither must trigger a forced logout.
    const isExpectedBusiness401 = path.includes("/otp/") || path.includes("/change-password");
    if (res.status === 401 && token && !isExpectedBusiness401) {
      // The token we sent was rejected (expired/invalid/revoked) - clear it
      // and let SlateProvider's listener drop the session, which routes the
      // user straight back to login instead of leaving a half-authenticated
      // page on screen.
      setAuthToken(null);
      window.dispatchEvent(new CustomEvent("slate:unauthorized"));
    }
    throw new SlateApiError(json?.message || `Request failed (${res.status})`, res.status, json?.code);
  }
  return (json?.data ?? json) as T;
}

export const slateApi = {
  requestOtp: (input: { identifier: string; channel: "mobile" | "email"; purpose?: "LOGIN" | "REGISTER" | "CONSENT"; password?: string }) =>
    request<{ sent: boolean; devOtp?: string }>("POST", "/slate_iam/auth/otp/request", input),

  verifyOtp: (input: {
    identifier: string; otp: string; purpose?: "LOGIN" | "REGISTER"; fullName?: string;
    email?: string; gender?: string; dob?: string; address?: string; aadhaarMasked?: string; password?: string;
  }) =>
    request<{
      token: string;
      user: {
        id: string; name: string; portal: string; role: string; jurisdictionId: string | null;
        makerChecker: string | null; employeeId: string | null; mustChangePassword: boolean;
      };
    }>("POST", "/slate_iam/auth/otp/verify", input),

  /** Confirms a digital-consent OTP (sender/recipient signing a transaction)
   * without issuing a new session - the caller must already be logged in. */
  verifyConsentOtp: (input: { identifier: string; otp: string }) =>
    request<{ verified: true }>("POST", "/slate_iam/auth/otp/verify-consent", input),

  changePassword: (input: { currentPassword: string; newPassword: string }) =>
    request<{ success: boolean }>("POST", "/slate_iam/auth/change-password", input),

  updateProfile: (input: { fullName?: string; email?: string; gender?: string; dob?: string; address?: string; photoDataUrl?: string | null }) =>
    request<unknown>("PUT", "/slate_iam/auth/profile", input),

  /** Admin-only (e.g. Court/Admin onboarding an officer/bank/court/surveyor
   * identity) - generates a temp password and emails it to the work email;
   * the new account must change it on first login. */
  onboardStaffUser: (input: { name: string; portal: string; roleId: string; email: string; employeeId?: string; jurisdictionId?: string; makerChecker?: string }) =>
    request<{ id: string; email: string; devTempPassword?: string }>("POST", "/slate_iam/auth/onboard-staff", input),

  me: () =>
    request<{
      user: {
        id: string; name: string; portal: string; email: string | null; phone: string | null;
        gender: string | null; dob: string | null; address: string | null; aadhaarMasked: string | null;
        photoDataUrl: string | null;
      };
      role: string;
      jurisdictionId: string | null;
      makerChecker: string | null;
      employeeId: string | null;
      mustChangePassword: boolean;
      permissions: string[];
      menus: { code: string; label: string; path: string; icon: string }[];
    }>("GET", "/slate_iam/auth/me"),

  logout: () => request<{ success: boolean }>("POST", "/slate_iam/auth/logout"),

  // ---------------- Citizen portal ----------------
  citizen: {
    getProperties: () => request<SlateToken[]>("GET", "/slate/citizen/properties"),
    getPropertyDetail: (ulpin: string) => request<SlateToken>("GET", `/slate/citizen/properties/${ulpin}`),
    getRuleChecks: (ulpin: string) => request<{ label: string; pass: boolean; detail: string }[]>("GET", `/slate/citizen/rule-checks/${ulpin}`),
    createConsentRequest: (input: { ulpin: string; type: TxnType; recipientName: string; price?: string; sharePercent?: string; giftRelation?: string }) =>
      request<{ id: string }>("POST", "/slate/citizen/consent", input),
    giveRecipientConsent: (consentId: string) => request<ConsentRequest>("POST", `/slate/citizen/consent/${consentId}/recipient-consent`),
    getConsentRequest: (consentId: string) => request<ConsentRequest>("GET", `/slate/citizen/consent/${consentId}`),
    submitTransaction: (input: {
      ulpin: string; type: TxnType; buyerName: string; buyerAadhaar?: string; price?: string;
      sharePercent?: string; partitionArea?: string; giftRelation?: string; stampDutyCode?: string;
      paymentRef?: string | null; witnesses?: { name: string; address: string }[]; needsSurveyor?: boolean;
    }) => request<{ txnId: string; allClear: boolean }>("POST", "/slate/citizen/transactions", input),
    getIncoming: () => request<{ pendingConsent: ConsentRequest[]; queueItems: OfficerQueueItem[] }>("GET", "/slate/citizen/incoming"),
    getTrackStatus: () => request<{ myTxns: OfficerQueueItem[]; myExceptions: SlateException[] }>("GET", "/slate/citizen/track-status"),
    giveHeirConsent: (ulpin: string, heirId: string) => request<unknown>("POST", `/slate/citizen/succession/${ulpin}/heir-consent`, { heirId }),
    uploadDocument: (input: { ulpin: string; docType: string; fileName: string; dataUrl: string }) =>
      request<SlateDocument>("POST", "/slate/citizen/documents", input),
    getDocuments: (ulpin: string) => request<SlateDocument[]>("GET", `/slate/citizen/documents?ulpin=${encodeURIComponent(ulpin)}`),
    updateDocument: (id: string, patch: { fileName?: string; docType?: string }) => request<SlateDocument>("PUT", `/slate/citizen/documents/${id}`, patch),
    deleteDocument: (id: string) => request<{ success: boolean }>("DELETE", `/slate/citizen/documents/${id}`),
  },

  // ---------------- Officer portal ----------------
  officer: {
    getQueue: () => request<OfficerQueueItem[]>("GET", "/slate/officer/queue"),
    approveMaker: (txnId: string) => request<{ success: boolean }>("POST", `/slate/officer/queue/${txnId}/approve-maker`),
    approveChecker: (txnId: string, newOwners?: { id: string; name: string; share: number }[]) =>
      request<{ success: boolean }>("POST", `/slate/officer/queue/${txnId}/approve-checker`, { newOwners }),
    routeToException: (txnId: string, reason: string) => request<{ success: boolean }>("POST", `/slate/officer/queue/${txnId}/route-exception`, { reason }),
    getExceptions: () => request<SlateException[]>("GET", "/slate/officer/exceptions"),
    rejectException: (id: string) => request<{ success: boolean }>("POST", `/slate/officer/exceptions/${id}/reject`),
    returnException: (id: string) => request<{ success: boolean }>("POST", `/slate/officer/exceptions/${id}/return`),
    lookupAadhaar: (aadhaar: string) => request<{ id: string; name: string }>("GET", `/slate/officer/lookup-aadhaar/${encodeURIComponent(aadhaar)}`),
    mintToken: (input: {
      ulpin?: string; owner: string; ownerAadhaar?: string; survey?: string; subDivision?: string;
      parcelType?: string; propertyType?: string; natureOfTitle?: string; isLeasehold?: boolean;
      classificationTypeCode?: string; registrationDistrict?: string; sroId?: string;
      district?: string; taluk?: string; village?: string; landType?: string; wardNo?: string; street?: string;
      gps?: string; polygonVertices?: { lat: number; lng: number }[];
      area?: string; classification?: string;
      guidelineValue?: number; guidanceValue?: number; taxStatus?: string; fmbRef?: string;
      legacyOwnershipHistory?: {
        ownerName: string; ownerAadhaar?: string; fromDate?: string; toDate?: string; acquisitionType: string;
        transactionDate?: string; natureOfTransaction?: string; executorSeller?: string; claimantPurchaser?: string;
        documentType?: string; registrationRefNo?: string; stampDuty?: string; surveyNo?: string;
        dateOfDeath?: string; legalHeirs?: string; applicableLaw?: string;
      }[];
    }) => request<SlateToken>("POST", "/slate/officer/mint", input),
    /** Draft → Active - required before a token can be transacted on. */
    verifyAndActivate: (ulpin: string) => request<SlateToken>("POST", `/slate/officer/tokens/${encodeURIComponent(ulpin)}/verify-activate`),
    /** Split a token into two child tokens; parent becomes inactive. */
    splitToken: (ulpin: string, childA: { ulpin: string; owner: string; ownerAadhaar?: string; area: string; sharePercent: string }, childB: { ulpin: string; owner: string; ownerAadhaar?: string; area: string; sharePercent: string }) =>
      request<{ parent: SlateToken; childA: SlateToken; childB: SlateToken }>("POST", `/slate/officer/tokens/${encodeURIComponent(ulpin)}/split`, { childA, childB }),
    /** Full on-chain history for a single token (role-scoped). */
    getTokenHistory: (ulpin: string) =>
      request<{
        token: SlateToken & { splitParent?: string; splitChildren?: string[] };
        events: { txnId: string; ulpin: string; timestamp: string; operation: string; actorRole: string; preState: string | null; postState: string; detail: string }[];
      }>("GET", `/slate/officer/tokens/${encodeURIComponent(ulpin)}/history`),
    /** Role-scoped token search (citizen→own, officer→jurisdiction, admin/bank→all). */
    searchTokens: (q: string) => request<SlateToken[]>("GET", `/slate/officer/tokens/search?q=${encodeURIComponent(q)}`),
    getAuditTrail: () => request<SlateAuditRow[]>("GET", "/slate/officer/audit"),
  },

  // ---------------- Bank portal ----------------
  bank: {
    searchEncumbrance: (ulpin: string) => request<{ token: SlateToken; mortgages: SlateMortgage[] }>("GET", `/slate/bank/search?ulpin=${encodeURIComponent(ulpin)}`),
    createMortgage: (input: { ulpin: string; amount: number; type: string; borrower: string }) => request<SlateMortgage>("POST", "/slate/bank/mortgages", input),
    releaseMortgage: (id: string) => request<SlateMortgage>("POST", `/slate/bank/mortgages/${id}/release`),
    getMortgages: () => request<SlateMortgage[]>("GET", "/slate/bank/mortgages"),
  },

  // ---------------- Court / Admin portal ----------------
  court: {
    fileDispute: (input: { ulpin: string; cnr: string; type: string; filedBy: string; filedAgainst: string; court: string }) => request<SlateDispute>("POST", "/slate/court/disputes", input),
    enterCourtOrder: (id: string, input: { orderType: "Transfer" | "Partition" | "Auction" | "Dismissed"; orderHash?: string; newOwners?: { id: string; name: string; share: number }[] }) =>
      request<SlateDispute>("POST", `/slate/court/disputes/${id}/order`, input),
    getDisputes: () => request<SlateDispute[]>("GET", "/slate/court/disputes"),
    openSuccessionCase: (input: { ulpin: string; deceasedOwnerId: string; deathCertHash: string; law: string; heirs: { id: string; name: string; relation: string; share: number; consent: "pending" | "given" }[] }) =>
      request<unknown>("POST", "/slate/court/succession", input),
  },

  // ---------------- Surveyor portal ----------------
  surveyor: {
    getPendingSurveys: () => request<SlateToken[]>("GET", "/slate/surveyor/pending"),
    getSurveyQueue: () => request<OfficerQueueItem[]>("GET", "/slate/surveyor/queue"),
    submitVerification: (ulpin: string, input: { lat: number; lng: number; notes?: string; measurements?: { from: string; to: string; val: string }[]; surveyedArea?: string; conflict?: boolean; conflictDetails?: string }) =>
      request<SlateToken>("POST", `/slate/surveyor/${ulpin}/verify`, input),
    getSiteVisitTasks: () => request<SiteVisitTask[]>("GET", "/slate/surveyor/site-visit-tasks"),
    proposeDate: (taskId: string, date: string, time?: string) => request<SiteVisitTask>("POST", `/slate/surveyor/site-visit-tasks/${taskId}/propose-date`, { date, time }),
    acceptDate: (taskId: string) => request<SiteVisitTask>("POST", `/slate/surveyor/site-visit-tasks/${taskId}/accept-date`, {}),
    surveyorCheckIn: (taskId: string) => request<SiteVisitTask>("POST", `/slate/surveyor/site-visit-tasks/${taskId}/checkin`, {}),
  },

  // ---------------- VAO portal ----------------
  vao: {
    getQueue: () => request<SiteVisitTask[]>("GET", "/slate/vao/queue"),
    getTask: (taskId: string) => request<SiteVisitTask>("GET", `/slate/vao/tasks/${taskId}`),
    proposeDate: (taskId: string, date: string, time?: string) => request<SiteVisitTask>("POST", `/slate/vao/tasks/${taskId}/propose-date`, { date, time }),
    acceptDate: (taskId: string) => request<SiteVisitTask>("POST", `/slate/vao/tasks/${taskId}/accept-date`, {}),
    checkIn: (taskId: string) => request<SiteVisitTask>("POST", `/slate/vao/tasks/${taskId}/checkin`, {}),
    getVerificationQueue: () => request<OfficerQueueItem[]>("GET", "/slate/vao/verification-queue"),
    approveAndGeneratePatta: (txnId: string) => request<{ success: boolean }>("POST", `/slate/vao/verification-queue/${txnId}/approve-patta`),
    rejectDeed: (txnId: string, reason: string) => request<{ success: boolean }>("POST", `/slate/vao/verification-queue/${txnId}/reject`, { reason }),
  },

  // ---------------- Tahsildar portal ----------------
  tahsildar: {
    getQueue: () => request<OfficerQueueItem[]>("GET", "/slate/tahsildar/queue"),
    getVerificationQueue: () => request<OfficerQueueItem[]>("GET", "/slate/tahsildar/verification-queue"),
    getCompletedQueue: () => request<OfficerQueueItem[]>("GET", "/slate/tahsildar/completed-queue"),
    approveMutation: (txnId: string) => request<{ success: boolean }>("POST", `/slate/tahsildar/queue/${txnId}/approve`),
    approveAndGeneratePatta: (txnId: string) => request<{ success: boolean }>("POST", `/slate/tahsildar/verification-queue/${txnId}/approve-patta`),
    rejectMutation: (txnId: string, reason: string) => request<{ success: boolean }>("POST", `/slate/tahsildar/queue/${txnId}/reject`, { reason }),
    rejectDeed: (txnId: string, reason: string) => request<{ success: boolean }>("POST", `/slate/tahsildar/verification-queue/${txnId}/reject`, { reason }),
    getExecutionDetail: (txnId: string) => request<{
      txnId: string; flowCode: string; currentStepCode: string; status: string;
      stepHistory: { stepCode: string; actorId: string; completedAt: string; metadata?: Record<string, unknown> }[];
    }>("GET", `/slate/tahsildar/executions/${txnId}`),
  },

  // ---------------- Revenue Officer portal ----------------
  revenue: {
    getQueue: () => request<OfficerQueueItem[]>("GET", "/slate/revenue/queue"),
    approve: (txnId: string) => request<{ success: boolean }>("POST", `/slate/revenue/queue/${txnId}/approve`),
    reject: (txnId: string, reason: string) => request<{ success: boolean }>("POST", `/slate/revenue/queue/${txnId}/reject`, { reason }),
  },

  // ---------------- Ledger / Chain Integrity ----------------
  ledger: {
    verifyChain: (ulpin: string) => request<{ valid: boolean; brokenAt?: string; reason?: string; eventCount?: number }>("GET", `/slate/ledger/verify/${encodeURIComponent(ulpin)}`),
  },

  // ---------------- Admin - Blockchain Flow Builder ----------------
  admin: {
    flows: {
      getAll: () => request<{
        id: string; flowCode: string; flowName: string; flowCategory: string; description: string | null;
        isActive: boolean; version: number; txnTypeMap: string[];
      }[]>("GET", "/slate/admin/flows"),
      getById: (flowId: string) => request<{
        id: string; flowCode: string; flowName: string; flowCategory: string; description: string | null;
        isActive: boolean; version: number; txnTypeMap: string[];
        steps: {
          id: string; stepCode: string; stepName: string; stepOrder: number; stepType: string;
          actorRole: string; description: string | null; executionConfig: Record<string, unknown> | null;
          conditionConfig: Record<string, unknown> | null; isMandatory: boolean; timeoutHours: number | null;
        }[];
      }>("GET", `/slate/admin/flows/${flowId}`),
      create: (input: { flowCode: string; flowName: string; flowCategory: string; description?: string; txnTypeMap?: string[] }) =>
        request<{ id: string }>("POST", "/slate/admin/flows", input),
      update: (flowId: string, patch: { flowName?: string; description?: string; isActive?: boolean; txnTypeMap?: string[] }) =>
        request<{ success: boolean }>("PUT", `/slate/admin/flows/${flowId}`, patch),
      createStep: (flowId: string, input: {
        stepCode: string; stepName: string; stepOrder: number; stepType: string; actorRole: string;
        description?: string; executionConfig?: Record<string, unknown>; conditionConfig?: Record<string, unknown>;
        isMandatory?: boolean; timeoutHours?: number;
      }) => request<{ id: string }>("POST", `/slate/admin/flows/${flowId}/steps`, input),
      updateStep: (stepId: string, patch: Partial<{
        stepName: string; stepOrder: number; stepType: string; actorRole: string;
        description: string; executionConfig: Record<string, unknown>; conditionConfig: Record<string, unknown>;
        isMandatory: boolean; timeoutHours: number;
      }>) => request<{ success: boolean }>("PUT", `/slate/admin/steps/${stepId}`, patch),
      deleteStep: (stepId: string) => request<{ success: boolean }>("DELETE", `/slate/admin/steps/${stepId}`),
      reorderSteps: (flowId: string, stepIds: string[]) => request<{ success: boolean }>("PUT", `/slate/admin/flows/${flowId}/steps/reorder`, { stepIds }),
      getExecutions: (flowCode: string) => request<{
        id: string; txnId: string; flowCode: string; currentStepCode: string; status: string; startedAt: string; completedAt: string | null;
      }[]>("GET", `/slate/admin/flows/${flowCode}/executions`),
      getAllExecutions: () => request<{
        id: string; txnId: string; flowCode: string; currentStepCode: string; status: string; startedAt: string; completedAt: string | null;
      }[]>("GET", "/slate/admin/flows/executions/all"),
      reseedDemoData: () => request<{ success: boolean; message: string }>("POST", "/slate/admin/reseed"),
    },
  },

  // ---------------- Notifications ----------------
  notifications: {
    getMine: () =>
      request<{ id: string; title: string; body: string; isRead: boolean; createdAt: string; dataPayload?: { kind?: string; path?: string } | null }[]>("GET", "/notification/my"),
    markRead: (id: string) => request<{ success: boolean }>("POST", `/notification/my/${id}/read`),
  },

  // ---------------- Off-chain master/reference data ----------------
  masters: {
    getJurisdictions: () => request<{ id: string; jurisdictionId: string; level: string; name: string; parentId: string | null }[]>("GET", "/slate_token_registry/jurisdiction"),
    createJurisdiction: (input: { jurisdictionId: string; level: string; name: string; parentId?: string | null }) =>
      request<{ id: string }>("POST", "/slate_token_registry/jurisdiction", input),
    getSROList: async () => {
      const all = await request<{ id: string; jurisdictionId: string; level: string; name: string; parentId: string | null }[]>("GET", "/slate_token_registry/jurisdiction");
      return all.filter((j) => j.level === "sro");
    },
    getRelationships: () => request<{ id: string; code: string; label: string }[]>("GET", "/slate_token_registry/relationship"),
    createRelationship: (input: { code: string; label: string }) => request<{ id: string }>("POST", "/slate_token_registry/relationship", input),
    getStampDutyRates: () => request<{ id: string; code: string; label: string; rate: number }[]>("GET", "/slate_token_registry/stamp_duty_rate"),
    createStampDutyRate: (input: { code: string; label: string; rate: number }) => request<{ id: string }>("POST", "/slate_token_registry/stamp_duty_rate", input),
    getDocumentTypes: () => request<{ id: string; code: string; label: string; category?: string }[]>("GET", "/slate_token_registry/document_type"),
    createDocumentType: (input: { code: string; label: string; category?: string }) => request<{ id: string }>("POST", "/slate_token_registry/document_type", input),
    getByCategory: async (category: string) => {
      const all = await request<{ id: string; code: string; label: string; category?: string }[]>("GET", "/slate_token_registry/document_type");
      return all.filter((d) => d.category === category);
    },
    getPropertyTypes: () => slateApi.masters.getByCategory("property_type"),
    getNatureOfTitle: () => slateApi.masters.getByCategory("nature_of_title"),
    getLandTypes: () => slateApi.masters.getByCategory("land_type"),
    getClassificationTypes: () => slateApi.masters.getByCategory("classification_type"),
    getTransactionTypes: () => slateApi.masters.getByCategory("transaction_type"),
    getChainOfTitleNatures: () => slateApi.masters.getByCategory("chain_of_title_nature"),
  },

  // ---------------- IAM admin (roles, permissions, menus, mappings, users) ----------------
  // These hit the platform's generic CRUD routes directly (not under /slate_iam -
  // that domain's generic routes mount bare, a pre-existing platform quirk).
  iam: {
    getAuthStatuses: () => request<{ id: string; authStatusName: string }[]>("GET", "/auth_status"),

    getRoles: () => request<{ id: string; roleName: string }[]>("GET", "/auth_role"),
    createRole: (input: { roleName: string }) => request<{ id: string }>("POST", "/auth_role", input),

    getPermissions: () => request<{ id: string; permissionName: string; label: string | null; moduleLabel: string | null }[]>("GET", "/permission"),
    createPermission: (input: { permissionName: string; label?: string; moduleLabel?: string }) => request<{ id: string }>("POST", "/permission", input),

    getMenus: () => request<{ id: string; menuName: string; menuCode: string | null; portal: string | null; menuRoute: string | null; menuIcon: string | null }[]>("GET", "/menu"),
    createMenu: (input: { menuName: string; menuCode?: string; portal?: string; menuRoute?: string; menuIcon?: string }) => request<{ id: string }>("POST", "/menu", input),

    // Soft-deleted rows (isActive:false) stay in the table, so list calls
    // filter them out client-side - the generic CRUD list endpoint doesn't.
    getMenuPermissions: () =>
      request<{ id: string; menuId: string; permissionId: string; isActive?: boolean }[]>("GET", "/menu_permission").then((rows) => rows.filter((r) => r.isActive !== false)),
    createMenuPermission: (input: { menuId: string; permissionId: string }) => request<{ id: string }>("POST", "/menu_permission", input),
    deleteMenuPermission: (id: string) => request<{ success: boolean }>("DELETE", `/menu_permission/${id}`),

    getRolePermissions: () =>
      request<{ id: string; roleId: string; permissionId: string; isActive?: boolean }[]>("GET", "/slate_role_permission").then((rows) => rows.filter((r) => r.isActive !== false)),
    createRolePermission: (input: { roleId: string; permissionId: string }) => request<{ id: string }>("POST", "/slate_role_permission", input),
    deleteRolePermission: (id: string) => request<{ success: boolean }>("DELETE", `/slate_role_permission/${id}`),

    getUsers: () => request<{ id: string; authUserName: string; fullName: string | null; email: string | null; portal: string | null; authStatusId: string }[]>("GET", "/auth_user"),
    createUser: (input: { authUserName: string; authStatusId: string; fullName?: string; email?: string; portal?: string }) => request<{ id: string }>("POST", "/auth_user", input),

    getUserRoles: () => request<{ id: string; authUserId: string; roleId: string; employeeId: string | null; jurisdictionId: string | null; makerChecker: string | null }[]>("GET", "/auth_user_role"),
    createUserRole: (input: { authUserId: string; roleId: string; employeeId?: string; jurisdictionId?: string; makerChecker?: string }) =>
      request<{ id: string }>("POST", "/auth_user_role", input),
  },

  // ---------------- FMB diagram images ----------------
  fmb: {
    getImage: (fmbRef: string) =>
      request<{ imageData: string; fmbRef: string; surveyNo: string }>("GET", `/slate/fmb/image/${encodeURIComponent(fmbRef)}`),
    generateImage: (input: {
      fmbRef: string; surveyNo: string; district?: string;
      taluk?: string; village?: string; ulpin?: string;
      boundaries?: string; area?: string;
    }) => request<{ generated: boolean; fmbRef: string; imageData?: string }>("POST", "/slate/fmb/generate", input),
  },
};
