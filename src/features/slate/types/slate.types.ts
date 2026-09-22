export type SlatePortal = "citizen" | "officer" | "bank" | "court" | "surveyor" | "revenue" | "vao" | "tahsildar";

export type SiteVisitStatus =
  | "pending_proposal"
  | "surveyor_proposed"
  | "vao_proposed"
  | "date_agreed"
  | "surveyor_checkedin"
  | "vao_checkedin"
  | "joint_checkedin"
  | "completed"
  | "revisit_required";

export interface SiteVisitTask {
  id: string;
  txnId: string;
  ulpin: string;
  surveyorId: string;
  surveyorName: string | null;
  vaoId: string;
  vaoName: string | null;
  status: SiteVisitStatus;
  proposedDate: string | null;
  confirmedDate: string | null;
  proposedByRole: "surveyor" | "vao" | null;
  proposedTime: string | null;
  confirmedTime: string | null;
  surveyorCheckedInAt: string | null;
  vaoCheckedInAt: string | null;
  notes: string | null;
}

// Open string types - these are admin-extensible master lists (see data/slateData.ts
// DESIGNATIONS / DOCUMENT_TYPES seeds and SlateProvider's addDesignation/addDocumentType).
export type SlateDesignation = string;
export type SlateDocType = string;

export interface SlateMasterItem {
  code: string;
  label: string;
}

export interface SlateStampDutyRate {
  code: string;
  label: string;
  rate: number; // percentage, e.g. 7 for 7%
}

export interface SlatePermission {
  code: string;
  label: string;
  module: string;
}

export interface SlateMenuItem {
  code: string;
  label: string;
  portal: SlatePortal;
  icon?: string;
  path?: string;
}

export interface SlateJurisdictionNode {
  id: string;
  level: "state" | "district" | "taluk" | "village";
  name: string;
  parentId?: string;
}

export interface SlateOfficerJurisdiction {
  district: string;
  taluk: string;
  village?: string;
}

export interface SlateDocument {
  id: string;
  ulpin: string;
  docType: SlateDocType;
  fileName: string;
  dataUrl: string;
  uploadedAt: string;
  uploadedBy: string;
}

export type SlateTokenState =
  | "draft"
  | "verified"
  | "active"
  | "blocked"
  | "locked"
  | "disputed"
  | "split"
  | "retired";

export type SlateHistoryKind = "ok" | "warn" | "danger" | "info";

export interface SlateUser {
  id: string;
  name: string;
  role: string;
  portal: SlatePortal;
  initials: string;
  aadhaar?: string;
  phone?: string;
  email?: string;
  color: string;
  gender?: string;
  dob?: string;
  fatherName?: string;
  address?: string;
  photo?: string | null;
  dept?: string;
  employeeId?: string;
  designation?: SlateDesignation;
  jurisdiction?: SlateOfficerJurisdiction;
  makerChecker?: "Maker" | "Checker" | "N/A";
  status?: "pending" | "active" | "deactivated";
}

export interface SlateOwner {
  id: string;
  name: string;
  share: number;
}

export interface SlateHeir {
  id: string;
  name: string;
  relation: string;
  share: number;
  consent: "pending" | "given";
}

export interface SlateSuccession {
  deceased: string;
  deathCertNo: string;
  deathDate: string;
  law: string;
  heirs: SlateHeir[];
}

export interface SurveyMeasurementRow {
  from: string;
  to: string;
  val: string;
}

export interface SlateSurveyRecord {
  verifiedBy: string;
  verifiedAt: string;
  lat: number;
  lng: number;
  notes?: string;
  measurements?: SurveyMeasurementRow[];
  surveyedArea?: string;
  conflict?: { flag: boolean; reportedArea: string; tokenArea: string };
  /** GPS boundary polygon vertices from the Polygon tab. */
  polygonVertices?: Array<{ lat: number; lng: number }>;
}

export interface SlateHistoryEntry {
  ts: string;
  actor: string;
  action: string;
  detail: string;
  kind: SlateHistoryKind;
}

export interface EcEntry {
  srNo: number;
  docNo: string;
  docYear: number;
  executionDate: string;
  registrationDate: string;
  nature: string;
  executant: string;
  claimant: string;
  considerationValue?: number;
  marketValue?: number;
  prNumber?: string;
  surveyNo: string;
  extent: string;
  bankBranch?: string;
  status: "active" | "released";
  releaseDocNo?: string;
  releaseDate?: string;
}

