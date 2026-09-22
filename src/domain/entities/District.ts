import type { EntityStatus } from "../enums/Status";

export type District = {
    id: string;
    districtName: string;
    districtCode: string;
    countryId: number;
    stateId: number;
    country: { countryName: string };
    state?: { stateName: string };  // ← optional, for display purposes if API returns nested state data
    isActive: boolean;
    status?: EntityStatus;
};
