import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Card } from "@/ui/primitives/Card/Card";
import Empty from "@/ui/primitives/Empty/Empty";
import { Alert } from "@/ui/primitives/Alert/Alert";
import { slateApi } from "../services/apiClient";
import PageHead from "../components/PageHead";
import { mapNotification, relativeBucket, type SlateNotification } from "../utils/notifications";

const KIND_DOT: Record<string, string> = { ok: "#1C7A4E", warn: "#B8722E", danger: "#B0392F", info: "#B8923D" };

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<SlateNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    slateApi.notifications
      .getMine()
      .then((rows) => setNotifications(rows.map(mapNotification)))
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load notifications."))
      .finally(() => setLoading(false));
  }, []);

  const groups = new Map<string, SlateNotification[]>();
  notifications.forEach((n) => {
    const key = relativeBucket(n.ts);
    groups.set(key, [...(groups.get(key) ?? []), n]);
  });

  const handleOpen = (n: SlateNotification) => {
    if (!n.isRead) {
      slateApi.notifications.markRead(n.id).catch(() => undefined);
      setNotifications((prev) => prev.map((p) => (p.id === n.id ? { ...p, isRead: true } : p)));
    }
    navigate(n.path);
  };

  return (
    <div className="flex flex-col" style={{ height: "100%" }}>
      <div style={{ flexShrink: 0 }}>
        <PageHead title="Notifications" sub="Everything relevant to you: today, yesterday, this week and further back, newest first." />
      </div>

      <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
        {error && <Alert type="error" title="Could not load notifications" message={error} dismissible={false} />}
        {loading && !error && <div style={{ fontSize: 12.5, color: "#9aa1a9", padding: "20px 0" }}>Loading…</div>}
        {!loading && !error && notifications.length === 0 ? (
          <Empty variant="no-data" title="Nothing here yet" description="Notifications relevant to your portal will appear here." />
        ) : !loading && !error ? (
          <div className="flex flex-col gap-6">
            {Array.from(groups.entries()).map(([bucket, items]) => (
              <div key={bucket}>
                <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#9aa1a9", marginBottom: 10 }}>{bucket}</div>
                <div className="flex flex-col gap-2.5">
                  {items.map((n) => (
                    <Card
                      key={n.id}
                      className="group"
                      style={{ padding: "14px 16px", position: "relative", cursor: "pointer", background: n.isRead ? "#fff" : "#fbf9f4", border: "1px solid #eceef0" }}
                      onClick={() => handleOpen(n)}
                    >
                      <div className="flex items-start gap-3">
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: KIND_DOT[n.kind], marginTop: 5, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#161b22" }}>{n.title}</div>
                          <div style={{ fontSize: 12, color: "#717881", marginTop: 2 }}>{n.detail}</div>
                          <div style={{ fontSize: 10.5, color: "#9aa1a9", fontFamily: "monospace", marginTop: 6 }}>{n.ts}</div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpen(n); }}
                        className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{
                          position: "absolute",
                          right: 14,
                          bottom: 12,
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#fff",
                          background: "#B8923D",
                          border: "none",
                          borderRadius: 6,
                          padding: "4px 10px",
                          cursor: "pointer",
                        }}
                      >
                        View <ArrowUpRight size={12} />
                      </button>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
