import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  profileBootstrapService,
  type ProfileLite,
} from "@/services/profile/profileBootstrapService";

// ─── Storage keys ───────────────────────────────────────────────────────────
// These are the ONLY place in the app these key names should appear.
// Every read/write of profile data must go through this file.
const KEYS = {
  profileId: "auth.profileId",
  profiletype: "auth.profiletype",
  tenantProfileTypeId: "auth.tenantProfileTypeId",
  tenantProfileId: "auth.tenantProfileId",
  ownerAuthUserId: "auth.ownerAuthUserId",
  legalName: "legalEntityName",
  // Monotonic counter, bumped on every write from any tab. Lets a tab
  // detect "the stored profile changed since I last looked", even if
  // writers race or write the same value twice.
  version: "auth.profile.version",
} as const;

// Per-tab identity. sessionStorage is correctly scoped per-tab (this is the
// one piece of state that SHOULD live there) so each tab can tell whether a
// given storage write originated from itself or from a sibling tab.
const TAB_ID_KEY = "ipc.tabId";
const getTabId = (): string => {
  let id = sessionStorage.getItem(TAB_ID_KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `tab_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(TAB_ID_KEY, id);
  }
  return id;
};

export type ActiveProfile = {
  profileId: number;
  profiletype: string;
  tenantProfileTypeId: number;
  tenantProfileId: number;
  ownerAuthUserId: number;
  legalName: string | null;
};

const EMPTY_PROFILE: ActiveProfile = {
  profileId: 0,
  profiletype: "",
  tenantProfileTypeId: 0,
  tenantProfileId: 0,
  ownerAuthUserId: 0,
  legalName: null,
};

const readFromStorage = (): ActiveProfile => ({
  profileId: Number(localStorage.getItem(KEYS.profileId) ?? 0),
  profiletype: localStorage.getItem(KEYS.profiletype) ?? "",
  tenantProfileTypeId: Number(
    localStorage.getItem(KEYS.tenantProfileTypeId) ?? 0,
  ),
  tenantProfileId: Number(localStorage.getItem(KEYS.tenantProfileId) ?? 0),
  ownerAuthUserId: Number(localStorage.getItem(KEYS.ownerAuthUserId) ?? 0),
  legalName: localStorage.getItem(KEYS.legalName),
});

const readVersion = (): number =>
  Number(localStorage.getItem(KEYS.version) ?? 0);

const writeToStorage = (next: Partial<ActiveProfile>, tabId: string) => {
  if (next.profiletype !== undefined)
    localStorage.setItem(KEYS.profiletype, String(next.profiletype ?? ""));
  if (next.profileId !== undefined)
    localStorage.setItem(KEYS.profileId, String(next.profileId ?? ""));
  if (next.tenantProfileTypeId !== undefined)
    localStorage.setItem(
      KEYS.tenantProfileTypeId,
      String(next.tenantProfileTypeId ?? ""),
    );
  if (next.tenantProfileId !== undefined)
    localStorage.setItem(
      KEYS.tenantProfileId,
      String(next.tenantProfileId ?? ""),
    );
  if (next.ownerAuthUserId !== undefined)
    localStorage.setItem(
      KEYS.ownerAuthUserId,
      String(next.ownerAuthUserId ?? ""),
    );
  if (next.legalName !== undefined)
    localStorage.setItem(KEYS.legalName, String(next.legalName ?? ""));

  const nextVersion = readVersion() + 1;
  localStorage.setItem(KEYS.version, String(nextVersion));
  // Tag which tab made this write - read by sibling tabs' "storage" handler
  // so we can decide whether a cross-tab update should be adopted silently
  // or (later, if you want it) surfaced to the user as "switched elsewhere".
  localStorage.setItem("auth.profile.writerTabId", tabId);
  return nextVersion;
};

type ProfileContextValue = {
  /** Current profile snapshot. Always safe to read; never stale beyond one render. */
  profile: ActiveProfile;
  /** Bumps on every accepted profile change, from this tab or another. */
  profileVersion: number;
  /** Re-reads storage and updates state. Rarely needed directly, prefer reacting to profileVersion. */
  refreshProfile: () => void;
  /**
   * The ONLY supported way to change the active profile.
   * Handles the API call, the storage write, the version bump, and
   * guards against a slow/late network response from a previous
   * switch overwriting a newer one (see requestIdRef below).
   */
  switchProfile: (profile: ProfileLite) => Promise<void>;
  /** True while a switchProfile() call is in flight. */
  isSwitching: boolean;
  /** Error from the most recent switchProfile() call, if it failed. */
  switchError: string | null;
  /** This tab's stable identity, exposed for components that need to ignore their own writes in custom listeners. */
  tabId: string;
};

const ProfileCtx = createContext<ProfileContextValue>({
  profile: EMPTY_PROFILE,
  profileVersion: 0,
  refreshProfile: () => {},
  switchProfile: async () => {},
  isSwitching: false,
  switchError: null,
  tabId: "",
});

export const ProfileContextProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const tabId = useMemo(() => getTabId(), []);
  const [profile, setProfile] = useState<ActiveProfile>(readFromStorage);
  const [profileVersion, setProfileVersion] = useState<number>(readVersion);
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  // Guards against race conditions when profiles are switched in quick
  // succession: if switch A is still awaiting its API response when switch
  // B starts, A's response must NOT be allowed to clobber B's result once
  // it eventually resolves. Each call gets an incrementing ticket; only the
  // response matching the CURRENT ticket is allowed to write to state/storage.
  const requestIdRef = useRef(0);

  const refreshProfile = useCallback(() => {
    setProfile(readFromStorage());
    setProfileVersion(readVersion());
  }, []);

  // ── Same-tab updates: login bootstrap still dispatches this event ──────
  useEffect(() => {
    const handler = () => refreshProfile();
    window.addEventListener("ipc:post-login-bootstrap", handler);
    return () =>
      window.removeEventListener("ipc:post-login-bootstrap", handler);
  }, [refreshProfile]);

  // ── Cross-tab updates: the native "storage" event fires in every tab
  // EXCEPT the one that made the write, which is exactly what we want,
  // this tab adopts the change another tab made, without re-triggering
  // its own write loop. This is the actual fix for multi-tab corruption:
  // every tab converges on the same value instead of each tab keeping an
  // independent, possibly stale, copy in component-local state. ───────────
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      // Only react to keys we own; ignore unrelated storage writes.
      if (e.key && !Object.values(KEYS).includes(e.key as any)) return;
      const incomingVersion = readVersion();
      // Only adopt if the version actually moved forward, avoids redundant
      // re-renders when the event fires for a key we don't care about, and
      // avoids ever moving backward if events arrive out of order.
      setProfileVersion((current) => {
        if (incomingVersion <= current) return current;
        setProfile(readFromStorage());
        return incomingVersion;
      });
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const switchProfile = useCallback(
    async (nextProfile: ProfileLite) => {
      const myRequestId = ++requestIdRef.current;
      setIsSwitching(true);
      setSwitchError(null);

      try {
        const bootstrap = await profileBootstrapService.resolveBootstrap(
          nextProfile.tenantProfileId,
        );

        // A newer switchProfile() call started while we were awaiting the
        // network, this response is stale. Discard it silently; the newer
        // call's response (or the one after it) is the one that should win.
        if (myRequestId !== requestIdRef.current) return;

        const selected = bootstrap?.profileContext?.selectedProfile;
        const identity = bootstrap?.identity;
        const tenantProfileTypeId = selected?.tenantProfileTypeId ?? 0;
        const profileId =
          selected?.tenantProfileId ?? nextProfile.tenantProfileId;
        const profiletype =
          selected?.tenantProfileTypeName ??
          nextProfile.tenantProfileTypeName ??
          "";

        const roleName = (identity?.roleName ?? "").toLowerCase();
        const isManagerOrAnalyst =
          roleName.includes("manager") || roleName.includes("analyst");
        const ownerAuthUserId = isManagerOrAnalyst
          ? 0
          : Number(identity?.authUserId ?? 0);

        const legalName =
          (selected as { legalEntityName?: string | null })?.legalEntityName ??
          null;

        const nextVersion = writeToStorage(
          {
            profileId,
            profiletype,
            tenantProfileTypeId,
            tenantProfileId: profileId,
            ownerAuthUserId,
            legalName,
          },
          tabId,
        );

        if (myRequestId !== requestIdRef.current) return;

        setProfile(readFromStorage());
        setProfileVersion(nextVersion);

        // Still dispatched for any legacy same-tab listeners (TopHeader /
        // Sidebar bootstrapState) during migration. Safe to remove once the
        // migration steps below are complete and those components read
        // from this context instead.
        window.dispatchEvent(
          new CustomEvent("ipc:post-login-bootstrap", { detail: bootstrap }),
        );
      } catch (err: any) {
        if (myRequestId !== requestIdRef.current) return;
        setSwitchError(err?.message ?? "Failed to switch profile");
        throw err;
      } finally {
        if (myRequestId === requestIdRef.current) setIsSwitching(false);
      }
    },
    [tabId],
  );

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      profileVersion,
      refreshProfile,
      switchProfile,
      isSwitching,
      switchError,
      tabId,
    }),
    [
      profile,
      profileVersion,
      refreshProfile,
      switchProfile,
      isSwitching,
      switchError,
      tabId,
    ],
  );

  return <ProfileCtx.Provider value={value}>{children}</ProfileCtx.Provider>;
};

/** Returns the current active profile object. Re-renders on every profile change, from this tab or another. */
export const useActiveProfile = (): ActiveProfile =>
  useContext(ProfileCtx).profile;

/**
 * Returns a number that increments on every profile switch, from this tab
 * OR a sibling tab. Use as a useEffect dependency to re-fetch data whenever
 * the active profile changes, even if the profile IDs happen to repeat:
 *
 *   const profileVersion = useProfileVersion();
 *   useEffect(() => { fetchProjects(); }, [profileVersion]);
 */
export const useProfileVersion = (): number =>
  useContext(ProfileCtx).profileVersion;

/** Returns the refreshProfile callback for manual triggers. Prefer reacting to profileVersion in useEffect over calling this directly. */
export const useRefreshProfile = (): (() => void) =>
  useContext(ProfileCtx).refreshProfile;

/**
 * The single supported way to change the active profile anywhere in the
 * app. Do not write to auth.profileId / auth.tenantProfileId / etc.
 * directly from a component, route every switch through this.
 */
export const useSwitchProfile = () => {
  const { switchProfile, isSwitching, switchError } = useContext(ProfileCtx);
  return { switchProfile, isSwitching, switchError };
};


export const seedInitialProfile = (profile: Partial<ActiveProfile>) => {
  writeToStorage(profile, getTabId());
  window.dispatchEvent(new CustomEvent("ipc:post-login-bootstrap"));
};

export const useProfileContext = () => useContext(ProfileCtx);