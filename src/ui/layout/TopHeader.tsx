import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  Layers3,
} from "lucide-react";
import { useTheme } from "@/ui/theme/ThemeContext";
import { Button } from "@/ui/primitives/Button/Button";
import { useSRAnnounce } from "@/app/ScreenReaderProvider";
import { useSwitchProfile, useActiveProfile } from "@/context/ProfileContext";
import {
  getRouteHeader,
  getRouteHeaderBackAction,
} from "@/navigation/routeHeader";
import { Tooltip } from "../primitives/Tooltip/Tooltip";
import { useToast } from "@/ui/feedback/toast/ToastProvider";
import { usePermission } from "@/hooks/usePermissions";
import { apiService } from "@/services/api/apiService";

export type Breadcrumb = {
  id: string;
  label: string;
  href?: string;
};

export type HeaderProfileItem = {
  imageUrl?: string;
  tenantProfileId: number;
  profileName: string;
  tenantProfileTypeId?: number;
  tenantProfileTypeName?: string;
  tenantProfileTypeDisplayName?: string;
  profileStatusId?: number;
  profileStatusName?: string;
  gstNo?: string | null;
  isActive?: boolean;
  legalEntityName?: string | null;
};

type BootstrapIdentity = {
  authUserId?: number;
  appUserName?: string;
  authUserName?: string;
  avatarUrl?: string | null;
  tenantId?: number;
  roleId?: number;
  roleName?: string;
};

type BootstrapState = {
  identity?: BootstrapIdentity;
  profileContext?: {
    selectedProfile?: HeaderProfileItem;
    activeProfiles?: HeaderProfileItem[];
    pendingProfiles?: HeaderProfileItem[];
  };
  menuContext?: unknown;
  canCreateProfile?: boolean;
};

interface TopHeaderProps {
  breadcrumbs?: Breadcrumb[];
  companyName?: string;
  logoSrc?: string;
  logoFallbackInitial?: string;
  userName?: string;
  userEmail?: string;
  userAvatarSrc?: string;
  userStatus?: "online" | "offline" | "busy" | "away";
  onProfileClick?: () => void;
  profiles?: HeaderProfileItem[];
  selectedProfileId?: number;
  onProfileSwitch?: (profile: HeaderProfileItem) => void | Promise<void>;
}

function safeParse(raw: string | null) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function readBootstrapState(): BootstrapState | null {
  const fromBootstrap = safeParse(
    sessionStorage.getItem("ipc_post_login_bootstrap"),
  );
  if (fromBootstrap) return fromBootstrap as BootstrapState;

  const identity = safeParse(sessionStorage.getItem("ipc_login_identity"));
  if (identity) {
    return {
      identity: identity as BootstrapIdentity,
      profileContext: { activeProfiles: [], pendingProfiles: [] },
    };
  }
  return null;
}

export const LogoMark = ({
  src,
  initial,
  accent,
  size = 30,
  onClick,
}: {
  src?: string;
  initial?: string;
  accent: string;
  size?: number;
  onClick?: () => void;
}) => {
  const baseStyle: React.CSSProperties = {
    cursor: onClick ? "pointer" : "default",
    flexShrink: 0,
    transition: "opacity 0.15s, transform 0.15s",
    display: "inline-flex",
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    if (!onClick) return;
    (e.currentTarget as HTMLElement).style.opacity = "0.82";
    (e.currentTarget as HTMLElement).style.transform = "scale(0.96)";
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    if (!onClick) return;
    (e.currentTarget as HTMLElement).style.opacity = "1";
    (e.currentTarget as HTMLElement).style.transform = "scale(1)";
  };

  if (src) {
    return (
      <img
        src={src}
        alt="SLATE"
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={
          onClick
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClick();
                }
              }
            : undefined
        }
        onMouseEnter={handleMouseEnter as any}
        onMouseLeave={handleMouseLeave as any}
        style={{
          ...baseStyle,
          width: size,
          height: size,
          objectFit: "contain",
        }}
      />
    );
  }

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={
        onClick ? "SLATE logo - go to component library" : "SLATE logo"
      }
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        ...baseStyle,
        width: size,
        height: size,
        borderRadius: 8,
        background: `linear-gradient(135deg, ${accent}, ${accent}bb)`,
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
        fontSize: size * 0.45,
        color: "#fff",
        letterSpacing: "-0.5px",
        boxShadow: `0 2px 8px ${accent}44`,
      }}
    >
      <span aria-hidden="true">{initial ?? "A"}</span>
    </div>
  );
};

