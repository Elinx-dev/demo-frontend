import { useEffect, useState, useCallback } from "react";
import { Modal } from "@/ui/primitives/Modal/Modal";
import { Button } from "@/ui/primitives/Button/Button";
import { apiService } from "@/services/api";
import { useToast } from "@/ui/feedback/toast/ToastProvider";
import {
  ShieldCheck,
  ShieldOff,
  Shield,
  RotateCcw,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useTheme } from "@/ui/theme/ThemeContext";
import Text from "@/ui/primitives/Text/Text";
import Badge from "@/ui/primitives/Badge/Badge";

export type ToggleState = "role_default" | "granted" | "revoked";

export interface PermissionToggleItem {
  permissionId: number;
  permissionName: string;
  displayName: string | null;
  isRoleDefault: boolean;
  isGranted: boolean;
  hasOverride: boolean;
  toggleState: ToggleState;
  menuName?: string | null;
  menuId?: number | null;
}

interface UserPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  authUserId: number;
  grantedBy: number;
  userName: string;
  roleId?: number;
  roleName?: string;
}

const formatPermissionName = (raw: string): string =>
  raw
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

const groupByMenu = (
  items: PermissionToggleItem[],
): Record<string, PermissionToggleItem[]> => {
  return items.reduce(
    (acc, item) => {
      const group =
        item.menuName ??
        item.permissionName.split("_")[0].charAt(0).toUpperCase() +
        item.permissionName.split("_")[0].slice(1).toLowerCase();
      (acc[group] ??= []).push(item);
      return acc;
    },
    {} as Record<string, PermissionToggleItem[]>,
  );
};

interface ToggleRowProps {
  item: PermissionToggleItem;
  saving: boolean;
  onToggle: (item: PermissionToggleItem, next: boolean | null) => void;
}

