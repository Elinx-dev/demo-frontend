// import { coldStoragePolicies } from "../policies/coldStorage.policies";
// import type { UIPolicy } from "../engine/policy.types";

// /* =========================
//  * UI Policy Registry Hook
//  * =======================*/

// /**
//  * Platform-level hook to collect all UI policies.
//  * This keeps BuildPolicyContext feature-agnostic.
//  */
// export const useUIPolicies = (): UIPolicy[] => {
//     return [
//         ...coldStoragePolicies,
//         // future feature policies go here
//         // e.g. ...userPolicies, ...reportPolicies
//     ];
// };
import type { UIPolicy } from "../engine/policy.types";
import { coldStoragePolicies } from "../policies/coldStorage.policies";
import { navigationPolicies } from "../policies/navigation.policies";

export const useUIPolicies = (): UIPolicy[] => [
    ...navigationPolicies,
    ...coldStoragePolicies,
];
