import { useParams } from "react-router-dom";
import { MasterEngine } from "@/masters/engine/MasterEngine";
import { masterRegistry } from "@/masters/registry";
import { DetailLayout } from "@/layouts/DetailLayout/DetailLayout";
import { EntityHeader } from "@/ui/layout/EntityHeader";
import { EmptyState } from "@/ui/primitives/EmptyState/EmptyState";
import { EntityStatus } from "@/domain/enums/Status";


export default function MasterPage() {
    const { masterId } = useParams<{ masterId: string }>();

    const config = masterId ? masterRegistry[masterId] : undefined;

    if (!masterId || !config) {
        return (
            <DetailLayout
                header={
                    <EntityHeader
                        title="Unknown Master"
                        entityId={masterId ?? "unknown"}
                        status={EntityStatus.Draft}
                    />
                }
            >
                <EmptyState
                    title="Master not found"
                    description="The requested master configuration does not exist."
                />
            </DetailLayout>
        );
    }

    return (
        <DetailLayout
            header={
                <EntityHeader
                    title={config.title}
                    entityId={masterId}
                    status={EntityStatus.Active}
                />
            }
        >
            <MasterEngine config={config} />
        </DetailLayout>
    );
}

