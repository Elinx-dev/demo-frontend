import { useEffect, useState } from "react";
import { ListChecks, AlertTriangle } from "lucide-react";
import { Card } from "@/ui/primitives/Card/Card";
import Badge from "@/ui/primitives/Badge/Badge";
import Empty from "@/ui/primitives/Empty/Empty";
import { Tabs } from "@/ui/primitives/Tabs/Tabs";
import { Alert } from "@/ui/primitives/Alert/Alert";
import { slateApi } from "../../services/apiClient";
import PageHead from "../../components/PageHead";
import { inr } from "../../utils/format";
import type { OfficerQueueItem, SlateException } from "../../types/slate.types";

const QUEUE_VARIANT: Record<string, "info" | "warning" | "danger" | "success"> = {
  pending_maker: "info",
  pending_checker: "warning",
  exception: "danger",
  approved: "success",
};

export default function TrackStatusPage() {
  const [myTxns, setMyTxns] = useState<OfficerQueueItem[]>([]);
  const [myExceptions, setMyExceptions] = useState<SlateException[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    slateApi.citizen
      .getTrackStatus()
      .then((r) => {
        setMyTxns(r.myTxns);
        setMyExceptions(r.myExceptions);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load your transaction status."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col" style={{ height: "100%" }}>
      <div style={{ flexShrink: 0 }}>
        <PageHead eyebrow="Citizen Portal" title="Track Status" sub="Follow your submitted transactions through Maker / Checker approval, or see why one was routed to exception." />
      </div>

      <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
        {error && <Alert type="error" title="Could not load status" message={error} dismissible={false} />}
        {loading && !error && <div style={{ fontSize: 12.5, color: "#9aa1a9", padding: "20px 0" }}>Loading…</div>}
        {!loading && !error && (
          <Tabs
            variant="underline"
            tabs={[
              {
                id: "transactions",
                label: "My Transactions",
                icon: <ListChecks size={14} />,
                content: (
                  <Card>
                    {myTxns.length === 0 ? (
                      <Empty variant="no-data" title="No transactions yet" description="Transactions you submit will appear here." />
                    ) : (
                      <div className="flex flex-col gap-2">
                        {myTxns.map((q) => (
                          <div key={q.id} className="flex items-center justify-between" style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #eceef0", background: "#fafbfc" }}>
                            <div>
                              <div style={{ fontSize: 12.5, fontWeight: 600 }}>{q.id} · {q.type}</div>
                              <div style={{ fontSize: 11.5, color: "#717881" }}>{q.parties} · {inr(q.amount)}</div>
                              <div style={{ fontSize: 10.5, color: "#9aa1a9", fontFamily: "monospace" }}>{q.ulpin} · submitted {q.submitted}</div>
                            </div>
                            <Badge size="sm" variant={QUEUE_VARIANT[q.status]}>{q.status.replace("_", " ")}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                ),
              },
              {
                id: "exceptions",
                label: "Exceptions Concerning Me",
                icon: <AlertTriangle size={14} />,
                content: (
                  <Card>
                    {myExceptions.length === 0 ? (
                      <Empty variant="no-data" title="No exceptions" description="None of your transactions have been flagged." />
                    ) : (
                      <div className="flex flex-col gap-2">
                        {myExceptions.map((e) => (
                          <div key={e.id} style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #eceef0", background: "#fafbfc" }}>
                            <div className="flex items-center justify-between">
                              <div style={{ fontSize: 12.5, fontWeight: 600 }}>{e.id} · {e.type}</div>
                              <Badge size="sm" variant={e.status === "open" ? "danger" : "success"}>{e.status}</Badge>
                            </div>
                            <div style={{ fontSize: 11.5, color: "#717881", marginTop: 4 }}>{e.reason}</div>
                            {e.resolution && <div style={{ fontSize: 11.5, color: "#1C7A4E", marginTop: 4 }}>{e.resolution}</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                ),
              },
            ]}
          />
        )}
      </div>
    </div>
  );
}
