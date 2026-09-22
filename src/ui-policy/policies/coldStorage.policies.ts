import { EntityStatus } from "@/domain/enums/Status";
import type { UIPolicy } from "../engine/policy.types";
import { UserRole } from "@/domain/enums/UserRole";

/**
 * Cold Storage Policies
 * --------------------
 * Governs pricing update permissions
 *
 * ❗ Deny-by-default
 * ✅ Role-safe (UserRole enum)
 * ✅ Status-aware locking
 */
export const coldStoragePolicies: UIPolicy[] = [
    {
        id: "cold-storage-update-guard",
        appliesTo: {
            entity: "cold-storages",
            action: "update", // canonical CRUD
        },
        rules: [
            /* =========================
             * ROLE GUARD
             * =======================*/
            {
                when: (ctx) => ctx.user.role !== UserRole.PlatformAdmin,
                effect: {
                    visible: true,
                    enabled: false,
                    reason: "Only platform admins can modify pricing",
                },
            },

            /* =========================
             * STATUS LOCK
             * =======================*/
            {
                when: (ctx) =>
                    ctx.entity?.status === EntityStatus.Approved,
                effect: {
                    visible: true,
                    enabled: false,
                    reason: "Approved cold storages are locked",
                },
            },
        ],
    },
];