const ProfilePanel = ({
  open,
  onClose,
  anchorRef,
  profiles,
  selectedProfileId,
  onProfileSwitch,
  canCreateProfile,
  disabled = false,
}: {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  profiles: HeaderProfileItem[];
  selectedProfileId?: number;
  onProfileSwitch?: (profile: HeaderProfileItem) => void | Promise<void>;
  canCreateProfile: boolean;
  disabled?: boolean;
}) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const toast = useToast();
  const { can } = usePermission();

  const panelRef = useRef<HTMLDivElement>(null);
  const [switchingProfileId, setSwitchingProfileId] = useState<number | null>(
    null,
  );
  const announce = useSRAnnounce();
  const navigate = useNavigate();
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose, anchorRef]);

  useEffect(() => {
    if (!open) return;
    const firstFocusable = panelRef.current?.querySelector<HTMLElement>(
      'button, [href], input, [tabindex]:not([tabindex="-1"])',
    );
    firstFocusable?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        anchorRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  const panelBg = c.surface ?? "#ffffff";
  const borderCol = c.primaryBorder ?? "#e5e7eb";
  const textCol = c.text ?? "#111827";
  const mutedCol = c.textMuted ?? "#6b7280";
  const accentCol = c.accent ?? "#6366f1";
  const subtleBg = c.primaryLight ?? "#f9fafb";

  const switchableProfiles = profiles.filter(
    (profile) => Number(profile.tenantProfileId) !== Number(selectedProfileId),
  );
  console.log("switchableProfiles", switchableProfiles);

  const handleProfileClick = async (profile: HeaderProfileItem) => {
    if (disabled) {
      toast.info(
        "Please finish the current profile update before switching workspaces.",
      );
      return;
    }

  localStorage.setItem(
    "profile.legalEntityName",
    profile.legalEntityName ?? ""
  );
         
    if (!onProfileSwitch) return;
    try {
      setSwitchingProfileId(profile.tenantProfileId);
      await onProfileSwitch(profile);
      announce(`${profile.profileName} workspace selected`);
      onClose();
    } finally {
      setSwitchingProfileId(null);
    }
  };
  const roleUser = localStorage.getItem("uiMode");

  const assignUser = roleUser ? roleUser : null;

  console.log("assignUser", assignUser);

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Profile and workspace switcher"
      style={{
        position: "absolute",
        top: "calc(100% + 10px)",
        right: 0,
        width: 360,
        maxWidth: "calc(100vw - 24px)",
        background: panelBg,
        border: `1px solid ${borderCol}`,
        borderRadius: 18,
        boxShadow: "0 16px 42px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.06)",
        zIndex: 1000,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: 16,
          borderBottom: `1px solid ${borderCol}`,
          background: subtleBg,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            justifyContent: "space-between",
          }}
        >
          <span className="flex gap-2">
            <Layers3 size={14} color={accentCol} aria-hidden="true" />

            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: textCol,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              Switch Profile
            </span>
          </span>

          {can("ASSIGN_USER") && (
            <Button
              onClick={() => {
                if (!canCreateProfile) {
                  // alert("All available profiles have already been created.");
                  toast.info(
                    "All available profiles have already been created.",
                  );
                  return;
                }
                onClose();

                navigate("/create-profile");
              }}
              variant="primary"
              size="sm"
              className="gap-2 flex rounded-2xl cursor-pointer"
            >
              <Plus size={16} />
              <span>Create Profile</span>
            </Button>
          )}
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <div
          style={{
            display: "grid",
            gap: 10,
            maxHeight: 320,
            overflowY: "auto",
          }}
        >
          {profiles.length === 0 ? (
            <div
              style={{
                borderRadius: 14,
                padding: 14,
                border: `1px dashed ${borderCol}`,
                color: mutedCol,
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              No active profiles available for this account.
            </div>
          ) : switchableProfiles.length === 0 ? (
            <div
              style={{
                borderRadius: 14,
                padding: 14,
                border: `1px dashed ${borderCol}`,
                color: mutedCol,
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              No other profiles available to switch.
            </div>
          ) : (
            switchableProfiles.map((profile) => {
              const isSwitching =
                Number(profile.tenantProfileId) === Number(switchingProfileId);

              return (
                <button
                  key={profile.tenantProfileId}
                  onClick={() => void handleProfileClick(profile)}
                  disabled={disabled || isSwitching}
                  style={{
                    width: "100%",
                    borderRadius: 14,
                    border: `1px solid ${borderCol}`,
                    background: "#fff",
                    padding: 14,
                    textAlign: "left",
                    cursor: isSwitching ? "not-allowed" : "pointer",
                    boxShadow: "none",
                    opacity: isSwitching ? 0.7 : 1,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    {/* LEFT CONTENT */}
                    <div
                      style={{
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 800,
                          color: textCol,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {profile.profileName}
                      </div>

                      <div
                        style={{
                          marginTop: 4,
                          fontSize: 12,
                          color: mutedCol,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {profile.tenantProfileTypeDisplayName ?? "Profile"} ·{" "}
                        {profile.profileStatusName ?? "Status unavailable"}
                      </div>

                      {profile.gstNo ? (
                        <div
                          style={{
                            marginTop: 6,
                            fontSize: 11.5,
                            color: mutedCol,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          GST: {profile.gstNo}
                        </div>
                      ) : null}
                    </div>

                    {/* RIGHT SIDE */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={profile?.imageUrl || "/images/default-profile.png"}
                        alt={profile.profileName}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: `1px solid ${mutedCol}`,
                        }}
                      />

                      <ChevronRight
                        size={14}
                        color={mutedCol}
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export const TopHeader: React.FC<TopHeaderProps> = ({
  breadcrumbs = [],
  onProfileClick,
  profiles,
  selectedProfileId,
  onProfileSwitch,
}) => {
  console.log('onProfileSwitch', onProfileSwitch)
  const { theme } = useTheme();
  const c = theme.colors;
  const navigate = useNavigate();
  const announce = useSRAnnounce();
  const toast = useToast();

  const location = useLocation();
  const locationState = location.state as {
    from?: string;
    fromPath?: string;
  } | null;
  const routeHeader = getRouteHeader(location.pathname);
  const routeHeaderBackAction = getRouteHeaderBackAction(
    location.pathname,
    breadcrumbs,
    locationState,
  );

  const currentBreadcrumb = breadcrumbs[breadcrumbs.length - 1];
  const isEditingProfile =
    Boolean((location.state as { mode?: string } | null)?.mode === "edit") ||
    (location.pathname.includes("profile-onboarding") &&
      Boolean((location.state as { mode?: string } | null)?.mode === "edit"));

 
const isProjectDetailsPage =
  location.pathname.startsWith("/project-details/") ||
  location.pathname.startsWith("/edit-project/");

  const isSwitchingDisabled =
  isEditingProfile || isProjectDetailsPage;


  const headerTitle = routeHeader?.title ?? currentBreadcrumb?.label;
  const headerDescription = routeHeader?.description;
  const HeaderIcon = routeHeader?.icon;
  const headerIconColor = routeHeader?.iconColor ?? c.accent ?? "#6366f1";
  const headerIconBg = routeHeader?.iconBg;

  // const [settingsOpen, setSettingsOpen] = useState(false);
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);
  const [bootstrapState, setBootstrapState] = useState<BootstrapState | null>(
    () => readBootstrapState(),
  );

  const canCreateProfile =
    localStorage.getItem("auth.canCreateProfile") === "true";

  const [localSelectedProfileId, setLocalSelectedProfileId] = useState<
    number | undefined
  >(
    () =>
      readBootstrapState()?.profileContext?.selectedProfile?.tenantProfileId,
  );
  const manualSelectionRef = useRef<number | null>(null);
  const { switchProfile } = useSwitchProfile();

  // const settingsBtnRef = useRef<HTMLButtonElement | null>(null);
  const profileBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (breadcrumbs.length > 0) {
      const current = breadcrumbs[breadcrumbs.length - 1];
      announce(`${current.label} page loaded`);
    }
  }, [breadcrumbs, announce]);

  useEffect(() => {
    const sync = () => setBootstrapState(readBootstrapState());

    const handleBootstrapUpdate = (event: Event) => {
      const custom = event as CustomEvent;
      if (custom.detail) {
        setBootstrapState(custom.detail as BootstrapState);
      } else {
        sync();
      }
    };

    window.addEventListener("ipc:post-login-bootstrap", handleBootstrapUpdate);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener(
        "ipc:post-login-bootstrap",
        handleBootstrapUpdate,
      );
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    const nextSelectedId =
      bootstrapState?.profileContext?.selectedProfile?.tenantProfileId ??
      selectedProfileId;

    if (typeof nextSelectedId !== "number") return;

    if (
      manualSelectionRef.current !== null &&
      nextSelectedId !== manualSelectionRef.current
    ) {
      return;
    }

    setLocalSelectedProfileId(nextSelectedId);

    if (manualSelectionRef.current === nextSelectedId) {
      manualSelectionRef.current = null;
    }
  }, [selectedProfileId, bootstrapState]);

  const [role, setRole] = useState<{ value: string } | null>(null);
  const [roleLoaded, setRoleLoaded] = useState(false);

  console.log("role", role);
  useEffect(() => {
    const roleProfile = localStorage.getItem("auth.role");
    if (roleProfile) {
      setRole(JSON.parse(roleProfile));
    }
    setRoleLoaded(true);
  }, []);

  const borderCol = c.primaryBorder ?? "#e5e7eb";
  const textCol = c.primary ?? "#111827";
  const mutedCol = c.textMuted ?? "#9ca3af";
  const accentCol = c.accent ?? "#6366f1";

  const bootstrapProfileContext = bootstrapState?.profileContext ?? {};

  const effectiveProfiles =
    profiles && profiles.length > 0
      ? profiles
      : (bootstrapProfileContext.activeProfiles ?? []);

  const effectiveSelectedProfileId =
    localSelectedProfileId ??
    selectedProfileId ??
    bootstrapProfileContext.selectedProfile?.tenantProfileId;

  const selectedProfile = effectiveProfiles.find(
    (profile) =>
      Number(profile.tenantProfileId) === Number(effectiveSelectedProfileId),
  );
useEffect(() => {
  if (selectedProfile?.legalEntityName) {
    localStorage.setItem(
      "profile.legalEntityName",
      selectedProfile.legalEntityName,
    );
    localStorage.setItem("legalEntityName", selectedProfile.legalEntityName);
  }
}, [selectedProfile]);
  const handleProfileSwitch = async (profile: HeaderProfileItem) => {
    manualSelectionRef.current = profile.tenantProfileId;
    setLocalSelectedProfileId(profile.tenantProfileId);

    const optimisticBootstrap: BootstrapState = {
      ...(bootstrapState ?? {}),
      profileContext: {
        ...(bootstrapState?.profileContext ?? {}),
        selectedProfile: profile,
        activeProfiles: effectiveProfiles,
        pendingProfiles: bootstrapState?.profileContext?.pendingProfiles ?? [],
      },
    };
    setBootstrapState(optimisticBootstrap);

    if (onProfileSwitch) {
      await onProfileSwitch(profile);
      return;
    }

    try {
      await switchProfile({
        tenantProfileId: profile.tenantProfileId,
        profileName: profile.profileName,
        tenantProfileTypeId: profile.tenantProfileTypeId,
        tenantProfileTypeName: profile.tenantProfileTypeName,
        profileStatusId: profile.profileStatusId,
        profileStatusName: profile.profileStatusName,
        gstNo: profile.gstNo ?? undefined,
        isActive: profile.isActive,
      });

      const refreshed = readBootstrapState();
      if (refreshed) setBootstrapState(refreshed);
    } catch (err) {
      console.error("Profile switch failed", err);
    }
  };

  const handleHeaderBack = () => {
    if (routeHeaderBackAction?.to) {
      navigate(routeHeaderBackAction.to);
    }
  };

  const { profileId: activeProfileIdFromContext } = useActiveProfile();

  const isKycVerified = JSON.parse(
    localStorage.getItem("isKycVerified") ?? "false",
  );

  const tenantProfileId =
    activeProfileIdFromContext > 0 ? activeProfileIdFromContext : null;

  const handleKycVerification = async () => {
    try {
      const tenant_id: any = JSON.parse(
        localStorage.getItem("auth.tenantId") || "null",
      );
      const tenantId = tenant_id?.value || tenant_id;

      const response: any = await apiService.post("idam/get_by_id_tenant_kyc", {
        tenantId,
      });

      console.log("KYC Response:", response);

      // Navigate to the KYC page
      navigate("/kyc-verification", {
        state: {
          kycData: response?.data,
        },
      }) as any;
    } catch (error) {
      console.error("Failed to fetch KYC details:", error);
      toast.error("Unable to load KYC details.");
    }
  };
  return (
    <header
      style={{
        minHeight: "75px",
        maxHeight: "75px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingInline: "clamp(16px, 3vw, 28px)",
        background: c.surface ?? "#ffffff",
        borderBottom: `1px solid ${borderCol}`,
        position: "sticky",
        top: 0,
        zIndex: 100,
        transition: "background 0.25s, border-color 0.25s",
        gap: 16,
      }}
    >
      <a
        href="#main-content"
        style={{
          position: "absolute",
          left: -9999,
          top: "auto",
          width: 1,
          height: 1,
          overflow: "hidden",
        }}
        onFocus={(e) => {
          e.currentTarget.style.left = "16px";
          e.currentTarget.style.top = "16px";
          e.currentTarget.style.width = "auto";
          e.currentTarget.style.height = "auto";
          e.currentTarget.style.padding = "8px 12px";
          e.currentTarget.style.background = "#000";
          e.currentTarget.style.color = "#fff";
          e.currentTarget.style.zIndex = "9999";
        }}
        onBlur={(e) => {
          e.currentTarget.style.left = "-9999px";
        }}
      >
        Skip to main content
      </a>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 0,
          minWidth: 0,
          flex: 1,
        }}
      >
        {/* Empty logo slot */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            flexShrink: 0,
          }}
        />

        {/* Back button slot - always 32×32, hidden on dashboard */}
        <div
          style={{
            width: 32,
            height: 32,
            flexShrink: 0,
            marginRight: 16,
            visibility: routeHeaderBackAction ? "visible" : "hidden",
          }}
        >
          <Tooltip
            content={routeHeaderBackAction?.title ?? ""}
            placement="bottom"
            trigger="hover"
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleHeaderBack}
              aria-label={routeHeaderBackAction?.ariaLabel ?? ""}
              tabIndex={routeHeaderBackAction ? 0 : -1}
              className="group flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-ipc-border bg-ipc-surface p-0! shadow-[0_1px_4px_rgba(15,23,42,0.07)] transition-all duration-150 hover:border-ipc-surface hover:bg-ipc-surface hover:shadow-[0_3px_10px_rgba(23,33,66,0.22)] active:scale-95 focus-visible:ring-2 focus-visible:ring-ipc-surface/30"
            >
              <ArrowLeft
                size={14}
                strokeWidth={2.5}
                className="text-ipc-text-secondary transition-all duration-150 group-hover:-translate-x-0.5 group-hover:text-black"
              />
            </Button>
          </Tooltip>
        </div>

        {/* Vertical divider - always present, hidden on dashboard */}
        <div
          aria-hidden="true"
          style={{
            width: 1,
            height: 28,
            backgroundColor: c.primaryBorder ?? "#e5e7eb",
            flexShrink: 0,
            marginRight: 16,
            borderRadius: 1,
            opacity: 0.7,
            visibility: routeHeaderBackAction ? "visible" : "hidden",
          }}
        />

        {/* Icon + Title + Description - pixel-locked position always */}
        {(headerTitle || HeaderIcon) && (
          <div className="flex min-w-0 items-center gap-3">
            {HeaderIcon && (
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ring-1 ring-inset"
                style={{
                  color: headerIconColor,
                  backgroundColor: headerIconBg ?? `${headerIconColor}14`,
                  borderColor: `${headerIconColor}30`,
                  boxShadow: `0 2px 8px ${headerIconColor}22, inset 0 1px 0 rgba(255,255,255,0.6)`,
                }}
              >
                <HeaderIcon
                  size={20}
                  strokeWidth={2}
                  className="text-inherit drop-shadow-sm"
                />
              </span>
            )}
            <div className="min-w-0">
              {headerTitle && (
                <h1 className="m-0 truncate text-[16px] font-bold leading-tight tracking-[-0.01em] text-ipc-primary">
                  {headerTitle}
                </h1>
              )}
              {headerDescription && (
                <p className="m-0 mt-0.5 truncate text-xs leading-none text-ipc-text-muted">
                  {headerDescription}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      {tenantProfileId && (
        <div
          className={`flex items-center gap-2.5 shrink-0 px-3 py-1.5 rounded-[14px] text-xs font-medium ${
            isKycVerified
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
          }`}
        >
          <Button
            variant="ghost"
            size="sm"
            className={`cursor-pointer ${
              isKycVerified
                ? "text-green-700 hover:bg-green-100"
                : "text-yellow-700 hover:bg-yellow-200"
            }`}
            onClick={() => {
              if (!isKycVerified) {
                handleKycVerification();
              }
            }}
          >
            {isKycVerified ? "KYC Verified" : "Get KYC Verified"}
          </Button>
        </div>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexShrink: 0,
        }}
      >
        {/* <div style={{ position: "relative" }}>
          <Button
            ref={settingsBtnRef}
            variant="ghost"
            size="sm"
            onClick={() => {
              setSettingsOpen((p) => {
                const next = !p;
                if (next) setProfilePanelOpen(false);
                announce(next ? "Preferences opened" : "Preferences closed");
                return next;
              });
            }}
            aria-label="Open preferences"
            aria-expanded={settingsOpen}
            aria-haspopup="dialog"
            style={{
              width: 36,
              height: 36,
              padding: 0,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `1px solid ${settingsOpen ? accentCol : "transparent"}`,
              background: settingsOpen ? `${accentCol}12` : "transparent",
              color: settingsOpen ? accentCol : mutedCol,
              boxShadow: "none",
            }}
          >
            <Palette
              size={17}
              color={accentCol}
              aria-hidden="true"
              style={{
                transition: "transform 0.4s cubic-bezier(0.34,1.56,0.64,1)",
                transform: settingsOpen ? "rotate(45deg)" : "rotate(0deg)",
              }}
            />
          </Button>

          <SettingsPanel
            open={settingsOpen}
            onClose={() => {
              setSettingsOpen(false);
              announce("Preferences closed");
            }}
            anchorRef={settingsBtnRef}
          />
        </div> */}

        <div style={{ position: "relative" }}>
          {roleLoaded && role?.value !== "Super Admin" && (
            <Button
              className="cursor-pointer "
              ref={profileBtnRef}
              variant="ghost"
              size="sm"
              onClick={() => {
                if (isSwitchingDisabled) {
                  toast.info(
                    "Please finish the current profile update before switching workspaces.",
                  );
                  return;
                }
                setProfilePanelOpen((p) => {
                  const next = !p;
                  announce(
                    next
                      ? "Profile switcher opened"
                      : "Profile switcher closed",
                  );
                  return next;
                });
                onProfileClick?.();
              }}
              aria-label="Workspace profile switcher"
              aria-expanded={profilePanelOpen}
              aria-haspopup="dialog"
              disabled={isSwitchingDisabled}
             title={
  isSwitchingDisabled
    ? "Please finish the current operation before switching workspaces."
    : "Open workspace switcher"
}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "4px 18px",
                borderRadius: 14,
                boxShadow: "none",
                background: profilePanelOpen ? `${accentCol}12` : "transparent",
                border: `1px solid ${profilePanelOpen ? accentCol : borderCol}`,
                color: textCol,
                minWidth: 0,
                maxWidth: 290,
              }}
            >
              {/* <Layers3 size={15} color={accentCol} aria-hidden="true" /> */}
              <div
                style={{
                  minWidth: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                {/* LEFT CONTENT */}
                <div style={{ minWidth: 0, textAlign: "left", flex: 1 }}>
                  <div
                    style={{
                      fontSize: 12.5,
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      color: textCol,
                    }}
                  >
                    {selectedProfile?.profileName ?? "Select Profile"}
                  </div>

                  <div
                    style={{
                      marginTop: 2,
                      fontSize: 11,
                      color: mutedCol,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      paddingTop: 2,
                    }}
                  >
                    {selectedProfile?.tenantProfileTypeDisplayName ??
                      "Workspace"}
                  </div>
                </div>

                {/* RIGHT IMAGE */}
                <img
                  src={
                    selectedProfile?.imageUrl || "/images/default-profile.png"
                  }
                  alt={selectedProfile?.profileName}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    objectFit: "cover",
                    flexShrink: 0,
                    border: `1px solid ${mutedCol}`,
                  }}
                />
              </div>
              <ChevronDown size={14} color={mutedCol} aria-hidden="true" />
            </Button>
          )}

          <ProfilePanel
            open={profilePanelOpen}
            onClose={() => {
              setProfilePanelOpen(false);
              announce("Profile switcher closed");
            }}
            anchorRef={profileBtnRef}
            profiles={effectiveProfiles}
            selectedProfileId={effectiveSelectedProfileId}
            onProfileSwitch={handleProfileSwitch}
            canCreateProfile={canCreateProfile}
              disabled={isSwitchingDisabled}

          />
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
