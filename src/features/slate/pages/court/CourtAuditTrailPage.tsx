import AuditTrailTable from "../../components/AuditTrailTable";

export default function CourtAuditTrailPage() {
  return (
    <AuditTrailTable
      eyebrow="Court / Admin Portal"
      title="Audit Trail"
      sub="Immutable, append-only history of every state change across all SLATE tokens."
    />
  );
}
