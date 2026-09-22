import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRightLeft, ChevronRight, Clock } from "lucide-react";
import { Card } from "@/ui/primitives/Card/Card";
import { Button } from "@/ui/primitives/Button/Button";
import { Alert } from "@/ui/primitives/Alert/Alert";
import Empty from "@/ui/primitives/Empty/Empty";
import { ROUTES } from "@/navigation/routes";
import { slateApi } from "../../services/apiClient";
import PageHead from "../../components/PageHead";
import StateBadge from "../../components/StateBadge";
import { inrShort } from "../../utils/format";
import type { OfficerQueueItem, SlateToken } from "../../types/slate.types";

export default function MyPropertiesPage() {
  const navigate = useNavigate();
  const [tokens, setTokens] = useState<SlateToken[]>([]);
  const [incoming, setIncoming] = useState<OfficerQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      slateApi.citizen.getProperties(),
      slateApi.citizen.getIncoming().catch(() => ({ pendingConsent: [], queueItems: [] })),
    ])
      .then(([t, inc]) => {
        if (!cancelled) {
          setTokens(t);
          // Only show pending items (not already approved), deduplicated by ULPIN
          const seen = new Set<string>();
          const pendingOnly = (inc.queueItems ?? []).filter((q) => {
            if (q.status === "approved") return false;
            if (seen.has(q.ulpin)) return false;
            seen.add(q.ulpin);
            return true;
          });
          setIncoming(pendingOnly);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load your properties.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col" style={{ height: "100%" }}>
      <div style={{ flexShrink: 0 }}>
        <PageHead
          eyebrow="Citizen Portal"
          title="My Properties"
          sub="All land parcel tokens registered to your name on SLATE."
          actions={
            <Button onClick={() => navigate(ROUTES.PATHS.APP.SLATE.CITIZEN_INITIATE)}>
              <ArrowRightLeft size={14} /> Initiate Transaction
            </Button>
          }
        />
      </div>

      <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
        {error && <Alert type="error" title="Could not load properties" message={error} dismissible={false} />}
        {loading && !error && <div style={{ fontSize: 12.5, color: "#9aa1a9", padding: "20px 0" }}>Loading your properties…</div>}
        {!loading && !error && tokens.length === 0 && incoming.length === 0 && (
          <Empty variant="no-data" title="No properties found" description="No parcels are registered under your identity yet." />
        )}

        {!loading && tokens.length > 0 && (
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            {tokens.map((t) => (
              <Card key={t.ulpin} className="cursor-pointer" onClick={() => navigate(ROUTES.PATHS.APP.SLATE.CITIZEN_PROPERTY_DETAIL.replace(":ulpin", t.ulpin))}>
                <div className="flex items-start justify-between">
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, fontFamily: "monospace", color: "#0F2A4A" }}>{t.ulpin}</div>
                    <div style={{ fontSize: 11.5, color: "#717881", marginTop: 2 }}>
                      {t.location.village}, {t.location.taluk}, {t.location.district}
                    </div>
                  </div>
                  <StateBadge state={t.state} size="sm" />
                </div>

                <div className="flex justify-between" style={{ marginTop: 14, fontSize: 12 }}>
                  <div>
                    <div style={{ color: "#9aa1a9" }}>Area</div>
                    <div style={{ fontWeight: 600 }}>{t.physical.area}</div>
                  </div>
                  <div>
                    <div style={{ color: "#9aa1a9" }}>Classification</div>
                    <div style={{ fontWeight: 600 }}>{t.physical.classification}</div>
                  </div>
                  <div>
                    <div style={{ color: "#9aa1a9" }}>Guideline Value</div>
                    <div style={{ fontWeight: 600 }}>{inrShort(t.financial.guidanceValue)}</div>
                  </div>
                  <ChevronRight size={16} style={{ color: "#9aa1a9", alignSelf: "center" }} />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Pending incoming transfers */}
        {!loading && incoming.length > 0 && (
          <div style={{ marginTop: tokens.length > 0 ? 28 : 0 }}>
            <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
              <Clock size={13} style={{ color: "#d97706" }} />
              <span style={{ fontSize: 11.5, fontWeight: 700, color: "#d97706", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Pending Incoming Transfers
              </span>
            </div>
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
              {incoming.map((item) => {
                const seller = (item.parties ?? "").split(/->|→/)[0]?.trim() || "-";
                return (
                  <Card key={item.txnId} style={{ border: "1.5px dashed #d97706", background: "#fffbf0" }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, fontFamily: "monospace", color: "#0F2A4A" }}>{item.ulpin}</div>
                        <div style={{ fontSize: 11.5, color: "#717881", marginTop: 2 }}>
                          Incoming {item.type ?? "transfer"} - from {seller}
                        </div>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 999, background: "#fff3e0", color: "#d97706", whiteSpace: "nowrap", border: "1px solid #f6c05e" }}>
                        Pending Approval
                      </span>
                    </div>
                    <div style={{ marginTop: 10, fontSize: 11, color: "#9aa1a9", lineHeight: 1.5 }}>
                      This property will be added to your account once the registration authority approves the transfer.
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
