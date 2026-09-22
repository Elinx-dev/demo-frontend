import { WorkflowStepper, WorkflowActions } from "./components";
import { useWorkflowEngine } from "./engine";
import type { WorkflowConfig } from "./engine";
import { FatalError } from "@/ui/primitives/FatalError/FatalError";

/* =========================
 * Props (GENERIC & STRICT)
 * =======================*/
type WorkflowPageProps<TData extends Record<string, any>> = {
    workflow: WorkflowConfig<TData>;
    initialData: TData;
};


export function WorkflowPage<TData extends Record<string, any>>({
    workflow,
    initialData,
}: WorkflowPageProps<TData>) {
    const engine = useWorkflowEngine<TData>(workflow, initialData);
    const StepComponent = engine.currentStep.component;

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <WorkflowStepper
                steps={engine.steps}
                statusMap={engine.statusMap}
            />

            {engine.error && (
                <FatalError
                    title="Workflow error"
                    message={engine.error.message}
                />
            )}

            <div className="border rounded-lg p-6">
                <StepComponent
                    data={engine.data}
                    setData={engine.setData}
                />
            </div>

            <WorkflowActions
                onBack={engine.previous}
                onNext={engine.next}
                isFirst={engine.isFirst}
                isLast={engine.isLast}
            />
        </div>
    );
}
