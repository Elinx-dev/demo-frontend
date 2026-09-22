import type {
  SlateAuditRow,
  SlateDesignation,
  SlateDispute,
  SlateDocType,
  SlateDocument,
  SlateException,
  SlateJurisdictionNode,
  SlateMasterItem,
  SlateMortgage,
  SlateOperation,
  SlateStampDutyRate,
  SlateStateDef,
  SlateToken,
  SlateUser,
  OfficerQueueItem,
  ConsentRequest,
  EcData,
} from "../types/slate.types";

function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return h;
}

function buildAuditTrail(tokens: Record<string, SlateToken>): SlateAuditRow[] {
  const rows: SlateAuditRow[] = [];
  Object.values(tokens).forEach((t) => {
    t.history.forEach((h) => {
      rows.push({
        ts: h.ts,
        ulpin: t.ulpin,
        actor: h.actor,
        action: h.action,
        detail: h.detail,
        kind: h.kind,
        txnId: "TXN-" + Math.abs(hashCode(t.ulpin + h.ts)).toString().slice(0, 6),
      });
    });
  });
  rows.sort((a, b) => b.ts.localeCompare(a.ts));
  return rows;
}

export const STATE_DEFS: Record<string, SlateStateDef> = {
  draft: { label: "Draft", cls: "draft", meaning: "Created from legacy import; not yet verified", txns: "No" },
  verified: { label: "Verified", cls: "verified", meaning: "Department confirmed data matches reality", txns: "Limited" },
  active: { label: "Active", cls: "active", meaning: "Live; transactions can occur", txns: "Yes" },
  blocked: { label: "Transfer Blocked", cls: "blocked", meaning: "Encumbrance (mortgage/lien/lease) prevents sale", txns: "No sale; otherwise active" },
  locked: { label: "Locked", cls: "locked", meaning: "Death or system-level hold", txns: "None" },
  disputed: { label: "Disputed", cls: "disputed", meaning: "Court case filed; frozen until court decides", txns: "None" },
  split: { label: "Split", cls: "split", meaning: "Subdivided into child tokens", txns: "Parent retired" },
  retired: { label: "Retired", cls: "retired", meaning: "Permanently deactivated", txns: "No" },
};

export const DESIGNATIONS: { code: SlateDesignation; label: string }[] = [
  { code: "VAO", label: "Village Administrative Officer (VAO)" },
  { code: "TAHSILDAR", label: "Tahsildar (Revenue)" },
  { code: "SUB_REGISTRAR", label: "Sub-Registrar (Registration)" },
  { code: "BANK_OFFICER", label: "Bank Officer" },
  { code: "COURT_ADMIN", label: "Court / Admin" },
];

export const JURISDICTIONS: SlateJurisdictionNode[] = [
  { id: "ST-TN", level: "state", name: "Tamil Nadu" },
  { id: "DIST-CGL", level: "district", name: "Chengalpattu", parentId: "ST-TN" },
  { id: "TLK-TBM", level: "taluk", name: "Tambaram", parentId: "DIST-CGL" },
  { id: "TLK-SPM", level: "taluk", name: "Sriperumbudur", parentId: "DIST-CGL" },
  { id: "VIL-TVM", level: "village", name: "Thiruvanmiyur", parentId: "TLK-TBM" },
  { id: "VIL-SHL", level: "village", name: "Sholinganallur", parentId: "TLK-TBM" },
  { id: "VIL-MBK", level: "village", name: "Mambakkam", parentId: "TLK-TBM" },
  { id: "VIL-SPMT", level: "village", name: "Sriperumbudur Town", parentId: "TLK-SPM" },
];

export const DOCUMENT_TYPES: { code: SlateDocType; label: string }[] = [
  { code: "sale_deed", label: "Sale Deed" },
  { code: "court_order", label: "Court Order" },
  { code: "kyc", label: "KYC Document" },
  { code: "survey_map", label: "Survey Map" },
  { code: "death_cert", label: "Death Certificate" },
  { code: "patta", label: "Patta / Mutation Certificate" },
  { code: "other", label: "Other" },
];

export const RELATIONSHIPS: string[] = [
  "Son", "Daughter", "Spouse", "Father", "Mother", "Brother", "Sister", "Grandson", "Granddaughter", "Other",
];

export const STAMP_DUTY_RATES: SlateStampDutyRate[] = [
  { code: "SALE_DEED", label: "Sale Deed", rate: 7 },
  { code: "GIFT_DEED_FAMILY", label: "Gift Deed (Family member)", rate: 1 },
  { code: "GIFT_DEED_NON_FAMILY", label: "Gift Deed (Non-family)", rate: 7 },
  { code: "PARTITION_DEED", label: "Partition / Share Transfer Deed", rate: 1 },
];

export const OPERATIONS: SlateOperation[] = [
  { op: "MINT", desc: "Create a token from legacy import or fresh grant", caller: "Registration officer", from: "- (new)", to: "Draft / Verified / Active" },
  { op: "TRANSFER", desc: "Move ownership and trigger mutation", caller: "RegMutate (officer-approved)", from: "Active", to: "Active (new owner)" },
  { op: "LOCK", desc: "Freeze all activity (e.g. on death)", caller: "InheritChain", from: "Active / Verified", to: "Locked" },
  { op: "UNLOCK", desc: "Release a lock after resolution", caller: "InheritChain / officer", from: "Locked", to: "Active" },
  { op: "FLAG", desc: "Mark encumbrance or dispute", caller: "EncumbranceGuard / DisputeResolve", from: "Active", to: "Transfer Blocked / Disputed" },
  { op: "RETIRE", desc: "Permanently deactivate a token", caller: "RegMutate / DisputeResolve", from: "Active / Disputed / Split", to: "Retired" },
  { op: "SPLIT", desc: "Subdivide into child tokens after partition", caller: "RegMutate + Survey", from: "Active", to: "Split - child Active" },
  { op: "MERGE", desc: "Combine tokens after consolidation", caller: "RegMutate + Survey", from: "Active", to: "Merged" },
];

export interface SlateData {
  users: Record<string, SlateUser>;
  tokens: Record<string, SlateToken>;
  officerQueue: OfficerQueueItem[];
  consentRequests: ConsentRequest[];
  exceptionQueue: SlateException[];
  mortgages: SlateMortgage[];
  disputes: SlateDispute[];
  auditTrail: SlateAuditRow[];
  documents: SlateDocument[];
  jurisdictions: SlateJurisdictionNode[];
  designations: SlateMasterItem[];
  documentTypes: SlateMasterItem[];
  relationships: string[];
  stampDutyRates: SlateStampDutyRate[];
}

