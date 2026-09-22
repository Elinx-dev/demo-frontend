export type Command = {
    id: string;
    label: string;
    action: () => void;
    permissionKey?: string;
};
