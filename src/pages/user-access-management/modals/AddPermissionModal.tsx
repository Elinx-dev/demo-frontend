import { useEffect, useMemo, useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { useToast } from "@/ui/feedback/toast/ToastProvider";
import { apiService } from "@/services/api/apiService";
import { Modal } from "@/ui/primitives/Modal/Modal";
import { Button } from "@/ui/primitives/Button/Button";
import { Input } from "@/ui/primitives/Input/Input";
import { Select } from "@/ui/primitives/Select/Select";
import { Checkbox } from "@/ui/primitives/Checkbox/Checkbox";

const safeArray = <T,>(x: any): T[] => (Array.isArray(x) ? x : x ? [x] : []);

export type MenuLite = { menuId: number; menuName: string };

export type PermissionPayload = {
  permissionName: string;
  isActive: boolean;
  menuId: number;
  mediaLink?: string | null;
};

export default function AddPermissionModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: PermissionPayload) => Promise<unknown> | unknown;
}) {
  const toast = useToast();

  const [permissionName, setPermissionName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [menuId, setMenuId] = useState("");
  const [mediaLink, setMediaLink] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // fetched lists
  const [menus, setMenus] = useState<MenuLite[]>([]);
  const [loadingMenus, setLoadingMenus] = useState(false);

  const menuOptions = useMemo(
    () => menus.map((m) => ({ label: m.menuName, value: String(m.menuId) })),
    [menus],
  );

  useEffect(() => {
    if (!open) return;
    setPermissionName("");
    setMenuId("");
    setIsActive(true);
    setMediaLink("");
    setSubmitting(false);
    setMenus([]);

    // Fetch all menus
    (async () => {
      setLoadingMenus(true);
      try {
        const resp = await apiService.get<any>(`idam/get_all_menus`);
        const list = resp?.data?.data ?? resp?.data ?? resp ?? [];
        const mapped: MenuLite[] = safeArray<any>(list)
          .map((m) => ({
            menuId: Number(m.menuId ?? m.id ?? 0),
            menuName: String(m.menuName ?? m.name ?? ""),
          }))
          .filter((m) => !!m.menuId && !!m.menuName);
        setMenus(mapped);
      } catch {
        setMenus([]);
        toast.error("Failed to fetch menus");
      } finally {
        setLoadingMenus(false);
      }
    })();
  }, [open]);

  const submit = async () => {
    const misses: string[] = [];
    if (!permissionName.trim()) misses.push("Permission Name");
    if (!menuId) misses.push("Menu");

    if (misses.length) {
      toast.error(`Please fill: ${misses.join(", ")}`);
      return;
    }

    const payload: PermissionPayload = {
      permissionName: permissionName.trim(),
      menuId: Number(menuId),
      isActive,
      mediaLink: mediaLink.trim() || null,
    };
    try {
      setSubmitting(true);
      await Promise.resolve(onCreate(payload));
      toast.success("Permission created");
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Failed to create permission");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={() => onClose()} size="md">
      <div className="border-b p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-emerald-100 p-2">
            <KeyRound className="h-5 w-5 text-emerald-700" />
          </div>
          <div>
            <div className="text-lg font-semibold">Add Menu Permission</div>
            <div className="text-sm text-gray-600">
              Create a permission entity.
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-6">
        <Input
          label="Permission Name *"
          placeholder="e.g., Risk Reports"
          value={permissionName}
          onChange={(e) => setPermissionName(e.target.value)}
        />
        <Select
          label="Menu *"
          placeholder={
            loadingMenus
              ? "Loading menus…"
              : menuOptions.length
                ? "Select menu"
                : "No menus"
          }
          value={menuId}
          onChange={(e) => setMenuId(e.target.value)}
          options={menuOptions}
          disabled={loadingMenus || !menuOptions.length}
        />
        <Input
          label="Media Link (optional)"
          placeholder="https://asset.example/icon"
          value={mediaLink}
          onChange={(e) => setMediaLink(e.target.value)}
        />
        <Checkbox
          label="Active"
          checked={isActive}
          onChange={(v) => setIsActive(v)}
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
              <span className="ml-2">Creating...</span>
            </>
          ) : (
            "Create Menu Permission"
          )}
        </Button>
      </div>
    </Modal>
  );
}
