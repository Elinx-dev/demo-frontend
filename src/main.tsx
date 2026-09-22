import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";

import { AppProviders } from "@/app/AppProviders";
import { ErrorBoundary } from "@/app/ErrorBoundary";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  
  <React.StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <AppProviders>
          <App />
        </AppProviders>
      </HashRouter>
    </ErrorBoundary>
  </React.StrictMode>
);