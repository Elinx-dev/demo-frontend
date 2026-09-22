// src/services/api/apiService.ts

import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import type {
  ApiServiceConfig,
  RequestOptions,
  EndpointConfig,
} from "./api.types";
import { apiConfig } from "./api.config";

/* =========================
 * Error Classes
 * =======================*/
export class APIError extends Error {
  status: number;
  code: string;
  data?: unknown;
  constructor(
    status: number,
    message: string,
    code = "API_ERROR",
    data?: unknown,
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.data = data;
  }
}
export class NetworkError extends APIError {
  constructor() {
    super(0, "Network error", "NETWORK_ERROR");
  }
}
export class TimeoutError extends APIError {
  constructor() {
    super(408, "Request timeout", "TIMEOUT");
  }
}
export class UnauthorizedError extends APIError {
  constructor() {
    super(401, "Unauthorized", "UNAUTHORIZED");
  }
}
export class ContractViolationError extends APIError {
  constructor(issues: unknown) {
    super(
      500,
      "API response contract violated",
      "SCHEMA_VALIDATION_ERROR",
      issues,
    );
  }
}

/* =========================
 * Circuit Breaker
 * =======================*/
class SimpleCircuitBreaker {
  private failures = 0;
  private lastFailure = 0;
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";
  private threshold: number;
  private timeout: number;

  constructor(threshold: number, timeout: number) {
    this.threshold = threshold;
    this.timeout = timeout;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailure > this.timeout) {
        this.state = "HALF_OPEN";
      } else {
        throw new APIError(
          503,
          "Service temporarily unavailable",
          "CIRCUIT_OPEN",
        );
      }
    }
    try {
      const result = await fn();
      this.failures = 0;
      this.state = "CLOSED";
      return result;
    } catch (err) {
      this.failures++;
      this.lastFailure = Date.now();
      if (this.failures >= this.threshold) this.state = "OPEN";
      throw err;
    }
  }
}

/* =========================
 * ApiService
 * =======================*/
export class ApiService {
  private axiosInstance: AxiosInstance;
  private breakers = new Map<string, SimpleCircuitBreaker>();
  private token: string | null = null;
  private sessionUserId: string | null = null;
  private config: ApiServiceConfig;

