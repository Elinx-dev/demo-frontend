export type PostLoginIdentity = {
  authUserId?: number;
  authUserName?: string;
  phoneNumber?: string;
  tenantId?: number;
  roleId?: number;
  roleName?: string;
};

export type PostLoginBootstrap = {
  identity: PostLoginIdentity;
  profileContext?: Record<string, unknown>;
  menuContext?: Record<string, unknown>;
};

const BOOTSTRAP_KEY = "ipc_post_login_bootstrap";
const IDENTITY_KEY = "ipc_login_identity";

export const postLoginBootstrapStorage = {
  set(payload: PostLoginBootstrap) {
    sessionStorage.setItem(BOOTSTRAP_KEY, JSON.stringify(payload));
    sessionStorage.setItem(IDENTITY_KEY, JSON.stringify(payload.identity));
    window.dispatchEvent(
      new CustomEvent("ipc:post-login-bootstrap", {
        detail: payload,
      }),
    );
  },

  get(): PostLoginBootstrap | null {
    const raw = sessionStorage.getItem(BOOTSTRAP_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as PostLoginBootstrap;
    } catch {
      return null;
    }
  },

  getIdentity(): PostLoginIdentity | null {
    const raw = sessionStorage.getItem(IDENTITY_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as PostLoginIdentity;
    } catch {
      return null;
    }
  },

  clear() {
    sessionStorage.removeItem(BOOTSTRAP_KEY);
    sessionStorage.removeItem(IDENTITY_KEY);
  },
};