export function createInitialSlateData(): SlateData {
  const users: Record<string, SlateUser> = {
    citizen_ravi: { id: "citizen_ravi", name: "Ravi Kumar", role: "Citizen", portal: "citizen", initials: "RK", aadhaar: "XXXX XXXX 4521", phone: "+91 98400 11221", color: "#2a5a8c", gender: "Male", email: "ravi.kumar@mail.com", dob: "14 Mar 1986", fatherName: "Muthukrishnan Kumar", address: "12, Kamaraj Salai, Thiruvanmiyur, Chennai, Tamil Nadu 600041", photo: null },
    citizen_muthu: { id: "citizen_muthu", name: "Muthu Selvam", role: "Citizen", portal: "citizen", initials: "MS", aadhaar: "XXXX XXXX 7732", phone: "+91 94440 22938", color: "#8f6a26", gender: "Male", email: "muthu.selvam@mail.com", dob: "02 Aug 1958", fatherName: "Selvam Pillai", address: "45, Agraharam Street, Mambakkam, Tambaram, Chennai, Tamil Nadu 600127", photo: null },
    citizen_anita: { id: "citizen_anita", name: "Anita Kumar", role: "Citizen", portal: "citizen", initials: "AK", aadhaar: "XXXX XXXX 9013", phone: "+91 90030 55218", color: "#5b3fa8", gender: "Female", email: "anita.kumar@mail.com", dob: "27 Nov 1994", fatherName: "Ravi Kumar", address: "7, Lake View Road, Sholinganallur, Chennai, Tamil Nadu 600119", photo: null },
    citizen_kumar2: { id: "citizen_kumar2", name: "Kumar Raman", role: "Citizen", portal: "citizen", initials: "KR", aadhaar: "XXXX XXXX 3387", phone: "+91 97150 88341", color: "#b0392f", gender: "Male", email: "kumar.raman@mail.com", dob: "19 Jan 1989", fatherName: "Raman Pillai", address: "18, Canal Bank Road, Thiruvanmiyur, Chennai, Tamil Nadu 600041", photo: null },
    officer_maker: { id: "officer_maker", name: "S. Lakshmi", role: "Registration Officer - Maker", portal: "officer", initials: "SL", dept: "Registration Dept · Sub-Registrar, Thiruvanmiyur", color: "#15375c", gender: "Female", email: "lakshmi.s@tnreg.gov.in", dob: "09 May 1981", fatherName: "Subramaniam Iyer", employeeId: "TNREG-SRO-04471", address: "Sub-Registrar Office, GST Road, Thiruvanmiyur, Chennai, Tamil Nadu 600041", photo: null, designation: "SUB_REGISTRAR", jurisdiction: { district: "Chengalpattu", taluk: "Tambaram" }, makerChecker: "Maker", status: "active" },
    officer_checker: { id: "officer_checker", name: "R. Venkatesan", role: "Registration Officer - Checker", portal: "officer", initials: "RV", dept: "Registration Dept · Sub-Registrar, Thiruvanmiyur", color: "#0F2A4A", gender: "Male", email: "venkatesan.r@tnreg.gov.in", dob: "23 Sep 1975", fatherName: "Ranganathan Venkatesan", employeeId: "TNREG-SRO-03108", address: "Sub-Registrar Office, GST Road, Thiruvanmiyur, Chennai, Tamil Nadu 600041", photo: null, designation: "SUB_REGISTRAR", jurisdiction: { district: "Chengalpattu", taluk: "Tambaram" }, makerChecker: "Checker", status: "active" },
    officer_tahsildar: { id: "officer_tahsildar", name: "K. Meena", role: "Tahsildar - Revenue", portal: "officer", initials: "KM", dept: "Revenue Dept · Taluk Office, Sriperumbudur", color: "#6b4f9e", gender: "Female", email: "meena.k@tnrev.gov.in", dob: "30 Jul 1983", fatherName: "Krishnamurthy Naidu", employeeId: "TNREV-SPM-00231", address: "Taluk Office, Sriperumbudur, Chengalpattu, Tamil Nadu 602105", photo: null, designation: "TAHSILDAR", jurisdiction: { district: "Chengalpattu", taluk: "Sriperumbudur" }, makerChecker: "N/A", status: "active" },
    surveyor_1: { id: "surveyor_1", name: "R. Aravind", role: "Surveyor - Survey Dept", portal: "surveyor", initials: "RA", dept: "Survey & Settlement Dept · Chengalpattu Division", color: "#1d6f8c", gender: "Male", email: "aravind.r@tnsurvey.gov.in", dob: "16 Apr 1987", fatherName: "Rajendran Pillai", employeeId: "TNSUR-CGL-00874", address: "Survey & Settlement Office, Chengalpattu, Tamil Nadu 603001", photo: null, status: "active" },
    vao_1: { id: "vao_1", name: "A. Krishnamurthy", role: "Village Administrative Officer (VAO)", portal: "vao", initials: "AK", dept: "Revenue Dept · VAO, Tambaram Taluk", color: "#6d3d9a", gender: "Male", email: "krishnamurthy.a@tnrev.gov.in", dob: "08 Nov 1983", fatherName: "Ayyasami Krishnamurthy", employeeId: "VAO-TBM-00123", address: "VAO Office, Thiruvanmiyur, Tambaram Taluk, Chennai, Tamil Nadu 600041", photo: null, status: "active" },
    vao_2: { id: "vao_2", name: "R. Meenakshi", role: "Village Administrative Officer (VAO)", portal: "vao", initials: "RM", dept: "Revenue Dept · VAO, Tambaram Taluk", color: "#6d3d9a", gender: "Female", email: "meenakshi.r@tnrev.gov.in", dob: "22 Jun 1990", fatherName: "Ramasamy", employeeId: "VAO-TBM-00456", address: "VAO Office, Sholinganallur, Tambaram Taluk, Chennai, Tamil Nadu 600119", photo: null, status: "active" },
    bank_officer: { id: "bank_officer", name: "Priya Narayanan", role: "Bank Officer - SBI", portal: "bank", initials: "PN", dept: "State Bank of India · Adyar Branch", color: "#1C7A4E", gender: "Female", email: "priya.narayanan@sbi.co.in", dob: "11 Feb 1990", fatherName: "Narayanan Krishnamurthy", employeeId: "SBI-ADY-22156", address: "State Bank of India, Adyar Branch, Lattice Bridge Road, Chennai, Tamil Nadu 600020", photo: null },
    court_admin: { id: "court_admin", name: "Court / Admin Console", role: "e-Courts Liaison & Demo Admin", portal: "court", initials: "CA", dept: "Civil Court, Chennai · Demo Seeding Console", color: "#8f6a26", gender: "Not specified", email: "admin@ecourts-demo.gov.in", dob: "-", fatherName: "-", employeeId: "ECRT-ADMIN-0001", address: "Civil Court Complex, High Court Campus, Chennai, Tamil Nadu 600104", photo: null },
    // ── 10 new EC-demo citizens ───────────────────────────────────────────
    citizen_subashini: { id: "citizen_subashini", name: "Subashini D.", role: "Citizen", portal: "citizen", initials: "SD", aadhaar: "XXXX XXXX 5521", phone: "+91 94431 12345", color: "#2a7a6c", gender: "Female", email: "subashini.d@mail.com", dob: "11 Jun 1982", fatherName: "Doraiswamy", address: "14, Sri Nagar Colony, Kumbakonam, Thanjavur, Tamil Nadu 612001", photo: null },
    citizen_nalini: { id: "citizen_nalini", name: "Nalini S.", role: "Citizen", portal: "citizen", initials: "NS", aadhaar: "XXXX XXXX 6231", phone: "+91 97802 54321", color: "#5a3e8f", gender: "Female", email: "nalini.s@mail.com", dob: "03 Mar 1975", fatherName: "Suresh", address: "7, Swami Nagar, Kumbakonam, Thanjavur, Tamil Nadu 612001", photo: null },
    citizen_arjun: { id: "citizen_arjun", name: "Arjun Sakthivel", role: "Citizen", portal: "citizen", initials: "AS", aadhaar: "XXXX XXXX 7812", phone: "+91 77089 11053", color: "#8f3a26", gender: "Male", email: "arjun.sakthivel@mail.com", dob: "28 Mar 2000", fatherName: "Sakthivel", address: "Kurunji Nagar, Sandhaipettai, Ayyalur, Vedasandur, Dindigul, Tamil Nadu 624801", photo: null },
    citizen_priyanka: { id: "citizen_priyanka", name: "Priyanka Murugan", role: "Citizen", portal: "citizen", initials: "PM", aadhaar: "XXXX XXXX 3421", phone: "+91 98431 67890", color: "#b03a6c", gender: "Female", email: "priyanka.m@mail.com", dob: "15 Sep 1988", fatherName: "Murugan", address: "22, Anna Nagar, Madurai, Tamil Nadu 625020", photo: null },
    citizen_karthik: { id: "citizen_karthik", name: "Karthikeyan R.", role: "Citizen", portal: "citizen", initials: "KR", aadhaar: "XXXX XXXX 9102", phone: "+91 90033 44567", color: "#264f8f", gender: "Male", email: "karthik.r@mail.com", dob: "22 Jul 1980", fatherName: "Ramasamy", address: "5, Gandhipuram, Coimbatore, Tamil Nadu 641012", photo: null },
    citizen_selvamraja: { id: "citizen_selvamraja", name: "Selvam Raja", role: "Citizen", portal: "citizen", initials: "SR", aadhaar: "XXXX XXXX 2233", phone: "+91 94881 22334", color: "#1a7a2e", gender: "Male", email: "selvam.raja@mail.com", dob: "08 Nov 1970", fatherName: "Raja Gopal", address: "33, Fairlands, Salem, Tamil Nadu 636016", photo: null },
    citizen_kavitha: { id: "citizen_kavitha", name: "Kavitha Nair", role: "Citizen", portal: "citizen", initials: "KN", aadhaar: "XXXX XXXX 8811", phone: "+91 96770 33445", color: "#7a2a5e", gender: "Female", email: "kavitha.nair@mail.com", dob: "14 Feb 1985", fatherName: "Nair Krishnan", address: "8, Cantonment, Trichy, Tamil Nadu 620001", photo: null },
    citizen_muruganantham: { id: "citizen_muruganantham", name: "Muruganantham P.", role: "Citizen", portal: "citizen", initials: "MP", aadhaar: "XXXX XXXX 5566", phone: "+91 95812 44556", color: "#4a6e2a", gender: "Male", email: "muruga.p@mail.com", dob: "30 Apr 1965", fatherName: "Pandi", address: "12, Palayamkottai Road, Tirunelveli, Tamil Nadu 627002", photo: null },
    citizen_padmavathi: { id: "citizen_padmavathi", name: "Padmavathi V.", role: "Citizen", portal: "citizen", initials: "PV", aadhaar: "XXXX XXXX 3344", phone: "+91 97820 55667", color: "#6a3a5e", gender: "Female", email: "padma.v@mail.com", dob: "25 Dec 1978", fatherName: "Venkatachalapathy", address: "19, Katpadi Road, Vellore, Tamil Nadu 632004", photo: null },
    citizen_venkataraman: { id: "citizen_venkataraman", name: "Venkataraman S.", role: "Citizen", portal: "citizen", initials: "VS", aadhaar: "XXXX XXXX 7744", phone: "+91 93811 66778", color: "#2a3e6e", gender: "Male", email: "venkat.s@mail.com", dob: "17 Jun 1972", fatherName: "Subramaniam", address: "45, Chengalpattu Main Road, Kancheepuram, Tamil Nadu 631502", photo: null },
    citizen_radhika: { id: "citizen_radhika", name: "Radhika T.", role: "Citizen", portal: "citizen", initials: "RT", aadhaar: "XXXX XXXX 9988", phone: "+91 91822 77889", color: "#6e2a2a", gender: "Female", email: "radhika.t@mail.com", dob: "02 Aug 1990", fatherName: "Thangavel", address: "3, GST Road, Chengalpattu, Tamil Nadu 603001", photo: null },
  };

  const tokens: Record<string, SlateToken> = {
    "TN-CGL-045-002-A": {
      ulpin: "TN-CGL-045-002-A",
      state: "active",
      identity: { surveyNo: "45/2A", subDivision: "A", tokenId: "SLT-0001-9F3C", parcelType: "Agricultural" },
      location: { district: "Chengalpattu", taluk: "Tambaram", village: "Thiruvanmiyur", gpsCentroid: "12.9831° N, 80.2594° E", geometryRef: "PG-45A-001" },
      ownership: { owners: [{ id: "citizen_ravi", name: "Ravi Kumar", share: 100 }], ownershipType: "Sole", acquisitionDate: "2026-06-12" },
      physical: { area: "1.00 acre", classification: "Agricultural - Dry", boundaries: "N: Survey 45/1, S: Village road, E: Survey 45/3, W: Canal", fmbRef: "FMB-TVM-45-1998" },
      encumbrance: { flag: false, lender: null, chargeAmount: 0, lienType: null, secondCharge: false },
      dispute: { flag: false, cnr: null, filingDate: null, status: "Clear" },
      financial: { guidanceValue: 5000000, lastSaleValue: 4800000, stampDutyRef: "SD-2026-001884", taxStatus: "Paid till 2026" },
      lifecycle: { lastOperation: "TRANSFER", lastEndorsers: ["Registration", "Revenue"], docHashes: ["a7b3c9e1f2..."], created: "2025-01-08" },
      history: [
        { ts: "2026-06-12 10:42", actor: "RegMutate (auto)", action: "TRANSFER executed - Muthu Selvam → Ravi Kumar", detail: "Mutation completed in same transaction. Patta updated automatically.", kind: "ok" },
        { ts: "2026-06-12 10:41", actor: "S. Lakshmi (Maker)", action: "Registration approved", detail: "Stamp duty ₹3,50,000 verified. All pre-checks clear.", kind: "ok" },
        { ts: "2026-06-12 10:38", actor: "System", action: "Pre-checks completed", detail: "Ownership verified · No encumbrance · No dispute · Stamp duty validated", kind: "ok" },
        { ts: "2026-06-12 10:30", actor: "Ravi Kumar (Citizen)", action: "Sale initiated", detail: "Buyer eKYC completed. Offer price ₹50,00,000 submitted.", kind: "info" },
        { ts: "2025-01-08 09:15", actor: "Registration Dept", action: "Token MINTED", detail: "Legacy import from Sub-Registrar Thiruvanmiyur records. Owner: Muthu Selvam.", kind: "info" },
      ],
    },
    "TN-CGL-045-002-B": {
      ulpin: "TN-CGL-045-002-B",
      state: "blocked",
      identity: { surveyNo: "78/4", subDivision: "-", tokenId: "SLT-0002-7A1D", parcelType: "Agricultural" },
      location: { district: "Chengalpattu", taluk: "Tambaram", village: "Thiruvanmiyur", gpsCentroid: "12.9790° N, 80.2550° E", geometryRef: "PG-78-004" },
      ownership: { owners: [{ id: "citizen_ravi", name: "Ravi Kumar", share: 100 }], ownershipType: "Sole", acquisitionDate: "2024-03-02" },
      physical: { area: "1.50 acre", classification: "Agricultural - Wet", boundaries: "N: Survey 78/3, S: Survey 78/5, E: River reserve, W: Village road", fmbRef: "FMB-TVM-78-2001" },
      encumbrance: { flag: true, lender: "State Bank of India · Adyar Branch", chargeAmount: 3000000, lienType: "Equitable Mortgage", secondCharge: false, since: "2026-06-10" },
      dispute: { flag: false, cnr: null, filingDate: null, status: "Clear" },
      financial: { guidanceValue: 7200000, lastSaleValue: 6900000, stampDutyRef: "SD-2024-000932", taxStatus: "Paid till 2026" },
      lifecycle: { lastOperation: "FLAG", lastEndorsers: ["Bank", "Registration"], docHashes: ["c91a4f02e8..."], created: "2024-03-02" },
      history: [
        { ts: "2026-06-10 14:05", actor: "EncumbranceGuard (auto)", action: "Token FLAGGED - Transfer Blocked", detail: "Equitable mortgage of ₹30,00,000 registered by SBI Adyar Branch. Visible to all banks instantly.", kind: "warn" },
        { ts: "2026-06-10 14:03", actor: "Priya Narayanan (SBI)", action: "Mortgage created", detail: "Loan officer submitted mortgage request after encumbrance search returned clean.", kind: "info" },
        { ts: "2026-06-10 13:58", actor: "Priya Narayanan (SBI)", action: "Encumbrance search", detail: "ULPIN searched - token was Active, no prior mortgage, no dispute.", kind: "info" },
        { ts: "2024-03-02 11:20", actor: "Registration Dept", action: "Token MINTED", detail: "Legacy import. Owner: Ravi Kumar.", kind: "info" },
      ],
    },
    "TN-CGL-067-014-C": {
      ulpin: "TN-CGL-067-014-C",
      state: "locked",
      identity: { surveyNo: "112/1", subDivision: "-", tokenId: "SLT-0003-4E9B", parcelType: "Agricultural" },
      location: { district: "Chengalpattu", taluk: "Tambaram", village: "Sholinganallur", gpsCentroid: "12.9010° N, 80.2279° E", geometryRef: "PG-112-001" },
      ownership: { owners: [{ id: "deceased", name: "Late Raman Pillai (deceased)", share: 100 }], ownershipType: "Sole (deceased)", acquisitionDate: "1998-07-19" },
      physical: { area: "2.00 acre", classification: "Agricultural - Dry", boundaries: "N: Survey 112/2, S: Canal reserve, E: Survey 113, W: Village road", fmbRef: "FMB-SHL-112-1998" },
      encumbrance: { flag: false, lender: null, chargeAmount: 0, lienType: null, secondCharge: false },
      dispute: { flag: false, cnr: null, filingDate: null, status: "Clear" },
      financial: { guidanceValue: 9000000, lastSaleValue: null, stampDutyRef: null, taxStatus: "Paid till 2025" },
      lifecycle: { lastOperation: "LOCK", lastEndorsers: ["InheritChain"], docHashes: ["e2b87d61aa...", "f4019cde55..."], created: "1998-07-19" },
      succession: {
        deceased: "Raman Pillai",
        deathCertNo: "DC-2026-008812",
        deathDate: "2026-06-08",
        law: "Hindu Succession Act, 1956 - Class I heirs",
        heirs: [
          { id: "citizen_ravi", name: "Ravi Kumar", relation: "Son", share: 50, consent: "pending" },
          { id: "citizen_kumar2", name: "Kumar Raman", relation: "Son", share: 50, consent: "pending" },
        ],
      },
      history: [
        { ts: "2026-06-15 09:00", actor: "InheritChain (auto)", action: "Token LOCKED", detail: "Death certificate DC-2026-008812 uploaded. All tokens of Raman Pillai locked instantly.", kind: "warn" },
        { ts: "2026-06-15 08:58", actor: "Ravi Kumar (Legal rep.)", action: "Death certificate uploaded", detail: "Submitted with heirship affidavit. Succession law selected: Hindu Succession Act, 1956.", kind: "info" },
        { ts: "1998-07-19 10:00", actor: "Registration Dept", action: "Token MINTED", detail: "Legacy import. Owner: Raman Pillai.", kind: "info" },
      ],
    },
    "TN-CGL-029-008-D": {
      ulpin: "TN-CGL-029-008-D",
      state: "disputed",
      identity: { surveyNo: "45/2", subDivision: "-", tokenId: "SLT-0004-2C7F", parcelType: "Agricultural" },
      location: { district: "Chengalpattu", taluk: "Tambaram", village: "Thiruvanmiyur", gpsCentroid: "12.9835° N, 80.2598° E", geometryRef: "PG-45-002" },
      ownership: { owners: [{ id: "citizen_ravi", name: "Ravi Kumar", share: 100 }], ownershipType: "Sole", acquisitionDate: "2023-11-04" },
      physical: { area: "0.80 acre", classification: "Agricultural - Dry", boundaries: "N: Survey 45/1, S: Survey 45/3 (disputed boundary), E: Village road, W: Canal", fmbRef: "FMB-TVM-45-1998" },
      encumbrance: { flag: false, lender: null, chargeAmount: 0, lienType: null, secondCharge: false },
      dispute: { flag: true, cnr: "CNR-TNCH02-2026-004471", filingDate: "2026-06-14", status: "Boundary dispute - frozen", court: "Civil Court, Chennai (e-Courts)", petitioner: "Neighbouring landowner - S. Ganesan" },
      financial: { guidanceValue: 4000000, lastSaleValue: 3850000, stampDutyRef: "SD-2023-007711", taxStatus: "Paid till 2026" },
      lifecycle: { lastOperation: "FLAG", lastEndorsers: ["Courts", "Revenue"], docHashes: ["9d4a11ef02..."], created: "2023-11-04" },
      history: [
        { ts: "2026-06-14 16:20", actor: "DisputeResolve (auto)", action: "Token DISPUTED - frozen", detail: "Court case CNR-TNCH02-2026-004471 filed by S. Ganesan. e-Courts oracle picked up filing automatically. All transactions refused.", kind: "danger" },
        { ts: "2026-06-14 16:18", actor: "e-Courts (oracle)", action: "Case reference received", detail: "Boundary dispute filed in Civil Court, Chennai.", kind: "info" },
        { ts: "2023-11-04 12:00", actor: "Registration Dept", action: "Token MINTED", detail: "Sale registered. Owner: Ravi Kumar.", kind: "info" },
      ],
    },
    "TN-CGL-091-021-E": {
      ulpin: "TN-CGL-091-021-E",
      state: "active",
      identity: { surveyNo: "201/3", subDivision: "-", tokenId: "SLT-0005-1B6A", parcelType: "Residential" },
      location: { district: "Chengalpattu", taluk: "Tambaram", village: "Sholinganallur", gpsCentroid: "12.8995° N, 80.2270° E", geometryRef: "PG-201-003" },
      ownership: { owners: [{ id: "citizen_anita", name: "Anita Kumar", share: 100 }], ownershipType: "Sole", acquisitionDate: "2025-02-18" },
      physical: { area: "0.25 acre", classification: "Residential", boundaries: "N: Plot 200, S: Street, E: Plot 202, W: Plot 199", fmbRef: "FMB-SHL-201-2010" },
      encumbrance: { flag: false, lender: null, chargeAmount: 0, lienType: null, secondCharge: false },
      dispute: { flag: false, cnr: null, filingDate: null, status: "Clear" },
      financial: { guidanceValue: 6500000, lastSaleValue: 0, stampDutyRef: "SD-2025-002217", taxStatus: "Paid till 2026" },
      lifecycle: { lastOperation: "TRANSFER (Gift)", lastEndorsers: ["Registration", "Revenue"], docHashes: ["77ac0bd1e4..."], created: "2025-02-18" },
      history: [
        { ts: "2025-02-18 11:05", actor: "RegMutate (auto)", action: "TRANSFER executed - Gift deed", detail: "Ravi Kumar gifted parcel to daughter Anita Kumar on marriage. Zero consideration. Mutation automatic.", kind: "ok" },
        { ts: "2025-02-18 10:50", actor: "S. Lakshmi (Maker)", action: "Gift deed approved", detail: "Stamp duty at gift rate ₹65,000 verified.", kind: "ok" },
      ],
    },
    "TN-CGL-112-003-F": {
      ulpin: "TN-CGL-112-003-F",
      state: "verified",
      identity: { surveyNo: "301/1", subDivision: "-", tokenId: "SLT-0006-9D3E", parcelType: "Agricultural" },
      location: { district: "Chengalpattu", taluk: "Tambaram", village: "Mambakkam", gpsCentroid: "12.8765° N, 80.1820° E", geometryRef: "PG-301-001" },
      ownership: { owners: [{ id: "citizen_muthu", name: "Muthu Selvam", share: 100 }], ownershipType: "Sole", acquisitionDate: "2010-05-30" },
      physical: { area: "3.20 acre", classification: "Agricultural - Dry", boundaries: "N: Survey 300, S: Survey 302, E: Highway reserve, W: Canal", fmbRef: "FMB-MBK-301-2005" },
      encumbrance: { flag: false, lender: null, chargeAmount: 0, lienType: null, secondCharge: false },
      dispute: { flag: false, cnr: null, filingDate: null, status: "Clear" },
      financial: { guidanceValue: 12000000, lastSaleValue: null, stampDutyRef: null, taxStatus: "Paid till 2026" },
      lifecycle: { lastOperation: "verify", lastEndorsers: ["Registration"], docHashes: ["3fbe0c98a1..."], created: "2026-06-18" },
      history: [
        { ts: "2026-06-18 15:40", actor: "S. Lakshmi (Maker)", action: "Verified", detail: "Field data cross-checked against legacy Patta record. Awaiting activation.", kind: "ok" },
        { ts: "2026-06-18 15:10", actor: "Registration Dept", action: "Token MINTED (Draft)", detail: "Legacy import from Sub-Registrar Tambaram records.", kind: "info" },
      ],
    },
    "TN-CGL-058-019-G": {
      ulpin: "TN-CGL-058-019-G",
      state: "draft",
      identity: { surveyNo: "88/2", subDivision: "-", tokenId: "SLT-0007-6F2C", parcelType: "Agricultural" },
      location: { district: "Chengalpattu", taluk: "Tambaram", village: "Thiruvanmiyur", gpsCentroid: "12.9850° N, 80.2610° E", geometryRef: "PG-88-002" },
      ownership: { owners: [{ id: "citizen_kumar2", name: "Kumar Raman", share: 100 }], ownershipType: "Sole", acquisitionDate: "2012-09-09" },
      physical: { area: "1.10 acre", classification: "Agricultural - Dry", boundaries: "N: Survey 88/1, S: Survey 88/3, E: Canal, W: Village road", fmbRef: "FMB-TVM-88-2003" },
      encumbrance: { flag: false, lender: null, chargeAmount: 0, lienType: null, secondCharge: false },
      dispute: { flag: false, cnr: null, filingDate: null, status: "Clear" },
      financial: { guidanceValue: 4400000, lastSaleValue: null, stampDutyRef: null, taxStatus: "Paid till 2025" },
      lifecycle: { lastOperation: "MINT", lastEndorsers: ["Registration"], docHashes: [], created: "2026-06-19" },
      history: [
        { ts: "2026-06-19 10:00", actor: "Registration Dept", action: "Token MINTED (Draft)", detail: "Legacy import seeded for demo. Pending field verification.", kind: "info" },
      ],
    },
    "TN-CGL-076-033-H": {
      ulpin: "TN-CGL-076-033-H",
      state: "retired",
      identity: { surveyNo: "19/1", subDivision: "-", tokenId: "SLT-0008-8A4D", parcelType: "Agricultural" },
      location: { district: "Chengalpattu", taluk: "Tambaram", village: "Sholinganallur", gpsCentroid: "12.9020° N, 80.2300° E", geometryRef: "PG-19-001" },
      ownership: { owners: [{ id: "gov", name: "District Collectorate (acquired)", share: 100 }], ownershipType: "Government", acquisitionDate: "2026-05-02" },
      physical: { area: "4.00 acre", classification: "Agricultural - converted (Highway)", boundaries: "N: Highway corridor, S: Survey 20, E: Survey 18, W: Village road", fmbRef: "FMB-SHL-19-1999" },
      encumbrance: { flag: false, lender: null, chargeAmount: 0, lienType: null, secondCharge: false },
      dispute: { flag: false, cnr: null, filingDate: null, status: "Resolved - acquired" },
      financial: { guidanceValue: 16000000, lastSaleValue: 16000000, stampDutyRef: null, taxStatus: "N/A - Government" },
      lifecycle: { lastOperation: "RETIRE", lastEndorsers: ["Courts", "Revenue"], docHashes: ["b62af910cc..."], created: "2018-02-11" },
      history: [
        { ts: "2026-05-02 09:30", actor: "DisputeResolve (auto)", action: "Token RETIRED", detail: "Government acquisition order executed. Compensation ₹1,60,00,000 released to prior owner.", kind: "ok" },
        { ts: "2026-04-20 11:00", actor: "Court/Admin", action: "Acquisition order entered", detail: "RFCTLARR Act acquisition for highway project, Section 11 notification.", kind: "warn" },
      ],
    },
    "TN-CGL-211-004-A": {
      ulpin: "TN-CGL-211-004-A",
      state: "active",
      identity: { surveyNo: "211/4", subDivision: "-", tokenId: "SLT-0009-3B7E", parcelType: "Agricultural" },
      location: { district: "Chengalpattu", taluk: "Sriperumbudur", village: "Sriperumbudur Town", gpsCentroid: "12.9620° N, 79.9530° E", geometryRef: "PG-211-004" },
      ownership: { owners: [{ id: "citizen_muthu", name: "Muthu Selvam", share: 100 }], ownershipType: "Sole", acquisitionDate: "2019-06-21" },
      physical: { area: "1.40 acre", classification: "Agricultural - Dry", boundaries: "N: Survey 211/3, S: Survey 211/5, E: Highway service road, W: Canal", fmbRef: "FMB-SPM-211-2008" },
      encumbrance: { flag: false, lender: null, chargeAmount: 0, lienType: null, secondCharge: false },
      dispute: { flag: false, cnr: null, filingDate: null, status: "Clear" },
      financial: { guidanceValue: 5800000, lastSaleValue: null, stampDutyRef: null, taxStatus: "Paid till 2026" },
      lifecycle: { lastOperation: "MINT", lastEndorsers: ["Registration"], docHashes: [], created: "2019-06-21" },
      history: [
        { ts: "2019-06-21 10:00", actor: "Registration Dept", action: "Token MINTED", detail: "Legacy import from Sub-Registrar Sriperumbudur records. Owner: Muthu Selvam.", kind: "info" },
      ],
    },
    "TN-CGL-088-027-J": {
      ulpin: "TN-CGL-088-027-J",
      state: "active",
      identity: { surveyNo: "88/2A", subDivision: "Partitioned - 2 shares", tokenId: "SLT-0010-7C2A", parcelType: "Agricultural" },
      location: { district: "Chengalpattu", taluk: "Tambaram", village: "Mambakkam", gpsCentroid: "12.8760° N, 80.1825° E", geometryRef: "PG-88-027" },
      ownership: { owners: [{ id: "citizen_anita", name: "Anita Kumar", share: 50 }, { id: "citizen_kumar2", name: "Kumar Raman", share: 50 }], ownershipType: "Joint (post-succession)", acquisitionDate: "2026-06-21" },
      physical: { area: "1.60 acre", classification: "Agricultural - Dry", boundaries: "N: Survey 88/1, S: Survey 88/3, E: Canal, W: Village road", fmbRef: "FMB-MBK-88-2001" },
      encumbrance: { flag: false, lender: null, chargeAmount: 0, lienType: null, secondCharge: false },
      dispute: { flag: false, cnr: null, filingDate: null, status: "Clear" },
      financial: { guidanceValue: 6200000, lastSaleValue: null, stampDutyRef: null, taxStatus: "Paid till 2026" },
      lifecycle: { lastOperation: "TRANSFER (succession)", lastEndorsers: ["Registration", "Revenue"], docHashes: ["a91cfe002b..."], created: "2015-03-12" },
      surveyPending: true,
      history: [
        { ts: "2026-06-21 09:15", actor: "Surveyor (pending)", action: "Survey verification required", detail: "Land shared between heirs. A Surveyor must visit the site and record the verified GPS lat/long before the record is finalised.", kind: "warn" },
        { ts: "2026-06-21 09:10", actor: "InheritChain (auto)", action: "TRANSFER executed - succession complete", detail: "All heirs consented. Token unlocked and reassigned per computed shares.", kind: "ok" },
        { ts: "2026-06-20 09:00", actor: "Registration Dept", action: "Token MINTED", detail: "Legacy import. Owner: late B. Selvaraj.", kind: "info" },
      ],
    },
    // ── EC demo tokens ────────────────────────────────────────────────────────
    // Token 1: Kumbakonam - ICICI mortgage CLEARED → EC PASS
    "TN-TJV-108-001-A": {
      ulpin: "TN-TJV-108-001-A",
      state: "active",
      identity: { surveyNo: "2298/37, 2710/2B", subDivision: "-", tokenId: "SLT-EC01-A1B2", parcelType: "House and Site" },
      location: { district: "Thanjavur", taluk: "Kumbakonam", village: "Ward 6 – Sri Nagar Colony", gpsCentroid: "10.9617° N, 79.3845° E", geometryRef: "PG-2298-37" },
      ownership: { owners: [{ id: "citizen_subashini", name: "Subashini D.", share: 100 }], ownershipType: "Sole", acquisitionDate: "2021-03-15" },
      physical: { area: "323 Sq.mt (3476 Sq.ft)", classification: "Residential - House and Site", boundaries: "E: K.R.Rajalakshmi residence, W: Amaldhas residence, N: Pugazhmurugan residence, S: Sri Nagar Colony Main Road", fmbRef: "FMB-KBM-2298-2005" },
      encumbrance: { flag: false, lender: null, chargeAmount: 0, lienType: null, secondCharge: false },
      dispute: { flag: false, cnr: null, filingDate: null, status: "Clear" },
      financial: { guidanceValue: 5000000, lastSaleValue: null, stampDutyRef: "SD-2021-PR5791-2021", taxStatus: "Paid till 2026" },
      lifecycle: { lastOperation: "MINT", lastEndorsers: ["Registration"], docHashes: [], created: "2021-03-15" },
      ecData: {
        searchPeriod: { from: "27-Oct-2025", to: "30-Jun-2026" },
        sro: "1 Eṇ Iṇai Cārpativāḷar Kumbakonam",
        entries: [
          {
            srNo: 1, docNo: "6260", docYear: 2025,
            executionDate: "05-Nov-2025", registrationDate: "05-Nov-2025",
            nature: "Title Deed Deposit (Mortgage)",
            executant: "Subashini D.", claimant: "ICICI Bank Ltd., Kumbakonam Main Branch",
            marketValue: 5000000, considerationValue: 0,
            prNumber: "5791/2021", surveyNo: "2298/37; 2710/2B", extent: "323 Sq.mt",
            bankBranch: "ICICI Bank Ltd., Kumbakonam Main Branch",
            status: "released", releaseDocNo: "3283/2026", releaseDate: "29-Jun-2026",
          },
        ],
      } as EcData,
      history: [
        { ts: "2026-06-29 14:00", actor: "ICICI Bank (auto)", action: "Mortgage RELEASED", detail: "Loan fully repaid. Title deed returned to owner Subashini D. Doc 3283/2026.", kind: "ok" },
        { ts: "2025-11-05 10:00", actor: "Registration Dept", action: "Mortgage registered", detail: "ICICI Bank Ltd. - Title deed deposit. Market value ₹50,00,000. Doc 6260/2025.", kind: "warn" },
        { ts: "2021-03-15 09:00", actor: "Registration Dept", action: "Token MINTED", detail: "Legacy import. PR: 5791/2021.", kind: "info" },
      ],
    },
    // Token 2: Ayyalur - Indian Bank mortgage ACTIVE → EC FAIL
    "TN-DNL-609-002-B": {
      ulpin: "TN-DNL-609-002-B",
      state: "blocked",
      identity: { surveyNo: "609/4A2", subDivision: "-", tokenId: "SLT-EC02-C3D4", parcelType: "House and Site" },
      location: { district: "Dindigul", taluk: "Vedasandur", village: "Ayyalur", gpsCentroid: "10.6521° N, 77.9844° E", geometryRef: "PG-609-4A2" },
      ownership: { owners: [{ id: "citizen_arjun", name: "Arjun Sakthivel", share: 100 }], ownershipType: "Sole", acquisitionDate: "2018-10-23" },
      physical: { area: "2178 Sq.ft (1323 Sq.ft built-up)", classification: "Residential - House and Site", boundaries: "E: 18 ft open road, W: Metkke road, N: North-East road, S: Sakthivel's land", fmbRef: "FMB-VSN-609-2002" },
      encumbrance: { flag: true, lender: "Indian Bank, Ayyalur Branch", chargeAmount: 900000, lienType: "Equitable Mortgage", secondCharge: false, since: "2018-10-23" },
      dispute: { flag: false, cnr: null, filingDate: null, status: "Clear" },
      financial: { guidanceValue: 900000, lastSaleValue: null, stampDutyRef: "SD-2018-PR325-2002", taxStatus: "Paid till 2026" },
      lifecycle: { lastOperation: "FLAG", lastEndorsers: ["Bank", "Registration"], docHashes: [], created: "2018-10-23" },
      ecData: {
        searchPeriod: { from: "01-Oct-2018", to: "05-Jul-2026" },
        sro: "O Sub-Registrar Office, Vadamaturai",
        entries: [
          {
            srNo: 1, docNo: "4099", docYear: 2018,
            executionDate: "22-Oct-2018", registrationDate: "23-Oct-2018",
            nature: "Title Deed Deposit (Mortgage)",
            executant: "Arjun Sakthivel", claimant: "Indian Bank, Ayyalur Branch",
            marketValue: 900000, considerationValue: 0,
            prNumber: "325/2002", surveyNo: "609/4A2", extent: "2178 Sq.ft",
            bankBranch: "Indian Bank, Ayyalur Branch",
            status: "active",
          },
        ],
      } as EcData,
      history: [
        { ts: "2018-10-23 11:00", actor: "EncumbranceGuard (auto)", action: "Token FLAGGED - Transfer Blocked", detail: "Equitable mortgage of ₹9,00,000 registered by Indian Bank, Ayyalur Branch. Doc 4099/2018.", kind: "warn" },
        { ts: "2018-10-23 10:30", actor: "Indian Bank", action: "Mortgage registered", detail: "Title deed deposit. Market value ₹9,00,000. Survey 609/4A2.", kind: "info" },
      ],
    },
    // Token 3: Madurai - Axis Bank mortgage ACTIVE → EC FAIL
    "TN-MDU-412-003-C": {
      ulpin: "TN-MDU-412-003-C",
      state: "blocked",
      identity: { surveyNo: "412/3B", subDivision: "-", tokenId: "SLT-EC03-E5F6", parcelType: "Residential Plot" },
      location: { district: "Madurai", taluk: "Madurai West", village: "Anna Nagar", gpsCentroid: "9.9252° N, 78.1198° E", geometryRef: "PG-412-3B" },
      ownership: { owners: [{ id: "citizen_priyanka", name: "Priyanka Murugan", share: 100 }], ownershipType: "Sole", acquisitionDate: "2022-04-10" },
      physical: { area: "1200 Sq.ft", classification: "Residential Plot", boundaries: "N: Plot 21, S: 30ft Road, E: Plot 23, W: Canal", fmbRef: "FMB-MDU-412-2010" },
      encumbrance: { flag: true, lender: "Axis Bank Ltd., Madurai Branch", chargeAmount: 2500000, lienType: "Equitable Mortgage", secondCharge: false, since: "2024-06-01" },
      dispute: { flag: false, cnr: null, filingDate: null, status: "Clear" },
      financial: { guidanceValue: 3200000, lastSaleValue: 2800000, stampDutyRef: "SD-2022-007821", taxStatus: "Paid till 2026" },
      lifecycle: { lastOperation: "FLAG", lastEndorsers: ["Bank", "Registration"], docHashes: [], created: "2022-04-10" },
      ecData: {
        searchPeriod: { from: "01-Apr-2022", to: "05-Jul-2026" },
        sro: "Sub-Registrar Office, Madurai West",
        entries: [
          {
            srNo: 1, docNo: "2891", docYear: 2024,
            executionDate: "01-Jun-2024", registrationDate: "01-Jun-2024",
            nature: "Title Deed Deposit (Mortgage)",
            executant: "Priyanka Murugan", claimant: "Axis Bank Ltd., Madurai Branch",
            marketValue: 3200000, considerationValue: 0,
            prNumber: "7821/2022", surveyNo: "412/3B", extent: "1200 Sq.ft",
            bankBranch: "Axis Bank Ltd., Madurai Anna Nagar Branch",
            status: "active",
          },
        ],
      } as EcData,
      history: [
        { ts: "2024-06-01 12:00", actor: "EncumbranceGuard (auto)", action: "Token FLAGGED - Transfer Blocked", detail: "Axis Bank mortgage ₹25,00,000 registered. Doc 2891/2024.", kind: "warn" },
        { ts: "2022-04-10 10:00", actor: "Registration Dept", action: "Token MINTED", detail: "Sale deed registered. Owner: Priyanka Murugan.", kind: "info" },
      ],
    },
    // Token 4: Coimbatore - No mortgage → EC CLEAR
    "TN-CBE-221-004-D": {
      ulpin: "TN-CBE-221-004-D",
      state: "active",
      identity: { surveyNo: "221/2A", subDivision: "-", tokenId: "SLT-EC04-G7H8", parcelType: "Residential Plot" },
      location: { district: "Coimbatore", taluk: "Coimbatore North", village: "Gandhipuram", gpsCentroid: "11.0168° N, 76.9558° E", geometryRef: "PG-221-2A" },
      ownership: { owners: [{ id: "citizen_karthik", name: "Karthikeyan R.", share: 100 }], ownershipType: "Sole", acquisitionDate: "2020-08-22" },
      physical: { area: "2400 Sq.ft", classification: "Residential - Plot", boundaries: "N: Survey 221/1, S: 40ft Road, E: Survey 222, W: Canal reserve", fmbRef: "FMB-CBE-221-2008" },
      encumbrance: { flag: false, lender: null, chargeAmount: 0, lienType: null, secondCharge: false },
      dispute: { flag: false, cnr: null, filingDate: null, status: "Clear" },
      financial: { guidanceValue: 4800000, lastSaleValue: 4200000, stampDutyRef: "SD-2020-003344", taxStatus: "Paid till 2026" },
      lifecycle: { lastOperation: "MINT", lastEndorsers: ["Registration"], docHashes: [], created: "2020-08-22" },
      ecData: {
        searchPeriod: { from: "01-Aug-2020", to: "05-Jul-2026" },
        sro: "Sub-Registrar Office, Coimbatore North",
        entries: [],
      } as EcData,
      history: [
        { ts: "2020-08-22 10:00", actor: "Registration Dept", action: "Token MINTED", detail: "Sale deed registered. Owner: Karthikeyan R. No encumbrances on record.", kind: "info" },
      ],
    },
    // Token 5: Salem - SBI cleared + HDFC active → EC FAIL
    "TN-SLM-133-005-E": {
      ulpin: "TN-SLM-133-005-E",
      state: "blocked",
      identity: { surveyNo: "133/4", subDivision: "-", tokenId: "SLT-EC05-I9J0", parcelType: "Agricultural Land" },
      location: { district: "Salem", taluk: "Salem West", village: "Fairlands", gpsCentroid: "11.6643° N, 78.1460° E", geometryRef: "PG-133-4" },
      ownership: { owners: [{ id: "citizen_selvamraja", name: "Selvam Raja", share: 100 }], ownershipType: "Sole", acquisitionDate: "2015-03-01" },
      physical: { area: "1.80 Acre", classification: "Agricultural - Dry", boundaries: "N: Survey 133/3, S: Survey 133/5, E: River reserve, W: Main road", fmbRef: "FMB-SLM-133-2009" },
      encumbrance: { flag: true, lender: "HDFC Bank Ltd., Salem Branch", chargeAmount: 3500000, lienType: "Equitable Mortgage", secondCharge: false, since: "2025-02-15" },
      dispute: { flag: false, cnr: null, filingDate: null, status: "Clear" },
      financial: { guidanceValue: 5400000, lastSaleValue: null, stampDutyRef: "SD-2015-001122", taxStatus: "Paid till 2026" },
      lifecycle: { lastOperation: "FLAG", lastEndorsers: ["Bank", "Registration"], docHashes: [], created: "2015-03-01" },
      ecData: {
        searchPeriod: { from: "01-Mar-2015", to: "05-Jul-2026" },
        sro: "Sub-Registrar Office, Salem West",
        entries: [
          {
            srNo: 1, docNo: "1122", docYear: 2019,
            executionDate: "10-Apr-2019", registrationDate: "10-Apr-2019",
            nature: "Title Deed Deposit (Mortgage)",
            executant: "Selvam Raja", claimant: "State Bank of India, Salem Branch",
            marketValue: 4000000, considerationValue: 0,
            prNumber: "1122/2015", surveyNo: "133/4", extent: "1.80 Acre",
            bankBranch: "SBI Salem West Branch",
            status: "released", releaseDocNo: "2241/2024", releaseDate: "20-Jan-2024",
          },
          {
            srNo: 2, docNo: "3319", docYear: 2025,
            executionDate: "15-Feb-2025", registrationDate: "15-Feb-2025",
            nature: "Title Deed Deposit (Mortgage)",
            executant: "Selvam Raja", claimant: "HDFC Bank Ltd., Salem Branch",
            marketValue: 5400000, considerationValue: 0,
            prNumber: "1122/2015", surveyNo: "133/4", extent: "1.80 Acre",
            bankBranch: "HDFC Bank Ltd., Salem Branch",
            status: "active",
          },
        ],
      } as EcData,
      history: [
        { ts: "2025-02-15 11:00", actor: "EncumbranceGuard (auto)", action: "Token FLAGGED - Transfer Blocked", detail: "HDFC Bank mortgage ₹35,00,000 registered. Doc 3319/2025.", kind: "warn" },
        { ts: "2024-01-20 10:00", actor: "EncumbranceGuard (auto)", action: "Mortgage RELEASED", detail: "SBI loan fully repaid. Token unblocked. Doc 2241/2024.", kind: "ok" },
        { ts: "2019-04-10 09:30", actor: "Registration Dept", action: "Mortgage registered", detail: "SBI Salem - Title deed deposit. Market value ₹40,00,000.", kind: "warn" },
        { ts: "2015-03-01 10:00", actor: "Registration Dept", action: "Token MINTED", detail: "Legacy import. Owner: Selvam Raja.", kind: "info" },
      ],
    },
    // Token 6: Trichy - Canara Bank cleared → EC PASS
    "TN-TRY-341-006-F": {
      ulpin: "TN-TRY-341-006-F",
      state: "active",
      identity: { surveyNo: "341/7", subDivision: "-", tokenId: "SLT-EC06-K1L2", parcelType: "Residential Plot" },
      location: { district: "Tiruchirappalli", taluk: "Trichy West", village: "Cantonment", gpsCentroid: "10.7905° N, 78.7047° E", geometryRef: "PG-341-7" },
      ownership: { owners: [{ id: "citizen_kavitha", name: "Kavitha Nair", share: 100 }], ownershipType: "Sole", acquisitionDate: "2018-06-14" },
      physical: { area: "1800 Sq.ft", classification: "Residential Plot", boundaries: "N: Plot 6, S: 30ft Road, E: Plot 8, W: Plot 5", fmbRef: "FMB-TRY-341-2006" },
      encumbrance: { flag: false, lender: null, chargeAmount: 0, lienType: null, secondCharge: false },
      dispute: { flag: false, cnr: null, filingDate: null, status: "Clear" },
      financial: { guidanceValue: 2800000, lastSaleValue: 2500000, stampDutyRef: "SD-2018-004455", taxStatus: "Paid till 2026" },
      lifecycle: { lastOperation: "MINT", lastEndorsers: ["Registration"], docHashes: [], created: "2018-06-14" },
      ecData: {
        searchPeriod: { from: "01-Jun-2018", to: "05-Jul-2026" },
        sro: "Sub-Registrar Office, Trichy West",
        entries: [
          {
            srNo: 1, docNo: "2201", docYear: 2020,
            executionDate: "12-Mar-2020", registrationDate: "12-Mar-2020",
            nature: "Title Deed Deposit (Mortgage)",
            executant: "Kavitha Nair", claimant: "Canara Bank, Trichy Branch",
            marketValue: 2800000, considerationValue: 0,
            prNumber: "4455/2018", surveyNo: "341/7", extent: "1800 Sq.ft",
            bankBranch: "Canara Bank, Cantonment Branch, Trichy",
            status: "released", releaseDocNo: "1089/2025", releaseDate: "05-Mar-2025",
          },
        ],
      } as EcData,
      history: [
        { ts: "2025-03-05 10:00", actor: "EncumbranceGuard (auto)", action: "Mortgage RELEASED", detail: "Canara Bank loan fully repaid. Token unblocked. Doc 1089/2025.", kind: "ok" },
        { ts: "2020-03-12 09:00", actor: "Registration Dept", action: "Mortgage registered", detail: "Canara Bank - Title deed deposit. Doc 2201/2020.", kind: "warn" },
        { ts: "2018-06-14 10:00", actor: "Registration Dept", action: "Token MINTED", detail: "Sale deed registered. Owner: Kavitha Nair.", kind: "info" },
      ],
    },
    // Token 7: Tirunelveli - No mortgage, fully clear
    "TN-TNV-752-007-G": {
      ulpin: "TN-TNV-752-007-G",
      state: "active",
      identity: { surveyNo: "752/1C", subDivision: "-", tokenId: "SLT-EC07-M3N4", parcelType: "Agricultural Land" },
      location: { district: "Tirunelveli", taluk: "Palayamkottai", village: "Palayamkottai Road", gpsCentroid: "8.7139° N, 77.7567° E", geometryRef: "PG-752-1C" },
      ownership: { owners: [{ id: "citizen_muruganantham", name: "Muruganantham P.", share: 100 }], ownershipType: "Sole", acquisitionDate: "2012-01-20" },
      physical: { area: "2.50 Acre", classification: "Agricultural - Wet", boundaries: "N: Survey 752/1B, S: Survey 752/2, E: Canal, W: Main road", fmbRef: "FMB-TNV-752-2003" },
      encumbrance: { flag: false, lender: null, chargeAmount: 0, lienType: null, secondCharge: false },
      dispute: { flag: false, cnr: null, filingDate: null, status: "Clear" },
      financial: { guidanceValue: 3500000, lastSaleValue: null, stampDutyRef: "SD-2012-000778", taxStatus: "Paid till 2026" },
      lifecycle: { lastOperation: "MINT", lastEndorsers: ["Registration"], docHashes: [], created: "2012-01-20" },
      ecData: {
        searchPeriod: { from: "01-Jan-2012", to: "05-Jul-2026" },
        sro: "Sub-Registrar Office, Palayamkottai",
        entries: [],
      } as EcData,
      history: [
        { ts: "2012-01-20 10:00", actor: "Registration Dept", action: "Token MINTED", detail: "Legacy import. Owner: Muruganantham P. No encumbrances.", kind: "info" },
      ],
    },
    // Token 8: Vellore - Multiple cleared mortgages → EC PASS
    "TN-VLR-863-008-H": {
      ulpin: "TN-VLR-863-008-H",
      state: "active",
      identity: { surveyNo: "863/2", subDivision: "-", tokenId: "SLT-EC08-O5P6", parcelType: "Residential Plot" },
      location: { district: "Vellore", taluk: "Vellore", village: "Katpadi Road", gpsCentroid: "12.9165° N, 79.1325° E", geometryRef: "PG-863-2" },
      ownership: { owners: [{ id: "citizen_padmavathi", name: "Padmavathi V.", share: 100 }], ownershipType: "Sole", acquisitionDate: "2010-09-05" },
      physical: { area: "3600 Sq.ft", classification: "Residential - Plot", boundaries: "N: Survey 863/1, S: 40ft Road, E: Survey 864, W: Survey 862", fmbRef: "FMB-VLR-863-2005" },
      encumbrance: { flag: false, lender: null, chargeAmount: 0, lienType: null, secondCharge: false },
      dispute: { flag: false, cnr: null, filingDate: null, status: "Clear" },
      financial: { guidanceValue: 5600000, lastSaleValue: 4800000, stampDutyRef: "SD-2010-002341", taxStatus: "Paid till 2026" },
      lifecycle: { lastOperation: "MINT", lastEndorsers: ["Registration"], docHashes: [], created: "2010-09-05" },
      ecData: {
        searchPeriod: { from: "01-Sep-2010", to: "05-Jul-2026" },
        sro: "Sub-Registrar Office, Vellore",
        entries: [
          {
            srNo: 1, docNo: "1890", docYear: 2013,
            executionDate: "08-Jun-2013", registrationDate: "08-Jun-2013",
            nature: "Title Deed Deposit (Mortgage)",
            executant: "Padmavathi V.", claimant: "Indian Overseas Bank, Vellore Branch",
            marketValue: 3800000, considerationValue: 0,
            prNumber: "2341/2010", surveyNo: "863/2", extent: "3600 Sq.ft",
            bankBranch: "IOB, Vellore Main Branch",
            status: "released", releaseDocNo: "3310/2018", releaseDate: "15-Aug-2018",
          },
          {
            srNo: 2, docNo: "4122", docYear: 2019,
            executionDate: "22-Oct-2019", registrationDate: "22-Oct-2019",
            nature: "Title Deed Deposit (Mortgage)",
            executant: "Padmavathi V.", claimant: "Punjab National Bank, Vellore Branch",
            marketValue: 5000000, considerationValue: 0,
            prNumber: "2341/2010", surveyNo: "863/2", extent: "3600 Sq.ft",
            bankBranch: "PNB, Katpadi Road Branch, Vellore",
            status: "released", releaseDocNo: "1092/2023", releaseDate: "10-Feb-2023",
          },
        ],
      } as EcData,
      history: [
        { ts: "2023-02-10 10:00", actor: "EncumbranceGuard (auto)", action: "Mortgage RELEASED", detail: "PNB loan cleared. Doc 1092/2023.", kind: "ok" },
        { ts: "2019-10-22 09:00", actor: "Registration Dept", action: "Mortgage registered", detail: "PNB - Title deed deposit. Doc 4122/2019.", kind: "warn" },
        { ts: "2018-08-15 10:00", actor: "EncumbranceGuard (auto)", action: "Mortgage RELEASED", detail: "IOB loan cleared. Doc 3310/2018.", kind: "ok" },
        { ts: "2013-06-08 09:00", actor: "Registration Dept", action: "Mortgage registered", detail: "IOB - Title deed deposit. Doc 1890/2013.", kind: "warn" },
        { ts: "2010-09-05 10:00", actor: "Registration Dept", action: "Token MINTED", detail: "Legacy import. Owner: Padmavathi V.", kind: "info" },
      ],
    },
    // Token 9: Kancheepuram - HDFC active → EC FAIL
    "TN-KCP-974-009-I": {
      ulpin: "TN-KCP-974-009-I",
      state: "blocked",
      identity: { surveyNo: "974/3", subDivision: "-", tokenId: "SLT-EC09-Q7R8", parcelType: "House and Site" },
      location: { district: "Kancheepuram", taluk: "Kancheepuram", village: "Chengalpattu Main Road", gpsCentroid: "12.8342° N, 79.7036° E", geometryRef: "PG-974-3" },
      ownership: { owners: [{ id: "citizen_venkataraman", name: "Venkataraman S.", share: 100 }], ownershipType: "Sole", acquisitionDate: "2017-11-30" },
      physical: { area: "2000 Sq.ft", classification: "Residential - House and Site", boundaries: "N: Survey 974/2, S: Main Road, E: Survey 975, W: Survey 973", fmbRef: "FMB-KCP-974-2008" },
      encumbrance: { flag: true, lender: "HDFC Bank Ltd., Kancheepuram Branch", chargeAmount: 4000000, lienType: "Equitable Mortgage", secondCharge: false, since: "2023-08-10" },
      dispute: { flag: false, cnr: null, filingDate: null, status: "Clear" },
      financial: { guidanceValue: 5200000, lastSaleValue: 4600000, stampDutyRef: "SD-2017-006612", taxStatus: "Paid till 2026" },
      lifecycle: { lastOperation: "FLAG", lastEndorsers: ["Bank", "Registration"], docHashes: [], created: "2017-11-30" },
      ecData: {
        searchPeriod: { from: "01-Nov-2017", to: "05-Jul-2026" },
        sro: "Sub-Registrar Office, Kancheepuram",
        entries: [
          {
            srNo: 1, docNo: "3841", docYear: 2023,
            executionDate: "10-Aug-2023", registrationDate: "10-Aug-2023",
            nature: "Title Deed Deposit (Mortgage)",
            executant: "Venkataraman S.", claimant: "HDFC Bank Ltd., Kancheepuram Branch",
            marketValue: 5200000, considerationValue: 0,
            prNumber: "6612/2017", surveyNo: "974/3", extent: "2000 Sq.ft",
            bankBranch: "HDFC Bank Ltd., Kancheepuram Main Branch",
            status: "active",
          },
        ],
      } as EcData,
      history: [
        { ts: "2023-08-10 12:00", actor: "EncumbranceGuard (auto)", action: "Token FLAGGED - Transfer Blocked", detail: "HDFC Bank mortgage ₹40,00,000 registered. Doc 3841/2023.", kind: "warn" },
        { ts: "2017-11-30 10:00", actor: "Registration Dept", action: "Token MINTED", detail: "Sale deed registered. Owner: Venkataraman S.", kind: "info" },
      ],
    },
    // Token 10: Chengalpattu - IOB active → EC FAIL
    "TN-CGL-085-010-J": {
      ulpin: "TN-CGL-085-010-J",
      state: "blocked",
      identity: { surveyNo: "85/6", subDivision: "-", tokenId: "SLT-EC10-S9T0", parcelType: "Agricultural Land" },
      location: { district: "Chengalpattu", taluk: "Chengalpattu", village: "GST Road", gpsCentroid: "12.6921° N, 79.9765° E", geometryRef: "PG-85-6" },
      ownership: { owners: [{ id: "citizen_radhika", name: "Radhika T.", share: 100 }], ownershipType: "Sole", acquisitionDate: "2016-07-18" },
      physical: { area: "1.20 Acre", classification: "Agricultural - Dry", boundaries: "N: Survey 85/5, S: Survey 86, E: Highway, W: Canal", fmbRef: "FMB-CGL-85-2007" },
      encumbrance: { flag: true, lender: "Indian Overseas Bank, Chengalpattu Branch", chargeAmount: 1800000, lienType: "Equitable Mortgage", secondCharge: false, since: "2022-03-20" },
      dispute: { flag: false, cnr: null, filingDate: null, status: "Clear" },
      financial: { guidanceValue: 2400000, lastSaleValue: null, stampDutyRef: "SD-2016-003311", taxStatus: "Paid till 2025" },
      lifecycle: { lastOperation: "FLAG", lastEndorsers: ["Bank", "Registration"], docHashes: [], created: "2016-07-18" },
      ecData: {
        searchPeriod: { from: "01-Jul-2016", to: "05-Jul-2026" },
        sro: "Sub-Registrar Office, Chengalpattu",
        entries: [
          {
            srNo: 1, docNo: "1540", docYear: 2022,
            executionDate: "20-Mar-2022", registrationDate: "20-Mar-2022",
            nature: "Title Deed Deposit (Mortgage)",
            executant: "Radhika T.", claimant: "Indian Overseas Bank, Chengalpattu Branch",
            marketValue: 2400000, considerationValue: 0,
            prNumber: "3311/2016", surveyNo: "85/6", extent: "1.20 Acre",
            bankBranch: "Indian Overseas Bank, Chengalpattu Branch",
            status: "active",
          },
        ],
      } as EcData,
      history: [
        { ts: "2022-03-20 11:30", actor: "EncumbranceGuard (auto)", action: "Token FLAGGED - Transfer Blocked", detail: "IOB mortgage ₹18,00,000 registered. Doc 1540/2022.", kind: "warn" },
        { ts: "2016-07-18 10:00", actor: "Registration Dept", action: "Token MINTED", detail: "Legacy import. Owner: Radhika T.", kind: "info" },
      ],
    },
    "TN-CGL-058-019-K": {
      ulpin: "TN-CGL-058-019-K",
      state: "active",
      identity: { surveyNo: "88/2", subDivision: "Block C, 4th Floor, Flat 402", tokenId: "SLT-0011-5E1F", parcelType: "Apartment / Flat" },
      location: { district: "Chengalpattu", taluk: "Tambaram", village: "Thiruvanmiyur", gpsCentroid: "12.9842° N, 80.2601° E", geometryRef: "PG-88-002-C402" },
      ownership: { owners: [{ id: "citizen_ravi", name: "Ravi Kumar", share: 100 }], ownershipType: "Sole", acquisitionDate: "2021-08-14" },
      physical: { area: "1150 sq.ft (carpet)", classification: "Residential - Apartment", boundaries: "Within Lakeview Apartments, Block C, Survey 88/2", fmbRef: "FMB-TVM-88-2003" },
      encumbrance: { flag: false, lender: null, chargeAmount: 0, lienType: null, secondCharge: false },
      dispute: { flag: false, cnr: null, filingDate: null, status: "Clear" },
      financial: { guidanceValue: 7200000, lastSaleValue: 6800000, stampDutyRef: "SD-2021-009934", taxStatus: "Paid till 2026" },
      lifecycle: { lastOperation: "TRANSFER", lastEndorsers: ["Registration", "Revenue"], docHashes: ["c71fa3e80d..."], created: "2021-08-14" },
      history: [
        { ts: "2021-08-14 11:20", actor: "RegMutate (auto)", action: "TRANSFER executed - Apartment sale", detail: "Builder allotment registered to Ravi Kumar. Mutation automatic.", kind: "ok" },
        { ts: "2021-08-14 11:00", actor: "S. Lakshmi (Maker)", action: "Sale deed approved", detail: "Apartment sale deed - stamp duty 7% of ₹68,00,000 verified.", kind: "ok" },
      ],
    },
  };

  const officerQueue: OfficerQueueItem[] = [
    { id: "TXN-100240", type: "Sale", ulpin: "TN-CGL-211-004-A", parties: "Muthu Selvam → Lakshmi Narayanan", amount: 5500000, submitted: "2026-06-20 09:40", status: "pending_maker", priority: "normal" },
    { id: "TXN-100231", type: "Sale", ulpin: "TN-CGL-045-002-A", parties: "Muthu Selvam → Ravi Kumar", amount: 5000000, submitted: "2026-06-19 09:12", status: "pending_maker", priority: "normal", recipientName: "Ravi Kumar" },
    { id: "TXN-100232", type: "Sale", ulpin: "TN-CGL-058-019-G", parties: "Kumar Raman → Priya Subramaniam", amount: 4400000, submitted: "2026-06-19 11:30", status: "pending_maker", priority: "normal" },
    { id: "TXN-100233", type: "Sale (blocked)", ulpin: "TN-CGL-045-002-B", parties: "Ravi Kumar → Senthil Velu", amount: 7200000, submitted: "2026-06-18 14:02", status: "exception", priority: "high", reason: "Active SBI mortgage ₹30,00,000 - Transfer Blocked" },
    { id: "TXN-100234", type: "Succession", ulpin: "TN-CGL-067-014-C", parties: "Heirs: Ravi Kumar, Kumar Raman", amount: 0, submitted: "2026-06-15 09:05", status: "pending_checker", priority: "normal" },
  ];

  const consentRequests: ConsentRequest[] = [
    {
      id: "CR-1001",
      ulpin: "TN-CGL-091-021-E",
      type: "gift",
      senderId: "citizen_anita",
      senderName: "Anita Kumar",
      recipientName: "Kumar Raman",
      giftRelation: "Cousin",
      createdAt: "2026-06-22 10:00",
      senderConsent: true,
      recipientConsent: false,
    },
  ];

  const exceptionQueue: SlateException[] = [
    {
      id: "EXC-5501", txnId: "TXN-100233", ulpin: "TN-CGL-045-002-B", type: "Sale blocked - active encumbrance",
      flaggedBy: "RegMutate (rule check)", flaggedAt: "2026-06-18 14:02",
      reason: "Parcel carries an active SBI mortgage of ₹30,00,000 registered 2026-06-10. EncumbranceGuard set Transfer Blocked. Sale cannot proceed until mortgage is released.",
      context: ["Seller: Ravi Kumar (verified owner)", "Buyer: Senthil Velu (eKYC complete)", "Token state: Transfer Blocked since 2026-06-10", "Lender: State Bank of India · Adyar Branch"],
      status: "open",
    },
    {
      id: "EXC-5502", txnId: "TXN-100235", ulpin: "TN-CGL-029-008-D", type: "Sale blocked - disputed parcel",
      flaggedBy: "DisputeResolve (rule check)", flaggedAt: "2026-06-17 10:44",
      reason: "Parcel is under an active boundary dispute (CNR-TNCH02-2026-004471). DisputeResolve set the token to Disputed. No transactions permitted until the court issues an order.",
      context: ["Seller: Ravi Kumar (verified owner)", "Court: Civil Court, Chennai", "Filed: 2026-06-14", "Petitioner: S. Ganesan (neighbouring landowner)"],
      status: "open",
    },
    {
      id: "EXC-5498", txnId: "TXN-100210", ulpin: "TN-CGL-091-021-E", type: "Ownership mismatch - resolved",
      flaggedBy: "Revenue Sync Check (rule check)", flaggedAt: "2026-06-11 08:20",
      reason: 'Legacy revenue record briefly showed a different owner name due to a manual update lag. Resolved after officer cross-verification with Registration record.',
      context: ["Token owner: Anita Kumar", 'Legacy record (stale): showed "A. Kumar - pending update"', "Resolved by: S. Lakshmi, 2026-06-11"],
      status: "resolved", resolution: "Approved - confirmed same person, legacy record updated.",
    },
  ];

  const mortgages: SlateMortgage[] = [
    { id: "MTG-3301", ulpin: "TN-CGL-045-002-B", borrower: "Ravi Kumar", bank: "State Bank of India · Adyar Branch", amount: 3000000, type: "Equitable Mortgage", status: "active", created: "2026-06-10" },
    { id: "MTG-3287", ulpin: "TN-CGL-112-003-F", borrower: "Muthu Selvam", bank: "State Bank of India · Adyar Branch", amount: 5500000, type: "Equitable Mortgage", status: "released", created: "2024-01-15", released: "2025-09-02" },
  ];

  const disputes: SlateDispute[] = [
    { id: "CNR-TNCH02-2026-004471", ulpin: "TN-CGL-029-008-D", type: "Boundary dispute", filedBy: "S. Ganesan", filedAgainst: "Ravi Kumar", filed: "2026-06-14", status: "frozen", court: "Civil Court, Chennai" },
    { id: "CNR-TNCH02-2026-003120", ulpin: "TN-CGL-076-033-H", type: "Government acquisition", filedBy: "District Collectorate", filedAgainst: "Prior owner", filed: "2026-04-20", status: "order_executed", court: "Civil Court, Chennai", orderType: "Acquisition", orderDate: "2026-05-02" },
  ];

  return {
    users,
    tokens,
    officerQueue,
    consentRequests,
    exceptionQueue,
    mortgages,
    disputes,
    auditTrail: buildAuditTrail(tokens),
    documents: [],
    jurisdictions: [...JURISDICTIONS],
    designations: [...DESIGNATIONS],
    documentTypes: [...DOCUMENT_TYPES],
    relationships: [...RELATIONSHIPS],
    stampDutyRates: [...STAMP_DUTY_RATES],
  };
}
