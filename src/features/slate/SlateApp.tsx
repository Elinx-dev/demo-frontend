import { Routes, Route, Navigate } from "react-router-dom";
import { ROUTES } from "@/navigation/routes";
import { SlateProvider, useSlateStore } from "./state/SlateProvider";
import SlateShell from "./components/SlateShell";
import SlateLoginPage from "./pages/SlateLoginPage";
import SetNewPasswordPage from "./pages/SetNewPasswordPage";
import CitizenRegisterPage from "./pages/CitizenRegisterPage";
import DashboardRouter from "./pages/DashboardRouter";

import MyPropertiesPage from "./pages/citizen/MyPropertiesPage";
import PropertyDetailPage from "./pages/citizen/PropertyDetailPage";
import InitiateTransactionPage from "./pages/citizen/InitiateTransactionPage";
import UploadDocumentsPage from "./pages/citizen/UploadDocumentsPage";
import TrackStatusPage from "./pages/citizen/TrackStatusPage";
import IncomingTransfersPage from "./pages/citizen/IncomingTransfersPage";
import ConsentVerificationPage from "./pages/citizen/ConsentVerificationPage";

import PendingQueuePage from "./pages/officer/PendingQueuePage";
import TransactionDetailPage from "./pages/officer/TransactionDetailPage";
import ExceptionReviewPage from "./pages/officer/ExceptionReviewPage";
import MintTokenPage from "./pages/officer/MintTokenPage";
import OfficerAuditTrailPage from "./pages/officer/OfficerAuditTrailPage";

import EncumbranceSearchPage from "./pages/bank/EncumbranceSearchPage";
import MortgageManagePage from "./pages/bank/MortgageManagePage";
import MortgageDetailPage from "./pages/bank/MortgageDetailPage";

import DisputesPage from "./pages/court/DisputesPage";
import DisputeDetailPage from "./pages/court/DisputeDetailPage";
import CourtAuditTrailPage from "./pages/court/CourtAuditTrailPage";
import MasterDataPage from "./pages/court/MasterDataPage";
import FlowBuilderPage from "./pages/court/FlowBuilderPage";

import TahsildarQueuePage from "./pages/officer/TahsildarQueuePage";
import TahsildarVerificationQueuePage from "./pages/officer/TahsildarVerificationQueuePage";
import TahsildarVerificationDetailPage from "./pages/officer/TahsildarVerificationDetailPage";
import TahsildarPropertyListPage from "./pages/officer/TahsildarPropertyListPage";
import RevenueDashboardPage from "./pages/officer/RevenueDashboardPage";

import NotificationsPage from "./pages/NotificationsPage";
import HelpPage from "./pages/HelpPage";
import SurveyDetailPage from "./pages/surveyor/SurveyDetailPage";
import SurveyorSiteVisitsPage from "./pages/surveyor/SurveyorSiteVisitsPage";
import SurveyVerificationPage from "./pages/surveyor/SurveyVerificationPage";
import VaoQueuePage from "./pages/vao/VaoQueuePage";
import VaoVerificationQueuePage from "./pages/vao/VaoVerificationQueuePage";
import VaoVerificationDetailPage from "./pages/vao/VaoVerificationDetailPage";
import VaoPropertyListPage from "./pages/vao/VaoPropertyListPage";
import OfficerPropertyListPage from "./pages/officer/OfficerPropertyListPage";

const SEG = ROUTES.SEGMENTS.APP.SLATE;
const PATH = ROUTES.PATHS.APP.SLATE;

