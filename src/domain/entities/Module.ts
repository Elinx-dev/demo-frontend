export type Module = {
    id: string;
    code: string;
    name: string;
    host: string;
    port: number;
    is_active: boolean;
    enabled?: boolean;
};
