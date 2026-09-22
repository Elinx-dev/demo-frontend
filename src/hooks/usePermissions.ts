import { SecureStorage } from "@/services/storage";
import type { AuthSession } from "@/services/auth/authService";
import { useUIPolicyContext } from "@/ui-policy/context/UIPolicyContext";

let _permissionSet: Set<string> | null = null;
let _lastSessionKey: string | null = null;

const getPermissionSet = (): Set<string> => {
  const session = SecureStorage.get<AuthSession>("auth.session");

  const sessionKey = session?.authUserName ?? null;

  if (_permissionSet && sessionKey && sessionKey === _lastSessionKey) {
    return _permissionSet;
  }

  const permissions: string[] = (session as any)?.permissions ?? [];
  _permissionSet = new Set(permissions);
  _lastSessionKey = sessionKey;
  return _permissionSet;
};

export const clearPermissionCache = () => {
  _permissionSet = null;
  _lastSessionKey = null;
};

export const usePermission = () => {
  const policy = useUIPolicyContext();
  return { can: policy.can };
};