function SlateRoutes() {
  const { session } = useSlateStore();

  if (session.restoring) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: "#0a1628", color: "#fff", fontSize: 13 }}>
        Loading SLATE…
      </div>
    );
  }

  if (!session.loggedIn) {
    return (
      <Routes>
        <Route path={SEG.LOGIN} element={<SlateLoginPage />} />
        <Route path={SEG.REGISTER} element={<CitizenRegisterPage />} />
        <Route path="*" element={<Navigate to={PATH.LOGIN} replace />} />
      </Routes>
    );
  }

  // Forced on admin-onboarded staff accounts until they set their own
  // password - blocks every other route, including direct URL navigation,
  // until this is resolved.
  if (session.mustChangePassword) {
    return <SetNewPasswordPage />;
  }

  return (
    <Routes>
      <Route element={<SlateShell />}>
        <Route path={SEG.DASHBOARD} element={<DashboardRouter />} />

        <Route path={SEG.CITIZEN_PROPERTIES} element={<MyPropertiesPage />} />
        <Route path={SEG.CITIZEN_PROPERTY_DETAIL} element={<PropertyDetailPage />} />
        <Route path={SEG.CITIZEN_INITIATE} element={<InitiateTransactionPage />} />
        <Route path={SEG.CITIZEN_DOCUMENTS} element={<UploadDocumentsPage />} />
        <Route path={SEG.CITIZEN_STATUS} element={<TrackStatusPage />} />
        <Route path={SEG.CITIZEN_INCOMING} element={<IncomingTransfersPage />} />
        <Route path={SEG.CITIZEN_CONSENT} element={<ConsentVerificationPage />} />

        <Route path={SEG.OFFICER_QUEUE} element={<PendingQueuePage />} />
        <Route path={SEG.OFFICER_TXN_DETAIL} element={<TransactionDetailPage />} />
        <Route path={SEG.OFFICER_EXCEPTIONS} element={<ExceptionReviewPage />} />
        <Route path={SEG.OFFICER_MINT} element={<MintTokenPage />} />
        <Route path={SEG.OFFICER_INITIATE} element={<InitiateTransactionPage />} />
        <Route path={SEG.OFFICER_AUDIT} element={<OfficerAuditTrailPage />} />
        <Route path={SEG.OFFICER_PROPERTIES} element={<OfficerPropertyListPage />} />

        <Route path={SEG.BANK_SEARCH} element={<EncumbranceSearchPage />} />
        <Route path={SEG.BANK_MORTGAGES} element={<MortgageManagePage />} />
        <Route path={SEG.BANK_MORTGAGE_DETAIL} element={<MortgageDetailPage />} />

        <Route path={SEG.COURT_DISPUTES} element={<DisputesPage />} />
        <Route path={SEG.COURT_DISPUTE_DETAIL} element={<DisputeDetailPage />} />
        <Route path={SEG.COURT_AUDIT} element={<CourtAuditTrailPage />} />
        <Route path={SEG.COURT_ADMIN} element={<MasterDataPage />} />
        <Route path={SEG.COURT_FLOW_BUILDER} element={<FlowBuilderPage />} />

        <Route path={SEG.TAHSILDAR_QUEUE} element={<TahsildarQueuePage />} />
        <Route path={SEG.TAHSILDAR_VERIFICATION_QUEUE} element={<TahsildarVerificationQueuePage />} />
        <Route path={SEG.TAHSILDAR_VERIFICATION_DETAIL} element={<TahsildarVerificationDetailPage />} />
        <Route path={SEG.TAHSILDAR_PROPERTIES} element={<TahsildarPropertyListPage />} />
        <Route path={SEG.TAHSILDAR_AUDIT} element={<OfficerAuditTrailPage />} />
        <Route path={SEG.REVENUE_QUEUE} element={<RevenueDashboardPage />} />

        <Route path={SEG.SURVEYOR_DETAIL} element={<SurveyDetailPage />} />
        <Route path={SEG.SURVEYOR_SITE_VISITS} element={<SurveyorSiteVisitsPage />} />
        <Route path={SEG.SURVEYOR_QUEUE} element={<SurveyVerificationPage />} />

        <Route path={SEG.VAO_QUEUE} element={<VaoQueuePage />} />
        <Route path={SEG.VAO_VERIFICATION_QUEUE} element={<VaoVerificationQueuePage />} />
        <Route path={SEG.VAO_VERIFICATION_DETAIL} element={<VaoVerificationDetailPage />} />
        <Route path={SEG.VAO_PROPERTIES} element={<VaoPropertyListPage />} />

        <Route path={SEG.NOTIFICATIONS} element={<NotificationsPage />} />
        <Route path={SEG.HELP} element={<HelpPage />} />

        <Route path="*" element={<Navigate to={PATH.DASHBOARD} replace />} />
      </Route>
    </Routes>
  );
}

export default function SlateApp() {
  return (
    <SlateProvider>
      <SlateRoutes />
    </SlateProvider>
  );
}
