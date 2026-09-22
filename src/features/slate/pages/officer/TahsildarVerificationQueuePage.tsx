import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, RefreshCw, ExternalLink, X, Clock, CheckCircle2 } from "lucide-react";
import Empty from "@/ui/primitives/Empty/Empty";
import { Button } from "@/ui/primitives/Button/Button";
import PageHead from "../../components/PageHead";
import { slateApi } from "../../services/apiClient";
import { inr, fmtTs } from "../../utils/format";
import { ROUTES } from "@/navigation/routes";
import type { OfficerQueueItem } from "../../types/slate.types";

const SLATE_PATHS = ROUTES.PATHS.APP.SLATE;

const TYPE_COLOR: Record<string, { bg: string; color: string }> = {
  "Direct Sale Deed": { bg: "#e8f4ff", color: "#1d4670" },
  "Partial Sale Deed": { bg: "#fff3e0", color: "#b8722e" },
};

const STATUS_COLOR: Record<string, { bg: string; color: string; label: string }> = {
  approved:          { bg: "#edf7f1", color: "#1C7A4E", label: "Approved" },
  tahsildar_rejected:{ bg: "#fef3f2", color: "#B0392F", label: "Rejected" },
};

function TypeChip({ type }: { type: string }) {
  const s = TYPE_COLOR[type] ?? { bg: "#f4f5f7", color: "#545c66" };
  return (
    <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: s.bg, color: s.color, whiteSpace: "nowrap" as const }}>
      {type}
    </span>
  );
}

function StatusChip({ status }: { status: string }) {
  const s = STATUS_COLOR[status] ?? { bg: "#f4f5f7", color: "#545c66", label: status };
  return (
    <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 9px", borderRadius: 12, background: s.bg, color: s.color, whiteSpace: "nowrap" as const }}>
      {s.label}
    </span>
  );
}

const TABLE_HEADERS = ["Transaction ID", "ULPIN", "Type", "Parties", "Amount", "Submitted", ""];

