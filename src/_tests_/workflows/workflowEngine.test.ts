import { describe, it, expect } from "vitest";
import { ProducerWorkflow } from "@/workflows/configs/producer.workflow";
import { renderHook, act } from "@testing-library/react";
import { useWorkflowEngine } from "@/workflows/engine/useWorkflowEngine";

describe("Workflow engine", () => {
    it("starts at first step", () => {
        const { result } = renderHook(() =>
            useWorkflowEngine(ProducerWorkflow, { name: "" })
        );

        expect(result.current.currentStep.id).toBe("basic");
    });

    it("blocks next if validation fails", () => {
        const { result } = renderHook(() =>
            useWorkflowEngine(ProducerWorkflow, { name: "" })
        );

        act(() => {
            result.current.next();
        });

        expect(result.current.error).not.toBeNull();
    });
});