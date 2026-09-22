// src/services/api/api.types.ts
import type { ZodSchema } from "zod";

/* =========================
 * HTTP
 * =======================*/

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/* =========================
 * Endpoint Contract
 * =======================*/

export interface EndpointConfig<TResponse = unknown> {
  path: string;
  method: HttpMethod;
  requiresAuth?: boolean;
  responseSchema?: ZodSchema<TResponse>;
  baseURL?: string;
}

/* =========================
 * Retry & Circuit Breaker
 * =======================*/

export interface RetryConfig {
  maxRetries: number;
  delayMs: number;
  statusCodesToRetry: number[];
}

export interface CircuitBreakerConfig {
  errorThreshold: number;
  resetTimeout: number;
}

/* =========================
 * Api Service Config
 * =======================*/

export interface ApiServiceConfig {
  baseUrl: string;
  timeout?: number;

  endpoints: Record<string, EndpointConfig<any>>;

  retryConfig: RetryConfig;
  circuitBreaker: CircuitBreakerConfig;

  auth?: {
    refreshEndpoint: string;
  };
}

/* =========================
 * Request Options
 * =======================*/

export interface RequestOptions<TResponse = unknown> {
  method: HttpMethod;
  url: string;
  data?: unknown;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  skipAuth?: boolean;
  baseURL?: string;

  /** ✅ Runtime contract validation */
  responseSchema?: ZodSchema<TResponse>;
}
