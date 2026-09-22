import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2, Shield } from "lucide-react";
import { useToast } from "@/ui/feedback/toast/ToastProvider";
import { apiService } from "@/services/api/apiService";
import { Modal } from "@/ui/primitives/Modal/Modal";
import { Button } from "@/ui/primitives/Button/Button";
import { Input } from "@/ui/primitives/Input/Input";
import { Select } from "@/ui/primitives/Select/Select";
import { Checkbox } from "@/ui/primitives/Checkbox/Checkbox";
import { authService } from "@/services/auth/authService";

const safeArray = <T,>(x: any): T[] => (Array.isArray(x) ? x : x ? [x] : []);

export type Tenant = { tenantId: number; tenantName: string; isActive?: boolean };

export type RolePayload = {
  roleName: string;
  tenantId: number;
  isActive: boolean;
  mediaLink?: string | null;
};

export default function AddRoleModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  tenants?: Tenant[];
  onClose: () => void;
  onCreate: (payload: RolePayload) => Promise<unknown> | unknown;
}) {
  const toast = useToast();

  const [roleName, setRoleName] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [mediaLink, setMediaLink] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // const [tenants, setTenants] = useState<Tenant[]>([]);
  // const [loadingTenants, setLoadingTenants] = useState(false);

  // const tenantOptions = useMemo(
  //   () =>
  //     tenants.map((t) => ({
  //       label: t.tenantName,
  //       value: String(t.tenantId),
  //     })), 
  //   [tenants],
  // );

  useEffect(() => {
    if (!open) return;
    setRoleName("");
    setTenantId("");
    setIsActive(true);
    setMediaLink("");
    setSubmitting(false);
    // setTenants([]);

    // // Fetch all tenants
    // (async () => {
    //   setLoadingTenants(true);
    //   try {
    //     const resp = await apiService.get<any>(`get_all_tenants`);
    //     const list = resp?.data?.data ?? resp?.data ?? resp ?? [];
    //     const mapped: Tenant[] = safeArray<any>(list)
    //       .map((t) => ({
    //         tenantId: Number(t.tenantId ?? t.id ?? 0),
    //         tenantName: String(t.tenantName ?? t.name ?? ""),
    //         isActive: t.isActive !== false,
    //       }))
    //       .filter((t) => !!t.tenantId && !!t.tenantName);
    //     setTenants(mapped);
    //   } catch {
    //     setTenants([]);
    //     toast.error("Failed to fetch tenants");
    //   } finally {
    //     setLoadingTenants(false);
    //   }
    // })();
  }, [open]);

  const validate = () => {
    const misses: string[] = [];
    if (!roleName.trim()) misses.push("Role Name");
    // if (!tenantId) misses.push("Tenant");
    if (misses.length) {
      toast.error(`Please fill: ${misses.join(", ")}`);
      return false;
    }
    return true;
  };

  const submit = async () => {
    if (!validate()) return;
    const currentTenantId = authService.getTenantId();
    const payload: RolePayload = {
      roleName: roleName.trim(),
      tenantId: Number(currentTenantId),
      isActive,
      mediaLink: mediaLink.trim() || null,
    };
    try {
      setSubmitting(true);
      await Promise.resolve(onCreate(payload));
      toast.success("Role created");
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Failed to create role");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={() => onClose()} size="lg">
      <div className="border-b p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-emerald-100 p-2">
            <Shield className="h-5 w-5 text-emerald-700" />
          </div>
          <div>
            <div className="text-lg font-semibold">Add Role</div>
            <div className="text-sm text-gray-600">Create a new role for a bank.</div>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-6">
        <Input
          label="Role Name *"
          placeholder="e.g., Vendor IT Team"
          value={roleName}
          onChange={(e) => setRoleName(e.target.value)}
        />

        {/* <Select
          label="Tenant *"
          placeholder={
            loadingTenants
              ? "Loading tenants…"
              : tenantOptions.length
                ? "Select tenant"
                : "No tenants"
          }
          value={tenantId}
          onChange={(e) => setTenantId(e.target.value)}
          options={tenantOptions}
          disabled={loadingTenants || !tenantOptions.length}
        /> */}

        <Input
          label="Media Link (optional)"
          placeholder="https://asset.example/icon"
          value={mediaLink}
          onChange={(e) => setMediaLink(e.target.value)}
        />

        <Checkbox label="Active" checked={isActive} onChange={(v) => setIsActive(v)} />

        {/* <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800">
          <div className="mb-1 flex items-center gap-2 font-medium">
            <AlertCircle className="h-4 w-4" />
            Tip
          </div>
          Use a clear name (e.g., <b>QBOX – Vendor IT Team</b>).
        </div> */}
      </div>

      <div className="flex items-center justify-end gap-3 border-t p-6">
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="ml-2">Creating...</span>
            </>
          ) : (
            "Create Role"
          )}
        </Button>
      </div>
    </Modal>
  );
}