function QueueTable({
  items,
  loading,
  searchText,
  onView,
  emptyTitle,
  emptyDesc,
  showAction,
}: {
  items: OfficerQueueItem[];
  loading: boolean;
  searchText: string;
  onView: (item: OfficerQueueItem) => void;
  emptyTitle: string;
  emptyDesc: string;
  showAction: boolean;
}) {
  const filtered = items.filter((item) =>
    !searchText ||
    [item.id, item.ulpin, item.parties, item.type].some((f) =>
      f?.toLowerCase().includes(searchText.toLowerCase())
    )
  );

  if (loading) {
    return <div style={{ padding: "48px 0", textAlign: "center" as const, color: "#9aa1a9", fontSize: 13 }}>Loading…</div>;
  }
  if (filtered.length === 0) {
    return <Empty variant="no-data" title={emptyTitle} description={emptyDesc} />;
  }

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
      <thead>
        <tr style={{ background: "#f8f9fb", borderBottom: "1.5px solid #eceef0" }}>
          {[...TABLE_HEADERS, ...(showAction ? [] : ["Status"])].map((h) => (
            <th key={h} style={{ padding: "9px 14px", textAlign: "left" as const, fontSize: 10.5, fontWeight: 700, color: "#9aa1a9", textTransform: "uppercase" as const, letterSpacing: ".06em", whiteSpace: "nowrap" as const }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {filtered.map((item) => {
          const typeStyle = TYPE_COLOR[item.type] ?? { bg: "#f4f5f7", color: "#545c66" };
          return (
            <tr
              key={item.id}
              onClick={() => onView(item)}
              style={{ borderBottom: "1px solid #f0f1f3", cursor: "pointer", transition: "background 100ms" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f8ff")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "")}
            >
              <td style={{ padding: "12px 14px", fontFamily: "monospace", fontSize: 12, color: "#0F2A4A", fontWeight: 700, whiteSpace: "nowrap" as const }}>{item.id}</td>
              <td style={{ padding: "12px 14px", fontFamily: "monospace", fontSize: 11.5, color: "#717881", whiteSpace: "nowrap" as const }}>{item.ulpin}</td>
              <td style={{ padding: "12px 14px" }}><TypeChip type={item.type} /></td>
              <td style={{ padding: "12px 14px", fontSize: 12, color: "#545c66", maxWidth: 180, overflow: "hidden" as const, textOverflow: "ellipsis" as const, whiteSpace: "nowrap" as const }}>{item.parties}</td>
              <td style={{ padding: "12px 14px", fontSize: 12, color: "#1C7A4E", fontWeight: 600, whiteSpace: "nowrap" as const }}>{inr(item.amount)}</td>
              <td style={{ padding: "12px 14px", fontSize: 11.5, color: "#9aa1a9", whiteSpace: "nowrap" as const }}>{fmtTs(item.submitted)}</td>
              {!showAction && (
                <td style={{ padding: "12px 14px" }}><StatusChip status={item.status} /></td>
              )}
              <td style={{ padding: "12px 14px" }}>
                {showAction ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); onView(item); }}
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 700, color: "#7c3aed", background: "#f3e8ff", border: "1px solid #c4b5fd", borderRadius: 6, padding: "5px 10px", cursor: "pointer", whiteSpace: "nowrap" as const }}
                  >
                    <ExternalLink size={11} /> Review &amp; Approve
                  </button>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); onView(item); }}
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 600, color: "#717881", background: "#f4f5f7", border: "none", borderRadius: 6, padding: "5px 10px", cursor: "pointer", whiteSpace: "nowrap" as const }}
                  >
                    <ExternalLink size={11} /> View
                  </button>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default function TahsildarVerificationQueuePage() {
  const navigate = useNavigate();
  const [pendingItems, setPendingItems] = useState<OfficerQueueItem[]>([]);
  const [completedItems, setCompletedItems] = useState<OfficerQueueItem[]>([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [loadingCompleted, setLoadingCompleted] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "completed">("pending");

  const load = useCallback(() => {
    setLoadingPending(true);
    setLoadingCompleted(true);
    slateApi.tahsildar.getVerificationQueue()
      .then(setPendingItems).catch(() => setPendingItems([]))
      .finally(() => setLoadingPending(false));
    slateApi.tahsildar.getCompletedQueue()
      .then(setCompletedItems).catch(() => setCompletedItems([]))
      .finally(() => setLoadingCompleted(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleView = (item: OfficerQueueItem) => {
    navigate(SLATE_PATHS.TAHSILDAR_VERIFICATION_DETAIL.replace(":txnId", item.id), { state: { item } });
  };

  const TAB_STYLE = (active: boolean) => ({
    display: "flex" as const,
    alignItems: "center" as const,
    gap: 6,
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer" as const,
    background: "none",
    border: "none",
    borderBottom: active ? "2.5px solid #7c3aed" : "2.5px solid transparent",
    color: active ? "#7c3aed" : "#717881",
    transition: "color 0.15s",
  });

  const loading = activeTab === "pending" ? loadingPending : loadingCompleted;

  return (
    <div className="flex flex-col" style={{ height: "100%" }}>
      <div style={{ flexShrink: 0 }}>
        <PageHead
          eyebrow="Thasildar Portal"
          title="Verification Queue"
          sub="Deeds pending Thasildar approval after VAO verification."
          actions={
            <Button variant="outline" onClick={load} disabled={loadingPending || loadingCompleted}>
              <RefreshCw size={13} className={(loadingPending || loadingCompleted) ? "animate-spin" : ""} /> Refresh
            </Button>
          }
        />
      </div>

      {/* Tabs + Search bar */}
      <div style={{ flexShrink: 0, background: "#fff", borderBottom: "1px solid #eceef0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px" }}>
          <div style={{ display: "flex" }}>
            <button style={TAB_STYLE(activeTab === "pending")} onClick={() => setActiveTab("pending")}>
              <Clock size={14} />
              Pending Approval
              {pendingItems.length > 0 && (
                <span style={{ fontSize: 10.5, fontWeight: 700, background: "#7c3aed", color: "#fff", borderRadius: 9999, padding: "1px 7px", marginLeft: 2 }}>
                  {pendingItems.length}
                </span>
              )}
            </button>
            <button style={TAB_STYLE(activeTab === "completed")} onClick={() => setActiveTab("completed")}>
              <CheckCircle2 size={14} />
              Completed
              {completedItems.length > 0 && (
                <span style={{ fontSize: 10.5, fontWeight: 700, background: "#eceef0", color: "#545c66", borderRadius: 9999, padding: "1px 7px", marginLeft: 2 }}>
                  {completedItems.length}
                </span>
              )}
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
            <div style={{ position: "relative" as const }}>
              <Search size={12} style={{ position: "absolute" as const, left: 9, top: "50%", transform: "translateY(-50%)", color: "#9aa1a9" }} />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search ID, ULPIN, parties…"
                style={{ padding: "6px 28px", borderRadius: 7, border: "1.5px solid #dee2e6", fontSize: 12, color: "#161b22", outline: "none", width: 260, boxSizing: "border-box" as const }}
              />
              {searchText && (
                <button onClick={() => setSearchText("")} style={{ position: "absolute" as const, right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9aa1a9" }}>
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: "auto", background: "#fff" }}>
        {activeTab === "pending" ? (
          <QueueTable
            items={pendingItems}
            loading={loadingPending}
            searchText={searchText}
            onView={handleView}
            emptyTitle="No pending approvals"
            emptyDesc="Deeds will appear here once the VAO has verified them and forwarded for Thasildar approval."
            showAction={true}
          />
        ) : (
          <QueueTable
            items={completedItems}
            loading={loadingCompleted}
            searchText={searchText}
            onView={handleView}
            emptyTitle="No completed transactions"
            emptyDesc="Transactions approved or rejected by the Thasildar will appear here."
            showAction={false}
          />
        )}
      </div>
    </div>
  );
}
