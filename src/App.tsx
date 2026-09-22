import { Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "@/app/AppShell";
import { ROUTES } from "@/navigation/routes";

import "./App.css";

import UserAccessManagement from "./pages/user-access-management/UserAccessManagement";
import UserOnboarding from "./pages/userOnboarding/UserOnboarding";
import UserProfilePage from "./pages/userOnboarding/UserProfilePage";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import SlateApp from "@/features/slate/SlateApp";
import { generateToken, registerForegroundListener } from "@/pages/notifications/fireBase/fireBaseNotification";
import { useEffect } from "react";

function App() {
  useEffect(() => {
    const initFCM = async () => {
      if ("serviceWorker" in navigator) {
        await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      }

      const token = await generateToken();

      if (token) {
        console.log("FCM Token:", token);
        localStorage.setItem('FCM Token', token)
      }

      registerForegroundListener();
    };

    initFCM();
  }, []);

  return (
    <Routes>
      {/* ===== APP SHELL (IAM / legacy dashboard - no auth gate) ===== */}
      <Route path={ROUTES.SEGMENTS.APP.ROOT} element={<AppShell />}>
        <Route index element={<Navigate to={ROUTES.PATHS.APP.SLATE.ROOT} replace />} />
        {/* DASHBOARD */}
        <Route
          path={ROUTES.SEGMENTS.APP.DASHBOARD}
          element={<DashboardPage />}
        />
        {/* USER ACCESS */}
        <Route
          path={ROUTES.SEGMENTS.APP.USER_ACCESS_MANAGEMENT}
          element={<UserAccessManagement />}
        />
        <Route
          path={ROUTES.SEGMENTS.APP.USER_PROFILE}
          element={<UserProfilePage />}
        />
        <Route
          path={ROUTES.SEGMENTS.APP.USER_ONBOARDING}
          element={<UserOnboarding />}
        />
        <Route
          path={ROUTES.SEGMENTS.APP.EDIT_USER_ONBOARDING}
          element={<UserOnboarding />}
        />
      </Route>

      {/* ===== SLATE - Land Registry POC (own full-page shell, own login) ===== */}
      <Route
        path={`${ROUTES.SEGMENTS.APP.SLATE.ROOT}/*`}
        element={<SlateApp />}
      />

      <Route path="*" element={<Navigate to={ROUTES.PATHS.APP.SLATE.ROOT} replace />} />
    </Routes>
  );
}

export default App;