const ToggleRow: React.FC<ToggleRowProps> = ({ item, saving, onToggle }) => {
  // const { theme } = useTheme();

  const badgeConfig: Record<
    ToggleState,
    { label: string; color: string; bg: string; Icon: React.ElementType }
  > = {
    role_default: {
      label: "Role Default",
      color: "#6B7280",
      bg: "#F3F4F6",
      Icon: Shield,
    },
    granted: {
      label: "Explicitly Granted",
      color: "#059669",
      bg: "#D1FAE5",
      Icon: ShieldCheck,
    },
    revoked: {
      label: "Explicitly Revoked",
      color: "#DC2626",
      bg: "#FEE2E2",
      Icon: ShieldOff,
    },
  };

  const badge = badgeConfig[item.toggleState];

  return (
    <div
      className="flex items-center justify-between gap-4 rounded-xl px-4 py-3 transition-colors"
      style={{
        background: item.isGranted
          ? "rgba(16,185,129,0.04)"
          : "rgba(239,68,68,0.04)",
        border: `1px solid ${item.isGranted ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.12)"}`,
      }}
    >
      {/* Left: name + state badge */}
      <div className="flex flex-col gap-1 min-w-0">
        <Text as="span" size="sm" weight="medium" truncate>
          {item.displayName || formatPermissionName(item.permissionName)}
        </Text>

        <div className="flex items-center gap-1.5">
          <badge.Icon size={11} style={{ color: badge.color }} />
          <Badge
            variant="custom"
            bgColor={badge.bg}
            textColor={badge.color}
            size="xs"
            className="uppercase tracking-wide font-semibold"
          >
            {badge.label}
          </Badge>

          {/* Reset to default - only show when there's an active override */}
          {item.hasOverride && (
            <Button
              variant="ghost"
              type="button"
              disabled={saving}
              onClick={() => onToggle(item, null)}
              className="ml-1 !flex !items-center !gap-1 !text-[10px] !font-medium !text-gray-400 hover:!text-gray-600 transition-colors !p-0 !h-auto !bg-transparent hover:!bg-transparent"
              title="Reset to role default"
            >
              <RotateCcw size={10} />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Right: toggle switch */}
      <div className="flex items-center gap-2 shrink-0">
        {saving && <Loader2 size={14} className="animate-spin text-gray-400" />}

        <Button
          variant="ghost"
          type="button"
          role="switch"
          aria-checked={item.isGranted}
          disabled={saving}
          onClick={() => onToggle(item, !item.isGranted)}
          className={`!relative !inline-flex !h-6 !w-11 !items-center !justify-start !rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 !p-0 !min-w-0 !border-0 hover:!bg-transparent ${saving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            }`}
          style={{
            background: item.isGranted ? "#10B981" : "#D1D5DB",
          }}
        >
          <span
            className="inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200"
            style={{
              transform: item.isGranted
                ? "translateX(24px)"
                : "translateX(4px)",
            }}
          />
        </Button>
      </div>
    </div>
  );
};

const SYSTEM_PERMISSIONS = [
  "DESIGNATION_MANAGER",
  "DESIGNATION_ANALYST",
  "DESIGNATION_SUPER_ADMIN",
  "SCOPE_USER",
  "SCOPE_PLATFORM",
];

const HIDDEN_FOR_ROLE: Record<string, string[]> = {
  manager: [
    "FEATURE_REVENUE_TAB",
    "ASSIGN_USER",
    // "PROJECT_EDIT",
    "PROJECT_DELETE",
    "My Projects",
    "USER_DASHBOARD",
    "AGREEMENT_DELETE"
  ],
  analyst: [
    // "PROJECT_CREATE",
    // "PROJECT_VIEW",
    // "PROJECT_EDIT",
    "USER_DASHBOARD",
    "My Projects",
  ],
};

const getDesignation = (roleName?: string): string => {
  if (!roleName) return "";
  const lower = roleName.toLowerCase();
  if (lower.endsWith("manager")) return "manager";
  if (lower.endsWith("analyst")) return "analyst";
  if (lower.endsWith("super admin")) return "super_admin";
  return "";
};

export const UserPermissionsModal: React.FC<UserPermissionsModalProps> = ({
  isOpen,
  onClose,
  authUserId,
  grantedBy,
  userName,
  roleId,
  roleName,
}) => {
  const { theme } = useTheme();
  const toast = useToast();

  const [permissions, setPermissions] = useState<PermissionToggleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [pendingChanges, setPendingChanges] = useState<
    Map<number, boolean | null>
  >(new Map());
  const fetchPermissions = useCallback(async () => {
    if (!authUserId) return;
    setLoading(true);
    setError(null);
    try {
      const res: any = await apiService.post(
        "idam/get_user_permissions_for_toggle",
        {
          ...(authUserId ? { authUserId } : {}),
          ...(roleId ? { roleId } : {}),
        },
      );
      const data: PermissionToggleItem[] = res?.data?.data ?? [];
      setPermissions(data);
      setPendingChanges(new Map());
    } catch (err) {
      console.error("Failed to load permissions", err);
      setError("Could not load permissions. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [authUserId, roleId]);

  useEffect(() => {
    if (isOpen) fetchPermissions();
  }, [isOpen, fetchPermissions]);

  const handleToggle = (
    item: PermissionToggleItem,
    nextValue: boolean | null,
  ) => {
    setPermissions((prev) =>
      prev.map((p) => {
        if (p.permissionId !== item.permissionId) return p;

        if (nextValue === null) {
          // reset → back to role default
          return {
            ...p,
            isGranted: p.isRoleDefault,
            hasOverride: false,
            toggleState: "role_default",
          };
        }

        const newToggleState: ToggleState = nextValue
          ? p.isRoleDefault
            ? "role_default"
            : "granted"
          : "revoked";

        return {
          ...p,
          isGranted: nextValue,
          hasOverride: nextValue !== p.isRoleDefault || !nextValue,
          toggleState: newToggleState,
        };
      }),
    );

    setPendingChanges((prev) => {
      const next = new Map(prev);
      if (nextValue === null) {
        next.delete(item.permissionId);
      } else if (nextValue === item.isRoleDefault && !item.hasOverride) {
        next.delete(item.permissionId);
      } else {
        next.set(item.permissionId, nextValue);
      }
      return next;
    });
  };

  // ── save all pending changes in sequence ──
  const handleSaveAll = async () => {
    if (!authUserId) {
      onClose();
      return;
    }
    if (pendingChanges.size === 0) {
      onClose();
      return;
    }

    try {
      setSavingId(-1);

      const overrides = Array.from(pendingChanges.entries()).map(
        ([permissionId, isGranted]) => ({ permissionId, isGranted }),
      );

      await apiService.post("idam/create_user_permission_override", {
        authUserId,
        grantedBy,
        overrides,
      });

      toast.success(
        `${overrides.length} permission${overrides.length > 1 ? "s" : ""} updated successfully`,
      );

      await fetchPermissions();
      onClose();
    } catch (err: any) {
      console.error("Failed to save permissions", err);
      toast.error(err?.response?.data?.message ?? "Failed to save permissions");
    } finally {
      setSavingId(null);
    }
  };

  const handleDiscard = () => {
    fetchPermissions();
  };


  const visiblePermissions = permissions.filter((p) => {

    if (SYSTEM_PERMISSIONS.includes(p.permissionName)) return false;

    const hiddenList = HIDDEN_FOR_ROLE[getDesignation(roleName)] ?? [];
    return !hiddenList.includes(p.permissionName);
  });
  const grouped = groupByMenu(visiblePermissions);
  const groupNames = Object.keys(grouped).sort();
  const isSaving = savingId !== null;
  const hasPending = pendingChanges.size > 0;

  const stats = {
    total: visiblePermissions.length,
    granted: visiblePermissions.filter((p) => p.isGranted).length,
    overrides: visiblePermissions.filter((p) => p.hasOverride).length,
  };

  const formattedRoleName = roleName
    ? roleName.charAt(0).toUpperCase() + roleName.slice(1).toLowerCase()
    : "";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Permissions for ${formattedRoleName ? `${formattedRoleName} - ` : ""}${userName}`}
      size="3xl"
    >
      <div className="flex flex-col" style={{ maxHeight: "65vh" }}>
        {/* ── Stats bar ── */}
        <div
          className="flex items-center gap-6 px-6 py-3 border-b text-sm"
          style={{
            borderColor: theme.colors.primaryBorder,
            background:
              (theme.colors as any).surfaceAlt ?? theme.colors.surface,
          }}
        >
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-blue-500" />
            <Text as="span" color={theme.colors.textSecondary} size="sm">
              <Text as="strong" color={theme.colors.text} weight="bold">
                {stats.total}
              </Text>{" "}
              Available Permissions
            </Text>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-500" />
            <Text as="span" color={theme.colors.textSecondary} size="sm">
              <Text as="strong" color={theme.colors.text} weight="bold">
                {stats.granted}
              </Text>{" "}
              Given Permissions
            </Text>
          </div>
          {hasPending && (
            <div className="flex items-center gap-2 ml-auto">
              <Badge
                variant="warning"
                soft
                size="xs"
                className="font-semibold border border-amber-200"
              >
                <AlertTriangle size={11} className="mr-1 inline-block" />
                {pendingChanges.size} unsaved change
                {pendingChanges.size > 1 ? "s" : ""}
              </Badge>
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 size={28} className="animate-spin text-blue-500" />
              <Text size="sm" color={theme.colors.textSecondary}>
                Loading permissions…
              </Text>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-red-500">
              <AlertTriangle size={28} />
              <Text size="sm">{error}</Text>
              <Button variant="outline" size="sm" onClick={fetchPermissions}>
                Retry
              </Button>
            </div>
          )}

          {!loading && !error && permissions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
              <Shield size={32} />
              <Text size="sm">No permissions found for this user's role.</Text>
            </div>
          )}

          {!loading && !error && permissions.length > 0 && (
            <div className="space-y-6">
              {groupNames.map((group) => (
                <div key={group}>
                  {/* Group header */}
                  <div className="flex items-center gap-2 mb-3">
                    <Text
                      as="span"
                      size="xs"
                      weight="bold"
                      className="uppercase tracking-widest"
                      color={theme.colors.textSecondary}
                    >
                      {group}
                    </Text>
                    <Badge
                      variant="custom"
                      bgColor={theme.colors.primaryBorder}
                      textColor={theme.colors.textSecondary}
                      size="xs"
                      className="font-semibold"
                    >
                      {grouped[group].length}
                    </Badge>
                    <div
                      className="flex-1 h-px"
                      style={{ background: theme.colors.primaryBorder }}
                    />
                  </div>

                  {/* Permission rows */}
                  <div className="space-y-2">
                    {grouped[group].map((item) => (
                      <ToggleRow
                        key={item.permissionId}
                        item={item}
                        saving={isSaving}
                        onToggle={handleToggle}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div
          className="flex items-center justify-end px-6 py-4 border-t"
          style={{ borderColor: theme.colors.primaryBorder }}
        >
          {/* Legend */}
          {/* <div className="flex items-center gap-4 text-xs" style={{ color: theme.colors.textSecondary }}>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
              <Text as="span" size="xs" color={theme.colors.textSecondary}>Role default</Text>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <Text as="span" size="xs" color={theme.colors.textSecondary}>Explicit grant</Text>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              <Text as="span" size="xs" color={theme.colors.textSecondary}>Explicit revoke</Text>
            </span>
          </div> */}

          {/* Actions */}
          <div className="flex items-center gap-3">
            {hasPending && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDiscard}
                disabled={isSaving}
              >
                Discard
              </Button>
            )}

            <Button variant="secondary" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>

            <Button
              variant="primary"
              onClick={handleSaveAll}
              disabled={isSaving || loading}
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  Saving…
                </span>
              ) : hasPending ? (
                `Save Changes (${pendingChanges.size})`
              ) : (
                "Done"
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default UserPermissionsModal;
