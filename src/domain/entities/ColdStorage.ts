import { EntityStatus } from "../enums/Status";

export type ColdStorage = {
    id: string;
    name: string;
    status: EntityStatus;
    stage: "onboarding" | "live" | "archived";
};
