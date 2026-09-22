import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Building2, ExternalLink, X } from "lucide-react";
import Empty from "@/ui/primitives/Empty/Empty";
import Badge from "@/ui/primitives/Badge/Badge";
import PageHead from "../../components/PageHead";
import { slateApi } from "../../services/apiClient";
import { ROUTES } from "@/navigation/routes";
import type { SlateToken } from "../../types/slate.types";

const SLATE_PATHS = ROUTES.PATHS.APP.SLATE;

export default function TahsildarPropertyListPage() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [tokens, setTokens] = useState<SlateToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback((q: string) => {
    setLoading(true);
    slateApi.officer
      .searchTokens(q.trim())
      .then((results) => {
        setTokens(results.slice(0, 50));
        setSearched(true);
      })
      .catch(() => { setTokens([]); setSearched(true); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);

    if (searchText.trim() === "") {
      // Empty → load all (also handles mount and user clearing search)
      doSearch("");
      return;
    }
    if (searchText.trim().length < 2) {
      // Too short - wait, don't change current results
      return;
    }
    debounce.current = setTimeout(() => doSearch(searchText), 400);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [searchText, doSearch]);

  const handleView = (token: SlateToken) => {
    navigate(SLATE_PATHS.CITIZEN_PROPERTY_DETAIL.replace(":ulpin", token.ulpin));
  };

  return (
    <div className="flex flex-col" style={{ height: "100%" }}>
      <div style={{ flexShrink: 0 }}>
        <PageHead
          eyebrow="Thasildar Portal"
          title="Property List"
          sub="All properties under your jurisdiction. Search by ULPIN, survey number, owner name, or village."
        />
      </div>

      {/* Search bar */}
      <div
        style={{
          padding: "10px 16px",
          flexShrink: 0,
          background: "#fff",
          borderBottom: "1px solid #eceef0",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div style={{ position: "relative", flex: "0 0 360px" }}>
          <Search
            size={13}
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#9aa1a9",
            }}
          />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="ULPIN, survey number, owner, village…"
            style={{
              width: "100%",
              padding: "8px 32px",
              borderRadius: 8,
              border: "1.5px solid #dee2e6",
              fontSize: 13,
              color: "#161b22",
              outline: "none",
              boxSizing: "border-box" as const,
            }}
            autoFocus
          />
          {searchText && (
            <button
              onClick={() => setSearchText("")}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#9aa1a9",
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>
        {searched && (
          <span style={{ fontSize: 11.5, color: "#9aa1a9" }}>
            {loading ? "Searching…" : `${tokens.length} propert${tokens.length === 1 ? "y" : "ies"} found`}
          </span>
        )}
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: "auto", background: "#fff" }}>
        {loading ? (
          <div
            style={{ padding: "48px 0", textAlign: "center" as const, color: "#9aa1a9", fontSize: 13 }}
          >
            Loading properties…
          </div>
        ) : tokens.length === 0 && searched ? (
          <Empty
            variant="no-data"
            title="No properties found"
            description="Try a different ULPIN, survey number, or owner name."
          />
        ) : tokens.length > 0 ? (
          <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
            <thead>
              <tr style={{ background: "#f8f9fb", borderBottom: "1.5px solid #eceef0" }}>
                {["ULPIN", "Survey No.", "Owner(s)", "Village / Taluk", "Type", "Extent", "Status", ""].map(
                  (h) => (
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
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {tokens.map((tok) => {
                const owners = tok.ownership.owners.map((o) => o.name).join(", ");
                const location = [tok.location.village, tok.location.taluk]
                  .filter(Boolean)
                  .join(" / ");
                return (
                  <tr
                    key={tok.ulpin}
                    onClick={() => handleView(tok)}
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
                        padding: "11px 14px",
                        fontFamily: "monospace",
                        fontSize: 12,
                        color: "#0F2A4A",
                        fontWeight: 700,
                        whiteSpace: "nowrap" as const,
                      }}
                    >
                      <MapPin size={10} style={{ display: "inline", marginRight: 5, color: "#9aa1a9" }} />
                      {tok.ulpin}
                    </td>
                    <td
                      style={{
                        padding: "11px 14px",
                        fontFamily: "monospace",
                        fontSize: 12,
                        color: "#545c66",
                        whiteSpace: "nowrap" as const,
                      }}
                    >
                      {tok.identity.surveyNo}
                    </td>
                    <td
                      style={{
                        padding: "11px 14px",
                        fontSize: 12,
                        color: "#161b22",
                        maxWidth: 200,
                        overflow: "hidden" as const,
                        textOverflow: "ellipsis" as const,
                        whiteSpace: "nowrap" as const,
                      }}
                    >
                      {owners}
                    </td>
                    <td
                      style={{
                        padding: "11px 14px",
                        fontSize: 12,
                        color: "#545c66",
                        whiteSpace: "nowrap" as const,
                      }}
                    >
                      <Building2 size={10} style={{ display: "inline", marginRight: 5, color: "#9aa1a9" }} />
                      {location}
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 600,
                          padding: "2px 7px",
                          borderRadius: 8,
                          background: "#f4f5f7",
                          color: "#545c66",
                        }}
                      >
                        {tok.identity.parcelType}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "11px 14px",
                        fontSize: 12,
                        color: "#717881",
                        whiteSpace: "nowrap" as const,
                      }}
                    >
                      {tok.physical.extent}
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      {tok.encumbrance.flag ? (
                        <Badge variant="warning" size="sm">Encumbered</Badge>
                      ) : tok.dispute.flag ? (
                        <Badge variant="danger" size="sm">Disputed</Badge>
                      ) : (
                        <Badge variant="success" size="sm">Clear</Badge>
                      )}
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleView(tok);
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          fontSize: 11.5,
                          fontWeight: 600,
                          color: "#e85d04",
                          background: "#fff3e0",
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
        ) : null}
      </div>
    </div>
  );
}
