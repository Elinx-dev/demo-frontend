import type { EntityStatus } from "@/domain/enums/Status";

type Props = {
    title: string;
    entityId: string;
    status: EntityStatus;
    actions?: React.ReactNode;
};

export const EntityHeader = ({ title, entityId, status, actions }: Props) => (
    <div className="flex justify-between items-center border-b pb-3">
        <div>
            <h1 className="text-lg font-semibold">{title}</h1>
            <div className="text-sm text-muted">
                ID: {entityId} • Status: {status}
            </div>
        </div>
        <div>{actions}</div>
    </div>
);
