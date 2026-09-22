import { useCallback, useEffect, useState } from "react";
import type {
    WorkflowConfig,
    WorkflowStepStatus,
} from "./workflow.types";
import { useWorkflowPersistence } from "./useWorkflowPersistence";
import { useTelemetry } from "@/services/telemetry/TelemetryContext";

/* =========================
 * Error Model
 * =======================*/
export type WorkflowError = {
    code:
    | "VALIDATION_FAILED"
    | "CANNOT_EXIT"
    | "INVALID_STEP"
    | "UNKNOWN";
    message: string;
    stepId?: string;
};

/* =========================
 * Hook
 * =======================*/
export function useWorkflowEngine<TData extends Record<string, unknown>>(
    workflow: WorkflowConfig<TData>,
    initialData: TData
) {
    if (!workflow.steps || workflow.steps.length === 0) {
        throw new Error(
            `Workflow "${workflow.id}" has no steps defined`
        );
    }

    const telemetry = useTelemetry();
    const timestamp = () => Date.now();

    const [currentIndex, setCurrentIndex] = useState(0);
    const [data, setData] = useState<TData>(initialData);
    const [error, setError] = useState<WorkflowError | null>(null);

    /* =========================
     * Step Status Map
     * =======================*/
    const [statusMap, setStatusMap] = useState<
        Record<string, WorkflowStepStatus>
    >(() =>
        workflow.steps.reduce((acc, step, idx) => {
            acc[step.id] =
                idx === 0 ? "in_progress" : "not_started";
            return acc;
        }, {} as Record<string, WorkflowStepStatus>)
    );

    const currentStep = workflow.steps[currentIndex];

    /* =========================
     * Workflow START
     * =======================*/
    useEffect(() => {
        telemetry.track({
            type: "workflow_transition",
            source: "workflow",
            timestamp: timestamp(),
            workflowId: workflow.id,
            fromStep: undefined,
            toStep: currentStep.id,
        });
        // intentional: fire once on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* =========================
     * Persistence
     * =======================*/
    useWorkflowPersistence(
        workflow.id,
        currentStep.id,
        (stepId) => {
            const idx = workflow.steps.findIndex(
                (s) => s.id === stepId
            );
            if (idx >= 0) {
                setCurrentIndex(idx);
            }
        }
    );

    /* =========================
     * NEXT
     * =======================*/
    const next = useCallback(() => {
        setError(null);

        const validationError =
            currentStep.validate?.(data);

        if (validationError) {
            setError({
                code: "VALIDATION_FAILED",
                message: validationError,
                stepId: currentStep.id,
            });

            telemetry.track({
                type: "workflow_transition",
                source: "workflow",
                timestamp: timestamp(),
                workflowId: workflow.id,
                fromStep: currentStep.id,
                toStep: currentStep.id,
            });

            return;
        }

        if (
            currentStep.canExit &&
            !currentStep.canExit(data)
        ) {
            setError({
                code: "CANNOT_EXIT",
                message: "Cannot proceed from this step",
                stepId: currentStep.id,
            });

            telemetry.track({
                type: "workflow_transition",
                source: "workflow",
                timestamp: timestamp(),
                workflowId: workflow.id,
                fromStep: currentStep.id,
                toStep: currentStep.id,
            });

            return;
        }

        const nextStep =
            workflow.steps[currentIndex + 1];

        if (!nextStep) {
            telemetry.track({
                type: "workflow_transition",
                source: "workflow",
                timestamp: timestamp(),
                workflowId: workflow.id,
                fromStep: currentStep.id,
                toStep: "COMPLETED",
            });
            return;
        }

        setStatusMap((s) => ({
            ...s,
            [currentStep.id]: "completed",
            [nextStep.id]: "in_progress",
        }));

        setCurrentIndex((i) => i + 1);

        telemetry.track({
            type: "workflow_transition",
            source: "workflow",
            timestamp: timestamp(),
            workflowId: workflow.id,
            fromStep: currentStep.id,
            toStep: nextStep.id,
        });
    }, [
        currentIndex,
        currentStep,
        data,
        workflow.steps,
        workflow.id,
        telemetry,
    ]);

    /* =========================
     * PREVIOUS
     * =======================*/
    const previous = useCallback(() => {
        if (currentIndex === 0) return;

        setError(null);
        const prevStep = workflow.steps[currentIndex - 1];

        setCurrentIndex((i) => i - 1);

        telemetry.track({
            type: "workflow_transition",
            source: "workflow",
            timestamp: timestamp(),
            workflowId: workflow.id,
            fromStep: currentStep.id,
            toStep: prevStep.id,
        });
    }, [currentIndex, currentStep.id, telemetry, workflow]);

    /* =========================
     * GOTO
     * =======================*/
    const goTo = useCallback(
        (stepId: string) => {
            const idx = workflow.steps.findIndex(
                (s) => s.id === stepId
            );

            if (idx === -1) {
                setError({
                    code: "INVALID_STEP",
                    message: `Step "${stepId}" not found`,
                });
                return;
            }

            telemetry.track({
                type: "workflow_transition",
                source: "workflow",
                timestamp: timestamp(),
                workflowId: workflow.id,
                fromStep: currentStep.id,
                toStep: stepId,
            });

            setCurrentIndex(idx);
        },
        [workflow.steps, workflow.id, currentStep.id, telemetry]
    );

    /* =========================
     * RESET
     * =======================*/
    const reset = useCallback(() => {
        setError(null);
        setCurrentIndex(0);
        setData(initialData);
        setStatusMap(
            workflow.steps.reduce((acc, step, idx) => {
                acc[step.id] =
                    idx === 0
                        ? "in_progress"
                        : "not_started";
                return acc;
            }, {} as Record<string, WorkflowStepStatus>)
        );

        telemetry.track({
            type: "workflow_transition",
            source: "workflow",
            timestamp: timestamp(),
            workflowId: workflow.id,
            fromStep: currentStep.id,
            toStep: workflow.steps[0].id,
        });
    }, [
        initialData,
        workflow.steps,
        workflow.id,
        currentStep.id,
        telemetry,
    ]);

    /* =========================
     * Derived
     * =======================*/
    const isFirst = currentIndex === 0;
    const isLast =
        currentIndex === workflow.steps.length - 1;

    return {
        steps: workflow.steps,
        currentStep,
        currentIndex,
        statusMap,

        data,
        setData,

        next,
        previous,
        goTo,
        reset,

        isFirst,
        isLast,

        error,
        clearError: () => setError(null),
    };
}
