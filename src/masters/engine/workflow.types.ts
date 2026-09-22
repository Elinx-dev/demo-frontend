export type WorkflowStep = {
    id: string;                 // step id (overview, pricing, review)
    label: string;              // UI label
    description?: string;       // optional help text
    optional?: boolean;         // optional step
};

export type WorkflowConfig = {
    enabled: boolean;

    steps: WorkflowStep[];

    initialStep?: string;       // default starting step
};
