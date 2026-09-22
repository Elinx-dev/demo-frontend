import type { EntityStatus } from "../enums/Status";

export type State = {
    id: string;
    stateName: string;
    stateCode: string;
    countryId: number;
    country: { countryName: string };  // ← optional, for display purposes if API returns nested country data
    isActive: boolean;
    status?: EntityStatus;
    optionsConfig?: {
        endpoint: string;
        labelKey: string;
        valueKey: string;
        entityName: string;
    };
};
