import type { StoragePort, StorageValue } from "./StoragePort";

export class LocalStorageAdapter implements StoragePort {
    get<T>(key: string): T | null {
        const raw = localStorage.getItem(key);
        if (!raw) return null;

        try {
            const parsed: StorageValue<T> = JSON.parse(raw);

            if (
                parsed.expiresAt &&
                Date.now() > parsed.expiresAt
            ) {
                localStorage.removeItem(key);
                return null;
            }

            return parsed.value;
        } catch {
            return null;
        }
    }

    set<T>(key: string, value: T, ttlMs?: number): void {
        const payload: StorageValue<T> = {
            value,
            expiresAt: ttlMs
                ? Date.now() + ttlMs
                : undefined,
        };

        localStorage.setItem(key, JSON.stringify(payload));
    }

    remove(key: string): void {
        localStorage.removeItem(key);
    }

    clear(): void {
        localStorage.clear();
    }
}
