import type { WorkflowStepStatus } from "../engine";

type Props = {
    steps: { id: string; label: string }[];
    statusMap: Record<string, WorkflowStepStatus>;
};

export function WorkflowStepper({ steps, statusMap }: Props) {
    return (
        <div className="flex gap-6 mb-6">
            {steps.map((step) => {
                const status = statusMap[step.id];

                const color =
                    status === "completed"
                        ? "bg-green-500"
                        : status === "in_progress"
                            ? "bg-blue-500"
                            : status === "blocked"
                                ? "bg-red-500"
                                : "bg-gray-300";

                return (
                    <div key={step.id} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${color}`} />
                        <span className="text-sm font-medium">{step.label}</span>
                    </div>
                );
            })}
        </div>
    );
}
