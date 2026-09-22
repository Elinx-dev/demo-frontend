import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Landmark, CheckCircle2 } from "lucide-react";
import { Card } from "@/ui/primitives/Card/Card";
import Badge from "@/ui/primitives/Badge/Badge";
import { ROUTES } from "@/navigation/routes";
import { useSlateStore } from "../../state/SlateProvider";
import { slateApi } from "../../services/apiClient";
import DashboardHero from "../../components/DashboardHero";
import KpiCard from "../../components/KpiCard";
import { inrShort } from "../../utils/format";
import type { SlateMortgage } from "../../types/slate.types";

const QUICK_ACTIONS = [
  { label: "Encumbrance Search", desc: "Check a parcel before lending", icon: <Search size={17} />, path: ROUTES.PATHS.APP.SLATE.BANK_SEARCH },
  { label: "Manage Mortgages", desc: "Create or release a charge", icon: <Landmark size={17} />, path: ROUTES.PATHS.APP.SLATE.BANK_MORTGAGES },
];

export default function BankDashboardPage() {
  const { currentUser } = useSlateStore();
  const navigate = useNavigate();
  const [mortgages, setMortgages] = useState<SlateMortgage[]>([]);

  useEffect(() => {
    slateApi.bank.getMortgages().then(setMortgages).catch(() => undefined);
  }, []);

  const active = mortgages.filter((m) => m.status === "active");
  const released = mortgages.filter((m) => m.status === "released");
  const totalExposure = active.reduce((sum, m) => sum + m.amount, 0);

  return (
    <div className="flex flex-col" style={{ height: "100%" }}>
      <div style={{ flexShrink: 0 }}>
        <DashboardHero
          eyebrow="Bank Portal"
          title={`Welcome back, ${currentUser?.name ?? "Bank Officer"}`}
          sub="Search encumbrance before lending, and manage mortgages your branch holds against SLATE tokens."
          accent="#1d4670"
          icon={<Landmark size={22} />}
        />

        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(3, 1fr)", margin: "16px 0 20px" }}>
          <KpiCard label="Active Mortgages" value={active.length} icon={<Landmark size={18} />} accent="#1d4670" pct={active.length + released.length ? (active.length / (active.length + released.length)) * 100 : 0} />
          <KpiCard label="Released Mortgages" value={released.length} icon={<CheckCircle2 size={18} />} accent="#1C7A4E" />
          <KpiCard label="Total Exposure" value={inrShort(totalExposure)} icon={<Landmark size={18} />} accent="#1d4670" foot="Across active mortgages" />
        </div>
      </div>

      <div className="grid gap-4 flex-1" style={{ gridTemplateColumns: "2fr 1fr", gridAutoRows: "1fr", minHeight: 0 }}>
        <Card style={{ overflowY: "auto", minHeight: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 12, color: "#0F2A4A" }}>Quick actions</div>
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
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
        </Card>

        <Card style={{ display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 12, color: "#0F2A4A", flexShrink: 0 }}>Recent mortgages</div>
          <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
            <div className="flex flex-col gap-2">
              {mortgages.slice(0, 6).map((m) => (
                <button
                  key={m.id}
                  onClick={() => navigate(ROUTES.PATHS.APP.SLATE.BANK_MORTGAGE_DETAIL.replace(":mortgageId", m.id))}
                  className="flex items-center justify-between text-left"
                  style={{ padding: "9px 10px", borderRadius: 7, border: "1px solid #eceef0", background: "#fafbfc", cursor: "pointer" }}
                >
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#161b22", fontFamily: "monospace" }}>{m.id}</div>
                    <div style={{ fontSize: 11, color: "#717881" }}>{m.borrower} · {inrShort(m.amount)}</div>
                  </div>
                  <Badge size="sm" variant={m.status === "active" ? "warning" : "success"}>{m.status}</Badge>
                </button>
              ))}
              {mortgages.length === 0 && <div style={{ fontSize: 12, color: "#9aa1a9" }}>No mortgages yet.</div>}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
