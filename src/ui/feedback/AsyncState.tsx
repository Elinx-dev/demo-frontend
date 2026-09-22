type AsyncStateProps = {
    loading?: boolean;
    error?: string | null;
    empty?: boolean;
    children: React.ReactNode;
};

export function AsyncState({
    loading,
    error,
    empty,
    children,
}: AsyncStateProps) {
    if (loading) return <div>Loading…</div>;
    if (error) return <div className="text-red-600">{error}</div>;
    if (empty) return <div>No records found</div>;
    return <>{children}</>;
}
