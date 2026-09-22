import { apiService } from "@/services/api";
import { useEffect } from "react";
import type { WorkflowStateResponse } from "./workflow.api.types";

export const useWorkflowPersistence = (
    workflowId: string,
    step: string,
    setStep: (s: string) => void
) => {
    /* Persist step */
    useEffect(() => {
        apiService.post<void>(`/workflow/${workflowId}/step`, { step });
    }, [workflowId, step]);

    /* Restore step */
    useEffect(() => {
        apiService
            .get<WorkflowStateResponse>(`/workflow/${workflowId}`)
            .then((res) => {
                if (res.step) setStep(res.step);
            });
    }, [workflowId, setStep]);
};
