import type { ReactNode } from "react";
import { useTheme } from "@/ui/theme/ThemeContext";

type PageLayoutProps = {
  header?: ReactNode;
  actions?: ReactNode;
  status?: ReactNode;
  children: ReactNode;
};

export const PageLayout = ({
  header,
  actions,
  status,
  children,
}: PageLayoutProps) => {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <div
      className="flex-1 flex flex-col"
      style={{ backgroundColor: c.background }}
    >
      <main
        className=" flex flex-col gap-4 "
        style={{
          backgroundColor: c.background,
          color: c.text,
        }}
      >
        {/* Header */}
        {(header || actions || status) && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>{header}</div>

              <div className="flex items-center gap-2">{actions}</div>
            </div>

            {status && (
              <div className="text-sm" style={{ color: c.textMuted }}>
                {status}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">{children}</div>
      </main>
    </div>
  );
};

export default PageLayout;
