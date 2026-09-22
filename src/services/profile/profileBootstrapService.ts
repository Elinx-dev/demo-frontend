import { apiService } from "@/services/api/apiService";

export type ProfileLite = {
  tenantProfileId: number;
  profileName: string;
  tenantProfileTypeId?: number;
  tenantProfileTypeName?: string;
  profileStatusId?: number;
  profileStatusName?: string;
  entityTypeId?: number;
  gstNo?: string;
  isActive?: boolean;
};

export type ProfileContext = {
  authUserId?: number;
  tenantId?: number;
  roleId?: number;
  roleName?: string;
  hasProfiles?: boolean;
  totalProfileCount?: number;
  activeProfileCount?: number;
  pendingProfileCount?: number;
  landingAction?: string;
  landingRoute?: string;
  selectedProfile?: ProfileLite;
  activeProfiles?: ProfileLite[];
  pendingProfiles?: ProfileLite[];
};

export type PostLoginBootstrap = {
  identity?: {
    authUserId?: number;
    authUserName?: string;
    tenantId?: number;
    roleId?: number;
    roleName?: string;
  };
  profileContext?: ProfileContext;
  menuContext?: any;
};

const RESOLVE_POST_LOGIN_BOOTSTRAP_ENDPOINT =
  import.meta.env.VITE_RESOLVE_POST_LOGIN_BOOTSTRAP_ENDPOINT ??
  "idam/resolve_post_login_bootstrap";

  // console.log('RESOLVE_POST_LOGIN_BOOTSTRAP_ENDPOINT', RESOLVE_POST_LOGIN_BOOTSTRAP_ENDPOINT)
const GET_DYNAMIC_MENU_ENDPOINT =
  import.meta.env.VITE_GET_DYNAMIC_MENU_ENDPOINT ?? "idam/get_dynamic_menu";

const BOOTSTRAP_KEY = "ipc_post_login_bootstrap";
const IDENTITY_KEY = "ipc_login_identity";

export const profileBootstrapService = {
  readBootstrap(): PostLoginBootstrap | null {
    const raw = sessionStorage.getItem(BOOTSTRAP_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as PostLoginBootstrap;
    } catch {
      return null;
    }
  },

  readIdentity() {
    const raw = sessionStorage.getItem(IDENTITY_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as NonNullable<PostLoginBootstrap["identity"]>;
    } catch {
      return null;
    }
  },

  persistBootstrap(payload: PostLoginBootstrap) {
    sessionStorage.setItem(BOOTSTRAP_KEY, JSON.stringify(payload));
    if (payload.identity) {
      sessionStorage.setItem(IDENTITY_KEY, JSON.stringify(payload.identity));
    }
    window.dispatchEvent(
      new CustomEvent("ipc:post-login-bootstrap", { detail: payload }),
    );
  },

  async resolveBootstrap(selectedProfileId?: number) {
    const current = this.readBootstrap();
    const identity = current?.identity ?? this.readIdentity();

    if (!identity?.tenantId) {
      throw new Error("Missing tenant identity");
    }

    const resp: any = await apiService.post(RESOLVE_POST_LOGIN_BOOTSTRAP_ENDPOINT, {
      authUserId: identity.authUserId,
      authUserName: identity.authUserName,
      tenantId: identity.tenantId,
      roleId: identity.roleId,
      roleName: identity.roleName,
      ...(selectedProfileId ? { selectedProfileId } : {}),
    });

    const envelope = resp?.data?.data ?? resp?.data ?? resp;
    const payload = envelope?.data ?? envelope;

    const nextBootstrap: PostLoginBootstrap = {
      identity,
      profileContext: payload?.profileContext ?? {},
      menuContext: payload?.menuContext ?? {},
    };

    this.persistBootstrap(nextBootstrap);
    return nextBootstrap;
  },

  async getDynamicMenu(args: {
    authUserId?: number;
    tenantId?: number;
    roleId?: number;
    roleName?: string;
    selectedProfileId?: number;
    selectedProfileTypeId?: number;
  }) {
    const resp: any = await apiService.post(GET_DYNAMIC_MENU_ENDPOINT, args);
    const envelope = resp?.data?.data ?? resp?.data ?? resp;
    return envelope?.data ?? envelope;
  },
};