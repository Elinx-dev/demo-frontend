import { useEffect, useMemo, useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { useToast } from "@/ui/feedback/toast/ToastProvider";
import { apiService } from "@/services/api/apiService";
import { Modal } from "@/ui/primitives/Modal/Modal";
import { Button } from "@/ui/primitives/Button/Button";
import { Input } from "@/ui/primitives/Input/Input";
import { Select } from "@/ui/primitives/Select/Select";
import { authService } from "@/services/auth/authService";

export type Tenant = {
  tenantId: number;
  tenantName: string;
  tenantCode?: string;
  isActive?: boolean;
};
type RoleLite = { roleId: number; roleName: string };

type Props = {
  open: boolean;
  tenants?: Tenant[];
  onClose: () => void;
  onSuccess: () => void;
};

const safeArray = <T,>(x: any): T[] => (Array.isArray(x) ? x : x ? [x] : []);

export default function CreateUserModal({ open, onClose, onSuccess }: Props) {
  const toast = useToast();

  // form state
  const [email, setEmail] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [roleId, setRoleId] = useState("");

  // fetched lists
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [roles, setRoles] = useState<RoleLite[]>([]);

  // loading flags
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const tenant_id = authService.getTenantId();

  // ── Reset form & fetch tenants when modal opens ──────────────────────────
  useEffect(() => {
    if (!open) return;
    setEmail("");
    setTenantId("");
    setRoleId("");
    setTenants([]);
    setRoles([]);
    setSubmitting(false);

    // Fetch all tenants
    (async () => {
      setLoadingTenants(true);
      try {
        const resp = await apiService.get<any>(`idam/get_all_tenants`);
        const list = resp?.data?.data ?? resp?.data ?? resp ?? [];
        const mapped: Tenant[] = safeArray<any>(list)
          .map((t) => ({
            tenantId: Number(t.tenantId ?? t.id ?? 0),
            tenantName: String(t.tenantName ?? t.name ?? ""),
            tenantCode: String(t.tenantCode ?? ""),
            isActive: t.isActive !== false,
          }))
          .filter((t) => !!t.tenantId && !!t.tenantName);
        setTenants(mapped);
      } catch {
        setTenants([]);
        toast.error("Failed to fetch tenants");
      } finally {
        setLoadingTenants(false);
      }
    })();
  }, [open]);

  // ── Fetch all roles when modal opens ─────────────────────────────────────
  useEffect(() => {
    if (!open) return;

    (async () => {
      setLoadingRoles(true);
      try {
        const resp = await apiService.get<any>(
          `idam/get_all_role?tenantId=${tenant_id}`,
        );
        const raw = resp?.data?.data ?? resp?.data ?? resp ?? [];

        // Handle both array and numeric-keyed object response
        const list = Array.isArray(raw)
          ? raw
          : raw && typeof raw === "object"
            ? Object.values(raw).filter(
                (v) =>
                  v && typeof v === "object" && ("roleId" in v || "id" in v),
              )
            : [];

        const mapped: RoleLite[] = list
          .map((r: any) => ({
            roleId: Number(r.roleId ?? r.id ?? 0),
            roleName: String(r.roleName ?? r.name ?? ""),
          }))
          .filter((r) => !!r.roleId && !!r.roleName);
        setRoles(mapped);
      } catch {
        setRoles([]);
        toast.error("Failed to fetch roles");
      } finally {
        setLoadingRoles(false);
      }
    })();
  }, [open]);

  // ── Derived options ──────────────────────────────────────────────────────
  const tenantOptions = useMemo(
    () =>
      tenants.map((t) => ({ label: t.tenantName, value: String(t.tenantId) })),
    [tenants],
  );

  const roleOptions = useMemo(
    () => roles.map((r) => ({ label: r.roleName, value: String(r.roleId) })),
    [roles],
  );

  // ── Validation ───────────────────────────────────────────────────────────
  const validate = () => {
    const misses: string[] = [];
    if (!email.trim()) misses.push("Email");
    if (!tenantId) misses.push("Tenant");
    if (!roleId) misses.push("Role");
    if (misses.length) {
      toast.error(`Please fill: ${misses.join(", ")}`);
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Enter a valid email address");
      return false;
    }
    return true;
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const submit = async () => {
    if (!validate()) return;
    const payload: any = {
      authUserName: email.trim(),
      tenantId: Number(tenantId),
      roleId: Number(roleId),
      // role_id: Number(roleId),
    };
    try {
      setSubmitting(true);
      await apiService.post(`idam/create_tenant_credentials`, payload);
      toast.success("User created");
      onSuccess();
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={() => onClose()} size="xl">
      <div className="border-b p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-emerald-100 p-2">
            <UserPlus className="h-5 w-5 text-emerald-700" />
          </div>
          <div>
            <div className="text-lg font-semibold">Create User</div>
            <div className="text-sm text-gray-600">
              Create tenant credentials and assign a role.
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <Input
            label="Email *"
            type="email"
            placeholder="user@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <Select
          label="Tenant *"
          placeholder={
            loadingTenants
              ? "Loading tenants…"
              : tenantOptions.length
                ? "Select tenant"
                : "No tenants"
          }
          value={tenantId}
          onChange={(e) => {
            setTenantId(e.target.value);
            setRoleId("");
          }}
          options={tenantOptions}
          disabled={loadingTenants || !tenantOptions.length}
        />

        <Select
          label="Role *"
          placeholder={loadingRoles ? "Loading roles…" : "Select role"}
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
          options={roleOptions}
          disabled={loadingRoles}
        />
      </div>

      <div className="flex items-center justify-end gap-3 border-t p-6">
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="ml-2">Creating…</span>
            </>
          ) : (
            "Create"
          )}
        </Button>
      </div>
    </Modal>
  );
}
