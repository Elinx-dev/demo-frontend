import type { ReactNode } from "react";
import { TopHeader } from "@/ui/layout/TopHeader";
import Sidebar from "@/ui/layout/Sidebar";
import { useNavigationGraph } from "@/navigation/useNavigationGraph";
import { CommandPalette } from "@/ui/commands/CommandPalette";

export const AppChrome = ({ children }: { children: ReactNode }) => {
  const { breadcrumbs, sidebar } = useNavigationGraph();

  return (
    <div className="h-screen flex flex-col overflow-hidden relative bg-ipc-canvas">
      {/* Body row */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar items={sidebar} />

        {/* Main content */}
        <main
          id="main-content"
          className="flex-1 h-full flex flex-col overflow-y-auto no-scrollbar bg-ipc-canvas"
        >
          {/* Header */}
          <TopHeader breadcrumbs={breadcrumbs} />

          {/* Page content */}
          <div className="ipc-route-content flex-1">
            {children}
          </div>

          {/* Footer if needed */}
          {/* <AppFooter /> */}
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette />
    </div>
  );
};
