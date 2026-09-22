import { useEffect, useState, type ReactNode } from "react";
import Table, { type Column } from "@/ui/primitives/Table/Table";
import Badge from "@/ui/primitives/Badge/Badge";
import { Alert } from "@/ui/primitives/Alert/Alert";
import { slateApi } from "../services/apiClient";
import PageHead from "./PageHead";
import type { SlateAuditRow } from "../types/slate.types";

const KIND_VARIANT: Record<string, "success" | "warning" | "danger" | "info"> = {
  ok: "success",
  warn: "warning",
  danger: "danger",
  info: "info",
};

export default function AuditTrailTable({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: ReactNode }) {
  const [rows, setRows] = useState<SlateAuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    slateApi.officer
      .getAuditTrail()
      .then(setRows)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load the audit trail."))
      .finally(() => setLoading(false));
  }, []);

  const columns: Column<SlateAuditRow>[] = [
    { key: "ts", label: "Timestamp" },
    { key: "ulpin", label: "ULPIN" },
    { key: "txnId", label: "Txn ID" },
    { key: "actor", label: "Actor" },
    { key: "action", label: "Action" },
    { key: "detail", label: "Detail" },
    {
      key: "kind",
      label: "Type",
      render: (row) => <Badge size="sm" variant={KIND_VARIANT[row.kind] ?? "info"}>{row.kind}</Badge>,
    },
  ];

  return (
    <div className="flex flex-col" style={{ height: "100%" }}>
      <div style={{ flexShrink: 0 }}>
        <PageHead eyebrow={eyebrow} title={title} sub={sub} />
      </div>
      <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
        {error && <Alert type="error" title="Could not load audit trail" message={error} dismissible={false} />}
        {loading && !error && <div style={{ fontSize: 12.5, color: "#9aa1a9", padding: "20px 0" }}>Loading…</div>}
        {!loading && !error && (
          <Table columns={columns} data={rows} searchKey={["ulpin", "actor", "action", "txnId"]} title="Audit Trail" emptyMessage="No audit entries yet." enableFilter={false} />
        )}
      </div>
    </div>
  );
}
