import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2, PanelsTopLeft } from "lucide-react";
import { useToast } from "@/ui/feedback/toast/ToastProvider";
import { Modal } from "@/ui/primitives/Modal/Modal";
import { Button } from "@/ui/primitives/Button/Button";
import { Input } from "@/ui/primitives/Input/Input";
import { Select } from "@/ui/primitives/Select/Select";
import { Checkbox } from "@/ui/primitives/Checkbox/Checkbox";

type RawMenu = any;

export type MenuPayload = {
  menuName: string;
  parentId: number | null;
  menuLevel: number;
  menuRoute?: string | null;
  menuLink?: string | null;
  menuIcon?: string | null;
  menuSortOrder?: number | null;
  isActive: boolean;
  mediaLink?: string | null;
};

function toMenuId(m: RawMenu): number {
  return Number(m?.menuId ?? m?.id);
}
function toMenuName(m: RawMenu): string {
  return m?.menuName ?? m?.menu_name ?? m?.name ?? `Menu #${toMenuId(m)}`;
}
function toMenuLevel(m: RawMenu): number | undefined {
  const v = Number(m?.menuLevel ?? m?.menu_level ?? NaN);
  return Number.isFinite(v) ? v : undefined;
}
function toMenuSort(m: RawMenu): number | undefined {
  const v = Number(m?.menuSortOrder ?? m?.menu_sortorder ?? NaN);
  return Number.isFinite(v) ? v : undefined;
}

export default function AddMenuModal({
  open,
  menus,
  onClose,
  onCreate,
}: {
  open: boolean;
  menus: RawMenu[];
  onClose: () => void;
  onCreate: (payload: MenuPayload) => Promise<unknown> | unknown;
}) {
  const toast = useToast();

  const [menuName, setMenuName] = useState("");
  const [parentId, setParentId] = useState("");
  const [menuRoute, setMenuRoute] = useState("");
  const [menuLink, setMenuLink] = useState("");
  const [menuIcon, setMenuIcon] = useState("");
  const [menuSortOrder, setMenuSortOrder] = useState("");
  const [mediaLink, setMediaLink] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const defaultSort = useMemo(() => {
    const sorts = (menus ?? [])
      .map(toMenuSort)
      .filter((x): x is number => Number.isFinite(x));
    if (!sorts.length) return 10;
    const max = Math.max(...sorts);
    return Math.ceil((max + 1) / 10) * 10 || max + 1;
  }, [menus]);

  const parentOptions = useMemo(
    () => [
      { label: "(No parent – top level)", value: "" },
      ...(menus ?? []).map((m) => ({ label: toMenuName(m), value: String(toMenuId(m)) })),
    ],
    [menus],
  );

  const selectedParent = useMemo(
    () => (parentId ? (menus ?? []).find((m) => toMenuId(m) === Number(parentId)) : undefined),
    [parentId, menus],
  );

  const menuLevel = useMemo(() => {
    const pLvl = selectedParent ? toMenuLevel(selectedParent) : undefined;
    return Number.isFinite(pLvl) ? Number(pLvl) + 1 : 1;
  }, [selectedParent]);

  useEffect(() => {
    if (!open) return;
    setMenuName("");
    setParentId("");
    setMenuRoute("");
    setMenuLink("");
    setMenuIcon("");
    setMenuSortOrder(String(defaultSort));
    setMediaLink("");
    setIsActive(true);
    setSubmitting(false);
  }, [open, defaultSort]);

  const validate = () => {
    const misses: string[] = [];
    if (!menuName.trim()) misses.push("Menu Name");
    const so = Number(menuSortOrder);
    if (!Number.isFinite(so) || so < 0) misses.push("Valid Sort Order");
    if (misses.length) {
      toast.error(`Please fill: ${misses.join(", ")}`);
      return false;
    }
    return true;
  };

  const submit = async () => {
    if (!validate()) return;
    const payload: MenuPayload = {
      menuName: menuName.trim(),
      parentId: parentId ? Number(parentId) : null,
      menuLevel,
      menuRoute: menuRoute.trim() || null,
      menuLink: menuLink.trim() || null,
      menuIcon: menuIcon.trim() || null,
      menuSortOrder: Number(menuSortOrder),
      isActive,
      mediaLink: mediaLink.trim() || null,
    };
    try {
      setSubmitting(true);
      await Promise.resolve(onCreate(payload));
      toast.success("Menu created");
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Failed to create menu");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={() => onClose()} size="xl">
      <div className="border-b p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-emerald-100 p-2">
            <PanelsTopLeft className="h-5 w-5 text-emerald-700" />
          </div>
          <div>
            <div className="text-lg font-semibold">Add Menu</div>
            <div className="text-sm text-gray-600">Create a navigation menu.</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <Input
            label="Menu Name *"
            placeholder="e.g., Vendor Reports"
            value={menuName}
            onChange={(e) => setMenuName(e.target.value)}
          />
        </div>

        <div>
          <Select
            label="Parent Menu"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            options={parentOptions}
          />
          <div className="mt-1 text-xs text-gray-500">
            Level will be set to {menuLevel} based on parent.
          </div>
        </div>

        <div>
          <Input
            label="Sort Order *"
            type="number"
            placeholder={String(defaultSort)}
            value={menuSortOrder}
            onChange={(e) => setMenuSortOrder(e.target.value)}
          />
          <div className="mt-1 text-xs text-gray-500">Suggested: {defaultSort}</div>
        </div>

        <Input
          label="Route"
          placeholder="/reports/vendor"
          value={menuRoute}
          onChange={(e) => setMenuRoute(e.target.value)}
        />

        <Input
          label="External Link"
          placeholder="https://docs.example.com"
          value={menuLink}
          onChange={(e) => setMenuLink(e.target.value)}
        />

        <Input
          label="Icon"
          placeholder="HelpCircle"
          value={menuIcon}
          onChange={(e) => setMenuIcon(e.target.value)}
        />

        <Input
          label="Media Link (optional)"
          placeholder="https://asset.example/icon"
          value={mediaLink}
          onChange={(e) => setMediaLink(e.target.value)}
        />

        <div className="md:col-span-2">
          <Checkbox label="Active" checked={isActive} onChange={(v) => setIsActive(v)} />
        </div>

        {/* <div className="md:col-span-2 rounded-lg bg-blue-50 p-3 text-xs text-blue-800">
          <div className="mb-1 flex items-center gap-2 font-medium">
            <AlertCircle className="h-4 w-4" />
            Tip
          </div>
          Define a hierarchy by setting a parent; the level will be auto-calculated.
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
            "Create Menu"
          )}
        </Button>
      </div>
    </Modal>
  );
}

