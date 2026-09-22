export const EntityStatus = {
    Draft: "draft",
    Submitted: "submitted",
    Approved: "approved",
    Active: "active",
    Archived: "archived",
} as const;

export type EntityStatus =
    (typeof EntityStatus)[keyof typeof EntityStatus];
