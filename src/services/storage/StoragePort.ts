export type StorageValue<T> = {
    value: T;
    expiresAt?: number;
};

export interface StoragePort {
    get<T>(key: string): T | null;
    set<T>(key: string, value: T, ttlMs?: number): void;
    remove(key: string): void;
    clear(): void;
}
