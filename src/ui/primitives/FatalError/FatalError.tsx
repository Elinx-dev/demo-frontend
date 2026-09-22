type FatalErrorProps = {
    title?: string;
    message: string;
};

export const FatalError = ({ title = "Something went wrong", message }: FatalErrorProps) => {
    return (
        <div
            className="p-4 rounded-lg border"
            style={{
                backgroundColor: "var(--color-danger-bg)",
                borderColor: "var(--color-danger-border)",
                color: "var(--color-danger-text)",
            }}
        >
            <div className="font-semibold mb-1">{title}</div>
            <div className="text-sm">{message}</div>
        </div>
    );
};
