import type { EntityStatus } from "../enums/Status";

export type Country = {
    id: string;
    code: string;
    name: string;
    isoCode: string;
    is_active: boolean;
    status?: EntityStatus;
};
