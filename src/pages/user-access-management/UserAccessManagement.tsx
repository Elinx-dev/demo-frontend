import React, { useEffect, useMemo, useState } from "react";
import {
  Shield,
  PanelsTopLeft,
  Boxes,
  UserPlus,
  Plus,
  RefreshCw,
  Loader2,
  AlertCircle,
  Search,
  GitMerge,
  GitPullRequest,
  KeyRound,
} from "lucide-react";
import { useToast } from "@/ui/feedback/toast/ToastProvider";
import { apiService } from "@/services/api/apiService";
import { authService } from "@/services/auth/authService";
import DataTable from "@/ui/primitives/DataTable/DataTable";
import { Tabs } from "@/ui/primitives/Tabs/Tabs";
import { Button } from "@/ui/primitives/Button/Button";
import CreateUserModal from "./modals/CreateUserModal";
import AddRoleModal from "./modals/AddRoleModal";
import AddMenuModal from "./modals/AddMenuModal";
import AddModuleModal from "./modals/AddModuleModal";
import AddPermissionModal from "./modals/AddPermissionModal";

type AnyObj = Record<string, any>;

// ---- ENV / BASES -----------------------------------------------------------
// const IDAM_PATH =
//   (import.meta as any).env?.VITE_IAM_API_PATH || "/api/tyme/idam/v1/";
// const BUMI_DOMAIN_PATH =
//   (import.meta as any).env?.VITE_API_BUMI_DOMAIN_PATH || "/api/elinx/bumi/v1/";

// ---- PARSERS (robust to shape) --------------------------------------------
function pick<T = any>(obj: any, path: string, fallback?: any): T {
  try {
    const parts = path.split(".");
    let cur: any = obj;
    for (const p of parts) cur = cur?.[p];
    return (cur ?? fallback) as T;
  } catch {
    return fallback as T;
  }
}

function unwrapArray(resp: AnyObj): any[] {
  const candidates = [
    resp?.data?.data,
    resp?.data?.Data,
    resp?.data,
    resp?.Data,
    resp,
  ];
  for (const c of candidates) if (Array.isArray(c)) return c;
  return [];
}

function parseUsers(resp: AnyObj) {
  const arr = unwrapArray(resp);
  return arr.map((u: AnyObj) => ({
    authUserId: Number(u?.authUserId ?? u?.id ?? 0),
    username: String(u?.username ?? u?.authUserName ?? ""),
    tenantId: Number(u?.tenantId ?? 0),
    tenantName: String(u?.tenantName ?? ""),
    tenantCode: String(u?.tenantCode ?? ""),
    roleId: Number(u?.roleId ?? 0),
    roleName: String(u?.roleName ?? ""),
    isActive: !!u?.isActive,
  }));
}

function parseRoles(resp: AnyObj) {
  const nested = pick<any[]>(resp, "data.get_all_role.data", undefined);
  const arr = Array.isArray(nested) ? nested : unwrapArray(resp);

  return arr.map((r: AnyObj) => ({
    roleId: Number(r?.roleId ?? r?.id ?? 0),
    roleName: String(r?.roleName ?? r?.name ?? ""),
    tenantId: Number(r?.tenantId ?? 0),
    tenantName: String(r?.tenantName ?? ""),
    isActive: r?.isActive !== false,
    mediaLink: r?.mediaLink ?? null,
  }));
}

function parsePermissions(resp: AnyObj) {
  const arr = unwrapArray(resp);
  return arr.map((p: AnyObj) => ({
    permissionId: Number(p?.permissionId ?? p?.id ?? 0),
    permissionName: String(p?.permissionName ?? p?.name ?? ""),
    isActive: p?.isActive !== false,
    mediaLink: p?.mediaLink ?? null,
    menuId: p.menuId,
    menuName: p.menuName,
  }));
}

function parseMenus(resp: AnyObj) {
  const arr = unwrapArray(resp);
  return arr.map((m: AnyObj) => ({
    menuId: Number(m?.menuId ?? m?.id ?? 0),
    menuName: String(m?.menuName ?? m?.name ?? ""),
    menuLevel: Number(m?.menuLevel ?? 1),
    parentId: m?.parentId ? Number(m?.parentId) : null,
    parentMenuName: m?.parentMenuName ?? null,
    menuRoute: m?.menuRoute ?? null,
    menuLink: m?.menuLink ?? null,
    menuIcon: m?.menuIcon ?? null,
    menuSortOrder: m?.menuSortOrder ? Number(m?.menuSortOrder) : null,
    isActive: m?.isActive !== false,
    mediaLink: m?.mediaLink ?? null,
  }));
}

