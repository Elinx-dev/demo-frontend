import type { SlateToken } from "../types/slate.types";

function inrFmt(val: number | null | undefined): string {
  if (val == null) return "-";
  return "₹" + val.toLocaleString("en-IN");
}

function buildPattaHTML(token: SlateToken, txnId?: string): string {
  const issuedOn = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  const owners = token.ownership.owners.map((o) => `${o.name} (${o.share}%)`).join(" · ");
  const location = [token.location.village, token.location.taluk, token.location.district].filter(Boolean).join(", ");
  const encumbrance = token.encumbrance.flag
    ? `${token.encumbrance.lienType ?? "Lien"} - ${token.encumbrance.lender}`
    : "Nil";

  const measurementsHTML =
    token.survey?.measurements && token.survey.measurements.length > 0
      ? `<table style="width:100%;border-collapse:collapse;font-size:11px;margin-top:6px">
          <thead>
            <tr style="background:#f4f8fd">
              <th style="padding:5px 8px;text-align:left;border:1px solid #dce0e5;font-weight:600;color:#545c66">From</th>
              <th style="padding:5px 8px;text-align:center;border:1px solid #dce0e5;color:#9aa1a9">→</th>
              <th style="padding:5px 8px;text-align:left;border:1px solid #dce0e5;font-weight:600;color:#545c66">To</th>
              <th style="padding:5px 8px;text-align:right;border:1px solid #dce0e5;font-weight:600;color:#545c66">Measurement</th>
            </tr>
          </thead>
          <tbody>
            ${token.survey.measurements.map((m) => `
              <tr>
                <td style="padding:5px 8px;border:1px solid #eceef0">${m.from}</td>
                <td style="padding:5px 8px;border:1px solid #eceef0;text-align:center;color:#9aa1a9">→</td>
                <td style="padding:5px 8px;border:1px solid #eceef0">${m.to}</td>
                <td style="padding:5px 8px;border:1px solid #eceef0;text-align:right;font-family:monospace">${m.val}</td>
              </tr>`).join("")}
          </tbody>
        </table>`
      : "<div style='font-size:11px;color:#9aa1a9'>Not recorded</div>";

  const conflictBanner =
    token.survey?.conflict?.flag
      ? `<div style="margin-bottom:20px;padding:10px 14px;background:#fdf0ee;border:1px solid #f5c6cb;border-radius:6px">
           <div style="font-size:11px;font-weight:700;color:#B0392F">⚠ Survey Conflict Detected</div>
           <div style="font-size:10.5px;color:#7c2d2d;margin-top:3px">
             Surveyor recorded: <strong>${token.survey.conflict.reportedArea}</strong> · Token record: <strong>${token.survey.conflict.tokenArea}</strong>
           </div>
         </div>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Patta - ${token.ulpin}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #161b22; padding: 36px 48px; line-height: 1.5; }
    .header { display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 3px solid #0F2A4A; padding-bottom: 18px; margin-bottom: 24px; }
    .logo-mark { font-size: 26px; font-weight: 900; color: #0F2A4A; letter-spacing: 4px; }
    .logo-sub { font-size: 9px; color: #B8923D; letter-spacing: 2px; font-weight: 700; margin-top: 2px; }
    .logo-dept { font-size: 9.5px; color: #6c757d; margin-top: 3px; }
    .doc-heading { text-align: right; }
    .doc-title { font-size: 17px; font-weight: 700; color: #B8923D; letter-spacing: 1px; text-transform: uppercase; }
    .doc-issued { font-size: 10px; color: #6c757d; margin-top: 4px; }
    .ulpin-chip { display: inline-block; font-family: monospace; font-size: 15px; font-weight: 700; color: #0F2A4A; background: #f4f8fd; border: 1.5px solid #c4dbf3; padding: 5px 12px; border-radius: 4px; margin-top: 7px; }
    .state-bar { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: #f0f8f2; border: 1px solid #bfe6cc; border-radius: 6px; margin-bottom: 20px; }
    .state-dot { width: 8px; height: 8px; border-radius: 50%; background: #1C7A4E; flex-shrink: 0; }
    .state-label { font-size: 11.5px; font-weight: 700; color: #1C7A4E; }
    .state-meta { margin-left: auto; font-size: 10px; color: #717881; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 10px; font-weight: 700; color: #0F2A4A; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1.5px solid #eceef0; padding-bottom: 5px; margin-bottom: 12px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 28px; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px 28px; }
    .full { grid-column: 1 / -1; }
    .field-label { font-size: 9px; font-weight: 700; color: #9aa1a9; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 2px; }
    .field-value { font-size: 12px; color: #161b22; }
    .mono { font-family: monospace; }
    .sig-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 48px; text-align: center; }
    .sig-box { border-top: 1px solid #161b22; padding-top: 6px; font-size: 10.5px; font-weight: 600; color: #0F2A4A; }
    .footer { margin-top: 32px; border-top: 1px solid #eceef0; padding-top: 12px; display: flex; justify-content: space-between; align-items: flex-end; }
    .footer-text { font-size: 9.5px; color: #9aa1a9; max-width: 70%; }
    .footer-watermark { font-size: 22px; font-weight: 900; color: #0F2A4A; letter-spacing: 3px; opacity: 0.12; }
    @media print {
      body { padding: 20px 30px; }
      @page { margin: 1cm; }
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div>
      <div class="logo-mark">◈ SLATE</div>
      <div class="logo-sub">SECURED LAND ASSET TOKEN EXCHANGE</div>
      <div class="logo-dept">Government of Tamil Nadu · Registration Department</div>
    </div>
    <div class="doc-heading">
      <div class="doc-title">Patta Document</div>
      <div class="doc-issued">Issued on ${issuedOn}</div>
      ${txnId ? `<div class="doc-issued">Transaction Ref: <span class="mono">${txnId}</span></div>` : ""}
      <div class="ulpin-chip">${token.ulpin}</div>
    </div>
  </div>

  <!-- State bar -->
  <div class="state-bar">
    <div class="state-dot"></div>
    <div class="state-label">TOKEN STATE: ${token.state.toUpperCase()}</div>
    <div class="state-meta">
      Token ID: <span class="mono">${token.identity.tokenId}</span>
      &nbsp;·&nbsp; Created: ${token.lifecycle.created}
      &nbsp;·&nbsp; Last Operation: ${token.lifecycle.lastOperation}
    </div>
  </div>

  ${conflictBanner}

  <!-- Ownership -->
  <div class="section">
    <div class="section-title">Ownership Details</div>
    <div class="grid">
      <div class="full">
        <div class="field-label">Owner(s)</div>
        <div class="field-value">${owners}</div>
      </div>
      <div>
        <div class="field-label">Ownership Type</div>
        <div class="field-value">${token.ownership.ownershipType}</div>
      </div>
      <div>
        <div class="field-label">Acquisition Date</div>
        <div class="field-value">${token.ownership.acquisitionDate}</div>
      </div>
    </div>
  </div>

  <!-- Identity & Location -->
  <div class="section">
    <div class="section-title">Identity &amp; Location</div>
    <div class="grid">
      <div>
        <div class="field-label">Survey No.</div>
        <div class="field-value mono">${token.identity.surveyNo}</div>
      </div>
      <div>
        <div class="field-label">Sub-Division</div>
        <div class="field-value">${token.identity.subDivision || "-"}</div>
      </div>
      <div>
        <div class="field-label">Parcel Type</div>
        <div class="field-value">${token.identity.parcelType}</div>
      </div>
      <div>
        <div class="field-label">GPS Centroid</div>
        <div class="field-value mono">${token.location.gpsCentroid || "-"}</div>
      </div>
      <div>
        <div class="field-label">Village / Panchayat</div>
        <div class="field-value">${token.location.village}</div>
      </div>
      <div>
        <div class="field-label">Taluk</div>
        <div class="field-value">${token.location.taluk}</div>
      </div>
      <div>
        <div class="field-label">District</div>
        <div class="field-value">${token.location.district}</div>
      </div>
      <div>
        <div class="field-label">Geometry Ref</div>
        <div class="field-value mono">${token.location.geometryRef || "-"}</div>
      </div>
    </div>
  </div>

  <!-- Physical Details -->
  <div class="section">
    <div class="section-title">Physical Details</div>
    <div class="grid">
      <div>
        <div class="field-label">Area / Extent</div>
        <div class="field-value">${token.physical.area}</div>
      </div>
      <div>
        <div class="field-label">Classification</div>
        <div class="field-value">${token.physical.classification}</div>
      </div>
      <div>
        <div class="field-label">FMB Ref</div>
        <div class="field-value mono">${token.physical.fmbRef || "-"}</div>
      </div>
      <div class="full">
        <div class="field-label">Boundary Description</div>
        <div class="field-value">${token.physical.boundaries || "-"}</div>
      </div>
    </div>
  </div>

  <!-- Survey Measurements -->
  ${token.survey ? `
  <div class="section">
    <div class="section-title">Survey Verification</div>
    <div class="grid" style="margin-bottom:10px">
      <div>
        <div class="field-label">Verified By</div>
        <div class="field-value">${token.survey.verifiedBy}</div>
      </div>
      <div>
        <div class="field-label">Verified On</div>
        <div class="field-value">${token.survey.verifiedAt}</div>
      </div>
      <div>
        <div class="field-label">GPS (Lat)</div>
        <div class="field-value mono">${token.survey.lat.toFixed(5)}° N</div>
      </div>
      <div>
        <div class="field-label">GPS (Lng)</div>
        <div class="field-value mono">${token.survey.lng.toFixed(5)}° E</div>
      </div>
      ${token.survey.surveyedArea ? `<div>
        <div class="field-label">Surveyed Area</div>
        <div class="field-value">${token.survey.surveyedArea}</div>
      </div>` : ""}
      ${token.survey.notes ? `<div class="full">
        <div class="field-label">Site Notes</div>
        <div class="field-value">${token.survey.notes}</div>
      </div>` : ""}
    </div>
    <div>
      <div class="field-label" style="margin-bottom:6px">Boundary Measurements</div>
      ${measurementsHTML}
    </div>
  </div>` : ""}

  <!-- Financial -->
  <div class="section">
    <div class="section-title">Financial Details</div>
    <div class="grid-3">
      <div>
        <div class="field-label">Guideline Value</div>
        <div class="field-value">${inrFmt(token.financial.guidanceValue)}</div>
      </div>
      <div>
        <div class="field-label">Last Sale Value</div>
        <div class="field-value">${inrFmt(token.financial.lastSaleValue)}</div>
      </div>
      <div>
        <div class="field-label">Stamp Duty Ref</div>
        <div class="field-value mono">${token.financial.stampDutyRef || "-"}</div>
      </div>
    </div>
  </div>

  <!-- Encumbrance & Dispute -->
  <div class="section">
    <div class="section-title">Encumbrance &amp; Dispute Status</div>
    <div class="grid">
      <div>
        <div class="field-label">Encumbrance</div>
        <div class="field-value">${encumbrance}</div>
      </div>
      <div>
        <div class="field-label">Active Dispute</div>
        <div class="field-value">${token.dispute.flag ? token.dispute.status : "Clear"}</div>
      </div>
    </div>
  </div>

  <!-- Signature blocks -->
  <div class="sig-row">
    <div class="sig-box">Citizen / Owner Signature &amp; Date</div>
    <div class="sig-box">Sub-Registrar Signature &amp; Official Seal</div>
    <div class="sig-box">Tahsildar / Revenue Officer Signature</div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-text">
      This Patta document is computer-generated by the SLATE platform and is legally binding upon on-chain validation.
      Document hash is stored on-chain for tamper-proof verification.
      Token ID: <span class="mono">${token.identity.tokenId}</span>
    </div>
    <div class="footer-watermark">◈ SLATE</div>
  </div>

</body>
</html>`;
}

export function buildPattaHtmlBlob(token: SlateToken, txnId?: string): string {
  const html = buildPattaHTML(token, txnId);
  const blob = new Blob([html], { type: "text/html" });
  return URL.createObjectURL(blob);
}

export function generatePattaPDF(token: SlateToken, txnId?: string): void {
  const html = buildPattaHTML(token, txnId);
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) {
    alert("Popup blocked. Please allow popups for this site to generate Patta.");
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  // Slight delay so styles load before print dialog opens
  setTimeout(() => {
    win.print();
  }, 600);
}
