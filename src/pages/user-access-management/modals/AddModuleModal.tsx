import { useEffect, useState } from "react";
import { AlertCircle, Boxes, Loader2 } from "lucide-react";
import { useToast } from "@/ui/feedback/toast/ToastProvider";
import { Modal } from "@/ui/primitives/Modal/Modal";
import { Button } from "@/ui/primitives/Button/Button";
import { Input } from "@/ui/primitives/Input/Input";
import { Checkbox } from "@/ui/primitives/Checkbox/Checkbox";

export type ModulePayload = {
  moduleName: string;
  isTechModule: boolean;
  isActive: boolean;
  mediaLink?: string | null;
};

export default function AddModuleModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: ModulePayload) => Promise<unknown> | unknown;
}) {
  const toast = useToast();

  const [moduleName, setModuleName] = useState("");
  const [isTechModule, setIsTechModule] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [mediaLink, setMediaLink] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setModuleName("");
    setIsTechModule(false);
    setIsActive(true);
    setMediaLink("");
    setSubmitting(false);
  }, [open]);

  const submit = async () => {
    if (!moduleName.trim()) {
      toast.error("Module Name is required");
      return;
    }
    const payload: ModulePayload = {
      moduleName: moduleName.trim(),
      isTechModule,
      isActive,
      mediaLink: mediaLink.trim() || null,
    };
    try {
      setSubmitting(true);
      await Promise.resolve(onCreate(payload));
      toast.success("Module created");
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Failed to create module");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={() => onClose()} size="lg">
      <div className="border-b p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-emerald-100 p-2">
            <Boxes className="h-5 w-5 text-emerald-700" />
          </div>
          <div>
            <div className="text-lg font-semibold">Add Module</div>
            <div className="text-sm text-gray-600">Create a module grouping.</div>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-6">
        <Input
          label="Module Name *"
          placeholder="e.g., Third-Party Risk"
          value={moduleName}
          onChange={(e) => setModuleName(e.target.value)}
        />

        <div className="flex flex-wrap items-center gap-6">
          <Checkbox
            label="Technical Module"
            checked={isTechModule}
            onChange={(v) => setIsTechModule(v)}
          />
          <Checkbox label="Active" checked={isActive} onChange={(v) => setIsActive(v)} />
        </div>

        <Input
          label="Media Link (optional)"
          placeholder="https://asset.example/icon"
          value={mediaLink}
          onChange={(e) => setMediaLink(e.target.value)}
        />

        {/* <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800">
          <div className="mb-1 flex items-center gap-2 font-medium">
            <AlertCircle className="h-4 w-4" />
            Tip
          </div>
          Modules are logical groupings (e.g., <b>Risk</b>, <b>Compliance</b>). Map
          Menus later in the Mapping tab.
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
            "Create Module"
          )}
        </Button>
      </div>
    </Modal>
  );
}

