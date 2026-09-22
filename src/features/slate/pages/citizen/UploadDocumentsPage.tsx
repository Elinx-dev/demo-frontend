import { useEffect, useState, useCallback } from "react";
import { Eye, Pencil, Trash2, FileText, Download, ShieldCheck, UserRound, ScrollText, Printer } from "lucide-react";
import { Card } from "@/ui/primitives/Card/Card";
import { Button } from "@/ui/primitives/Button/Button";
import { Select } from "@/ui/primitives/Select/Select";
import { Input } from "@/ui/primitives/Input/Input";
import { UploadZone } from "@/ui/primitives/UploadZone/UploadZone";
import { Modal } from "@/ui/primitives/Modal/Modal";
import { ConfirmationModal } from "@/ui/primitives/ConformationModal/ConfirmationModal";
import Badge from "@/ui/primitives/Badge/Badge";
import Empty from "@/ui/primitives/Empty/Empty";
import { Alert } from "@/ui/primitives/Alert/Alert";
import { useToast } from "@/ui/feedback/toast/useToast";
import { useSlateStore } from "../../state/SlateProvider";
import { slateApi } from "../../services/apiClient";
import PageHead from "../../components/PageHead";
import StateBadge from "../../components/StateBadge";
import DocumentPreview from "../../components/DocumentPreview";
import type { SlateDocType, SlateDocument, SlateToken } from "../../types/slate.types";

