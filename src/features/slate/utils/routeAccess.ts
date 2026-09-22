import { matchPath } from "react-router-dom";
import { ROUTES } from "@/navigation/routes";

const PATH = ROUTES.PATHS.APP.SLATE;

/** Maps every protected SLATE route to the menu permission that governs it -
 * detail pages (no sidebar entry of their own) inherit their parent list
 * page's menu code. Routes not listed here (Dashboard, Notifications, Help)
 * are reachable by any logged-in user regardless of role. */
const ROUTE_MENU_MAP: { pattern: string; menuCode: string }[] = [
  { pattern: PATH.CITIZEN_PROPERTY_DETAIL, menuCode: "citizen.properties" },
  { pattern: PATH.CITIZEN_PROPERTIES, menuCode: "citizen.properties" },
  { pattern: PATH.CITIZEN_INITIATE, menuCode: "citizen.initiate" },
  { pattern: PATH.CITIZEN_INITIATE, menuCode: "officer.initiate" },
  { pattern: PATH.CITIZEN_INITIATE, menuCode: "officer.queue" },
  { pattern: PATH.CITIZEN_DOCUMENTS, menuCode: "citizen.documents" },
  { pattern: PATH.CITIZEN_STATUS, menuCode: "citizen.status" },
  { pattern: PATH.CITIZEN_INCOMING, menuCode: "citizen.incoming" },
  { pattern: PATH.CITIZEN_CONSENT, menuCode: "citizen.consent" },
  { pattern: PATH.OFFICER_TXN_DETAIL, menuCode: "officer.queue" },
  { pattern: PATH.OFFICER_QUEUE, menuCode: "officer.queue" },
  { pattern: PATH.OFFICER_EXCEPTIONS, menuCode: "officer.exceptions" },
  { pattern: PATH.OFFICER_MINT, menuCode: "officer.mint" },
  { pattern: PATH.OFFICER_AUDIT, menuCode: "officer.audit" },
  { pattern: PATH.BANK_SEARCH, menuCode: "bank.search" },
  { pattern: PATH.BANK_MORTGAGE_DETAIL, menuCode: "bank.mortgages" },
  { pattern: PATH.BANK_MORTGAGES, menuCode: "bank.mortgages" },
  { pattern: PATH.COURT_DISPUTE_DETAIL, menuCode: "court.disputes" },
  { pattern: PATH.COURT_DISPUTES, menuCode: "court.disputes" },
  { pattern: PATH.COURT_AUDIT, menuCode: "court.audit" },
  { pattern: PATH.COURT_ADMIN, menuCode: "court.admin" },
  { pattern: PATH.SURVEYOR_DETAIL, menuCode: "surveyor.queue" },
  { pattern: PATH.SURVEYOR_SITE_VISITS, menuCode: "surveyor.visits" },
  { pattern: PATH.SURVEYOR_QUEUE, menuCode: "surveyor.queue" },
  { pattern: PATH.VAO_QUEUE, menuCode: "vao.queue" },
  { pattern: PATH.VAO_VERIFICATION_QUEUE, menuCode: "vao.queue" },
  { pattern: PATH.VAO_VERIFICATION_DETAIL, menuCode: "vao.queue" },
  { pattern: PATH.TAHSILDAR_VERIFICATION_QUEUE, menuCode: "tahsildar.queue" },
  { pattern: PATH.TAHSILDAR_VERIFICATION_DETAIL, menuCode: "tahsildar.queue" },
  { pattern: PATH.TAHSILDAR_PROPERTIES, menuCode: "tahsildar.queue" },
  { pattern: PATH.TAHSILDAR_AUDIT, menuCode: "tahsildar.audit" },
  { pattern: PATH.CITIZEN_PROPERTY_DETAIL, menuCode: "tahsildar.queue" },
];

/** Routes with no sidebar entry of their own (Dashboard/Notifications/Help)
 * are intentionally absent from ROUTE_MENU_MAP and always permitted. */
export function getRequiredMenuCode(pathname: string): string | null {
  for (const { pattern, menuCode } of ROUTE_MENU_MAP) {
    if (matchPath({ path: pattern, end: true }, pathname)) return menuCode;
  }
  return null;
}

export function isPathPermitted(pathname: string, liveMenuCodes: Set<string> | null): boolean {
  const allowedCodes = ROUTE_MENU_MAP
    .filter(({ pattern }) => matchPath({ path: pattern, end: true }, pathname))
    .map(({ menuCode }) => menuCode);
  if (allowedCodes.length === 0) return true;
  // Fail-open while liveIdentity hasn't resolved yet
  if (!liveMenuCodes) return true;
  return allowedCodes.some((code) => liveMenuCodes.has(code));
}
