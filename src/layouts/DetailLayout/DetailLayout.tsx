import type { ReactNode } from "react";
import PageLayout from "@/ui/layout/PageLayout";

type DetailLayoutProps = {
    header: ReactNode;
    actions?: ReactNode;
    status?: ReactNode;
    children: ReactNode;
};

export const DetailLayout = ({
    header,
    actions,
    status,
    children,
}: DetailLayoutProps) => {
    return (
        <PageLayout header={header} actions={actions} status={status}>
            <div className="space-y-4">
                {children}
            </div>
        </PageLayout>
    );
};

export default DetailLayout;
