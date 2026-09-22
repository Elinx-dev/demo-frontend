import { Navigate } from "react-router-dom";
import { useSlateStore } from "../state/SlateProvider";
import { ROUTES } from "@/navigation/routes";
import CitizenDashboardPage from "./citizen/CitizenDashboardPage";
import OfficerDashboardPage from "./officer/OfficerDashboardPage";
import BankDashboardPage from "./bank/BankDashboardPage";
import CourtDashboardPage from "./court/CourtDashboardPage";
import SurveyorDashboardPage from "./surveyor/SurveyorDashboardPage";
import RevenueDashboardPage from "./officer/RevenueDashboardPage";
import VaoDashboardPage from "./vao/VaoDashboardPage";
import TahsildarDashboardPage from "./officer/TahsildarDashboardPage";

export default function DashboardRouter() {
  const { session } = useSlateStore();

  if (!session.loggedIn || !session.currentPortal) {
    return <Navigate to={ROUTES.PATHS.APP.SLATE.LOGIN} replace />;
  }

  switch (session.currentPortal) {
    case "citizen":
      return <CitizenDashboardPage />;
    case "officer":
      return <OfficerDashboardPage />;
    case "bank":
      return <BankDashboardPage />;
    case "court":
      return <CourtDashboardPage />;
    case "surveyor":
      return <SurveyorDashboardPage />;
    case "revenue":
      return <RevenueDashboardPage />;
    case "vao":
      return <VaoDashboardPage />;
    case "tahsildar":
      return <TahsildarDashboardPage />;
    default:
      return <Navigate to={ROUTES.PATHS.APP.SLATE.LOGIN} replace />;
  }
}
