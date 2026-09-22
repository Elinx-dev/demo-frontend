import { Button } from "../../ui/primitives/Button/Button";

type Props = {
    onNext: () => void;
    onBack: () => void;
    isFirst: boolean;
    isLast: boolean;
};

export function WorkflowActions({
    onNext,
    onBack,
    isFirst,
    isLast,
}: Props) {
    return (
        <div className="flex justify-between pt-6 border-t">
            <Button
                variant="outline"
                disabled={isFirst}
                onClick={onBack}
            >
                Back
            </Button>

            <Button variant="primary" onClick={onNext}>
                {isLast ? "Submit" : "Next"}
            </Button>
        </div>
    );
}
