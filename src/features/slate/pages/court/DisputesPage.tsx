import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Gavel, CheckCircle2 } from "lucide-react";
import Table, { type Column } from "@/ui/primitives/Table/Table";
import { Button } from "@/ui/primitives/Button/Button";
import { Tabs } from "@/ui/primitives/Tabs/Tabs";
import Badge from "@/ui/primitives/Badge/Badge";
import { Modal } from "@/ui/primitives/Modal/Modal";
import { Select } from "@/ui/primitives/Select/Select";
import { Input } from "@/ui/primitives/Input/Input";
import { Alert } from "@/ui/primitives/Alert/Alert";
import { useToast } from "@/ui/feedback/toast/useToast";
import { ROUTES } from "@/navigation/routes";
import { slateApi } from "../../services/apiClient";
import PageHead from "../../components/PageHead";
import type { SlateDispute, SlateToken } from "../../types/slate.types";

function randomCnr() {
  return "CNR-TNCH02-" + new Date().getFullYear() + "-" + (100000 + Math.floor(Math.random() * 899999));
}

export default function DisputesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [disputes, setDisputes] = useState<SlateDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [properties, setProperties] = useState<SlateToken[]>([]);
  const [showFile, setShowFile] = useState(false);
  const [ulpin, setUlpin] = useState("");
  const [type, setType] = useState("Boundary dispute");
  const [court, setCourt] = useState("Civil Court, Chennai (e-Courts)");
  const [petitioner, setPetitioner] = useState("");
  const [filing, setFiling] = useState(false);
  const [fileError, setFileError] = useState("");

  const load = useCallback(() => {
    return slateApi.court
      .getDisputes()
      .then(setDisputes)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load disputes."));
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    if (showFile) slateApi.citizen.getProperties().then(setProperties).catch(() => undefined);
  }, [showFile]);

  const columns: Column<SlateDispute>[] = [
    { key: "id", label: "Case No." },
    { key: "ulpin", label: "ULPIN" },
    { key: "type", label: "Type" },
    { key: "filedBy", label: "Filed By" },
    { key: "filedAgainst", label: "Filed Against" },
    { key: "filed", label: "Filed" },
    {
      key: "status",
      label: "Status",
      render: (d) => <Badge size="sm" variant={d.status === "frozen" ? "danger" : "success"}>{d.status.replace("_", " ")}</Badge>,
    },
  ];

  const frozen = disputes.filter((d) => d.status === "frozen");
  const executed = disputes.filter((d) => d.status === "order_executed");

  const handleFile = () => {
    const token = properties.find((t) => t.ulpin === ulpin);
    if (!token) return;
    setFiling(true);
    setFileError("");
    slateApi.court
      .fileDispute({
        ulpin,
        cnr: randomCnr(),
        type,
        filedBy: petitioner,
        filedAgainst: token.ownership.owners.map((o) => o.name).join(", "),
        court,
      })
      .then((dispute) => {
        toast.success(`Dispute ${dispute.id} filed. Token frozen.`);
        setShowFile(false);
        setUlpin("");
        setPetitioner("");
        load();
      })
      .catch((err) => setFileError(err instanceof Error ? err.message : "Could not file this dispute."))
      .finally(() => setFiling(false));
  };

  return (
    <div className="flex flex-col" style={{ height: "100%" }}>
      <div style={{ flexShrink: 0 }}>
        <PageHead
          eyebrow="Court / Admin Portal"
          title="Disputes & Court Orders"
          sub="Cases filed against SLATE tokens via the e-Courts oracle, and verified order entry."
          actions={
            <Button onClick={() => setShowFile(true)}>
              <Plus size={14} /> File Dispute
            </Button>
          }
        />
      </div>

      <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
        {error && <Alert type="error" title="Could not load disputes" message={error} dismissible={false} />}
        {loading && !error && <div style={{ fontSize: 12.5, color: "#9aa1a9", padding: "20px 0" }}>Loading…</div>}
        {!loading && !error && (
          <Tabs
            variant="underline"
            tabs={[
              {
                id: "frozen",
                label: "Frozen: Awaiting Order",
                icon: <Gavel size={14} />,
                badge: frozen.length || undefined,
                content: (
                  <Table
                    columns={columns}
                    data={frozen}
                    emptyMessage="No disputes awaiting a court order."
                    rowOnClick
                    onRowClick={(d) => navigate(ROUTES.PATHS.APP.SLATE.COURT_DISPUTE_DETAIL.replace(":disputeId", d.id))}
                    enableFilter={false}
                    maxBodyHeight="calc(100vh - 320px)"
                  />
                ),
              },
              {
                id: "executed",
                label: "Order Executed",
                icon: <CheckCircle2 size={14} />,
                badge: executed.length || undefined,
                content: (
                  <Table
                    columns={columns}
                    data={executed}
                    emptyMessage="No orders executed yet."
                    rowOnClick
                    onRowClick={(d) => navigate(ROUTES.PATHS.APP.SLATE.COURT_DISPUTE_DETAIL.replace(":disputeId", d.id))}
                    enableFilter={false}
                    maxBodyHeight="calc(100vh - 320px)"
                  />
                ),
              },
            ]}
          />
        )}
      </div>

      <Modal isOpen={showFile} onClose={() => setShowFile(false)} size="sm" title="File Dispute">
        <div className="flex flex-col gap-3" style={{ padding: 20 }}>
          <Select
            label="Parcel (ULPIN)"
            value={ulpin}
            onChange={(e) => setUlpin(e.target.value)}
            options={properties.map((t) => ({ label: `${t.ulpin}, ${t.location.village}`, value: t.ulpin }))}
            placeholder="Select a parcel"
          />
          <Select
            label="Dispute type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            options={[
              { label: "Boundary dispute", value: "Boundary dispute" },
              { label: "Title dispute", value: "Title dispute" },
              { label: "Succession dispute", value: "Succession dispute" },
              { label: "Government acquisition", value: "Government acquisition" },
            ]}
          />
          <Input label="Court" value={court} onChange={(e) => setCourt(e.target.value)} />
          <Input label="Petitioner" value={petitioner} onChange={(e) => setPetitioner(e.target.value)} />
          {fileError && <Alert type="error" message={fileError} dismissible={false} />}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowFile(false)}>Cancel</Button>
            <Button disabled={!ulpin || !petitioner || filing} onClick={handleFile}>{filing ? "Filing…" : "File Dispute"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
