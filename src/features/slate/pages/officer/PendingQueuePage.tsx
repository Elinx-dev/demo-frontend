import { useEffect, useState, useCallback, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, AlertTriangle, ListChecks, Clock } from "lucide-react";
import Table, { type Column } from "@/ui/primitives/Table/Table";
import { Button } from "@/ui/primitives/Button/Button";
import { Tabs } from "@/ui/primitives/Tabs/Tabs";
import Badge from "@/ui/primitives/Badge/Badge";
import Empty from "@/ui/primitives/Empty/Empty";
import { Alert } from "@/ui/primitives/Alert/Alert";
import { useToast } from "@/ui/feedback/toast/useToast";
import { ROUTES } from "@/navigation/routes";
import { useSlateStore } from "../../state/SlateProvider";
import { slateApi } from "../../services/apiClient";
import PageHead from "../../components/PageHead";
import { inr } from "../../utils/format";
import type { OfficerQueueItem } from "../../types/slate.types";

const STAGE_LABEL: Record<string, string> = {
  pending_maker: "Pending Officer",
  pending_surveyor: "With Surveyor",
  pending_checker: "With VAO",
  pending_tahsildar: "With Thasildar",
  approved: "Approved",
  exception: "Exception",
};

export default function PendingQueuePage() {
  const { can } = useSlateStore();
  const navigate = useNavigate();
  const toast = useToast();
  const [queue, setQueue] = useState<OfficerQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    return slateApi.officer
      .getQueue()
      .then(setQueue)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load the queue."));
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  if (!can("tokens.transfer.queue.view")) {
    return <Empty variant="no-permission" title="No access to the registration queue" description="Your role doesn't carry the View pending queue permission." />;
  }

  const pending = queue.filter((q) => q.status === "pending_maker");
  const forwarded = queue.filter((q) => ["pending_surveyor", "pending_checker", "pending_tahsildar"].includes(q.status));
  const completed = queue.filter((q) => q.status === "approved");

  const handleApprove = (e: MouseEvent, item: OfficerQueueItem) => {
    e.stopPropagation();
    slateApi.officer.approveMaker(item.id)
      .then(() => {
        toast.success(`${item.id} approved - forwarded to ${item.needsSurveyor === false ? "VAO" : "Surveyor and VAO"}.`);
        load();
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not approve this transaction."));
  };

  const handleException = (e: MouseEvent, item: OfficerQueueItem) => {
    e.stopPropagation();
    slateApi.officer
      .routeToException(item.id, "Routed to exception queue by officer for manual review.")
      .then(() => {
        toast.info(`${item.id} routed to the Exception Queue.`);
        load();
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not route to exception."));
  };

  const columns: Column<OfficerQueueItem>[] = [
    { key: "id", label: "Txn ID" },
    { key: "type", label: "Type" },
    { key: "ulpin", label: "ULPIN" },
    { key: "parties", label: "Parties" },
    { key: "amount", label: "Amount", render: (item) => inr(item.amount) },
    { key: "submitted", label: "Submitted" },
    {
      key: "priority",
      label: "Priority",
      render: (item) => <Badge size="sm" variant={item.priority === "high" ? "danger" : "default"}>{item.priority}</Badge>,
    },
  ];

  const forwardedColumns: Column<OfficerQueueItem>[] = [
    { key: "id", label: "Txn ID" },
    { key: "type", label: "Type" },
    { key: "ulpin", label: "ULPIN" },
    { key: "parties", label: "Parties" },
    { key: "submitted", label: "Submitted" },
    {
      key: "status",
      label: "Current Stage",
      render: (item) => (
        <Badge size="sm" variant="info">{STAGE_LABEL[item.status] ?? item.status}</Badge>
      ),
    },
  ];

  const completedColumns: Column<OfficerQueueItem>[] = [
    { key: "id", label: "Txn ID" },
    { key: "type", label: "Type" },
    { key: "ulpin", label: "ULPIN" },
    { key: "parties", label: "Parties" },
    { key: "amount", label: "Amount", render: (item) => inr(item.amount) },
    { key: "submitted", label: "Submitted" },
    { key: "status", label: "Status", render: () => <Badge size="sm" variant="success">Approved</Badge> },
  ];

  return (
    <div className="flex flex-col" style={{ height: "100%" }}>
      <div style={{ flexShrink: 0 }}>
        <PageHead
          eyebrow="Registration Officer Portal"
          title="Registration Queue"
          sub="Transactions awaiting your approval. Approved items are forwarded to Surveyor and VAO, or directly to VAO for direct sales."
        />
      </div>

      <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
        {error && <Alert type="error" title="Could not load queue" message={error} dismissible={false} />}
        {loading && !error && <div style={{ fontSize: 12.5, color: "#9aa1a9", padding: "20px 0" }}>Loading…</div>}
        {!loading && !error && (
          <Tabs
            variant="underline"
            tabs={[
              {
                id: "pending",
                label: "Pending Approval",
                icon: <ListChecks size={14} />,
                badge: pending.length || undefined,
                content: (
                  <Table
                    columns={columns}
                    data={pending}
                    emptyMessage="No transactions pending your approval."
                    rowOnClick
                    onRowClick={(item) => navigate(ROUTES.PATHS.APP.SLATE.OFFICER_TXN_DETAIL.replace(":txnId", item.id))}
                    actions={(item) => (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={(e) => handleApprove(e, item)}>
                          <CheckCircle2 size={13} /> Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={(e) => handleException(e, item)}>
                          <AlertTriangle size={13} /> Exception
                        </Button>
                      </div>
                    )}
                    enableFilter={false}
                    maxBodyHeight="calc(100vh - 380px)"
                  />
                ),
              },
              {
                id: "forwarded",
                label: "In Progress",
                icon: <Clock size={14} />,
                badge: forwarded.length || undefined,
                content: (
                  <Table
                    columns={forwardedColumns}
                    data={forwarded}
                    emptyMessage="No transactions currently in progress."
                    rowOnClick
                    onRowClick={(item) => navigate(ROUTES.PATHS.APP.SLATE.OFFICER_TXN_DETAIL.replace(":txnId", item.id))}
                    enableFilter={false}
                    maxBodyHeight="calc(100vh - 380px)"
                  />
                ),
              },
              {
                id: "completed",
                label: "Completed",
                badge: completed.length || undefined,
                content: (
                  <Table
                    columns={completedColumns}
                    data={completed}
                    emptyMessage="No transactions completed yet."
                    rowOnClick
                    onRowClick={(item) => navigate(ROUTES.PATHS.APP.SLATE.OFFICER_TXN_DETAIL.replace(":txnId", item.id))}
                    enableFilter={false}
                    maxBodyHeight="calc(100vh - 380px)"
                  />
                ),
              },
            ]}
          />
        )}
      </div>
    </div>
  );
}
