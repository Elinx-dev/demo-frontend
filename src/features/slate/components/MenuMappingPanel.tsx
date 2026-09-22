import { useState } from "react";
import { Search, Check, Unlock, ChevronDown, ChevronRight } from "lucide-react";
import { Input } from "@/ui/primitives/Input/Input";
import { Popover } from "@/ui/primitives/Popover/Popover";
import { MenuIcon } from "../utils/menuIcons";
import type { SlateMenuItem, SlatePermission, SlatePortal } from "../types/slate.types";

const PORTAL_LABEL: Record<string, string> = { citizen: "Citizen", officer: "Officer", bank: "Bank", court: "Court", surveyor: "Surveyor" };
const PORTAL_ORDER: SlatePortal[] = ["citizen", "officer", "bank", "court", "surveyor"];

interface PermissionPickerProps {
  permissions: SlatePermission[];
  currentCode: string | undefined;
  onPick: (code: string) => void;
}

function PermissionPicker({ permissions, currentCode, onPick }: PermissionPickerProps) {
  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();
  const filtered = q ? permissions.filter((p) => p.label.toLowerCase().includes(q) || p.module.toLowerCase().includes(q)) : permissions;
  const modules = Array.from(new Set(filtered.map((p) => p.module)));

  return (
    <div style={{ width: 300 }}>
      <Input size="sm" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search permissions…" startAdornment={<Search size={13} />} />
      <div className="flex flex-col gap-1" style={{ marginTop: 10, maxHeight: 280, overflowY: "auto" }}>
        <button
          onClick={() => onPick("")}
          className="flex items-center justify-between w-full"
          style={{ padding: "8px 10px", borderRadius: 7, border: !currentCode ? "1.5px solid #B8923D" : "1px solid #eceef0", background: !currentCode ? "#fbf3e2" : "#fff", cursor: "pointer" }}
        >
          <span className="flex items-center gap-2" style={{ fontSize: 12, fontWeight: 600, color: "#161b22" }}>
            <Unlock size={12} style={{ color: "#1C7A4E" }} /> Always visible
          </span>
          {!currentCode && <Check size={13} style={{ color: "#8f6a26" }} />}
        </button>

        {modules.map((module) => (
          <div key={module} style={{ marginTop: 6 }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#9aa1a9", margin: "2px 0 4px 4px" }}>{module}</div>
            {filtered.filter((p) => p.module === module).map((p) => {
              const active = currentCode === p.code;
              return (
                <button
                  key={p.code}
                  onClick={() => onPick(p.code)}
                  className="flex items-center justify-between w-full text-left"
                  style={{ padding: "8px 10px", borderRadius: 7, border: active ? "1.5px solid #B8923D" : "1px solid #eceef0", background: active ? "#fbf3e2" : "#fff", cursor: "pointer", marginBottom: 4 }}
                >
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#161b22" }}>{p.label}</span>
                  {active && <Check size={13} style={{ color: "#8f6a26", flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

interface MenuMappingPanelProps {
  menus: SlateMenuItem[];
  permissions: SlatePermission[];
  menuPermissions: Record<string, string>;
  onAssign: (menuCode: string, permissionCode: string) => void;
}

export default function MenuMappingPanel({ menus, permissions, menuPermissions, onAssign }: MenuMappingPanelProps) {
  const [collapsed, setCollapsed] = useState<Set<SlatePortal>>(new Set());

  const toggle = (portal: SlatePortal) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(portal) ? next.delete(portal) : next.add(portal);
      return next;
    });
  };

  return (
    <div style={{ maxHeight: 460, overflowY: "auto", border: "1px solid #eceef0", borderRadius: 10 }}>
      {PORTAL_ORDER.map((portalKey) => {
        const menusForPortal = menus.filter((m) => m.portal === portalKey);
        if (menusForPortal.length === 0) return null;
        const isCollapsed = collapsed.has(portalKey);
        return (
          <div key={portalKey} style={{ borderBottom: "1px solid #eceef0" }}>
            <button
              onClick={() => toggle(portalKey)}
              className="flex items-center gap-2 w-full"
              style={{ padding: "10px 14px", border: "none", background: "#f7f8f9", cursor: "pointer" }}
            >
              {isCollapsed ? <ChevronRight size={13} style={{ color: "#9aa1a9" }} /> : <ChevronDown size={13} style={{ color: "#9aa1a9" }} />}
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#0F2A4A" }}>{PORTAL_LABEL[portalKey]} Portal</span>
              <span style={{ fontSize: 10.5, color: "#9aa1a9" }}>· {menusForPortal.length} menus</span>
            </button>

            {!isCollapsed && (
              <div>
                {menusForPortal.map((m) => {
                  const permCode = menuPermissions[m.code];
                  const perm = permissions.find((p) => p.code === permCode);
                  return (
                    <div key={m.code} className="flex items-center gap-3" style={{ padding: "10px 14px", borderTop: "1px solid #f1f3f5" }}>
                      <span className="flex items-center justify-center" style={{ width: 26, height: 26, borderRadius: 7, background: "#fbf3e2", color: "#8f6a26", flexShrink: 0 }}>
                        <MenuIcon name={m.icon} size={13} />
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: "#161b22" }}>{m.label}</div>
                        {m.path && <div style={{ fontSize: 10, color: "#9aa1a9", fontFamily: "monospace" }}>{m.path}</div>}
                      </div>
                      <Popover
                        placement="bottom"
                        trigger={
                          <button
                            className="flex items-center gap-1.5"
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "5px 10px",
                              borderRadius: 999,
                              border: perm ? "1px solid #ecddb8" : "1px solid #dee2e6",
                              background: perm ? "#fbf3e2" : "#fff",
                              color: perm ? "#8f6a26" : "#9aa1a9",
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {perm ? perm.label : "Always visible"}
                            <ChevronDown size={11} />
                          </button>
                        }
                        content={<PermissionPicker permissions={permissions} currentCode={permCode} onPick={(code) => onAssign(m.code, code)} />}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
