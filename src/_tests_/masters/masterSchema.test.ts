import { describe, it, expect } from "vitest";
import { validateMasterConfig } from "@/masters/engine/master.schemas";

// Minimal, generic fixture for the masters *engine* itself.
// (Concrete master data configs are registered per-feature in
// src/masters/registry - none are seeded by default in this app.)
const SampleMaster = {
    id: "sample",
    version: 1,
    title: "Sample Master",
    entity: { name: "sample", idField: "id" },
    endpoints: { list: "list_sample", create: "create_sample" },
    columns: [{ key: "id", label: "ID" }],
    form: { fields: [{ name: "name", label: "Name", type: "text" }] },
};

describe("Master registry validation", () => {
    it("accepts valid master config", () => {
        expect(() => validateMasterConfig(SampleMaster)).not.toThrow();
    });
});