export default function UploadDocumentsPage() {
  const { currentUser } = useSlateStore();
  const toast = useToast();

  const [tokens, setTokens] = useState<SlateToken[]>([]);
  const [documentTypes, setDocumentTypes] = useState<{ code: string; label: string }[]>([]);
  const [docs, setDocs] = useState<SlateDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedUlpin, setSelectedUlpin] = useState("");
  const [docType, setDocType] = useState<SlateDocType>("kyc");
  const [previewDoc, setPreviewDoc] = useState<SlateDocument | null>(null);
  const [editDoc, setEditDoc] = useState<SlateDocument | null>(null);
  const [editForm, setEditForm] = useState({ fileName: "", docType: "kyc" as SlateDocType });
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);
  const [showPatta, setShowPatta] = useState(false);

  const citizenDocumentTypes = documentTypes.filter((d) => d.code !== "patta");
  const docTypeLabel = (code: string) => documentTypes.find((d) => d.code === code)?.label ?? code;
  const selectedToken = tokens.find((t) => t.ulpin === selectedUlpin) ?? null;

  useEffect(() => {
    Promise.all([slateApi.citizen.getProperties(), slateApi.masters.getDocumentTypes()])
      .then(([t, dt]) => {
        setTokens(t);
        setDocumentTypes(dt);
        if (t[0]) setSelectedUlpin(t[0].ulpin);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load your properties."))
      .finally(() => setLoading(false));
  }, []);

  const loadDocs = useCallback((ulpin: string) => {
    if (!ulpin) {
      setDocs([]);
      return;
    }
    slateApi.citizen.getDocuments(ulpin).then(setDocs).catch(() => setDocs([]));
  }, []);

  useEffect(() => {
    loadDocs(selectedUlpin);
  }, [selectedUlpin, loadDocs]);

  const handleUpload = (files: File[]) => {
    const file = files[0];
    if (!file || !selectedUlpin) return;
    const reader = new FileReader();
    reader.onload = () => {
      slateApi.citizen
        .uploadDocument({ ulpin: selectedUlpin, docType, fileName: file.name, dataUrl: String(reader.result) })
        .then(() => {
          toast.success(`${file.name} uploaded as ${docTypeLabel(docType)}.`);
          loadDocs(selectedUlpin);
        })
        .catch((err) => toast.error(err instanceof Error ? err.message : "Upload failed."));
    };
    reader.readAsDataURL(file);
  };

  const openEdit = (doc: SlateDocument) => {
    setEditDoc(doc);
    setEditForm({ fileName: doc.fileName, docType: doc.docType });
  };

  const saveEdit = () => {
    if (!editDoc) return;
    slateApi.citizen
      .updateDocument(editDoc.id, { fileName: editForm.fileName, docType: editForm.docType })
      .then(() => {
        toast.success("Document updated.");
        setEditDoc(null);
        loadDocs(selectedUlpin);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not update document."));
  };

  const confirmDelete = () => {
    if (!deleteDocId) return;
    slateApi.citizen
      .deleteDocument(deleteDocId)
      .then(() => {
        toast.info("Document deleted.");
        setDeleteDocId(null);
        loadDocs(selectedUlpin);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not delete document."));
  };

  return (
    <div className="flex flex-col" style={{ height: "100%" }}>
      <div style={{ flexShrink: 0 }}>
        <PageHead
          eyebrow="Citizen Portal"
          title="Documents"
          sub="Upload, view, and manage documents for your parcels."
        />
      </div>

      <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
        {error && <Alert type="error" title="Could not load properties" message={error} dismissible={false} />}
        {loading && !error && <div style={{ fontSize: 12.5, color: "#9aa1a9", padding: "20px 0" }}>Loading…</div>}
        {!loading && !error && tokens.length === 0 ? (
          <Empty variant="no-data" title="No properties found" description="No parcels are registered under your identity yet." />
        ) : !loading && !error ? (
          <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1.4fr" }}>
            <Card>
              <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 12, color: "#0F2A4A" }}>Upload a document</div>
              <div className="flex flex-col gap-3">
                <Select
                  label="Parcel"
                  value={selectedUlpin}
                  onChange={(e) => setSelectedUlpin(e.target.value)}
                  options={tokens.map((t) => ({ label: `${t.ulpin}, ${t.location.village}`, value: t.ulpin }))}
                />
                {selectedToken && (
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 11.5, color: "#717881" }}>Current state:</span>
                    <StateBadge state={selectedToken.state} size="sm" />
                  </div>
                )}
                <Select
                  label="Document type"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as SlateDocType)}
                  options={citizenDocumentTypes.map((d) => ({ label: d.label, value: d.code }))}
                />
                <UploadZone
                  label={docTypeLabel(docType)}
                  description="Drag a file here or click to browse"
                  accept=".pdf,.jpg,.jpeg,.png"
                  maxFiles={1}
                  onUpload={handleUpload}
                />
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F2A4A" }}>
                  Documents for <span style={{ fontFamily: "monospace" }}>{selectedUlpin || "-"}</span>
                </div>
                <span style={{ fontSize: 11.5, color: "#9aa1a9" }}>{docs.length} file(s)</span>
              </div>

              {/* Patta Certificate - system document always shown for selected token */}
              {selectedToken && (
                <div className="flex items-center gap-3" style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #e8d5a3", background: "#fffdf5", marginBottom: 8 }}>
                  <div className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 6, background: "#fef3c7", color: "#92400e", flexShrink: 0 }}>
                    <ScrollText size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "#161b22" }}>Patta Certificate</div>
                    <div style={{ fontSize: 11, color: "#9aa1a9" }}>System-generated · Official land ownership record</div>
                  </div>
                  <span className="flex items-center gap-1" style={{ fontSize: 10.5, fontWeight: 600, padding: "3px 8px", borderRadius: 999, background: "#fff8e1", color: "#92400e", whiteSpace: "nowrap" }}>
                    <ShieldCheck size={10} />
                    Government
                  </span>
                  <Badge size="sm" variant="warning">Patta</Badge>
                  <Button size="sm" variant="ghost" onClick={() => setShowPatta(true)} title="View Patta"><Eye size={14} /></Button>
                </div>
              )}

              {docs.length === 0 ? (
                <Empty variant="no-data" title="No uploaded documents yet" description="Documents you upload for this parcel will appear here." />
              ) : (
                <div className="flex flex-col gap-2">
                  {docs.map((d) => {
                    const byCitizen = d.uploadedBy === currentUser?.name;
                    return (
                      <div key={d.id} className="flex items-center gap-3" style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #eceef0", background: "#fafbfc" }}>
                        {d.dataUrl.startsWith("data:image") ? (
                          <img src={d.dataUrl} alt={d.fileName} style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6, border: "1px solid #dee2e6", flexShrink: 0 }} />
                        ) : (
                          <div className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 6, background: "#f3f1ec", color: "#8f6a26", flexShrink: 0 }}>
                            <FileText size={18} />
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: "#161b22", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.fileName}</div>
                          <div style={{ fontSize: 11, color: "#9aa1a9" }}>{d.uploadedAt}</div>
                        </div>
                        <span
                          className="flex items-center gap-1"
                          style={{ fontSize: 10.5, fontWeight: 600, padding: "3px 8px", borderRadius: 999, background: byCitizen ? "#e8eef7" : "#eaf6ee", color: byCitizen ? "#1d4670" : "#1C7A4E", whiteSpace: "nowrap" }}
                        >
                          {byCitizen ? <UserRound size={10} /> : <ShieldCheck size={10} />}
                          {byCitizen ? "You" : d.uploadedBy}
                        </span>
                        <Badge size="sm" variant="info">{docTypeLabel(d.docType)}</Badge>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setPreviewDoc(d)} title="View"><Eye size={14} /></Button>
                          <Button size="sm" variant="ghost" onClick={() => openEdit(d)} title="Edit"><Pencil size={14} /></Button>
                          <Button size="sm" variant="ghost" onClick={() => setDeleteDocId(d.id)} title="Delete" style={{ color: "#B0392F" }}><Trash2 size={14} /></Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        ) : null}
      </div>

      <Modal isOpen={!!previewDoc} onClose={() => setPreviewDoc(null)} size="lg" title={previewDoc?.fileName}>
        <div style={{ padding: 20 }}>
          {previewDoc && <DocumentPreview dataUrl={previewDoc.dataUrl} fileName={previewDoc.fileName} height={420} />}
          <a href={previewDoc?.dataUrl} download={previewDoc?.fileName} style={{ display: "inline-block", marginTop: 14 }}>
            <Button variant="outline" size="sm"><Download size={13} /> Download</Button>
          </a>
        </div>
      </Modal>

      <Modal isOpen={!!editDoc} onClose={() => setEditDoc(null)} size="sm" title="Edit document">
        <div className="flex flex-col gap-3" style={{ padding: 20 }}>
          {editDoc && <DocumentPreview dataUrl={editDoc.dataUrl} fileName={editDoc.fileName} height={140} />}
          <Input label="File name" value={editForm.fileName} onChange={(e) => setEditForm((f) => ({ ...f, fileName: e.target.value }))} />
          <Select
            label="Document type"
            value={editForm.docType}
            onChange={(e) => setEditForm((f) => ({ ...f, docType: e.target.value as SlateDocType }))}
            options={citizenDocumentTypes.map((d) => ({ label: d.label, value: d.code }))}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setEditDoc(null)}>Cancel</Button>
            <Button onClick={saveEdit}>Save changes</Button>
          </div>
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={!!deleteDocId}
        onClose={() => setDeleteDocId(null)}
        onConfirm={confirmDelete}
        variant="danger"
        title="Delete document"
        message="This permanently removes the document from this parcel's records."
        confirmText="Delete"
      />

      {/* Patta Certificate Modal */}
      <Modal isOpen={showPatta} onClose={() => setShowPatta(false)} size="md" title="Patta Certificate">
        {selectedToken && (
          <div style={{ padding: 20 }}>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 20, paddingBottom: 16, borderBottom: "2px solid #e8d5a3" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#92400e", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>Government of Tamil Nadu</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#0F2A4A", marginBottom: 2 }}>Patta Certificate</div>
              <div style={{ fontSize: 11, color: "#9aa1a9" }}>Registration Department · SLATE Land Registry</div>
            </div>

            {/* Fields */}
            <div className="flex flex-col gap-2.5">
              {[
                { label: "ULPIN", value: selectedToken.ulpin },
                { label: "Survey No.", value: `${selectedToken.identity.surveyNo}${selectedToken.identity.subDivision ? ` / ${selectedToken.identity.subDivision}` : ""}` },
                { label: "Owner(s)", value: selectedToken.ownership.owners.map((o) => `${o.name}${selectedToken.ownership.owners.length > 1 ? ` (${o.share}%)` : ""}`).join(", ") },
                { label: "Ownership Type", value: selectedToken.ownership.ownershipType },
                { label: "Village", value: selectedToken.location.village },
                { label: "Taluk", value: selectedToken.location.taluk },
                { label: "District", value: selectedToken.location.district },
                { label: "Area / Extent", value: selectedToken.physical.area },
                { label: "Land Classification", value: selectedToken.physical.classification },
                { label: "FMB Reference", value: selectedToken.physical.fmbRef || "-" },
                { label: "Acquisition Date", value: selectedToken.ownership.acquisitionDate || "-" },
                { label: "Token Status", value: selectedToken.state.charAt(0).toUpperCase() + selectedToken.state.slice(1) },
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-2" style={{ fontSize: 12.5 }}>
                  <span style={{ width: 140, flexShrink: 0, color: "#717881", fontWeight: 500 }}>{label}</span>
                  <span style={{ color: "#161b22", fontWeight: 600, flex: 1 }}>{value}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 20, paddingTop: 14, borderTop: "1px solid #eceef0", fontSize: 10.5, color: "#9aa1a9", textAlign: "center" }}>
              This is a system-generated patta record from SLATE. For certified copy, visit the Sub-Registrar Office.
            </div>

            <div className="flex gap-2 justify-end" style={{ marginTop: 16 }}>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer size={13} /> Print
              </Button>
              <Button size="sm" onClick={() => setShowPatta(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
