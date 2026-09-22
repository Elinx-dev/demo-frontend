import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, RefreshCw, Filter, ExternalLink, X } from "lucide-react";
import { Select } from "@/ui/primitives/Select/Select";
import Empty from "@/ui/primitives/Empty/Empty";
import { Button } from "@/ui/primitives/Button/Button";
import PageHead from "../../components/PageHead";
import { slateApi } from "../../services/apiClient";
import { inr, fmtTs } from "../../utils/format";
import { ROUTES } from "@/navigation/routes";
import type { OfficerQueueItem } from "../../types/slate.types";

const DEED_TYPES = ["All Types", "sale", "gift", "partition"];

const TYPE_COLOR: Record<string, { bg: string; color: string }> = {
  sale: { bg: "#e8f4ff", color: "#1d4670" },
  gift: { bg: "#fff3e0", color: "#b8722e" },
  partition: { bg: "#f0f8f2", color: "#1C7A4E" },
};

const STATUS_OPTS = [
  { label: "All Status", value: "All" },
  { label: "Pending VAO Verification", value: "pending_checker" },
  { label: "Pending Thasildar", value: "pending_tahsildar" },
  { label: "Approved", value: "approved" },
];

const STATUS_COLOR: Record<string, { bg: string; color: string; label: string }> = {
  pending_checker: { bg: "#fff3e0", color: "#b8722e", label: "Pending VAO Verification" },
  pending_tahsildar: { bg: "#e8f4ff", color: "#1d4670", label: "Pending Thasildar" },
  approved: { bg: "#edf7f1", color: "#1C7A4E", label: "Approved" },
  exception: { bg: "#fef3f2", color: "#B0392F", label: "Exception" },
};

function StatusPill({ status }: { status: string }) {
  const s = STATUS_COLOR[status] ?? { bg: "#f4f5f7", color: "#545c66", label: status };
  return (
    <span
      style={{
        fontSize: 10.5,
        fontWeight: 700,
        padding: "2px 9px",
        borderRadius: 12,
        background: s.bg,
        color: s.color,
        whiteSpace: "nowrap" as const,
      }}
    >
      {s.label}
    </span>
  );
}

const SLATE_PATHS = ROUTES.PATHS.APP.SLATE;

