import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Landmark, CheckCircle2 } from "lucide-react";
import Table, { type Column } from "@/ui/primitives/Table/Table";
import { Button } from "@/ui/primitives/Button/Button";
import { Tabs } from "@/ui/primitives/Tabs/Tabs";
import Badge from "@/ui/primitives/Badge/Badge";
import { Alert } from "@/ui/primitives/Alert/Alert";
import { ROUTES } from "@/navigation/routes";
import { slateApi } from "../../services/apiClient";
import PageHead from "../../components/PageHead";
import CreateMortgageModal from "../../components/CreateMortgageModal";
import { inr } from "../../utils/format";
import type { SlateMortgage } from "../../types/slate.types";

export default function MortgageManagePage() {
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [mortgages, setMortgages] = useState<SlateMortgage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    return slateApi.bank
      .getMortgages()
      .then(setMortgages)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load mortgages."));
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const active = mortgages.filter((m) => m.status === "active");
  const released = mortgages.filter((m) => m.status === "released");

  const columns: Column<SlateMortgage>[] = [
    { key: "id", label: "Mortgage ID" },
    { key: "ulpin", label: "ULPIN" },
    { key: "borrower", label: "Borrower" },
    { key: "amount", label: "Amount", render: (m) => inr(m.amount) },
    { key: "type", label: "Type" },
    { key: "created", label: "Created" },
    {
      key: "status",
      label: "Status",
      render: (m) => <Badge size="sm" variant={m.status === "active" ? "warning" : "success"}>{m.status}</Badge>,
    },
  ];

  return (
    <div className="flex flex-col" style={{ height: "100%" }}>
      <div style={{ flexShrink: 0 }}>
        <PageHead
          eyebrow="Bank Portal"
          title="Manage Mortgages"
          sub="Mortgages and liens registered by your branch against SLATE tokens."
          actions={
            <Button onClick={() => setShowCreate(true)}>
              <Plus size={14} /> Create Mortgage
            </Button>
          }
        />
      </div>

      <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
        {error && <Alert type="error" title="Could not load mortgages" message={error} dismissible={false} />}
        {loading && !error && <div style={{ fontSize: 12.5, color: "#9aa1a9", padding: "20px 0" }}>Loading…</div>}
        {!loading && !error && (
          <Tabs
            variant="underline"
            tabs={[
              {
                id: "active",
                label: "Active",
                icon: <Landmark size={14} />,
                badge: active.length || undefined,
                content: (
                  <Table
                    columns={columns}
                    data={active}
                    emptyMessage="No active mortgages."
                    rowOnClick
                    onRowClick={(m) => navigate(ROUTES.PATHS.APP.SLATE.BANK_MORTGAGE_DETAIL.replace(":mortgageId", m.id))}
                    enableFilter={false}
                    maxBodyHeight="calc(100vh - 320px)"
                  />
                ),
              },
              {
                id: "released",
                label: "Released",
                icon: <CheckCircle2 size={14} />,
                badge: released.length || undefined,
                content: (
                  <Table
                    columns={columns}
                    data={released}
                    emptyMessage="No mortgages released yet."
                    rowOnClick
                    onRowClick={(m) => navigate(ROUTES.PATHS.APP.SLATE.BANK_MORTGAGE_DETAIL.replace(":mortgageId", m.id))}
                    enableFilter={false}
                    maxBodyHeight="calc(100vh - 320px)"
                  />
                ),
              },
            ]}
          />
        )}
      </div>

      <CreateMortgageModal isOpen={showCreate} onClose={() => setShowCreate(false)} onCreated={load} />
    </div>
  );
}
