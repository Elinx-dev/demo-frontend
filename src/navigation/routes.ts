/**
 * Route Registry (L5)
 * ------------------
 * SEGMENTS → for <Route path="">
 * PATHS    → for navigation, breadcrumbs, commands, telemetry
 * No raw strings allowed outside this file.
 */

export const ROUTES = {
  SEGMENTS: {
    APP: {
      ROOT: "",
      COMPONENT_LIBRARY: undefined,
      USER_ACCESS_MANAGEMENT: "user-access-management",
      DASHBOARD: "dashboard",
      USER_PROFILE: "user-profile",
      USER_ONBOARDING: "user-onboarding",
      EDIT_USER_ONBOARDING: "user-onboarding/:accountCenterUserId",

      SLATE: {
        ROOT: "slate",
        LOGIN: "login",
        REGISTER: "register",
        DASHBOARD: "dashboard",
        CITIZEN_PROPERTIES: "citizen/properties",
        CITIZEN_PROPERTY_DETAIL: "citizen/properties/:ulpin",
        CITIZEN_INITIATE: "citizen/initiate",
        CITIZEN_DOCUMENTS: "citizen/documents",
        CITIZEN_STATUS: "citizen/status",
        CITIZEN_INCOMING: "citizen/incoming",
        CITIZEN_CONSENT: "citizen/consent",
        OFFICER_QUEUE: "officer/queue",
        OFFICER_TXN_DETAIL: "officer/queue/:txnId",
        OFFICER_EXCEPTIONS: "officer/exceptions",
        OFFICER_MINT: "officer/mint",
        OFFICER_AUDIT: "officer/audit",
        BANK_SEARCH: "bank/search",
        BANK_MORTGAGES: "bank/mortgages",
        BANK_MORTGAGE_DETAIL: "bank/mortgages/:mortgageId",
        COURT_DISPUTES: "court/disputes",
        COURT_DISPUTE_DETAIL: "court/disputes/:disputeId",
        COURT_AUDIT: "court/audit",
        COURT_ADMIN: "court/admin",
        SURVEYOR_DETAIL: "surveyor/survey/:ulpin",
        SURVEYOR_SITE_VISITS: "surveyor/visits",
        SURVEYOR_QUEUE: "surveyor/queue",
        VAO_QUEUE: "vao/queue",
        VAO_VERIFICATION_QUEUE: "vao/verification-queue",
        VAO_VERIFICATION_DETAIL: "vao/verification-queue/:txnId",
        TAHSILDAR_QUEUE: "tahsildar/queue",
        TAHSILDAR_VERIFICATION_QUEUE: "tahsildar/verification-queue",
        TAHSILDAR_VERIFICATION_DETAIL: "tahsildar/verification-queue/:txnId",
        TAHSILDAR_PROPERTIES: "tahsildar/properties",
        TAHSILDAR_AUDIT: "tahsildar/audit",
        OFFICER_PROPERTIES: "officer/properties",
        VAO_PROPERTIES: "vao/properties",
        REVENUE_QUEUE: "revenue/queue",
        OFFICER_INITIATE: "officer/initiate",
        COURT_FLOW_BUILDER: "court/flows",
        NOTIFICATIONS: "notifications",
        HELP: "help",
      },
    },
  },

  PATHS: {
    APP: {
      ROOT: "/",
      COMPONENT_LIBRARY: "/",
      USER_ACCESS_MANAGEMENT: "/user-access-management",
      DASHBOARD: "/dashboard",
      USER_ONBOARDING: "/user-onboarding",
      USER_PROFILE: "/user-profile/:accountCenterUserId",

      SLATE: {
        ROOT: "/slate",
        LOGIN: "/slate/login",
        REGISTER: "/slate/register",
        DASHBOARD: "/slate/dashboard",
        CITIZEN_PROPERTIES: "/slate/citizen/properties",
        CITIZEN_PROPERTY_DETAIL: "/slate/citizen/properties/:ulpin",
        CITIZEN_INITIATE: "/slate/citizen/initiate",
        CITIZEN_DOCUMENTS: "/slate/citizen/documents",
        CITIZEN_STATUS: "/slate/citizen/status",
        CITIZEN_INCOMING: "/slate/citizen/incoming",
        CITIZEN_CONSENT: "/slate/citizen/consent",
        OFFICER_QUEUE: "/slate/officer/queue",
        OFFICER_TXN_DETAIL: "/slate/officer/queue/:txnId",
        OFFICER_EXCEPTIONS: "/slate/officer/exceptions",
        OFFICER_MINT: "/slate/officer/mint",
        OFFICER_AUDIT: "/slate/officer/audit",
        BANK_SEARCH: "/slate/bank/search",
        BANK_MORTGAGES: "/slate/bank/mortgages",
        BANK_MORTGAGE_DETAIL: "/slate/bank/mortgages/:mortgageId",
        COURT_DISPUTES: "/slate/court/disputes",
        COURT_DISPUTE_DETAIL: "/slate/court/disputes/:disputeId",
        COURT_AUDIT: "/slate/court/audit",
        COURT_ADMIN: "/slate/court/admin",
        SURVEYOR_DETAIL: "/slate/surveyor/survey/:ulpin",
        SURVEYOR_SITE_VISITS: "/slate/surveyor/visits",
        SURVEYOR_QUEUE: "/slate/surveyor/queue",
        VAO_QUEUE: "/slate/vao/queue",
        VAO_VERIFICATION_QUEUE: "/slate/vao/verification-queue",
        VAO_VERIFICATION_DETAIL: "/slate/vao/verification-queue/:txnId",
        TAHSILDAR_QUEUE: "/slate/tahsildar/queue",
        TAHSILDAR_VERIFICATION_QUEUE: "/slate/tahsildar/verification-queue",
        TAHSILDAR_VERIFICATION_DETAIL: "/slate/tahsildar/verification-queue/:txnId",
        TAHSILDAR_PROPERTIES: "/slate/tahsildar/properties",
        TAHSILDAR_AUDIT: "/slate/tahsildar/audit",
        OFFICER_PROPERTIES: "/slate/officer/properties",
        VAO_PROPERTIES: "/slate/vao/properties",
        REVENUE_QUEUE: "/slate/revenue/queue",
        OFFICER_INITIATE: "/slate/officer/initiate",
        COURT_FLOW_BUILDER: "/slate/court/flows",
        NOTIFICATIONS: "/slate/notifications",
        HELP: "/slate/help",
      },
    },
  },
} as const;

export type RoutePath =
  | typeof ROUTES.PATHS.APP.ROOT
  | typeof ROUTES.PATHS.APP.COMPONENT_LIBRARY
  | typeof ROUTES.PATHS.APP.USER_ACCESS_MANAGEMENT
  | typeof ROUTES.PATHS.APP.DASHBOARD
  | typeof ROUTES.PATHS.APP.USER_ONBOARDING
  | (typeof ROUTES.PATHS.APP.SLATE)[keyof typeof ROUTES.PATHS.APP.SLATE];
