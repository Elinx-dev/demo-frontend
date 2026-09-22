import { useEffect, useState, useCallback } from "react";
import { UserPlus, Building2, MapPin, Home, ShieldCheck, Flag, MapPinPlus, FileStack, Users2, Plus, Percent, Link2, Database, UserCog, KeyRound, ListTree, Grid3x3, Pencil, RefreshCw } from "lucide-react";
import { Card } from "@/ui/primitives/Card/Card";
import { Button } from "@/ui/primitives/Button/Button";
import { Input } from "@/ui/primitives/Input/Input";
import { Select } from "@/ui/primitives/Select/Select";
import { Checkbox } from "@/ui/primitives/Checkbox/Checkbox";
import { Tabs } from "@/ui/primitives/Tabs/Tabs";
import { Modal } from "@/ui/primitives/Modal/Modal";
import Table, { type Column } from "@/ui/primitives/Table/Table";
import Badge from "@/ui/primitives/Badge/Badge";
import Empty from "@/ui/primitives/Empty/Empty";
import { Alert } from "@/ui/primitives/Alert/Alert";
import { useToast } from "@/ui/feedback/toast/useToast";
import { slateApi } from "../../services/apiClient";
import PageHead from "../../components/PageHead";
import StateBadge from "../../components/StateBadge";
import TokenLifecycleDiagram from "../../components/TokenLifecycleDiagram";
import { STATE_DEFS, OPERATIONS } from "../../data/slateData";
import { MenuIcon, MENU_ICON_NAMES } from "../../utils/menuIcons";
import MenuMappingPanel from "../../components/MenuMappingPanel";
import type { SlateOperation, SlateTokenState, SlatePortal } from "../../types/slate.types";

const STATE_ROWS = Object.entries(STATE_DEFS).map(([key, def]) => ({ key: key as SlateTokenState, ...def }));
const LEVEL_LABEL: Record<string, string> = { state: "State", district: "District", taluk: "Taluk", village: "Village" };
const PARENT_LEVEL_OF: Record<string, string | null> = { state: null, district: "state", taluk: "district", village: "taluk" };
const PORTAL_LABEL: Record<string, string> = { citizen: "Citizen", officer: "Officer", bank: "Bank", court: "Court", surveyor: "Surveyor" };
const PORTAL_OPTIONS: { label: string; value: SlatePortal }[] = [
  { label: "Citizen", value: "citizen" },
  { label: "Registration Officer", value: "officer" },
  { label: "Thasildar", value: "tahsildar" },
  { label: "Bank", value: "bank" },
  { label: "Court / Admin", value: "court" },
  { label: "Surveyor", value: "surveyor" },
  { label: "VAO Officer", value: "vao" },
  { label: "Revenue", value: "revenue" },
];

interface Jurisdiction { id: string; jurisdictionId: string; level: string; name: string; parentId: string | null }
interface CodeLabel { id: string; code: string; label: string; category?: string }
interface StampDuty { id: string; code: string; label: string; rate: number }
interface Role { id: string; roleName: string }
interface Permission { id: string; permissionName: string; label: string | null; moduleLabel: string | null }
interface MenuRow { id: string; menuName: string; menuCode: string | null; portal: string | null; menuRoute: string | null; menuIcon: string | null }
interface MenuPermissionRow { id: string; menuId: string; permissionId: string }
interface RolePermissionRow { id: string; roleId: string; permissionId: string }
interface AuthUserRow { id: string; authUserName: string; fullName: string | null; email: string | null; portal: string | null; authStatusId: string }
interface AuthUserRoleRow { id: string; authUserId: string; roleId: string; employeeId: string | null; jurisdictionId: string | null; makerChecker: string | null }

