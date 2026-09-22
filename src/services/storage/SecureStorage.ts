import { LocalStorageAdapter } from "./LocalStorageAdapter";
import type { StoragePort } from "./StoragePort";

/**
 * SecureStorage
 * -------------
 * Swap implementation here later without touching app code.
 */
export const SecureStorage: StoragePort =
    new LocalStorageAdapter();
