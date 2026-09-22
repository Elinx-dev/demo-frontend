export const UserRole = {
    PlatformAdmin: "platform_admin",
    Operator: "operator",
    Viewer: "viewer",
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];