  constructor(config: ApiServiceConfig) {
    this.config = config;
    this.axiosInstance = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout,
      headers: { "Content-Type": "application/json" },
    });
    this.setupInterceptors();
    // If a JWT was stored in localStorage (by login), apply it so all requests include the header
    try {
      const stored = localStorage.getItem("auth.jwt");
      if (stored) this.setAuthToken(stored);
    } catch {
      // ignore storage issues
    }
  }

  /* =========================
   * Auth Token
   * =======================*/
  setAuthToken(token: string | null) {
    this.token = token;
    if (token) {
      this.axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete this.axiosInstance.defaults.headers.common.Authorization;
    }
  }

  /* =========================
   * Session User
   * Call after login: apiService.setSessionUser(userId)
   * =======================*/
  setSessionUser(userId: string | null) {
    this.sessionUserId = userId;
  }

  getEndpointPath(key: string): string {
    const ep = this.config.endpoints[key];
    if (!ep) throw new Error(`Endpoint "${key}" not registered in api.config`);
    return ep.path;
  }

  /* =========================
   * Interceptors
   * =======================*/
  private setupInterceptors() {
    this.axiosInstance.interceptors.request.use(
      (cfg: InternalAxiosRequestConfig & { skipAuth?: boolean }) => {
        // ── Auth token ────────────────────────────────────────────────
        if (!cfg.skipAuth && this.token) {
          cfg.headers.Authorization = `Bearer ${this.token}`;
        }

        // ── sessionUserId ─────────────────────────────────────────────
        if (this.sessionUserId) {
          const method = (cfg.method ?? "GET").toUpperCase();

          if (method === "GET" || method === "DELETE") {
            // Append to query string
            const separator = (cfg.url ?? "").includes("?") ? "&" : "?";
            cfg.url = `${cfg.url ?? ""}${separator}sessionUserId=${encodeURIComponent(this.sessionUserId)}`;
          } else {
            // POST / PUT / PATCH - inject into body
            // cfg.data can be: undefined, plain object, or JSON string
            // We normalise to object → merge → keep as object
            // (axios serialises plain objects to JSON automatically)

            let existing: Record<string, unknown> = {};

            if (cfg.data) {
              if (typeof cfg.data === "string") {
                // Already serialised - parse it back
                try {
                  existing = JSON.parse(cfg.data);
                } catch {
                  /* leave empty */
                }
              } else if (
                typeof cfg.data === "object" &&
                !(cfg.data instanceof FormData)
              ) {
                existing = cfg.data as Record<string, unknown>;
              } else if (cfg.data instanceof FormData) {
                // FormData - can't merge, use header fallback
                cfg.headers["x-session-user-id"] = this.sessionUserId;
                return cfg;
              }
            }

            // Merge sessionUserId and assign back as plain object
            // so axios serialises it cleanly
            cfg.data = {
              sessionUserId: this.sessionUserId,
              ...existing,
            };
          }
        }

        return cfg;
      },
    );

    this.axiosInstance.interceptors.response.use(
      (res) => res,
      (error: AxiosError) => {
        if (!error.response) throw new NetworkError();
        if (error.code === "ECONNABORTED") throw new TimeoutError();
        if (error.response.status === 401) throw new UnauthorizedError();
        throw new APIError(
          error.response.status,
          (error.response.data as Record<string, string>)?.message ||
            "API Error",
          "API_ERROR",
          error.response.data,
        );
      },
    );
  }

  /* =========================
   * Circuit Breaker
   * =======================*/
  private getBreaker(key: string) {
    if (!this.breakers.has(key)) {
      this.breakers.set(
        key,
        new SimpleCircuitBreaker(
          this.config.circuitBreaker.errorThreshold,
          this.config.circuitBreaker.resetTimeout,
        ),
      );
    }
    return this.breakers.get(key)!;
  }

  /* =========================
   * Raw Request
   * =======================*/
  private async rawRequest(cfg: AxiosRequestConfig): Promise<unknown> {
    const res = await this.axiosInstance.request(cfg);
    return res.data;
  }

  async get<T>(url: string) {
    return this.request<T>({ method: "GET", url });
  }
  // Add after the existing get() method:
  async getWithParams<T>(url: string, params?: Record<string, any>) {
    if (!params || Object.keys(params).length === 0) {
      return this.request<T>({ method: "GET", url });
    }
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null && v !== "")
        .map(([k, v]) => [k, String(v)]),
    ).toString();
    return this.request<T>({ method: "GET", url: `${url}?${qs}` });
  }
  async post<T>(url: string, data?: unknown) {
    return this.request<T>({ method: "POST", url, data });
  }
  async put<T>(url: string, data?: unknown) {
    return this.request<T>({ method: "PUT", url, data });
  }
  async patch<T>(url: string, data?: unknown) {
    return this.request<T>({ method: "PATCH", url, data });
  } // ← add this
  async delete<T>(url: string) {
    return this.request<T>({ method: "DELETE", url });
  }

  /* =========================
   * Unified Request + Validation
   * =======================*/
  async request<T>(options: RequestOptions<T>): Promise<T> {
    const breaker = this.getBreaker(options.url);
    const retries = this.config.retryConfig.maxRetries;
    const delay = this.config.retryConfig.delayMs;
    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await breaker.execute(async () => {
          const data = await this.rawRequest({
            ...options,
            baseURL: options.baseURL ?? this.config.baseUrl,
          });
          if (options.responseSchema) {
            const parsed = options.responseSchema.safeParse(data);
            if (!parsed.success)
              throw new ContractViolationError(parsed.error.format());
            return parsed.data;
          }
          return data as T;
        });
      } catch (err) {
        lastError = err;
        if (
          err instanceof UnauthorizedError &&
          this.config.auth?.refreshEndpoint
        ) {
          const refreshed = await this.tryRefreshToken();
          if (refreshed) continue;
        }
        if (attempt < retries) await this.sleep(delay);
      }
    }
    throw lastError;
  }

  /* =========================
   * Token Refresh
   * =======================*/
  private async tryRefreshToken(): Promise<boolean> {
    try {
      const endpoint = this.config.auth?.refreshEndpoint;
      if (!endpoint) return false;
      const res = await this.axiosInstance.post(endpoint, {}, {
        skipAuth: true,
      } as AxiosRequestConfig);
      const newToken = (res.data as Record<string, string>)?.token;
      if (newToken) {
        this.setAuthToken(newToken);
        return true;
      }
      return false;
    } catch {
      this.setAuthToken(null);
      return false;
    }
  }

  /* =========================
   * Endpoint Registry Call
   * =======================*/
  async callEndpoint<T>(
    key: string,
    options?: Partial<RequestOptions<T>>,
  ): Promise<T> {
    const ep = this.config.endpoints[key] as EndpointConfig<T>;
    if (!ep) throw new Error(`Endpoint "${key}" not found`);

    // By default, include auth token on requests unless caller explicitly sets skipAuth=true
    const skipAuthFlag = options?.skipAuth === true ? true : false;

    return this.request<T>({
      method: ep.method,
      url: ep.path,
      baseURL: ep.baseURL,
      responseSchema: ep.responseSchema,
      skipAuth: skipAuthFlag,
      ...options,
    });
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/* =========================
 * Singleton
 * =======================*/
export const apiService = new ApiService(apiConfig);
