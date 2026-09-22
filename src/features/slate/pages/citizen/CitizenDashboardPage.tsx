import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, ArrowRightLeft, UploadCloud, Radar, Landmark, Gavel, UserRound } from "lucide-react";
import { Card } from "@/ui/primitives/Card/Card";
import { ROUTES } from "@/navigation/routes";
import { useSlateStore } from "../../state/SlateProvider";
import { slateApi } from "../../services/apiClient";
import DashboardHero from "../../components/DashboardHero";
import KpiCard from "../../components/KpiCard";
import StateBadge from "../../components/StateBadge";
import { inrShort } from "../../utils/format";
import type { SlateHistoryEntry, SlateToken } from "../../types/slate.types";

const KIND_COLOR: Record<string, string> = {
  ok: "#1C7A4E",
  warn: "#B8722E",
  danger: "#B0392F",
  info: "#B8923D",
};

const QUICK_ACTIONS = [
  { label: "My Properties", desc: "View all parcels you own", icon: <Home size={17} />, path: ROUTES.PATHS.APP.SLATE.CITIZEN_PROPERTIES },
  { label: "Initiate Transaction", desc: "Sell, gift, or request a mortgage", icon: <ArrowRightLeft size={17} />, path: ROUTES.PATHS.APP.SLATE.CITIZEN_INITIATE },
  { label: "Upload Documents", desc: "Death certificate & succession docs", icon: <UploadCloud size={17} />, path: ROUTES.PATHS.APP.SLATE.CITIZEN_DOCUMENTS },
  { label: "Track Status", desc: "Follow your pending transactions", icon: <Radar size={17} />, path: ROUTES.PATHS.APP.SLATE.CITIZEN_STATUS },
];

export default function CitizenDashboardPage() {
  const { currentUser } = useSlateStore();
  const navigate = useNavigate();
  const [myTokens, setMyTokens] = useState<SlateToken[]>([]);

  useEffect(() => {
    slateApi.citizen.getProperties().then(setMyTokens).catch(() => undefined);
  }, []);

  const blocked = myTokens.filter((t) => t.state === "blocked").length;
  const locked = myTokens.filter((t) => t.state === "locked").length;
  const disputed = myTokens.filter((t) => t.state === "disputed").length;
  const totalValue = myTokens.reduce((sum, t) => sum + (t.financial.guidanceValue || 0), 0);

  const recentActivity = myTokens
    .flatMap((t) => t.history ?? [])
    .sort((a, b) => (a.ts < b.ts ? 1 : -1))
    .slice(0, 6) as SlateHistoryEntry[];

  return (
    <div className="flex flex-col" style={{ height: "100%" }}>
      <div style={{ flexShrink: 0 }}>
        <DashboardHero
          eyebrow="Citizen Portal"
          title={`Welcome back, ${currentUser?.name ?? "Citizen"}`}
          sub="Your land parcels, tracked on-chain. View status, initiate transactions, and follow up on succession or disputes."
          accent="#1d4670"
          icon={<Home size={22} />}
        />

        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(4, 1fr)", margin: "16px 0 20px" }}>
          <KpiCard label="My Properties" value={myTokens.length} icon={<Home size={18} />} accent="#1d4670" />
          <KpiCard label="Guideline Value" value={inrShort(totalValue)} icon={<Landmark size={18} />} accent="#1C7A4E" foot="Across all your parcels" />
          <KpiCard label="Transfer Blocked" value={blocked} icon={<ArrowRightLeft size={18} />} accent="#B8722E" foot={blocked ? "Active mortgage" : "None"} footKind={blocked ? "warn" : undefined} pct={myTokens.length ? (blocked / myTokens.length) * 100 : 0} />
          <KpiCard label="Disputed / Locked" value={disputed + locked} icon={<Gavel size={18} />} accent="#B0392F" foot={disputed + locked ? "Action may be needed" : "All clear"} footKind={disputed + locked ? "danger" : "up"} pct={myTokens.length ? ((disputed + locked) / myTokens.length) * 100 : 0} />
        </div>
      </div>

      <div className="grid gap-4 flex-1" style={{ gridTemplateColumns: "0.85fr 1.15fr 1fr", minHeight: 0 }}>
        <Card style={{ display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 12, color: "#0F2A4A", flexShrink: 0 }}>Quick actions</div>
          <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
            <div className="flex flex-col gap-3">
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.path}
                  onClick={() => navigate(a.path)}
                  className="flex items-start gap-3 text-left"
                  style={{ padding: 14, borderRadius: 9, border: "1px solid #dee2e6", background: "#fff", cursor: "pointer" }}
                >
                  <div style={{ color: "#1d4670" }}>{a.icon}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#161b22" }}>{a.label}</div>
                    <div style={{ fontSize: 11.5, color: "#717881", marginTop: 2 }}>{a.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card style={{ display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 12, color: "#0F2A4A", flexShrink: 0 }}>My properties</div>
          <div className="flex-1 flex flex-col overflow-y-auto" style={{ minHeight: 0 }}>
            <div className="flex flex-col gap-2">
              {myTokens.length === 0 && <div style={{ fontSize: 12, color: "#9aa1a9" }}>No properties yet.</div>}
              {myTokens.map((t) => (
                <button
                  key={t.ulpin}
                  onClick={() => navigate(ROUTES.PATHS.APP.SLATE.CITIZEN_PROPERTY_DETAIL.replace(":ulpin", t.ulpin))}
                  className="flex items-center justify-between text-left"
                  style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #eceef0", background: "#fafbfc", cursor: "pointer" }}
                >
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "#161b22", fontFamily: "monospace" }}>{t.ulpin}</div>
                    <div style={{ fontSize: 11.3, color: "#717881" }}>
                      {t.location.village}, {t.location.taluk} · {t.physical.area}
                    </div>
                  </div>
                  <StateBadge state={t.state} size="sm" />
                </button>
              ))}
            </div>
            {myTokens.length > 0 && (
              <button
                onClick={() => navigate(ROUTES.PATHS.APP.SLATE.CITIZEN_PROPERTIES)}
                className="flex items-center justify-center gap-1.5"
                style={{ marginTop: "auto", paddingTop: 14, fontSize: 12, fontWeight: 600, color: "#1d4670", background: "none", border: "none", cursor: "pointer" }}
              >
                Showing {myTokens.length} {myTokens.length === 1 ? "property" : "properties"} · View full portfolio →
              </button>
            )}
          </div>
        </Card>

        <Card style={{ display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 12, color: "#0F2A4A", flexShrink: 0 }}>Recent activity</div>
          <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
            <div className="flex flex-col gap-2.5">
              {recentActivity.length === 0 && <div style={{ fontSize: 12, color: "#9aa1a9" }}>No recent activity yet.</div>}
              {recentActivity.map((a, i) => {
                const color = KIND_COLOR[a.kind] ?? KIND_COLOR.info;
                return (
                  <div key={i} style={{ borderRadius: 9, border: `1px solid ${color}30`, background: `${color}0a`, padding: "10px 12px" }}>
                    <div className="flex items-center justify-between gap-2" style={{ marginBottom: 3 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: "#161b22" }}>{a.action}</span>
                      <span style={{ fontSize: 10, color: "#9aa1a9", fontFamily: "monospace", whiteSpace: "nowrap" }}>{a.ts}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: "#717881", lineHeight: 1.5 }}>{a.detail}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