function parseModules(resp: AnyObj) {
  const arr = unwrapArray(resp);
  return arr.map((m: AnyObj) => ({
    moduleId: Number(m?.moduleId ?? m?.id ?? 0),
    moduleName: String(m?.moduleName ?? m?.name ?? ""),
    menuName: String(m?.menuName ?? ""),
    isActive: m?.isActive !== false,
    isTechModule: !!m?.isTechModule,
    mediaLink: m?.mediaLink ?? null,
  }));
}

const tabs = [
  // { id: "overview", label: "Overview", icon: RefreshCw },
  { id: "users", label: "Users", icon: UserPlus },
  { id: "roles", label: "Roles", icon: Shield },
  { id: "menus", label: "Menus", icon: PanelsTopLeft },
  { id: "modules", label: "Modules", icon: Boxes },
  // Separate mapping tabs:
  { id: "mapModuleMenu", label: "Module ⇄ Menu", icon: GitMerge },
  { id: "mapMenuPermission", label: "Menu ⇄ Permission", icon: GitPullRequest },
  { id: "mapRolePermission", label: "Role ⇄ Permission", icon: KeyRound },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function IAMManager() {
  const toast = useToast();
  const [active, setActive] = useState<any>("users");
  useEffect(() => {
    console.log("TAB CHANGED 👉", active);
  }, [active]);

  const [loading, setLoading] = useState(false);
  const auth = {
    tenantId: authService.getTenantId(),
    clientId: 0,
    sessionUserId: authService.getSession()?.userId ?? "",
  };
  // data
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [menus, setMenus] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  console.log(permissions);
  // search
  const [userSearch, setUserSearch] = useState("");
  const [permissionSearch, setPermissionSearch] = useState("");

  // mapping state - Module ⇄ Menu (checkbox grid)
  const [selectedModuleId, setSelectedModuleId] = useState<number | "">("");
  const [moduleMenuList, setModuleMenuList] = useState<
    {
      menuId: number;
      menuName: string;
      isMapped: boolean;
      moduleMenuId?: number;
    }[]
  >([]);
  const [moduleMenuSnapshot, setModuleMenuSnapshot] = useState<
    {
      menuId: number;
      isMapped: boolean;
      moduleMenuId?: number;
    }[]
  >([]);
  const [savingModuleMap, setSavingModuleMap] = useState(false);

  // mapping state - Menu ⇄ Permission
  const [selectedMenuId, setSelectedMenuId] = useState<number | "">("");

  // mapping state - Role ⇄ Permission (checkbox grid)
  const [selectedRoleId, setSelectedRoleId] = useState<number | "">("");
  const [rolePermList, setRolePermList] = useState<
    {
      permissionId: number;
      permissionName: string;
      isMapped: boolean;
      rolePermissionId?: number;
    }[]
  >([]);
  const [rolePermSnapshot, setRolePermSnapshot] = useState<
    {
      permissionId: number;
      isMapped: boolean;
      rolePermissionId?: number;
    }[]
  >([]);
  const [savingRoleMap, setSavingRoleMap] = useState(false);

  // modals
  const [openRoleModal, setOpenRoleModal] = useState(false);
  const [openMenuModal, setOpenMenuModal] = useState(false);
  const [openModuleModal, setOpenModuleModal] = useState(false);
  const [openPermissionModal, setOpenPermissionModal] = useState(false);
  const [openCreateUserModal, setOpenCreateUserModal] = useState(false);

  const refreshAll = async () => {
    setLoading(true);
    try {
      // ONLY DASHBOARD / OVERVIEW DATA
      const results = await Promise.allSettled([
        apiService.get<AnyObj>(
          // `idam/get_all_users_of_tenant?tenantId=${auth.tenantId}`,
          `idam/get_all_users_of_tenant?tenantId=${null}`,
        ),
        apiService.get<AnyObj>(
          `idam/get_all_role_of_tenant?tenantId=${auth.tenantId}`,
        ),
        apiService.get<AnyObj>(`idam/get_all_menus`),
        apiService.get<AnyObj>(`idam/get_all_modules`),
        // apiService.post<AnyObj>(`get_all_tenant_of_client`, {
        //   clientId: auth?.clientId ?? 0,
        // }),
      ] as const);

      const [uRes, rRes, meRes, moRes] = results;

      if (uRes.status === "fulfilled") setUsers(parseUsers(uRes.value));
      if (rRes.status === "fulfilled") setRoles(parseRoles(rRes.value));
      if (meRes.status === "fulfilled") setMenus(parseMenus(meRes.value));
      if (moRes.status === "fulfilled") setModules(parseModules(moRes.value));
      // if (tRes.status === "fulfilled") setTenants(parseTenants(tRes.value));

      // Only show a toast if *everything* failed (so we don't spam users)
      const anySuccess = results.some((x) => x.status === "fulfilled");
      if (!anySuccess) toast.error("Failed to load overview");
    } catch (e: any) {
      toast.error(e?.message || "Failed to load overview");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!active) return;

    console.log("Loading data for tab:", active);

    switch (active) {
      case "users":
        apiService
          .get<AnyObj>(`idam/get_all_users_of_tenant?tenantId=${auth.tenantId}`)
          .then((res: any) => setUsers(parseUsers(res)));
        break;

      case "roles":
        apiService
          .get<AnyObj>(`idam/get_all_role_of_tenant?tenantId=${auth.tenantId}`)
          .then((res: any) => setRoles(parseRoles(res)));
        break;

      case "menus":
        apiService
          .get<AnyObj>(`idam/get_all_menus`)
          .then((res: any) => setMenus(parseMenus(res)));
        break;

      case "modules":
        apiService
          .get<AnyObj>(`idam/get_all_modules`)
          .then((res: any) => setModules(parseModules(res)));
        break;

      case "mapMenuPermission":
        apiService
          .get<AnyObj>(`idam/get_all_permissions`)
          .then((res: any) => setPermissions(parsePermissions(res)));
        break;

      case "mapRolePermission":
        apiService
          .get<AnyObj>(`idam/get_all_permissions`)
          .then((res: any) => setPermissions(parsePermissions(res)));
        break;

      default:
        break;
    }
  }, [active]);

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadModuleMapping = async (moduleId: number) => {
    setSelectedModuleId(moduleId);
    setModuleMenuList([]);
    setModuleMenuSnapshot([]);
    try {
      const res = await apiService.get<AnyObj>(
        `idam/get_map_unmap_module_menu_by_module_id?moduleId=${moduleId}`,
      );
      const mapped = pick<any[]>(res, "data.mapped_permissions", []) || [];
      const unmapped = pick<any[]>(res, "data.unmapped_permissions", []) || [];

      const menuMap = new Map<
        number,
        {
          menuId: number;
          menuName: string;
          isMapped: boolean;
          moduleMenuId?: number;
        }
      >();

      // Process mapped menus
      mapped.forEach((x: any) => {
        const mid = Number(x.menuId);
        if (!mid) return;
        menuMap.set(mid, {
          menuId: mid,
          menuName: String(x.menuName ?? `Menu #${mid}`),
          isMapped: true,
          moduleMenuId: Number(x.moduleMenuId ?? 0) || undefined,
        });
      });

      // Process unmapped menus - only add if not already mapped
      unmapped.forEach((x: any) => {
        const mid = Number(x.menuId);
        if (!mid || menuMap.has(mid)) return;
        menuMap.set(mid, {
          menuId: mid,
          menuName: String(x.menuName ?? `Menu #${mid}`),
          isMapped: false,
        });
      });

      const list = Array.from(menuMap.values()).sort((a, b) =>
        a.menuName.localeCompare(b.menuName),
      );

      setModuleMenuList(list);
      setModuleMenuSnapshot(
        list.map((m) => ({
          menuId: m.menuId,
          isMapped: m.isMapped,
          moduleMenuId: m.moduleMenuId,
        })),
      );
    } catch (e: any) {
      toast.error(e?.message || "Failed to load module mapping");
    }
  };

  const loadMenuMapping = async (menuId: number) => {
    setSelectedMenuId(menuId);
    try {
      const mp = await apiService.get<AnyObj>(`idam/get_all_menu_permission`);
      void mp;
    } catch (e: any) {
      toast.error(e?.message || "Failed to load menu permissions");
    }
  };

  // Load role permissions grouped by menu, flatten to unique permission list
  const loadRolePermissions = async (roleId: number) => {
    setSelectedRoleId(roleId);
    setRolePermList([]);
    setRolePermSnapshot([]);

    if (!roleId) return;

    try {
      const res = await apiService.get<AnyObj>(
        `idam/get_map_unmap_role_permission_by_role_id?roleId=${roleId}`,
      );

      const mappedGroups =
        pick<any[]>(res, "data.mapped_permissions", []) || [];
      const unmappedGroups =
        pick<any[]>(res, "data.unmapped_permissions", []) || [];

      // Build a map of permissionId -> { name, isMapped, rolePermissionId }
      const permMap = new Map<
        number,
        {
          permissionId: number;
          permissionName: string;
          isMapped: boolean;
          rolePermissionId?: number;
        }
      >();

      // Process mapped permissions first
      mappedGroups.forEach((g: any) => {
        (g?.permissions || []).forEach((p: any) => {
          const pid = Number(p.permissionId ?? 0);
          if (!pid) return;
          if (!permMap.has(pid)) {
            permMap.set(pid, {
              permissionId: pid,
              permissionName: String(p.permissionName ?? ""),
              isMapped: true,
              rolePermissionId: Number(p.rolePermissionId ?? 0) || undefined,
            });
          }
        });
      });

      // Process unmapped permissions - only add if not already mapped
      unmappedGroups.forEach((g: any) => {
        (g?.permissions || []).forEach((p: any) => {
          const pid = Number(p.permissionId ?? 0);
          if (!pid || permMap.has(pid)) return;
          permMap.set(pid, {
            permissionId: pid,
            permissionName: String(p.permissionName ?? ""),
            isMapped: false,
          });
        });
      });

      const list = Array.from(permMap.values()).sort((a, b) =>
        a.permissionName.localeCompare(b.permissionName),
      );

      setRolePermList(list);
      // Keep a snapshot for diffing
      setRolePermSnapshot(
        list.map((p) => ({
          permissionId: p.permissionId,
          isMapped: p.isMapped,
          rolePermissionId: p.rolePermissionId,
        })),
      );
    } catch (e: any) {
      toast.error(e?.message || "Failed to load role permissions");
    }
  };

  const createRole = async (payload: {
    roleName: string;
    tenantId: number;
    isActive: boolean;
    mediaLink?: string | null;
  }) => {
    await apiService.post<AnyObj>(`idam/create_role`, payload);
    const r = await apiService.get<AnyObj>(
      `idam/get_all_role_of_tenant?tenantId=${auth.tenantId}`,
    );
    setRoles(parseRoles(r));
  };

  const createMenu = async (payload: {
    menuName: string;
    parentId: number | null;
    menuLevel: number;
    menuRoute?: string | null;
    menuLink?: string | null;
    menuIcon?: string | null;
    menuSortOrder?: number | null;
    isActive: boolean;
    mediaLink?: string | null;
  }) => {
    await apiService.post<AnyObj>(`idam/create_menu`, payload);
    const m = await apiService.get<AnyObj>(`idam/get_all_menus`);
    setMenus(parseMenus(m));
  };

  const createModule = async (payload: {
    moduleName: string;
    isTechModule: boolean;
    isActive: boolean;
    mediaLink?: string | null;
  }) => {
    await apiService.post<AnyObj>(`idam/create_module`, payload);
    const mo = await apiService.get<AnyObj>(`idam/get_all_modules`);
    setModules(parseModules(mo));
  };

  const createPermission = async (payload: {
    permissionName: string;
    menuId: number;
    isActive: boolean;
    mediaLink?: string | null;
  }) => {
    await apiService.post<AnyObj>(`idam/create_menu_permission`, payload);
    const p = await apiService.get<AnyObj>(`idam/get_all_permissions`);
    setPermissions(parsePermissions(p));
  };

  const saveModuleMenuMapping = async (moduleId: number) => {
    setSavingModuleMap(true);
    try {
      const snapshotMap = new Map(moduleMenuSnapshot.map((s) => [s.menuId, s]));

      // Newly checked (was not mapped, now is mapped)
      const toAdd = moduleMenuList.filter((m) => {
        const snap = snapshotMap.get(m.menuId);
        return m.isMapped && (!snap || !snap.isMapped);
      });

      // Newly unchecked (was mapped, now is not mapped)
      const toRemove = moduleMenuList.filter((m) => {
        const snap = snapshotMap.get(m.menuId);
        return !m.isMapped && snap?.isMapped;
      });

      // ADD
      if (toAdd.length) {
        const payload: AnyObj = {
          mappedPermissions: toAdd.map((m) => ({
            menuId: m.menuId,
            moduleId,
            isActive: true,
          })),
          unmappedPermissions: [],
        };
        await apiService.post<AnyObj>(
          `idam/create_map_unmap_module_menu`,
          payload,
        );
      }

      // REMOVE - call delete_module_menu for each
      await Promise.all(
        toRemove.map((m) => {
          const snap = snapshotMap.get(m.menuId);
          return apiService.post<AnyObj>(`idam/delete_module_menu`, {
            moduleMenuId: snap?.moduleMenuId ?? m.moduleMenuId,
          });
        }),
      );

      toast.success("Module ⇄ Menu mapping saved");
      await loadModuleMapping(moduleId);
    } catch (e: any) {
      toast.error(e?.message || "Failed to save module mapping");
    } finally {
      setSavingModuleMap(false);
    }
  };

  // Menu ⇄ Permission save flow will be wired once modal content is provided.

  // Role ⇄ Permission save - diff current vs snapshot
  const saveRolePermissionMapping = async (roleId: number) => {
    setSavingRoleMap(true);
    try {
      const snapshotMap = new Map(
        rolePermSnapshot.map((s) => [s.permissionId, s]),
      );

      // Newly checked (was not mapped, now is mapped)
      const toAdd = rolePermList.filter((p) => {
        const snap = snapshotMap.get(p.permissionId);
        return p.isMapped && (!snap || !snap.isMapped);
      });

      // Newly unchecked (was mapped, now is not mapped)
      const toRemove = rolePermList.filter((p) => {
        const snap = snapshotMap.get(p.permissionId);
        return !p.isMapped && snap?.isMapped;
      });

      // ADD
      await Promise.all(
        toAdd.map((p) =>
          apiService.post<AnyObj>(`idam/create_role_permission`, {
            roleId,
            permissionId: p.permissionId,
            isActive: true,
          }),
        ),
      );

      // REMOVE - use role_permission_id from snapshot
      await Promise.all(
        toRemove.map((p) => {
          const snap = snapshotMap.get(p.permissionId);
          return apiService.post<AnyObj>(`idam/delete_role_permission`, {
            role_permission_id: snap?.rolePermissionId ?? p.rolePermissionId,
          });
        }),
      );

      toast.success("Role ⇄ Permission mapping saved");
      await loadRolePermissions(roleId);
    } catch (e: any) {
      toast.error(e?.message || "Failed to save role mapping");
    } finally {
      setSavingRoleMap(false);
    }
  };

  // ---- DERIVED -------------------------------------------------------------
  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    const q = userSearch.toLowerCase();
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        String(u.tenantName).toLowerCase().includes(q) ||
        String(u.roleName).toLowerCase().includes(q),
    );
  }, [users, userSearch]);

  const filteredPermissions = useMemo(() => {
    const q = permissionSearch.trim().toLowerCase();
    if (!q) return permissions;
    return permissions.filter((p) => {
      const hay =
        `${p.permissionName ?? ""} ${p.permissionId ?? ""} ${p.menuId ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [permissions, permissionSearch]);

  const sortedMenus = useMemo(() => {
    return menus
      .slice()
      .sort((a, b) => (a.menuSortOrder ?? 0) - (b.menuSortOrder ?? 0));
  }, [menus]);

  const userColumns = useMemo<Column<any>[]>(() => {
    return [
      { key: "username", label: "User", sortable: true },
      { key: "tenantName", label: "Tenant", sortable: true },
      { key: "roleName", label: "Role", sortable: true },
      {
        key: "isActive",
        label: "Status",
        render: (u) => (
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${
              u.isActive
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {u.isActive ? "Active" : "Inactive"}
          </span>
        ),
      },
    ];
  }, []);

  const menuColumns = useMemo<Column<any>[]>(() => {
    return [
      { key: "menuName", label: "Menu", sortable: true },
      {
        key: "parentMenuName",
        label: "Parent",
        render: (m) =>
          m.parentMenuName || (m.parentId ? `#${m.parentId}` : "-"),
      },
      { key: "menuLevel", label: "Level", sortable: true },
      {
        key: "menuRoute",
        label: "Route / Link",
        render: (m) => m.menuRoute || m.menuLink || "-",
      },
    ];
  }, []);

  const permissionColumns = useMemo<Column<any>[]>(() => {
    return [
      { key: "permissionId", label: "Permission ID", sortable: true },
      { key: "permissionName", label: "Permission", sortable: true },
      {
        key: "menuId",
        label: "Menu Id",
        render: (p) => p.menuId || "-",
      },
      {
        key: "isActive",
        label: "Status",
        render: (p) => (
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${
              p.isActive
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {p.isActive ? "Active" : "Inactive"}
          </span>
        ),
      },
    ];
  }, []);

  const tabItems = useMemo(() => {
    const overviewContent = (
      <div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatCard
            title="Users"
            value={users.length}
            icon={<UserPlus className="h-6 w-6 text-blue-600" />}
          />
          <StatCard
            title="Roles"
            value={roles.length}
            icon={<Shield className="h-6 w-6 text-emerald-700" />}
          />
          <StatCard
            title="Menus"
            value={menus.length}
            icon={<PanelsTopLeft className="h-6 w-6 text-purple-600" />}
          />
          <StatCard
            title="Modules"
            value={modules.length}
            icon={<Boxes className="h-6 w-6 text-orange-600" />}
          />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          <QuickActions
            onAddRole={() => setOpenRoleModal(true)}
            onAddMenu={() => setOpenMenuModal(true)}
            onAddPermission={() => setOpenPermissionModal(true)}
            onAddModule={() => setOpenModuleModal(true)}
            onInvite={() => setOpenCreateUserModal(true)}
          />
          <InfoCard />
        </div>
      </div>
    );

    const usersContent = (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search users by email, Tenant or role"
              className="w-80 rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>
          <Button onClick={() => setOpenCreateUserModal(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Create User
          </Button>
        </div>

        <DataTable
          columns={userColumns}
          data={filteredUsers}
          emptyMessage="No users found"
          enableGridView={false}
          enableTableView
          enableFilter={false}
          enableInputFilter={false}
        />
      </div>
    );

    const rolesContent = (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Roles</h3>
          <Button onClick={() => setOpenRoleModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Role
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {roles.map((r) => (
            <div key={r.roleId} className="rounded-xl border bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    {r.roleName}
                  </div>
                  <div className="text-xs text-gray-500">
                    Tenant: {r.tenantName || `#${r.tenantId}`}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shadow-none"
                  onClick={() => {
                    setActive("mapRolePermission");
                    loadRolePermissions(r.roleId);
                  }}
                >
                  Map permissions
                </Button>
              </div>
            </div>
          ))}
          {!roles.length && (
            <div className="rounded-xl border bg-white p-6 text-center text-sm text-gray-500">
              No roles yet. Create one.
            </div>
          )}
        </div>
      </div>
    );

    const menusContent = (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Menus</h3>
          <Button onClick={() => setOpenMenuModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Menu
          </Button>
        </div>

        <DataTable
          columns={menuColumns}
          data={sortedMenus}
          emptyMessage="No menus yet. Create one."
          enableGridView={false}
          enableTableView
          enableFilter={false}
          enableInputFilter={false}
          actions={(m) => (
            <Button
              variant="ghost"
              size="sm"
              className="shadow-none"
              onClick={() => {
                setActive("mapMenuPermission");
                loadMenuMapping(m.menuId);
              }}
            >
              Map permissions
            </Button>
          )}
        />
      </div>
    );

    const modulesContent = (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Modules</h3>
          <Button onClick={() => setOpenModuleModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Module
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {modules.map((m) => (
            <div key={m.moduleId} className="rounded-xl border bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    {m.moduleName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {m.isTechModule ? "Technical module" : "Business module"}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shadow-none"
                  onClick={() => {
                    setActive("mapModuleMenu");
                    loadModuleMapping(m.moduleId);
                  }}
                >
                  Map menus
                </Button>
              </div>
            </div>
          ))}
          {!modules.length && (
            <div className="rounded-xl border bg-white p-6 text-center text-sm text-gray-500">
              No modules yet. Create one.
            </div>
          )}
        </div>
      </div>
    );

    const mapModuleMenuContent = (
      <div className="space-y-8">
        <section className="rounded-xl border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Module ⇄ Menu</h3>
            <div className="flex items-center gap-2">
              <select
                value={selectedModuleId || ""}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  if (Number.isFinite(id)) loadModuleMapping(id);
                  else {
                    setSelectedModuleId("");
                    setModuleMenuList([]);
                    setModuleMenuSnapshot([]);
                  }
                }}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Select a module</option>
                {modules.map((m) => (
                  <option key={m.moduleId} value={m.moduleId}>
                    {m.moduleName}
                  </option>
                ))}
              </select>
              <Button
                onClick={() => {
                  if (!selectedModuleId) return;
                  saveModuleMenuMapping(selectedModuleId as number);
                }}
                disabled={!selectedModuleId || savingModuleMap}
              >
                {savingModuleMap ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>

          {!selectedModuleId ? (
            <div className="rounded-lg border border-dashed p-6 text-sm text-gray-500">
              Select a module to manage menu mappings.
            </div>
          ) : moduleMenuList.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-sm text-gray-500">
              No menus found for this module.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {moduleMenuList.map((menu) => (
                <label
                  key={menu.menuId}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-all hover:shadow-sm ${
                    menu.isMapped
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={menu.isMapped}
                    onChange={() => {
                      setModuleMenuList((prev) =>
                        prev.map((m) =>
                          m.menuId === menu.menuId
                            ? { ...m, isMapped: !m.isMapped }
                            : m,
                        ),
                      );
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-gray-900">
                      {menu.menuName}
                    </div>
                  </div>
                  {menu.isMapped && (
                    <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      Mapped
                    </span>
                  )}
                </label>
              ))}
            </div>
          )}
        </section>
      </div>
    );

    const mapMenuPermissionContent = (
      <div className="space-y-8">
        <section className="rounded-xl border p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedMenuId
                ? `Selected menu: #${selectedMenuId}`
                : "Select a menu from Menus tab to map permissions."}
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={permissionSearch}
                onChange={(e) => setPermissionSearch(e.target.value)}
                placeholder="Search Permissions by name or ID"
                className="w-80 rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>
            <Button onClick={() => setOpenPermissionModal(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Create Menu Permission
            </Button>
          </div>

          <DataTable
            columns={permissionColumns}
            data={filteredPermissions}
            emptyMessage="No permissions found"
            enableGridView={false}
            enableTableView
            enableFilter={false}
            enableInputFilter={false}
          />
        </section>
      </div>
    );

    const mapRolePermissionContent = (
      <div className="space-y-8">
        <section className="rounded-xl border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Role ⇄ Permission</h3>
            <div className="flex items-center gap-2">
              <select
                value={selectedRoleId || ""}
                onChange={(e) => {
                  const rid = Number(e.target.value);
                  if (Number.isFinite(rid)) loadRolePermissions(rid);
                  else {
                    setSelectedRoleId("");
                    setRolePermList([]);
                    setRolePermSnapshot([]);
                  }
                }}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Select a role</option>
                {roles.map((r) => (
                  <option key={r.roleId} value={r.roleId}>
                    {r.roleName} ({r.tenantName || `#${r.tenantId}`})
                  </option>
                ))}
              </select>

              <Button
                onClick={() => {
                  if (!selectedRoleId) return;
                  saveRolePermissionMapping(selectedRoleId as number);
                }}
                disabled={!selectedRoleId || savingRoleMap}
              >
                {savingRoleMap ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>

          {!selectedRoleId ? (
            <div className="rounded-lg border border-dashed p-6 text-sm text-gray-500">
              Select a role to manage permissions.
            </div>
          ) : rolePermList.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-sm text-gray-500">
              No permissions found for this role.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {rolePermList.map((perm) => (
                <label
                  key={perm.permissionId}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-all hover:shadow-sm ${
                    perm.isMapped
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={perm.isMapped}
                    onChange={() => {
                      setRolePermList((prev) =>
                        prev.map((p) =>
                          p.permissionId === perm.permissionId
                            ? { ...p, isMapped: !p.isMapped }
                            : p,
                        ),
                      );
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-gray-900">
                      {perm.permissionName}
                    </div>
                    {/* <div className="text-xs text-gray-400">
                      ID: {perm.permissionId}
                    </div> */}
                  </div>
                  {perm.isMapped && (
                    <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      Mapped
                    </span>
                  )}
                </label>
              ))}
            </div>
          )}
        </section>
      </div>
    );

    const contentById: Record<TabId, React.ReactNode> = {
      overview: overviewContent,
      users: usersContent,
      roles: rolesContent,
      menus: menusContent,
      modules: modulesContent,
      mapModuleMenu: mapModuleMenuContent,
      mapMenuPermission: mapMenuPermissionContent,
      mapRolePermission: mapRolePermissionContent,
    };

    return tabs.map((t) => ({
      id: t.id,
      label: t.label,
      icon: <t.icon className="h-4 w-4" />,
      content: contentById[t.id],
    }));
  }, [
    filteredPermissions,
    filteredUsers,
    loading,
    menuColumns,
    menus.length,
    modules,
    moduleMenuList,
    permissionColumns,
    permissionSearch,
    roles,
    rolePermList,
    savingModuleMap,
    savingRoleMap,
    selectedModuleId,
    selectedRoleId,
    sortedMenus,
    userColumns,
    userSearch,
    users.length,
  ]);

  // ---- RENDER --------------------------------------------------------------
  return (
    <div className="ipc-page-frame ipc-page-pad">
      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Shield className="h-6 w-6 text-emerald-700" />
            Identity & Access Management
          </h1>
          <p className="text-gray-600">
            Roles, Menus, Modules, Permissions, and User invitations - in one
            place.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={refreshAll}
            className="flex bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh
              </>
            )}
          </Button>
          <Button
            onClick={() => setOpenCreateUserModal(true)}
            className="flex bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Create User
          </Button>
        </div>
      </div>

      <Tabs
        tabs={tabItems}
        activeTab={active}
        onChange={(id) => setActive(id as TabId)}
        variant="underline"
        size="md"
        appearance="navbar"
      />

      {/* Snapshots are now handled inside load functions */}

      {/* MODALS */}
      <CreateUserModal
        open={openCreateUserModal}
        onClose={() => setOpenCreateUserModal(false)}
        onSuccess={async () => {
          setOpenCreateUserModal(false);
          try {
            const u = await apiService.get<AnyObj>(
              `idam/get_all_users_of_tenant?tenantId=${auth.tenantId}`,
            );
            setUsers(parseUsers(u));
          } catch {}
        }}
      />

      <AddRoleModal
        open={openRoleModal}
        onClose={() => setOpenRoleModal(false)}
        onCreate={createRole}
      />

      <AddMenuModal
        open={openMenuModal}
        menus={menus}
        onClose={() => setOpenMenuModal(false)}
        onCreate={createMenu}
      />

      <AddModuleModal
        open={openModuleModal}
        onClose={() => setOpenModuleModal(false)}
        onCreate={createModule}
      />

      <AddPermissionModal
        open={openPermissionModal}
        onClose={() => setOpenPermissionModal(false)}
        onCreate={createPermission}
      />
    </div>
  );
}

// ---- SMALLS ----------------------------------------------------------------
function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-600">{title}</div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">{icon}</div>
      </div>
    </div>
  );
}

function QuickActions({
  onAddRole,
  onAddMenu,
  onAddPermission,
  onAddModule,
  onInvite,
}: {
  onAddRole: () => void;
  onAddMenu: () => void;
  onAddPermission: () => void;
  onAddModule: () => void;
  onInvite: () => void;
}) {
  const Action = ({
    title,
    desc,
    onClick,
  }: {
    title: string;
    desc: string;
    onClick: () => void;
  }) => (
    <Button
      variant="secondary"
      onClick={onClick}
      className="flex w-full items-start gap-3 rounded-xl border bg-white p-4 text-left hover:bg-gray-50 shadow-none"
    >
      <div className="rounded-lg bg-emerald-100 p-2">
        <Plus className="h-5 w-5 text-emerald-700" />
      </div>
      <div>
        <div className="text-sm font-semibold text-gray-900">{title}</div>
        <div className="text-xs text-gray-600">{desc}</div>
      </div>
    </Button>
  );

  return (
    <div className="grid grid-cols-1 gap-3">
      <Action title="Add Role" desc="Create a new role" onClick={onAddRole} />
      <Action
        title="Add Menu"
        desc="Create a new navigation menu"
        onClick={onAddMenu}
      />
      <Action
        title="Add Permission"
        desc="Create a permission entity"
        onClick={onAddPermission}
      />
      <Action
        title="Add Module"
        desc="Create a product module"
        onClick={onAddModule}
      />
      <Action
        title="Create User"
        desc="Create a user with role and preferences"
        onClick={onInvite}
      />
    </div>
  );
}

function InfoCard() {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="mb-2 flex items-center gap-2">
        <div className="rounded-lg bg-blue-100 p-2">
          <AlertCircle className="h-5 w-5 text-blue-700" />
        </div>
        <div className="text-xl font-semibold text-gray-900">How it works</div>
      </div>
      <ul className="list-disc pl-6 text-2xl text-gray-600">
        <li>Modules group features. Map Menus to Modules.</li>
        <li>Menus expose screens/actions. Map Permissions to Menus.</li>
        <li>Roles grant access. Map Permissions to Roles (menu is derived).</li>
        <li>Invite users to a Bank and assign a Role.</li>
      </ul>
    </div>
  );
}