export default function VaoVerificationQueuePage() {
  const navigate = useNavigate();
  const [allItems, setAllItems] = useState<OfficerQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [filterType, setFilterType] = useState("All Types");
  const [filterStatus, setFilterStatus] = useState("pending_checker");

  const load = useCallback(() => {
    setLoading(true);
    slateApi.vao
      .getVerificationQueue()
      .then(setAllItems)
      .catch(() => setAllItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = allItems.filter((item) => {
    const matchType = filterType === "All Types" || item.type === filterType;
    const matchStatus = filterStatus === "All" || item.status === filterStatus;
    const matchSearch =
      !searchText ||
      [item.id, item.ulpin, item.parties, item.type].some((f) =>
        f?.toLowerCase().includes(searchText.toLowerCase())
      );
    return matchType && matchStatus && matchSearch;
  });

  const handleView = (item: OfficerQueueItem) => {
    navigate(SLATE_PATHS.VAO_VERIFICATION_DETAIL.replace(":txnId", item.id), {
      state: { item },
    });
  };

  return (
    <div className="flex flex-col" style={{ height: "100%" }}>
      <div style={{ flexShrink: 0 }}>
        <PageHead
          eyebrow="VAO Officer Portal"
          title="Verification Queue"
          sub="Sale deeds pending VAO verification and Patta generation. Click any row to open the detail view."
          actions={
            <Button variant="outline" onClick={load} disabled={loading}>
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
            </Button>
          }
        />
      </div>

      {/* Filter bar */}
      <div
        style={{
          padding: "10px 16px",
          flexShrink: 0,
          display: "flex",
          gap: 10,
          alignItems: "center",
          background: "#fff",
          borderBottom: "1px solid #eceef0",
        }}
      >
        <div style={{ position: "relative", flex: "0 0 280px" }}>
          <Search
            size={12}
            style={{
              position: "absolute",
              left: 9,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#9aa1a9",
            }}
          />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search ID, ULPIN, parties…"
            style={{
              width: "100%",
              padding: "6px 28px",
              borderRadius: 7,
              border: "1.5px solid #dee2e6",
              fontSize: 12,
              color: "#161b22",
              outline: "none",
              boxSizing: "border-box" as const,
            }}
          />
          {searchText && (
            <button
              onClick={() => setSearchText("")}
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#9aa1a9",
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>
        <div style={{ flex: "0 0 160px" }}>
          <Select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            options={DEED_TYPES.map((t) => ({ label: t, value: t }))}
          />
        </div>
        <div style={{ flex: "0 0 170px" }}>
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={STATUS_OPTS}
          />
        </div>
        <span style={{ fontSize: 11, color: "#9aa1a9", marginLeft: "auto" }}>
          <Filter size={10} style={{ display: "inline", marginRight: 4 }} />
          {filtered.length} of {allItems.length} transactions
        </span>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: "auto", background: "#fff" }}>
        {loading ? (
          <div
            style={{ padding: "48px 0", textAlign: "center" as const, color: "#9aa1a9", fontSize: 13 }}
          >
            Loading queue…
          </div>
        ) : filtered.length === 0 ? (
          <Empty
            variant="no-data"
            title="No transactions found"
            description="No transactions match the current filter. Transactions appear here after the Surveyor submits site data."
          />
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
            <thead>
              <tr style={{ background: "#f8f9fb", borderBottom: "1.5px solid #eceef0" }}>
                {[
                  "Transaction ID",
                  "ULPIN",
                  "Type",
                  "Parties",
                  "Amount",
                  "Submitted",
                  "Status",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "9px 14px",
                      textAlign: "left" as const,
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: "#9aa1a9",
                      textTransform: "uppercase" as const,
                      letterSpacing: ".06em",
                      whiteSpace: "nowrap" as const,
                    }}
                  >
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
                    onClick={() => handleView(item)}
                    style={{
                      borderBottom: "1px solid #f0f1f3",
                      cursor: "pointer",
                      transition: "background 100ms",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f8ff")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                  >
                    <td
                      style={{
                        padding: "12px 14px",
                        fontFamily: "monospace",
                        fontSize: 12,
                        color: "#0F2A4A",
                        fontWeight: 700,
                        whiteSpace: "nowrap" as const,
                      }}
                    >
                      {item.id}
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        fontFamily: "monospace",
                        fontSize: 11.5,
                        color: "#717881",
                        whiteSpace: "nowrap" as const,
                      }}
                    >
                      {item.ulpin}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 10,
                          background: typeStyle.bg,
                          color: typeStyle.color,
                          whiteSpace: "nowrap" as const,
                        }}
                      >
                        {item.type}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        fontSize: 12,
                        color: "#545c66",
                        maxWidth: 180,
                        overflow: "hidden" as const,
                        textOverflow: "ellipsis" as const,
                        whiteSpace: "nowrap" as const,
                      }}
                    >
                      {item.parties}
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        fontSize: 12,
                        color: "#1C7A4E",
                        fontWeight: 600,
                        whiteSpace: "nowrap" as const,
                      }}
                    >
                      {inr(item.amount)}
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        fontSize: 11.5,
                        color: "#9aa1a9",
                        whiteSpace: "nowrap" as const,
                      }}
                    >
                      {fmtTs(item.submitted)}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <StatusPill status={item.status} />
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleView(item);
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          fontSize: 11.5,
                          fontWeight: 600,
                          color: "#1d4670",
                          background: "#e8f0fe",
                          border: "none",
                          borderRadius: 6,
                          padding: "5px 10px",
                          cursor: "pointer",
                          whiteSpace: "nowrap" as const,
                        }}
                      >
                        <ExternalLink size={11} /> View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