export interface EcData {
  searchPeriod: { from: string; to: string };
  sro: string;
  entries: EcEntry[];
}

export interface SlateToken {
  ulpin: string;
  state: SlateTokenState;
  identity: { surveyNo: string; subDivision: string; tokenId: string; parcelType: string };
  location: { district: string; taluk: string; village: string; gpsCentroid: string; geometryRef: string };
  ownership: { owners: SlateOwner[]; ownershipType: string; acquisitionDate: string };
  physical: { area: string; classification: string; boundaries: string; fmbRef: string };
  encumbrance: { flag: boolean; lender: string | null; chargeAmount: number; lienType: string | null; secondCharge: boolean; since?: string };
  dispute: { flag: boolean; cnr: string | null; filingDate: string | null; status: string; court?: string; petitioner?: string };
  financial: { guidanceValue: number; lastSaleValue: number | null; stampDutyRef: string | null; taxStatus: string };
  lifecycle: { lastOperation: string; lastEndorsers: string[]; docHashes: string[]; created: string };
  succession?: SlateSuccession;
  surveyPending?: boolean;
  survey?: SlateSurveyRecord;
  ecData?: EcData;
  history: SlateHistoryEntry[];
}

export type OfficerQueueStatus = "pending_maker" | "pending_checker" | "pending_surveyor" | "pending_tahsildar" | "exception" | "approved";

export interface OfficerQueueItem {
  id: string;
  type: string;
  ulpin: string;
  parties: string;
  amount: number;
  submitted: string;
  status: OfficerQueueStatus;
  priority: "normal" | "high";
  reason?: string;
  paymentRef?: string | null;
  recipientName?: string;
  sharePercent?: number;
  stampDutyCode?: string;
  needsSurveyor?: boolean | null;
  initiatedByName?: string | null;
  initiatedByRole?: string | null;
}

export type ExceptionStatus = "open" | "resolved";

export interface SlateException {
  id: string;
  txnId: string;
  ulpin: string;
  type: string;
  flaggedBy: string;
  flaggedAt: string;
  reason: string;
  context: string[];
  status: ExceptionStatus;
  resolution?: string;
}

export type MortgageStatus = "active" | "released";

export interface SlateMortgage {
  id: string;
  ulpin: string;
  borrower: string;
  bank: string;
  amount: number;
  type: string;
  status: MortgageStatus;
  created: string;
  released?: string;
}

export type DisputeStatus = "frozen" | "order_executed";

export interface SlateDispute {
  id: string;
  ulpin: string;
  type: string;
  filedBy: string;
  filedAgainst: string;
  filed: string;
  status: DisputeStatus;
  court: string;
  orderType?: string;
  orderDate?: string;
}

export interface SlateAuditRow {
  ts: string;
  ulpin: string;
  actor: string;
  action: string;
  detail: string;
  kind: SlateHistoryKind;
  txnId: string;
}

export interface SlateStateDef {
  label: string;
  cls: SlateTokenState;
  meaning: string;
  txns: string;
}

export interface SlateOperation {
  op: string;
  desc: string;
  caller: string;
  from: string;
  to: string;
}

export type TxnType = "sale" | "gift" | "partition" | "mortgage_request";

export interface TxnDraft {
  step: number;
  ulpin: string;
  type: TxnType;
  buyerName: string;
  buyerAadhaar: string;
  price: string;
  giftRelation: string;
  sharePercent: string;
  stampDutyCode: string;
  paymentMethod: "upi" | "card";
  paymentDone: boolean;
  paymentRef: string;
  submitted: boolean;
  consentRequestId?: string;
  witnesses: { name: string; address: string }[];
  /** Whether a surveyor visit is required before mutation. Forced true for partition type. */
  needsSurveyor?: boolean;
}

export interface ConsentRequest {
  id: string;
  ulpin: string;
  type: TxnType;
  senderId: string;
  senderName: string;
  recipientName: string;
  recipientId?: string;
  price?: string;
  sharePercent?: string;
  giftRelation?: string;
  createdAt: string;
  senderConsent: boolean;
  recipientConsent: boolean;
  recipientConsentAt?: string;
}

export interface RegisterDraft {
  step: number;
  name: string;
  aadhaar: string;
  mobile: string;
  email: string;
  gender: string;
  dob: string;
  address: string;
  consent: boolean;
  newUserId?: string;
}

export interface RegMutateCheck {
  label: string;
  pass: boolean;
  detail: string;
}
