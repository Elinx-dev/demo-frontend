import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPinned, ShieldCheck, ListChecks, ChevronRight } from "lucide-react";
import { Tabs } from "@/ui/primitives/Tabs/Tabs";
import Empty from "@/ui/primitives/Empty/Empty";
import { ROUTES } from "@/navigation/routes";
import { useSlateStore } from "../../state/SlateProvider";
import { slateApi } from "../../services/apiClient";
import type { SlateToken, OfficerQueueItem } from "../../types/slate.types";

const TH: React.CSSProperties = {
  padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "#717881",
  textTransform: "uppercase", letterSpacing: ".05em", textAlign: "left",
  borderBottom: "1px solid #dee2e6", background: "#f8f9fa", whiteSpace: "nowrap",
};

export default function SurveyVerificationPage() {
  const { session } = useSlateStore();
  const navigate = useNavigate();

  const [tokens, setTokens] = useState<SlateToken[]>([]);
  const [surveyQueue, setSurveyQueue] = useState<OfficerQueueItem[]>([]);
  const [jurisdictionLabel, setJurisdictionLabel] = useState<string | null>(null);

  const loadQueue = useCallback(() => {
    slateApi.surveyor.getSurveyQueue().then(setSurveyQueue).catch(() => undefined);
  }, []);

  useEffect(() => {
    slateApi.surveyor.getPendingSurveys().then(setTokens).catch(() => undefined);
    loadQueue();
  }, [loadQueue]);

  useEffect(() => {
    const jurisdictionId = session.liveIdentity?.jurisdictionId;
    if (!jurisdictionId) return;
    slateApi.masters
      .getJurisdictions()
      .then((all) => {
        const node = all.find((j) => j.jurisdictionId === jurisdictionId);
        setJurisdictionLabel(node ? node.name : jurisdictionId);
      })
      .catch(() => setJurisdictionLabel(jurisdictionId));
  }, [session.liveIdentity?.jurisdictionId]);

  const pending  = tokens.filter((t) => t.surveyPending);
  const verified = tokens.filter((t) => t.survey);

  /* Transaction Queue table */
  const txnQueueContent = (
    <div>
      {surveyQueue.length === 0 ? (
        <Empty variant="no-data" title="No transactions pending survey" description="Transactions forwarded by Registration Officers will appear here." />
      ) : (
        <div style={{ background: "#fff", border: "1px solid #dee2e6", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={TH}>Transaction ID</th>
                  <th style={TH}>ULPIN</th>
                  <th style={TH}>Type</th>
                  <th style={TH}>Parties</th>
                  <th style={{ ...TH, textAlign: "right" }}></th>
                </tr>
              </thead>
              <tbody>
                {surveyQueue.map((item, idx) => (
                  <tr key={item.id}
                    style={{ borderBottom: idx < surveyQueue.length - 1 ? "1px solid #f0f2f4" : "none", cursor: "pointer" }}
                    onClick={() => navigate(ROUTES.PATHS.APP.SLATE.SURVEYOR_DETAIL.replace(":ulpin", item.ulpin), { state: { hasPendingTxn: true, item } })}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f7ff")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "13px 14px" }}>
                      <span style={{ fontFamily: "monospace", fontSize: 12.5, fontWeight: 700, color: "#0F2A4A" }}>{item.id}</span>
                    </td>
                    <td style={{ padding: "13px 14px" }}>
                      <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 600, color: "#1d4670" }}>{item.ulpin}</span>
                    </td>
                    <td style={{ padding: "13px 14px" }}>
                      <span style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 9px", borderRadius: 10, background: "#e8eef7", color: "#1d4670" }}>
                        {item.type}
                      </span>
                    </td>
                    <td style={{ padding: "13px 14px", fontSize: 12, color: "#545c66" }}>{item.parties ?? "-"}</td>
                    <td style={{ padding: "13px 14px", textAlign: "right" }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(ROUTES.PATHS.APP.SLATE.SURVEYOR_DETAIL.replace(":ulpin", item.ulpin), { state: { hasPendingTxn: true, item } }); }}
                        style={{ fontSize: 12, fontWeight: 700, padding: "6px 14px", borderRadius: 6, background: "#1d4670", color: "#fff", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}
                      >
                        Open <ChevronRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  /* Pending Verification table */
  const pendingContent = (
    <div>
      {pending.length === 0 ? (
        <Empty variant="no-data" title="Nothing pending survey" description="No parcels in your jurisdiction are currently waiting for site verification." />
      ) : (
        <div style={{ background: "#fff", border: "1px solid #dee2e6", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={TH}>ULPIN</th>
                  <th style={TH}>Location</th>
                  <th style={TH}>Area</th>
                  <th style={TH}>Owners</th>
                  <th style={TH}>Status</th>
                  <th style={{ ...TH, textAlign: "right" }}></th>
                </tr>
              </thead>
              <tbody>
                {pending.map((t, idx) => (
                  <tr key={t.ulpin}
                    style={{ borderBottom: idx < pending.length - 1 ? "1px solid #f0f2f4" : "none", cursor: "pointer" }}
                    onClick={() => navigate(ROUTES.PATHS.APP.SLATE.SURVEYOR_DETAIL.replace(":ulpin", t.ulpin))}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f7ff")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "13px 14px" }}>
                      <span style={{ fontFamily: "monospace", fontSize: 12.5, fontWeight: 700, color: "#0F2A4A" }}>{t.ulpin}</span>
                    </td>
                    <td style={{ padding: "13px 14px", fontSize: 12, color: "#545c66" }}>
                      {t.location.village}, {t.location.taluk}
                    </td>
                    <td style={{ padding: "13px 14px", fontSize: 12, color: "#545c66" }}>{t.physical.area}</td>
                    <td style={{ padding: "13px 14px", fontSize: 12, color: "#545c66" }}>
                      {t.ownership.owners.map((o) => `${o.name} (${o.share}%)`).join(", ")}
                    </td>
                    <td style={{ padding: "13px 14px" }}>
                      <span style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 9px", borderRadius: 10, background: "#fbf3e2", color: "#8f6a26" }}>
                        Survey pending
                      </span>
                    </td>
                    <td style={{ padding: "13px 14px", textAlign: "right" }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(ROUTES.PATHS.APP.SLATE.SURVEYOR_DETAIL.replace(":ulpin", t.ulpin)); }}
                        style={{ fontSize: 12, fontWeight: 700, padding: "6px 14px", borderRadius: 6, background: "#1d4670", color: "#fff", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}
                      >
                        Open <ChevronRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  /* Completed table */
  const completedContent = (
    <div>
      {verified.length === 0 ? (
        <Empty variant="no-data" title="No completed surveys yet" description="Parcels you verify will be logged here with who verified them and when." />
      ) : (
        <div style={{ background: "#fff", border: "1px solid #dee2e6", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={TH}>ULPIN</th>
                  <th style={TH}>Location</th>
                  <th style={TH}>Verified By</th>
                  <th style={TH}>Verified At</th>
                  <th style={TH}>Result</th>
                </tr>
              </thead>
              <tbody>
                {verified.map((t, idx) => (
                  <tr key={t.ulpin}
                    style={{ borderBottom: idx < verified.length - 1 ? "1px solid #f0f2f4" : "none" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f8f9fa")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "13px 14px" }}>
                      <span style={{ fontFamily: "monospace", fontSize: 12.5, fontWeight: 700, color: "#0F2A4A" }}>{t.ulpin}</span>
                    </td>
                    <td style={{ padding: "13px 14px", fontSize: 12, color: "#545c66" }}>
                      {t.location.village}, {t.location.taluk}
                    </td>
                    <td style={{ padding: "13px 14px", fontSize: 12, color: "#545c66" }}>{t.survey?.verifiedBy ?? "-"}</td>
                    <td style={{ padding: "13px 14px", fontSize: 12, color: "#545c66" }}>{t.survey?.verifiedAt ?? "-"}</td>
                    <td style={{ padding: "13px 14px" }}>
                      {t.survey?.conflict?.flag ? (
                        <span style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 9px", borderRadius: 10, background: "#fdf0ee", color: "#B0392F" }}>Conflict Flagged</span>
                      ) : (
                        <span style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 9px", borderRadius: 10, background: "#eaf6ee", color: "#1C7A4E" }}>Verified</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col" style={{ height: "100%", overflowY: "auto" }}>
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#0F2A4A", marginBottom: 4 }}>Visit Data Entry</div>
        <div style={{ fontSize: 13, color: "#717881" }}>
          Survey verification queue{jurisdictionLabel ? ` - ${jurisdictionLabel}` : ""}. Review pending site visits, record GPS coordinates, and submit boundary measurements.
        </div>
      </div>

      <Tabs
        variant="underline"
        accentColor="#1d4670"
        tabs={[
          {
            id: "txn_queue",
            label: "Transaction Queue",
            icon: <ListChecks size={14} />,
            badge: surveyQueue.length || undefined,
            content: txnQueueContent,
          },
          {
            id: "pending",
            label: "Pending Verification",
            icon: <MapPinned size={14} />,
            badge: pending.length || undefined,
            content: pendingContent,
          },
          {
            id: "completed",
            label: "Completed",
            icon: <ShieldCheck size={14} />,
            badge: verified.length || undefined,
            content: completedContent,
          },
        ]}
      />
    </div>
  );
}