function JurisdictionTree({ nodes }: { nodes: Jurisdiction[] }) {
  const childrenOf = (level: string, parentId: string | null) => nodes.filter((n) => n.level === level && n.parentId === parentId);
  const states = childrenOf("state", null);

  return (
    <div className="flex flex-col gap-4">
      {states.map((state) => {
        const districts = childrenOf("district", state.jurisdictionId);
        return (
          <div key={state.id} style={{ borderRadius: 12, border: "1px solid #e3dfd3", overflow: "hidden" }}>
            <div className="flex items-center gap-2" style={{ padding: "10px 16px", background: "linear-gradient(120deg, #0F2A4A, #15375c)", color: "#fff" }}>
              <Flag size={15} />
              <span style={{ fontSize: 13.5, fontWeight: 700 }}>{state.name}</span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 9px", borderRadius: 999, background: "rgba(255,255,255,.16)", marginLeft: "auto" }}>STATE</span>
            </div>

            <div className="flex flex-col gap-3" style={{ padding: 14, background: "#fafbfc" }}>
              {districts.map((district) => {
                const taluks = childrenOf("taluk", district.jurisdictionId);
                return (
                  <div key={district.id} style={{ borderRadius: 10, border: "1px solid #eceef0", background: "#fff", padding: 12, borderLeft: "3px solid #8f6a26" }}>
                    <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
                      <Building2 size={14} style={{ color: "#8f6a26" }} />
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0F2A4A" }}>{district.name}</span>
                      <span style={{ fontSize: 9.5, fontWeight: 600, color: "#9aa1a9" }}>DISTRICT</span>
                    </div>
                    <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                      {taluks.map((taluk) => {
                        const villages = childrenOf("village", taluk.jurisdictionId);
                        return (
                          <div key={taluk.id} style={{ borderRadius: 8, border: "1px solid #e9f1fb", background: "#f4f8fd", padding: 10 }}>
                            <div className="flex items-center gap-1.5" style={{ marginBottom: 6 }}>
                              <MapPin size={12} style={{ color: "#1d6f8c" }} />
                              <span style={{ fontSize: 11.8, fontWeight: 700, color: "#15375c" }}>{taluk.name} Taluk</span>
                            </div>
                            {villages.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {villages.map((v) => (
                                  <span key={v.id} className="flex items-center gap-1" style={{ fontSize: 10.3, fontWeight: 600, padding: "3px 8px", borderRadius: 999, background: "#fff", color: "#545c66", border: "1px solid #dee2e6" }}>
                                    <Home size={9} /> {v.name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span style={{ fontSize: 10.5, color: "#9aa1a9" }}>No villages added yet.</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MasterChipList({ items, color }: { items: { code: string; label: string }[]; color: { bg: string; text: string; border: string } }) {
  if (items.length === 0) return <Empty variant="no-data" title="No entries yet" description="Add the first entry using the button above." />;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((i) => (
        <span key={i.code} style={{ fontSize: 11.5, fontWeight: 600, padding: "6px 12px", borderRadius: 999, background: color.bg, color: color.text, border: `1px solid ${color.border}` }}>
          {i.label}
        </span>
      ))}
    </div>
  );
}

const EMPTY_OFFICER_FORM = { name: "", roleId: "", taluk: "", makerChecker: "N/A" as "Maker" | "Checker" | "N/A", email: "" };
const EMPTY_LOCATION_FORM = { level: "village", name: "", parentId: "" };

export default function MasterDataPage() {
  const toast = useToast();

  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
  const [documentTypes, setDocumentTypes] = useState<CodeLabel[]>([]);
  const [relationships, setRelationships] = useState<CodeLabel[]>([]);
  const [stampDutyRates, setStampDutyRates] = useState<StampDuty[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [menus, setMenus] = useState<MenuRow[]>([]);
  const [menuPermissions, setMenuPermissions] = useState<MenuPermissionRow[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermissionRow[]>([]);
  const [authUsers, setAuthUsers] = useState<AuthUserRow[]>([]);
  const [authUserRoles, setAuthUserRoles] = useState<AuthUserRoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [addOfficerOpen, setAddOfficerOpen] = useState(false);
  const [officerForm, setOfficerForm] = useState(EMPTY_OFFICER_FORM);
  const [addLocationOpen, setAddLocationOpen] = useState(false);
  const [locationForm, setLocationForm] = useState(EMPTY_LOCATION_FORM);
  const [addDocTypeOpen, setAddDocTypeOpen] = useState(false);
  const [docTypeInput, setDocTypeInput] = useState("");
  const [docTypeCategory, setDocTypeCategory] = useState("");
  const [addRelationOpen, setAddRelationOpen] = useState(false);
  const [relationInput, setRelationInput] = useState("");
  const [addStampDutyOpen, setAddStampDutyOpen] = useState(false);
  const [stampDutyForm, setStampDutyForm] = useState({ label: "", rate: "" });
  const [addSroOpen, setAddSroOpen] = useState(false);
  const [sroForm, setSroForm] = useState({ name: "", parentId: "" });
  const [activeRole, setActiveRole] = useState<Role | null>(null);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [userForm, setUserForm] = useState({ name: "", portal: "citizen" as SlatePortal, roleId: "", email: "" });
  const [addRoleOpen, setAddRoleOpen] = useState(false);
  const [roleNameInput, setRoleNameInput] = useState("");
  const [addPermissionOpen, setAddPermissionOpen] = useState(false);
  const [permissionForm, setPermissionForm] = useState({ label: "", module: "" });
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [menuForm, setMenuForm] = useState({ label: "", portal: "" as SlatePortal | "", icon: "LayoutDashboard", path: "" });
  const [busy, setBusy] = useState(false);
  const [reseeding, setReseeding] = useState(false);

  const handleReseed = async () => {
    setReseeding(true);
    try {
      const result = await slateApi.admin.flows.reseedDemoData();
      toast({ title: "Reseed complete", description: result.message, type: "success" });
    } catch {
      toast({ title: "Reseed failed", description: "Could not refresh demo data. Check server logs.", type: "error" });
    } finally {
      setReseeding(false);
    }
  };

  const load = useCallback(() => {
    setError("");
    return Promise.all([
      slateApi.masters.getJurisdictions().then(setJurisdictions),
      slateApi.masters.getDocumentTypes().then(setDocumentTypes),
      slateApi.masters.getRelationships().then(setRelationships),
      slateApi.masters.getStampDutyRates().then(setStampDutyRates),
      slateApi.iam.getRoles().then(setRoles),
      slateApi.iam.getPermissions().then(setPermissions),
      slateApi.iam.getMenus().then(setMenus),
      slateApi.iam.getMenuPermissions().then(setMenuPermissions),
      slateApi.iam.getRolePermissions().then(setRolePermissions),
      slateApi.iam.getUsers().then(setAuthUsers),
      slateApi.iam.getUserRoles().then(setAuthUserRoles),
    ]).catch((err) => setError(err instanceof Error ? err.message : "Could not load master data."));
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const taluks = jurisdictions.filter((j) => j.level === "taluk");
  const sroEntries = jurisdictions.filter((j) => j.level === "sro");

  function districtForTaluk(talukName: string): string {
    const taluk = taluks.find((t) => t.name === talukName);
    const district = jurisdictions.find((j) => j.jurisdictionId === taluk?.parentId);
    return district?.name ?? "Chengalpattu";
  }

  const stateColumns: Column<(typeof STATE_ROWS)[number]>[] = [
    { key: "label", label: "State", render: (s) => <StateBadge state={s.key} size="sm" /> },
    { key: "meaning", label: "Meaning" },
    { key: "txns", label: "Transactions Allowed" },
  ];

  const opColumns: Column<SlateOperation>[] = [
    { key: "op", label: "Operation" },
    { key: "desc", label: "Description" },
    { key: "caller", label: "Triggered By" },
    { key: "from", label: "From" },
    { key: "to", label: "To" },
  ];

  const roleName = (roleId: string) => roles.find((r) => r.id === roleId)?.roleName ?? roleId;
  const officerRows = authUserRoles.filter((ur) => ur.employeeId);
  const officerColumns: Column<AuthUserRoleRow>[] = [
    { key: "authUserId", label: "Name", render: (ur) => authUsers.find((u) => u.id === ur.authUserId)?.fullName ?? "-" },
    { key: "roleId", label: "Designation", render: (ur) => roleName(ur.roleId) },
    { key: "jurisdictionId", label: "Jurisdiction", render: (ur) => ur.jurisdictionId ?? "All (unscoped)" },
    { key: "makerChecker", label: "Maker / Checker", render: (ur) => ur.makerChecker && ur.makerChecker !== "N/A" ? <Badge size="sm" variant="info">{ur.makerChecker}</Badge> : <span style={{ color: "#9aa1a9" }}>N/A</span> },
    { key: "employeeId", label: "Employee ID" },
  ];

  const handleCreateOfficer = () => {
    if (!officerForm.roleId || !officerForm.email) return;
    const taluk = officerForm.taluk || taluks[0]?.name || "";
    const district = districtForTaluk(taluk);
    const jurisdictionNode = taluks.find((t) => t.name === taluk);
    setBusy(true);
    slateApi
      .onboardStaffUser({
        name: officerForm.name,
        portal: "officer",
        roleId: officerForm.roleId,
        email: officerForm.email,
        employeeId: "EMP-" + Math.floor(1000 + Math.random() * 8999),
        jurisdictionId: jurisdictionNode?.jurisdictionId,
        makerChecker: officerForm.makerChecker,
      })
      .then((result) => {
        toast.success(
          `Officer created and assigned to ${taluk} Taluk (${district}). A temporary password was emailed to ${officerForm.email}.` +
            (result.devTempPassword ? ` (Dev only, temp password: ${result.devTempPassword})` : ""),
        );
        setOfficerForm(EMPTY_OFFICER_FORM);
        setAddOfficerOpen(false);
        load();
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not create officer."))
      .finally(() => setBusy(false));
  };

  const parentOptionsForLevel = (level: string) => {
    const pl = PARENT_LEVEL_OF[level];
    if (!pl) return [];
    return jurisdictions.filter((j) => j.level === pl);
  };

  const handleAddLocation = () => {
    const code = `${locationForm.level.slice(0, 3).toUpperCase()}-${locationForm.name.replace(/\s+/g, "").slice(0, 6).toUpperCase()}-${Math.floor(Math.random() * 90 + 10)}`;
    setBusy(true);
    slateApi.masters
      .createJurisdiction({ jurisdictionId: code, level: locationForm.level, name: locationForm.name, parentId: locationForm.parentId || null })
      .then(() => {
        toast.success(`${LEVEL_LABEL[locationForm.level]} "${locationForm.name}" added to the jurisdiction master.`);
        setLocationForm(EMPTY_LOCATION_FORM);
        setAddLocationOpen(false);
        load();
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not add location."))
      .finally(() => setBusy(false));
  };

  const handleAddDocType = () => {
    const code = docTypeInput.trim().toLowerCase().replace(/\s+/g, "_");
    setBusy(true);
    slateApi.masters
      .createDocumentType({ code, label: docTypeInput.trim(), category: docTypeCategory || undefined })
      .then(() => {
        toast.success(`"${docTypeInput}" added.`);
        setDocTypeInput("");
        setDocTypeCategory("");
        setAddDocTypeOpen(false);
        load();
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not add document type."))
      .finally(() => setBusy(false));
  };

  const handleAddRelation = () => {
    const code = relationInput.trim().toLowerCase().replace(/\s+/g, "_");
    setBusy(true);
    slateApi.masters
      .createRelationship({ code, label: relationInput.trim() })
      .then(() => {
        toast.success(`Relationship "${relationInput}" added.`);
        setRelationInput("");
        setAddRelationOpen(false);
        load();
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not add relationship."))
      .finally(() => setBusy(false));
  };

  const handleAddSro = () => {
    const code = `SRO-${sroForm.name.replace(/\s+/g, "").slice(0, 6).toUpperCase()}-${Math.floor(Math.random() * 90 + 10)}`;
    setBusy(true);
    slateApi.masters
      .createJurisdiction({ jurisdictionId: code, level: "sro", name: sroForm.name, parentId: sroForm.parentId || null })
      .then(() => {
        toast.success(`SRO "${sroForm.name}" added.`);
        setSroForm({ name: "", parentId: "" });
        setAddSroOpen(false);
        load();
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not add SRO."))
      .finally(() => setBusy(false));
  };

  const handleAddStampDuty = () => {
    const code = stampDutyForm.label.trim().toLowerCase().replace(/\s+/g, "_");
    setBusy(true);
    slateApi.masters
      .createStampDutyRate({ code, label: stampDutyForm.label.trim(), rate: Number(stampDutyForm.rate) || 0 })
      .then(() => {
        toast.success(`Stamp duty rate "${stampDutyForm.label}" (${stampDutyForm.rate}%) added.`);
        setStampDutyForm({ label: "", rate: "" });
        setAddStampDutyOpen(false);
        load();
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not add stamp duty rate."))
      .finally(() => setBusy(false));
  };

  const handleAddUser = () => {
    if (!userForm.roleId || !userForm.email) return;
    setBusy(true);
    slateApi
      .onboardStaffUser({
        name: userForm.name,
        portal: userForm.portal,
        roleId: userForm.roleId,
        email: userForm.email,
      })
      .then((result) => {
        toast.success(
          `${userForm.name} onboarded to the ${PORTAL_LABEL[userForm.portal]} portal. A temporary password was emailed to ${userForm.email}.` +
            (result.devTempPassword ? ` (Dev only, temp password: ${result.devTempPassword})` : ""),
        );
        setUserForm({ name: "", portal: "citizen", roleId: "", email: "" });
        setAddUserOpen(false);
        load();
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not onboard user."))
      .finally(() => setBusy(false));
  };

  const handleAddRole = () => {
    setBusy(true);
    slateApi.iam
      .createRole({ roleName: roleNameInput.trim() })
      .then(() => {
        toast.success(`Role "${roleNameInput}" created.`);
        setRoleNameInput("");
        setAddRoleOpen(false);
        load();
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not create role."))
      .finally(() => setBusy(false));
  };

  const handleAddPermission = () => {
    const permissionName = `${permissionForm.module.trim().toLowerCase().replace(/\s+/g, "_")}.${permissionForm.label.trim().toLowerCase().replace(/\s+/g, "_")}`;
    setBusy(true);
    slateApi.iam
      .createPermission({ permissionName, label: permissionForm.label.trim(), moduleLabel: permissionForm.module.trim() })
      .then(() => {
        toast.success(`Permission "${permissionForm.label}" created.`);
        setPermissionForm({ label: "", module: "" });
        setAddPermissionOpen(false);
        load();
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not create permission."))
      .finally(() => setBusy(false));
  };

  const handleAddMenu = () => {
    if (!menuForm.portal) return;
    const menuCode = `${menuForm.portal}.${menuForm.label.trim().toLowerCase().replace(/\s+/g, "_")}`;
    setBusy(true);
    slateApi.iam
      .createMenu({ menuName: menuForm.label.trim(), menuCode, portal: menuForm.portal, menuRoute: menuForm.path || undefined, menuIcon: menuForm.icon })
      .then(() => {
        toast.success(`Menu "${menuForm.label}" created.`);
        setMenuForm({ label: "", portal: "", icon: "LayoutDashboard", path: "" });
        setAddMenuOpen(false);
        load();
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not create menu."))
      .finally(() => setBusy(false));
  };

  const handleAssignMenuPermission = (menuId: string, permissionId: string) => {
    const existing = menuPermissions.find((mp) => mp.menuId === menuId);
    const remove = existing ? slateApi.iam.deleteMenuPermission(existing.id) : Promise.resolve();
    remove
      .then(() => (permissionId ? slateApi.iam.createMenuPermission({ menuId, permissionId }) : undefined))
      .then(() => load())
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not update menu mapping."));
  };

  const handleToggleRolePermission = (roleId: string, permissionId: string, granted: boolean) => {
    if (granted) {
      slateApi.iam
        .createRolePermission({ roleId, permissionId })
        .then(() => load())
        .catch((err) => toast.error(err instanceof Error ? err.message : "Could not grant permission."));
    } else {
      const existing = rolePermissions.find((rp) => rp.roleId === roleId && rp.permissionId === permissionId);
      if (!existing) return;
      slateApi.iam
        .deleteRolePermission(existing.id)
        .then(() => load())
        .catch((err) => toast.error(err instanceof Error ? err.message : "Could not revoke permission."));
    }
  };

  const stampDutyColumns: Column<StampDuty>[] = [
    { key: "label", label: "Deed type" },
    { key: "rate", label: "Rate", render: (r) => <Badge size="sm" variant="info">{r.rate}%</Badge> },
  ];

  const sroColumns: Column<Jurisdiction>[] = [
    { key: "name", label: "SRO Name" },
    {
      key: "parentId",
      label: "Parent Jurisdiction",
      render: (sro) => {
        const parent = jurisdictions.find((j) => j.jurisdictionId === sro.parentId);
        return parent ? `${parent.name} (${LEVEL_LABEL[parent.level] ?? parent.level})` : sro.parentId ?? "-";
      },
    },
    { key: "jurisdictionId", label: "SRO Code", render: (sro) => <span style={{ fontFamily: "monospace", fontSize: 11.5, color: "#717881" }}>{sro.jurisdictionId}</span> },
  ];

  const userColumns: Column<AuthUserRow>[] = [
    { key: "fullName", label: "Name" },
    { key: "portal", label: "Portal", render: (u) => <Badge size="sm" variant="info">{PORTAL_LABEL[u.portal ?? ""] ?? u.portal ?? "-"}</Badge> },
    { key: "email", label: "Email / Phone", render: (u) => u.email ?? u.authUserName },
  ];

  const roleColumns: Column<Role>[] = [
    { key: "roleName", label: "Role / Designation" },
    { key: "id", label: "Permissions", render: (r) => (
      <Button size="sm" variant="ghost" onClick={() => setActiveRole(r)}>View mapping</Button>
    ) },
  ];

  const permissionColumns: Column<Permission>[] = [
    { key: "moduleLabel", label: "Module" },
    { key: "label", label: "Permission" },
    { key: "permissionName", label: "Code", render: (p) => <span style={{ fontFamily: "monospace", fontSize: 11.5, color: "#717881" }}>{p.permissionName}</span> },
  ];

  const menuColumns: Column<MenuRow>[] = [
    { key: "menuName", label: "Menu", render: (m) => (
      <span className="flex items-center gap-2">
        <span className="flex items-center justify-center" style={{ width: 24, height: 24, borderRadius: 6, background: "#fbf3e2", color: "#8f6a26", flexShrink: 0 }}>
          <MenuIcon name={m.menuIcon ?? "LayoutDashboard"} size={13} />
        </span>
        {m.menuName}
      </span>
    ) },
    { key: "portal", label: "Portal", render: (m) => <Badge size="sm" variant="info">{PORTAL_LABEL[m.portal ?? ""] ?? m.portal ?? "-"}</Badge> },
    { key: "menuRoute", label: "Path", render: (m) => <span style={{ fontFamily: "monospace", fontSize: 11, color: "#9aa1a9" }}>{m.menuRoute ?? "-"}</span> },
    { key: "menuCode", label: "Code", render: (m) => <span style={{ fontFamily: "monospace", fontSize: 11.5, color: "#717881" }}>{m.menuCode}</span> },
  ];

  const onChainTabs = [
    {
      id: "diagram",
      label: "Lifecycle Diagram",
      content: (
        <Card>
          <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 4, color: "#0F2A4A" }}>State machine at a glance</div>
          <div style={{ fontSize: 11.5, color: "#9aa1a9", marginBottom: 6 }}>How a token moves between states and what triggers each move; built so anyone new to SLATE can read it without a walkthrough.</div>
          <div style={{ maxHeight: 420, overflow: "auto" }}>
            <TokenLifecycleDiagram />
          </div>
        </Card>
      ),
    },
    {
      id: "states",
      label: "States",
      content: (
        <Card>
          <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 12, color: "#0F2A4A" }}>States: detailed reference</div>
          <Table columns={stateColumns} data={STATE_ROWS} emptyMessage="No states defined." enableFilter={false} maxBodyHeight="380px" />
        </Card>
      ),
    },
    {
      id: "operations",
      label: "Operations",
      content: (
        <Card>
          <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 12, color: "#0F2A4A" }}>Operations</div>
          <Table columns={opColumns} data={OPERATIONS} emptyMessage="No operations defined." enableFilter={false} maxBodyHeight="380px" />
        </Card>
      ),
    },
  ];

  const offChainTabs = [
    {
      id: "jurisdictions",
      label: "Jurisdictions",
      content: (
        <Card>
          <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F2A4A" }}>State → District → Taluk → Village</div>
            <Button size="sm" onClick={() => setAddLocationOpen(true)}>
              <MapPinPlus size={14} /> Add location
            </Button>
          </div>
          <JurisdictionTree nodes={jurisdictions} />
        </Card>
      ),
    },
    {
      id: "officers",
      label: "Officers",
      content: (
        <Card>
          <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F2A4A" }}>Officer roster</div>
            <Button size="sm" onClick={() => setAddOfficerOpen(true)}>
              <UserPlus size={14} /> Add officer
            </Button>
          </div>
          <div style={{ fontSize: 11.5, color: "#9aa1a9", marginBottom: 10 }}>
            Each officer is assigned one designation and one taluk. Their Pending Queue, Exceptions, and Dashboard only show land parcels located within that taluk.
          </div>
          <Table columns={officerColumns} data={officerRows} emptyMessage="No officers onboarded yet." enableFilter={false} maxBodyHeight="380px" />
        </Card>
      ),
    },
    {
      id: "sro",
      label: "Sub-Registrar Offices",
      content: (
        <Card>
          <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
            <div className="flex items-center gap-2">
              <Building2 size={15} style={{ color: "#8f6a26" }} />
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F2A4A" }}>Sub-Registrar Offices</div>
            </div>
            <Button size="sm" onClick={() => setAddSroOpen(true)}>
              <Plus size={14} /> Add SRO
            </Button>
          </div>
          <div style={{ fontSize: 11.5, color: "#9aa1a9", marginBottom: 10 }}>
            Each SRO appears in the Mint Token form so the registering office can be assigned to a land parcel. SROs are associated with a parent taluk or district.
          </div>
          <Table columns={sroColumns} data={sroEntries} emptyMessage="No Sub-Registrar Offices defined." enableFilter={false} maxBodyHeight="380px" />
        </Card>
      ),
    },
    {
      id: "doctypes",
      label: "Document Types",
      content: (
        <Card>
          <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
            <div className="flex items-center gap-2">
              <FileStack size={15} style={{ color: "#8f6a26" }} />
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F2A4A" }}>Document types</div>
            </div>
            <Button size="sm" onClick={() => { setDocTypeCategory(""); setAddDocTypeOpen(true); }}>
              <Plus size={14} /> Add document type
            </Button>
          </div>
          <div style={{ fontSize: 11.5, color: "#9aa1a9", marginBottom: 10 }}>Used everywhere a document is uploaded so every file is classified consistently.</div>
          <MasterChipList items={documentTypes.filter((d) => !d.category || d.category === "document_type")} color={{ bg: "#eaf6ee", text: "#1C7A4E", border: "#bfe6cc" }} />
        </Card>
      ),
    },
    {
      id: "property_masters",
      label: "Property Masters",
      icon: <Home size={14} />,
      content: (
        <div className="flex flex-col gap-3">
          {([
            { key: "property_type", label: "Property Types", desc: "Residential, Agricultural, Commercial, etc. Used in Mint Token form." },
            { key: "nature_of_title", label: "Nature of Title", desc: "Absolute, Leasehold, etc. Ownership nature for each parcel." },
            { key: "land_type", label: "Land Types", desc: "Wet land, Dry land, Garden land, etc." },
            { key: "classification_type", label: "Classification Types", desc: "Revenue, Forest, Urban Local Body, etc." },
            { key: "transaction_type", label: "Transaction Types", desc: "Sale, Gift, Mortgage, Partition, etc. Used in Initiate Transaction." },
            { key: "chain_of_title_nature", label: "Chain of Title Nature", desc: "Nature field in Chain of Title records: Patta Transfer, Partition, etc." },
          ] as const).map(({ key, label, desc }) => (
            <Card key={key} style={{ padding: "12px 14px" }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0F2A4A" }}>{label}</div>
                  <div style={{ fontSize: 11.5, color: "#9aa1a9" }}>{desc}</div>
                </div>
                <Button size="sm" onClick={() => { setDocTypeCategory(key); setDocTypeInput(""); setAddDocTypeOpen(true); }}>
                  <Plus size={14} /> Add
                </Button>
              </div>
              <MasterChipList
                items={documentTypes.filter((d) => d.category === key)}
                color={{ bg: "#f4f6f9", text: "#545c66", border: "#dde1e6" }}
              />
            </Card>
          ))}
        </div>
      ),
    },
    {
      id: "relationships",
      label: "Relationships",
      content: (
        <Card>
          <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
            <div className="flex items-center gap-2">
              <Users2 size={15} style={{ color: "#8f6a26" }} />
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F2A4A" }}>Relationship types</div>
            </div>
            <Button size="sm" onClick={() => setAddRelationOpen(true)}>
              <Plus size={14} /> Add relationship
            </Button>
          </div>
          <div style={{ fontSize: 11.5, color: "#9aa1a9", marginBottom: 10 }}>Used for gift-deed recipients and succession heirs, so relationships are picked from a fixed list instead of free text.</div>
          <MasterChipList items={relationships} color={{ bg: "#e9f1fb", text: "#1d6f8c", border: "#c4dbf3" }} />
        </Card>
      ),
    },
    {
      id: "stampduty",
      label: "Stamp Duty",
      content: (
        <Card>
          <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
            <div className="flex items-center gap-2">
              <Percent size={15} style={{ color: "#8f6a26" }} />
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F2A4A" }}>Stamp duty rates</div>
            </div>
            <Button size="sm" onClick={() => setAddStampDutyOpen(true)}>
              <Plus size={14} /> Add rate
            </Button>
          </div>
          <div style={{ fontSize: 11.5, color: "#9aa1a9", marginBottom: 10 }}>Used in Initiate Transaction to calculate the stamp duty payable, based on the deed type the citizen selects.</div>
          <Table columns={stampDutyColumns} data={stampDutyRates} emptyMessage="No stamp duty rates defined." enableFilter={false} maxBodyHeight="380px" />
        </Card>
      ),
    },
  ];

  const iamTabs = [
    {
      id: "onboarding",
      label: "User Onboarding",
      icon: <UserCog size={14} />,
      content: (
        <Card>
          <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F2A4A" }}>Onboarded users</div>
            <Button size="sm" onClick={() => setAddUserOpen(true)}>
              <Plus size={14} /> Add user
            </Button>
          </div>
          <div style={{ fontSize: 11.5, color: "#9aa1a9", marginBottom: 10 }}>Every identity onboarded onto SLATE across all five portals.</div>
          <Table columns={userColumns} data={authUsers} emptyMessage="No users onboarded yet." enableFilter={false} maxBodyHeight="380px" />
        </Card>
      ),
    },
    {
      id: "roles",
      label: "Roles",
      icon: <ListTree size={14} />,
      content: (
        <Card>
          <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F2A4A" }}>Role / designation creation</div>
            <Button size="sm" onClick={() => setAddRoleOpen(true)}>
              <Plus size={14} /> Add role
            </Button>
          </div>
          <div style={{ fontSize: 11.5, color: "#9aa1a9", marginBottom: 10 }}>Roles double as officer designations. Click "View mapping" to see and edit which permissions a role carries.</div>
          <Table columns={roleColumns} data={roles} emptyMessage="No roles defined." enableFilter={false} maxBodyHeight="380px" />
        </Card>
      ),
    },
    {
      id: "permissions",
      label: "Permissions",
      icon: <KeyRound size={14} />,
      content: (
        <Card>
          <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F2A4A" }}>Permission creation</div>
            <Button size="sm" onClick={() => setAddPermissionOpen(true)}>
              <Plus size={14} /> Add permission
            </Button>
          </div>
          <div style={{ fontSize: 11.5, color: "#9aa1a9", marginBottom: 10 }}>Every action a role can be granted, grouped by module.</div>
          <Table columns={permissionColumns} data={permissions} emptyMessage="No permissions defined." enableFilter={false} maxBodyHeight="380px" />
        </Card>
      ),
    },
    {
      id: "menus",
      label: "Menu Creation",
      icon: <Grid3x3 size={14} />,
      content: (
        <Card>
          <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F2A4A" }}>Menu creation</div>
            <Button size="sm" onClick={() => setAddMenuOpen(true)}>
              <Plus size={14} /> Add menu
            </Button>
          </div>
          <div style={{ fontSize: 11.5, color: "#9aa1a9", marginBottom: 10 }}>Every sidebar menu item across all portals.</div>
          <Table columns={menuColumns} data={menus} emptyMessage="No menus defined." enableFilter={false} maxBodyHeight="380px" />
        </Card>
      ),
    },
    {
      id: "menumapping",
      label: "Menu Mapping",
      icon: <Grid3x3 size={14} />,
      content: (
        <Card>
          <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 4, color: "#0F2A4A" }}>Menu → Permission mapping</div>
          <div style={{ fontSize: 11.5, color: "#9aa1a9", marginBottom: 12 }}>
            Click a menu's permission pill to assign or change it, grouped by portal. Combined with Role Mapping below, this completes the Role → Permission → Menu chain.
          </div>
          <MenuMappingPanel
            menus={menus.map((m) => ({ code: m.id, label: m.menuName, portal: (m.portal ?? "citizen") as SlatePortal, icon: m.menuIcon ?? undefined, path: m.menuRoute ?? undefined }))}
            permissions={permissions.map((p) => ({ code: p.id, label: p.label ?? p.permissionName, module: p.moduleLabel ?? "General" }))}
            menuPermissions={Object.fromEntries(menuPermissions.map((mp) => [mp.menuId, mp.permissionId]))}
            onAssign={handleAssignMenuPermission}
          />
        </Card>
      ),
    },
    {
      id: "mapping",
      label: "Role Mapping",
      icon: <KeyRound size={14} />,
      content: (
        <Card>
          <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 4, color: "#0F2A4A" }}>Role → Permission mapping</div>
          <div style={{ fontSize: 11.5, color: "#9aa1a9", marginBottom: 10 }}>Which permissions are granted to each role. Use "Edit mapping" to add or remove permissions for a role.</div>
          <div className="flex flex-col gap-3" style={{ maxHeight: 380, overflowY: "auto" }}>
            {roles.map((r) => {
              const granted = rolePermissions.filter((rp) => rp.roleId === r.id);
              return (
                <div key={r.id} style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #eceef0", background: "#fafbfc" }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0F2A4A" }}>{r.roleName}</span>
                    <Button size="sm" variant="outline" onClick={() => setActiveRole(r)}>
                      <Pencil size={12} /> Edit mapping
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {granted.length === 0 && <span style={{ fontSize: 10.5, color: "#9aa1a9" }}>No permissions granted yet.</span>}
                    {granted.map((rp) => {
                      const perm = permissions.find((p) => p.id === rp.permissionId);
                      return (
                        <span key={rp.id} style={{ fontSize: 10.8, fontWeight: 600, padding: "3px 9px", borderRadius: 999, background: "#fbf3e2", color: "#8f6a26" }}>
                          {perm?.label ?? perm?.permissionName ?? rp.permissionId}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ),
    },
  ];

  return (
    <div className="flex flex-col" style={{ height: "100%" }}>
      <div style={{ flexShrink: 0 }}>
        <PageHead
          eyebrow="Court / Admin Portal"
          title="Master Data"
          sub="On-chain token lifecycle reference, off-chain reference masters, and SLATE's own IAM (users, roles, permissions, menus)."
          actions={
            <Button variant="outline" onClick={handleReseed} disabled={reseeding}>
              <RefreshCw size={13} className={reseeding ? "animate-spin" : ""} />
              {reseeding ? "Reseeding…" : "Reseed Demo Data"}
            </Button>
          }
        />
      </div>

      <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
        {error && <Alert type="error" title="Could not load master data" message={error} dismissible={false} />}
        {loading && !error && <div style={{ fontSize: 12.5, color: "#9aa1a9", padding: "20px 0" }}>Loading…</div>}
        {!loading && !error && (
          <Tabs
            variant="pills"
            tabs={[
              { id: "onchain", label: "On-chain Masters", icon: <Link2 size={14} />, content: <Tabs variant="underline" size="sm" tabs={onChainTabs} /> },
              { id: "offchain", label: "Off-chain Masters", icon: <Database size={14} />, content: <Tabs variant="underline" size="sm" tabs={offChainTabs} /> },
              { id: "iam", label: "IAM", icon: <ShieldCheck size={14} />, content: <Tabs variant="underline" size="sm" tabs={iamTabs} /> },
            ]}
          />
        )}
      </div>

      <Modal isOpen={addOfficerOpen} onClose={() => setAddOfficerOpen(false)} size="sm" title="Add officer">
        <div className="flex flex-col gap-3" style={{ padding: 20 }}>
          <Input label="Full name" value={officerForm.name} onChange={(e) => setOfficerForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. P. Saravanan" />
          <Select
            label="Designation / Role"
            value={officerForm.roleId}
            onChange={(e) => setOfficerForm((f) => ({ ...f, roleId: e.target.value }))}
            options={roles.map((r) => ({ label: r.roleName, value: r.id }))}
            placeholder="Select designation"
          />
          <Select
            label="Jurisdiction (Taluk)"
            value={officerForm.taluk || taluks[0]?.name || ""}
            onChange={(e) => setOfficerForm((f) => ({ ...f, taluk: e.target.value }))}
            options={taluks.map((t) => ({ label: `${t.name} Taluk`, value: t.name }))}
          />
          <Select
            label="Maker / Checker"
            value={officerForm.makerChecker}
            onChange={(e) => setOfficerForm((f) => ({ ...f, makerChecker: e.target.value as "Maker" | "Checker" | "N/A" }))}
            options={[
              { label: "N/A", value: "N/A" },
              { label: "Maker", value: "Maker" },
              { label: "Checker", value: "Checker" },
            ]}
          />
          <Input label="Work email" value={officerForm.email} onChange={(e) => setOfficerForm((f) => ({ ...f, email: e.target.value }))} placeholder="name@department.gov.in" />
          <div style={{ fontSize: 11, color: "#9aa1a9" }}>A temporary password will be emailed to this address. The officer must set their own password on first login.</div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setAddOfficerOpen(false)}>Cancel</Button>
            <Button disabled={!officerForm.name || !officerForm.roleId || !officerForm.email.trim() || busy} onClick={handleCreateOfficer}>{busy ? "Creating…" : "Create officer"}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={addLocationOpen} onClose={() => setAddLocationOpen(false)} size="sm" title="Add location">
        <div className="flex flex-col gap-3" style={{ padding: 20 }}>
          <Select
            label="Level"
            value={locationForm.level}
            onChange={(e) => setLocationForm((f) => ({ ...f, level: e.target.value, parentId: "" }))}
            options={[
              { label: "State", value: "state" },
              { label: "District", value: "district" },
              { label: "Taluk", value: "taluk" },
              { label: "Village", value: "village" },
            ]}
          />
          {locationForm.level !== "state" && (
            <Select
              label={`Parent ${LEVEL_LABEL[PARENT_LEVEL_OF[locationForm.level] ?? ""]}`}
              value={locationForm.parentId}
              onChange={(e) => setLocationForm((f) => ({ ...f, parentId: e.target.value }))}
              options={parentOptionsForLevel(locationForm.level).map((p) => ({ label: p.name, value: p.jurisdictionId }))}
              placeholder="Select parent"
            />
          )}
          <Input label="Name" value={locationForm.name} onChange={(e) => setLocationForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Singaperumal Koil" />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setAddLocationOpen(false)}>Cancel</Button>
            <Button disabled={!locationForm.name || (locationForm.level !== "state" && !locationForm.parentId) || busy} onClick={handleAddLocation}>{busy ? "Adding…" : "Add location"}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={addDocTypeOpen} onClose={() => { setAddDocTypeOpen(false); setDocTypeCategory(""); }} size="sm" title="Add entry">
        <div className="flex flex-col gap-3" style={{ padding: 20 }}>
          <Select
            label="Category"
            value={docTypeCategory}
            onChange={(e) => setDocTypeCategory(e.target.value)}
            options={[
              { label: "Document Type (uploads)", value: "" },
              { label: "Property Type", value: "property_type" },
              { label: "Nature of Title", value: "nature_of_title" },
              { label: "Land Type", value: "land_type" },
              { label: "Classification Type", value: "classification_type" },
              { label: "Transaction Type", value: "transaction_type" },
              { label: "Chain of Title Nature", value: "chain_of_title_nature" },
            ]}
          />
          <Input label="Name / label" value={docTypeInput} onChange={(e) => setDocTypeInput(e.target.value)} placeholder="e.g. Encumbrance Certificate" />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => { setAddDocTypeOpen(false); setDocTypeCategory(""); }}>Cancel</Button>
            <Button disabled={!docTypeInput.trim() || busy} onClick={handleAddDocType}>{busy ? "Adding…" : "Add"}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={addRelationOpen} onClose={() => setAddRelationOpen(false)} size="sm" title="Add relationship">
        <div className="flex flex-col gap-3" style={{ padding: 20 }}>
          <Input label="Relationship name" value={relationInput} onChange={(e) => setRelationInput(e.target.value)} placeholder="e.g. Nephew" />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setAddRelationOpen(false)}>Cancel</Button>
            <Button disabled={!relationInput.trim() || busy} onClick={handleAddRelation}>{busy ? "Adding…" : "Add"}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={addStampDutyOpen} onClose={() => setAddStampDutyOpen(false)} size="sm" title="Add stamp duty rate">
        <div className="flex flex-col gap-3" style={{ padding: 20 }}>
          <Input label="Deed type" value={stampDutyForm.label} onChange={(e) => setStampDutyForm((f) => ({ ...f, label: e.target.value }))} placeholder="e.g. Exchange Deed" />
          <Input label="Rate (%)" type="number" value={stampDutyForm.rate} onChange={(e) => setStampDutyForm((f) => ({ ...f, rate: e.target.value }))} placeholder="e.g. 7" />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setAddStampDutyOpen(false)}>Cancel</Button>
            <Button disabled={!stampDutyForm.label.trim() || !stampDutyForm.rate || busy} onClick={handleAddStampDuty}>{busy ? "Adding…" : "Add"}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={addSroOpen} onClose={() => setAddSroOpen(false)} size="sm" title="Add Sub-Registrar Office">
        <div className="flex flex-col gap-3" style={{ padding: 20 }}>
          <Input label="SRO name" value={sroForm.name} onChange={(e) => setSroForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Perungalathur SRO" />
          <Select
            label="Parent jurisdiction (Taluk or District)"
            value={sroForm.parentId}
            onChange={(e) => setSroForm((f) => ({ ...f, parentId: e.target.value }))}
            options={[
              ...taluks.map((j) => ({ label: `${j.name} Taluk`, value: j.jurisdictionId })),
              ...jurisdictions.filter((j) => j.level === "district").map((j) => ({ label: `${j.name} District`, value: j.jurisdictionId })),
            ]}
            placeholder="Select parent"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setAddSroOpen(false)}>Cancel</Button>
            <Button disabled={!sroForm.name.trim() || !sroForm.parentId || busy} onClick={handleAddSro}>{busy ? "Adding…" : "Add SRO"}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={addUserOpen} onClose={() => setAddUserOpen(false)} size="sm" title="Add user">
        <div className="flex flex-col gap-3" style={{ padding: 20 }}>
          <Input label="Full name" value={userForm.name} onChange={(e) => setUserForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. P. Saravanan" />
          <Select label="Portal" value={userForm.portal} onChange={(e) => setUserForm((f) => ({ ...f, portal: e.target.value as SlatePortal }))} options={PORTAL_OPTIONS} />
          <Select
            label="Role"
            value={userForm.roleId}
            onChange={(e) => setUserForm((f) => ({ ...f, roleId: e.target.value }))}
            options={roles.map((r) => ({ label: r.roleName, value: r.id }))}
            placeholder="Select role"
          />
          <Input label="Email" value={userForm.email} onChange={(e) => setUserForm((f) => ({ ...f, email: e.target.value }))} placeholder="name@example.com" />
          <div style={{ fontSize: 11, color: "#9aa1a9" }}>A temporary password will be emailed to this address. The user must set their own password on first login.</div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setAddUserOpen(false)}>Cancel</Button>
            <Button disabled={!userForm.name.trim() || !userForm.roleId || !userForm.email.trim() || busy} onClick={handleAddUser}>{busy ? "Adding…" : "Add user"}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={addRoleOpen} onClose={() => setAddRoleOpen(false)} size="sm" title="Add role">
        <div className="flex flex-col gap-3" style={{ padding: 20 }}>
          <Input label="Role name" value={roleNameInput} onChange={(e) => setRoleNameInput(e.target.value)} placeholder="e.g. DEPUTY_REGISTRAR" />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setAddRoleOpen(false)}>Cancel</Button>
            <Button disabled={!roleNameInput.trim() || busy} onClick={handleAddRole}>{busy ? "Adding…" : "Add role"}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={addPermissionOpen} onClose={() => setAddPermissionOpen(false)} size="sm" title="Add permission">
        <div className="flex flex-col gap-3" style={{ padding: 20 }}>
          <Input label="Permission name" value={permissionForm.label} onChange={(e) => setPermissionForm((f) => ({ ...f, label: e.target.value }))} placeholder="e.g. Release encumbrance" />
          <Input label="Module" value={permissionForm.module} onChange={(e) => setPermissionForm((f) => ({ ...f, module: e.target.value }))} placeholder="e.g. Mortgages" />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setAddPermissionOpen(false)}>Cancel</Button>
            <Button disabled={!permissionForm.label.trim() || !permissionForm.module.trim() || busy} onClick={handleAddPermission}>{busy ? "Adding…" : "Add permission"}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={addMenuOpen} onClose={() => setAddMenuOpen(false)} size="sm" title="Add menu item">
        <div className="flex flex-col gap-3" style={{ padding: 20 }}>
          <Input label="Menu name" value={menuForm.label} onChange={(e) => setMenuForm((f) => ({ ...f, label: e.target.value }))} placeholder="e.g. Tax Lien Manager" />
          <Select label="Portal *" value={menuForm.portal} onChange={(e) => setMenuForm((f) => ({ ...f, portal: e.target.value as SlatePortal }))} options={PORTAL_OPTIONS} placeholder="Select portal" />
          <Input label="Path" value={menuForm.path} onChange={(e) => setMenuForm((f) => ({ ...f, path: e.target.value }))} placeholder="e.g. /slate/officer/tax-lien" />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#161b22", marginBottom: 6 }}>Icon</div>
            <div className="flex flex-wrap gap-1.5" style={{ padding: 10, borderRadius: 8, border: "1px solid #dee2e6", maxHeight: 130, overflowY: "auto" }}>
              {MENU_ICON_NAMES.map((name) => (
                <button
                  key={name}
                  type="button"
                  title={name}
                  onClick={() => setMenuForm((f) => ({ ...f, icon: name }))}
                  className="flex items-center justify-center"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 7,
                    border: menuForm.icon === name ? "2px solid #B8923D" : "1px solid #dee2e6",
                    background: menuForm.icon === name ? "#fbf3e2" : "#fff",
                    color: menuForm.icon === name ? "#8f6a26" : "#545c66",
                    cursor: "pointer",
                  }}
                >
                  <MenuIcon name={name} size={15} />
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setAddMenuOpen(false)}>Cancel</Button>
            <Button disabled={!menuForm.label.trim() || !menuForm.portal || busy} onClick={handleAddMenu}>{busy ? "Adding…" : "Add menu"}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!activeRole} onClose={() => setActiveRole(null)} size="md" title={activeRole ? `${activeRole.roleName}: Permission mapping` : ""}>
        <div className="flex flex-col gap-3" style={{ padding: 20 }}>
          <div className="flex flex-col gap-4" style={{ maxHeight: 360, overflowY: "auto" }}>
            {Array.from(new Set(permissions.map((p) => p.moduleLabel ?? "General"))).map((module) => (
              <div key={module}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "#8f6a26", marginBottom: 8 }}>{module}</div>
                <div className="flex flex-col gap-2">
                  {permissions.filter((p) => (p.moduleLabel ?? "General") === module).map((perm) => (
                    <Checkbox
                      key={perm.id}
                      label={perm.label ?? perm.permissionName}
                      size="sm"
                      checked={!!activeRole && rolePermissions.some((rp) => rp.roleId === activeRole.id && rp.permissionId === perm.id)}
                      onChange={(checked) => activeRole && handleToggleRolePermission(activeRole.id, perm.id, checked)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setActiveRole(null)}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
