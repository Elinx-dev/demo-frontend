import { useEffect, useState, useCallback } from "react";
import { XCircle, Undo2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card } from "@/ui/primitives/Card/Card";
import { Button } from "@/ui/primitives/Button/Button";
import { Tabs } from "@/ui/primitives/Tabs/Tabs";
import Badge from "@/ui/primitives/Badge/Badge";
import Empty from "@/ui/primitives/Empty/Empty";
import { Alert } from "@/ui/primitives/Alert/Alert";
import { ConfirmationModal } from "@/ui/primitives/ConformationModal/ConfirmationModal";
import { useToast } from "@/ui/feedback/toast/useToast";
import { slateApi } from "../../services/apiClient";
import PageHead from "../../components/PageHead";
import type { SlateException } from "../../types/slate.types";

export default function ExceptionReviewPage() {
  const toast = useToast();
  const [exceptions, setExceptions] = useState<SlateException[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [action, setAction] = useState<{ id: string; kind: "reject" | "return" } | null>(null);

  const load = useCallback(() => {
    return slateApi.officer
      .getExceptions()
      .then(setExceptions)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load exceptions."));
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const open = exceptions.filter((e) => e.status === "open");
  const resolved = exceptions.filter((e) => e.status === "resolved");

  const handleConfirm = () => {
    if (!action) return;
    const call = action.kind === "reject" ? slateApi.officer.rejectException(action.id) : slateApi.officer.returnException(action.id);
    call
      .then(() => {
        toast[action.kind === "reject" ? "success" : "info"](action.kind === "reject" ? `${action.id} rejected.` : `${action.id} returned to citizen for correction.`);
        setAction(null);
        load();
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not resolve this exception."));
  };

  return (
    <div className="flex flex-col" style={{ height: "100%" }}>
      <div style={{ flexShrink: 0 }}>
        <PageHead
          eyebrow="Registration Officer Portal"
          title="Exception Review"
          sub="Transactions that failed RegMutate's automatic rule checks, requiring manual officer review within your jurisdiction."
        />
      </div>

      <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
        {error && <Alert type="error" title="Could not load exceptions" message={error} dismissible={false} />}
        {loading && !error && <div style={{ fontSize: 12.5, color: "#9aa1a9", padding: "20px 0" }}>Loading…</div>}
        {!loading && !error && (
          <Tabs
            variant="underline"
            tabs={[
              {
                id: "open",
                label: "Open",
                icon: <AlertTriangle size={14} />,
                badge: open.length || undefined,
                content: (
                  <Card>
                    {open.length === 0 && <Empty variant="no-data" title="No open exceptions" description="All exceptions have been resolved." />}
                    <div className="flex flex-col gap-3">
                      {open.map((e) => (
                        <div key={e.id} style={{ padding: "12px 14px", borderRadius: 9, border: "1px solid #f1c6bd", background: "#fdf6f4" }}>
                          <div className="flex items-center justify-between">
                            <div style={{ fontSize: 13, fontWeight: 700 }}>{e.id} · {e.type}</div>
                            <Badge size="sm" variant="danger">open</Badge>
                          </div>
                          <div style={{ fontSize: 11.5, color: "#9aa1a9", marginTop: 2, fontFamily: "monospace" }}>{e.ulpin} · {e.txnId}</div>
                          <div style={{ fontSize: 12.5, color: "#717881", marginTop: 6 }}>{e.reason}</div>
                          <div className="flex flex-col gap-1" style={{ marginTop: 6 }}>
                            {(e.context ?? []).map((c, i) => (
                              <div key={i} style={{ fontSize: 11.3, color: "#9aa1a9" }}>• {c}</div>
                            ))}
                          </div>
                          <div className="flex gap-2" style={{ marginTop: 10 }}>
                            <Button size="sm" variant="outline" onClick={() => setAction({ id: e.id, kind: "return" })}>
                              <Undo2 size={13} /> Return to citizen
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => setAction({ id: e.id, kind: "reject" })}>
                              <XCircle size={13} /> Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                ),
              },
              {
                id: "resolved",
                label: "Resolved",
                icon: <CheckCircle2 size={14} />,
                badge: resolved.length || undefined,
                content: (
                  <Card>
                    <div className="flex flex-col gap-2">
                      {resolved.map((e) => (
                        <div key={e.id} style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #eceef0", background: "#fafbfc" }}>
                          <div className="flex items-center justify-between">
                            <div style={{ fontSize: 12.5, fontWeight: 600 }}>{e.id} · {e.type}</div>
                            <Badge size="sm" variant="success">resolved</Badge>
                          </div>
                          <div style={{ fontSize: 11.5, color: "#717881", marginTop: 4 }}>{e.resolution}</div>
                        </div>
                      ))}
                      {resolved.length === 0 && <Empty variant="no-data" title="No resolved exceptions yet" description="Exceptions you return or reject will appear here." />}
                    </div>
                  </Card>
                ),
              },
            ]}
          />
        )}
      </div>

      <ConfirmationModal
        isOpen={!!action}
        onClose={() => setAction(null)}
        onConfirm={handleConfirm}
        variant={action?.kind === "reject" ? "danger" : "warning"}
        title={action?.kind === "reject" ? "Reject transaction" : "Return to citizen"}
        message={
          action?.kind === "reject"
            ? "This permanently rejects the transaction. The citizen will need to re-initiate it."
            : "This sends the transaction back to the citizen for correction."
        }
        confirmText={action?.kind === "reject" ? "Reject" : "Return"}
      />
    </div>
  );
}
