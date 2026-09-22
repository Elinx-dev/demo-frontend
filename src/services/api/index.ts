// src/services/api/index.ts

import { ApiService } from "./apiService";
import { apiConfig } from "./api.config";

export const apiService = new ApiService(apiConfig);

export * from "./api.types";
export * from "./apiService";
