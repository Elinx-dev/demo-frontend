// src/services/api/api.config.ts
 
import type { ApiServiceConfig } from "./api.types";
 
const normalizeBaseUrl = (value: string | undefined, label: string) => {
  const normalized = value?.trim().replace(/\/+$/, "");
 
  if (!normalized) {
    throw new Error(
      `Missing ${label}. Set it in .env.local or another Vite .env file.`,
    );
  }
 
  return normalized;
};
 
const defaultApiBaseUrl = normalizeBaseUrl(
  import.meta.env.VITE_DEFAULT_API_BASE_URL,
  "VITE_DEFAULT_API_BASE_URL",
);
 
const apiBaseRoute = import.meta.env.VITE_API_BASE_ROUTE?.trim().replace(/\/+$/, "") ?? "/api/v1/ipc";
const authBaseUrl =
  (import.meta.env.VITE_AUTH_API_BASE_URL?.trim() || defaultApiBaseUrl) + apiBaseRoute;
 
export const apiConfig: ApiServiceConfig = {
  /* =========================
   * Core
   * baseUrl already includes /api/v1 - all endpoint paths are relative to this.
   * Set VITE_DEFAULT_API_BASE_URL=http://localhost:5001 in your .env
   * Set VITE_AUTH_API_BASE_URL=http://localhost:5000 for auth endpoints.
   * =======================*/
  baseUrl: `${defaultApiBaseUrl}${apiBaseRoute}`,
  timeout: 100000,
 
  /* =========================
   * Endpoint Registry
   * Paths are relative to baseUrl - no need to repeat /api/v1 here.
   * =======================*/
  endpoints: {
    /* ===== AUTH ===== */
    login: {
      path: "/idam/login",
      method: "POST",
      requiresAuth: false,
      baseURL: authBaseUrl,
    },
    refreshToken: {
      path: "/auth/refresh",
      method: "POST",
      requiresAuth: false,
      baseURL: authBaseUrl,
    },
    verify_otp: {
      path: "/idam/verify_login_otp",
      method: "POST",
      requiresAuth: false,
      baseURL: authBaseUrl,
    },
    get_user_menu: {
      path: "/idam/get_user_menu",
      method: "GET",
      requiresAuth: true,
      baseURL: authBaseUrl,
    },
    /* ===== MODULE MASTER ===== */
    list_module_config: {
      path: "/module-config",
      method: "GET",
    },
    get_module_config: {
      path: "/module-config",
      method: "GET",
    },
    create_module_config: {
      path: "/module-config",
      method: "POST",
    },
    update_module_config: {
      path: "/module-config",
      method: "PUT",
    },
    delete_module_config: {
      path: "/module-config",
      method: "DELETE",
      
    },
 
    /* ===== COUNTRY MASTER ===== */
    list_country: {
      path: "/country",
      method: "GET",
    },
    create_country: {
      path: "/country",
      method: "POST",
    },
    update_country: {
      path: "/country",
      method: "PUT",
    },
    delete_country: {
      path: "/country",
      method: "DELETE",
    },
 
    /* ===== STATE MASTER ===== */
    list_state: {
      path: "/state",
      method: "GET",
    },
    create_state: {
      path: "/state",
      method: "POST",
    },
    update_state: {
      path: "/state",
      method: "PUT",
    },
    delete_state: {
      path: "/state",
      method: "DELETE",
    },
 
    /* ===== DISTRICT MASTER ===== */
    list_district: {
      path: "/district",
      method: "GET",
    },
    create_district: {
      path: "/district",
      method: "POST",
    },
    update_district: {
      path: "/district",
      method: "PUT",
    },
    delete_district: {
      path: "/district",
      method: "DELETE",
    },
 
    /* ===== AGREEMENT PHASE MASTER ===== */
    list_agreement_phase: {
      path: "/agreement_phase",
      method: "GET",
    },
    create_agreement_phase: {
      path: "/agreement_phase",
      method: "POST",
    },
    update_agreement_phase: {
      path: "/agreement_phase",
      method: "PUT",
    },
    delete_agreement_phase: {
      path: "/agreement_phase",
      method: "DELETE",
    },
    get_agreement_phase: {
      path: "/agreement_phase/{id}",
      method: "GET",
    },
 
    /* ===== AGREEMENT STATUS MASTER ===== */
    list_agreement_status: {
      path: "/agreement_status",
      method: "GET",
    },
    create_agreement_status: {
      path: "/agreement_status",
      method: "POST",
    },
    update_agreement_status: {
      path: "/agreement_status",
      method: "PUT",
    },
    delete_agreement_status: {
      path: "/agreement_status",
      method: "DELETE",
    },
    get_agreement_status: {
      path: "/agreement_status/{id}",
      method: "GET",
    },
 
    /* ===== AGREEMENT TYPE MASTER ===== */
    list_agreement_type: {
      path: "/agreement_type",
      method: "GET",
    },
    create_agreement_type: {
      path: "/agreement_type",
      method: "POST",
    },
    update_agreement_type: {
      path: "/agreement_type",
      method: "PUT",
    },
    delete_agreement_type: {
      path: "/agreement_type",
      method: "DELETE",
    },
    get_agreement_type: {
      path: "/agreement_type/{id}",
      method: "GET",
    },
 
    /* ===== ALERT THRESHOLD MASTER ===== */
    list_alert_threshold: {
      path: "/alert_threshold",
      method: "GET",
    },
    create_alert_threshold: {
      path: "/alert_threshold",
      method: "POST",
    },
    update_alert_threshold: {
      path: "/alert_threshold",
      method: "PUT",
    },
    delete_alert_threshold: {
      path: "/alert_threshold",
      method: "DELETE",
    },
    get_alert_threshold: {
      path: "/alert_threshold/{id}",
      method: "GET",
    },
 
    /* ===== CATALOG STATUS MASTER ===== */
    list_catalog_status: {
      path: "/catalog_status",
      method: "GET",
    },
    create_catalog_status: {
      path: "/catalog_status",
      method: "POST",
    },
    update_catalog_status: {
      path: "/catalog_status",
      method: "PUT",
    },
    delete_catalog_status: {
      path: "/catalog_status",
      method: "DELETE",
    },
    get_catalog_status: {
      path: "/catalog_status/{id}",
      method: "GET",
    },
 
    /* ===== CONTENT TYPE MASTER ===== */
    list_content_type: {
      path: "/content_type",
      method: "GET",
    },
    create_content_type: {
      path: "/content_type",
      method: "POST",
    },
    update_content_type: {
      path: "/content_type",
      method: "PUT",
    },
    delete_content_type: {
      path: "/content_type",
      method: "DELETE",
    },
    get_content_type: {
      path: "/content_type/{id}",
      method: "GET",
    },
 
    /* ===== CONTENT TYPE RIGHT MAP MASTER ===== */
    list_content_type_right_map: {
      path: "/content_type_right_map",
      method: "GET",
    },
    create_content_type_right_map: {
      path: "/content_type_right_map",
      method: "POST",
    },
    update_content_type_right_map: {
      path: "/content_type_right_map",
      method: "PUT",
    },
    delete_content_type_right_map: {
      path: "/content_type_right_map",
      method: "DELETE",
    },
    get_content_type_right_map: {
      path: "/content_type_right_map/{id}",
      method: "GET",
    },
 
    /* ===== COUNTERPARTY ROLE MASTER ===== */
    list_counterparty_role: {
      path: "/counterparty_role",
      method: "GET",
    },
    create_counterparty_role: {
      path: "/counterparty_role",
      method: "POST",
    },
    update_counterparty_role: {
      path: "/counterparty_role",
      method: "PUT",
    },
    delete_counterparty_role: {
      path: "/counterparty_role",
      method: "DELETE",
    },
    get_counterparty_role: {
      path: "/counterparty_role/{id}",
      method: "GET",
    },
 
    /* ===== DASHBOARD METRIC MASTER ===== */
    list_dashboard_metric: {
      path: "/dashboard_metric",
      method: "GET",
    },
    create_dashboard_metric: {
      path: "/dashboard_metric",
      method: "POST",
    },
    update_dashboard_metric: {
      path: "/dashboard_metric",
      method: "PUT",
    },
    delete_dashboard_metric: {
      path: "/dashboard_metric",
      method: "DELETE",
    },
    get_dashboard_metric: {
      path: "/dashboard_metric/{id}",
      method: "GET",
    },
 
    /* ===== DASHBOARD SECTION MASTER ===== */
    list_dashboard_section: {
      path: "/dashboard_section",
      method: "GET",
    },
    create_dashboard_section: {
      path: "/dashboard_section",
      method: "POST",
    },
    update_dashboard_section: {
      path: "/dashboard_section",
      method: "PUT",
    },
    delete_dashboard_section: {
      path: "/dashboard_section",
      method: "DELETE",
    },
    get_dashboard_section: {
      path: "/dashboard_section/{id}",
      method: "GET",
    },
 
    /* ===== DEAL STATUS MASTER ===== */
    list_deal_status: {
      path: "/deal_status",
      method: "GET",
    },
    create_deal_status: {
      path: "/deal_status",
      method: "POST",
    },
    update_deal_status: {
      path: "/deal_status",
      method: "PUT",
    },
    delete_deal_status: {
      path: "/deal_status",
      method: "DELETE",
    },
    get_deal_status: {
      path: "/deal_status/{id}",
      method: "GET",
    },
 
    /* ===== DEAL TYPE MASTER ===== */
    list_deal_type: {
      path: "/deal_type",
      method: "GET",
    },
    create_deal_type: {
      path: "/deal_type",
      method: "POST",
    },
    update_deal_type: {
      path: "/deal_type",
      method: "PUT",
    },
    delete_deal_type: {
      path: "/deal_type",
      method: "DELETE",
    },
    get_deal_type: {
      path: "/deal_type/{id}",
      method: "GET",
    },
 
    /* ===== DEPENDENCY TYPE MASTER ===== */
    list_dependency_type: {
      path: "/dependency_type",
      method: "GET",
    },
    create_dependency_type: {
      path: "/dependency_type",
      method: "POST",
    },
    update_dependency_type: {
      path: "/dependency_type",
      method: "PUT",
    },
    delete_dependency_type: {
      path: "/dependency_type",
      method: "DELETE",
    },
    get_dependency_type: {
      path: "/dependency_type/{id}",
      method: "GET",
    },
 
    /* ===== ENTITY TYPE MASTER ===== */
    list_entity_type: {
      path: "/entity_type",
      method: "GET",
    },
    create_entity_type: {
      path: "/entity_type",
      method: "POST",
    },
    update_entity_type: {
      path: "/entity_type",
      method: "PUT",
    },
    delete_entity_type: {
      path: "/entity_type",
      method: "DELETE",
    },
    get_entity_type: {
      path: "/entity_type/{id}",
      method: "GET",
    },
 
    /* ===== EXCLUSIVITY TYPE MASTER ===== */
    list_exclusivity_type: {
      path: "/exclusivity_type",
      method: "GET",
    },
    create_exclusivity_type: {
      path: "/exclusivity_type",
      method: "POST",
    },
    update_exclusivity_type: {
      path: "/exclusivity_type",
      method: "PUT",
    },
    delete_exclusivity_type: {
      path: "/exclusivity_type",
      method: "DELETE",
    },
    get_exclusivity_type: {
      path: "/exclusivity_type/{id}",
      method: "GET",
    },
 
    /* ===== LANGUAGE MASTER MASTER ===== */
    list_language_master: {
      path: "/language_master",
      method: "GET",
    },
    create_language_master: {
      path: "/language_master",
      method: "POST",
    },
    update_language_master: {
      path: "/language_master",
      method: "PUT",
    },
    delete_language_master: {
      path: "/language_master",
      method: "DELETE",
    },
    get_language_master: {
      path: "/language_master/{id}",
      method: "GET",
    },
 
    /* ===== MEDIA TYPE MASTER ===== */
    list_media_type: {
      path: "/media_type",
      method: "GET",
    },
    create_media_type: {
      path: "/media_type",
      method: "POST",
    },
    update_media_type: {
      path: "/media_type",
      method: "PUT",
    },
    delete_media_type: {
      path: "/media_type",
      method: "DELETE",
    },
    get_media_type: {
      path: "/media_type/{id}",
      method: "GET",
    },
 
    /* ===== OWNERSHIP TYPE MASTER ===== */
    list_ownership_type: {
      path: "/ownership_type",
      method: "GET",
    },
    create_ownership_type: {
      path: "/ownership_type",
      method: "POST",
    },
    update_ownership_type: {
      path: "/ownership_type",
      method: "PUT",
    },
    delete_ownership_type: {
      path: "/ownership_type",
      method: "DELETE",
    },
    get_ownership_type: {
      path: "/ownership_type/{id}",
      method: "GET",
    },
 
    /* ===== PLATFORM MASTER MASTER ===== */
    list_platform_master: {
      path: "/platform_master",
      method: "GET",
    },
    create_platform_master: {
      path: "/platform_master",
      method: "POST",
    },
    update_platform_master: {
      path: "/platform_master",
      method: "PUT",
    },
    delete_platform_master: {
      path: "/platform_master",
      method: "DELETE",
    },
    get_platform_master: {
      path: "/platform_master/{id}",
      method: "GET",
    },
 
    /* ===== PROFILE STATUS MASTER ===== */
    list_profile_status: {
      path: "/profile_status",
      method: "GET",
    },
    create_profile_status: {
      path: "/profile_status",
      method: "POST",
    },
    update_profile_status: {
      path: "/profile_status",
      method: "PUT",
    },
    delete_profile_status: {
      path: "/profile_status",
      method: "DELETE",
    },
    get_profile_status: {
      path: "/profile_status/{id}",
      method: "GET",
    },
 
    /* ===== READINESS STATUS MASTER ===== */
    list_readiness_status: {
      path: "/readiness_status",
      method: "GET",
    },
    create_readiness_status: {
      path: "/readiness_status",
      method: "POST",
    },
    update_readiness_status: {
      path: "/readiness_status",
      method: "PUT",
    },
    delete_readiness_status: {
      path: "/readiness_status",
      method: "DELETE",
    },
    get_readiness_status: {
      path: "/readiness_status/{id}",
      method: "GET",
    },
 
    /* ===== RESTRICTION TYPE MASTER ===== */
    list_restriction_type: {
      path: "/restriction_type",
      method: "GET",
    },
    create_restriction_type: {
      path: "/restriction_type",
      method: "POST",
    },
    update_restriction_type: {
      path: "/restriction_type",
      method: "PUT",
    },
    delete_restriction_type: {
      path: "/restriction_type",
      method: "DELETE",
    },
    get_restriction_type: {
      path: "/restriction_type/{id}",
      method: "GET",
    },
 
    /* ===== RIGHT MASTER MASTER ===== */
    list_right_master: {
      path: "/right_master",
      method: "GET",
    },
    create_right_master: {
      path: "/right_master",
      method: "POST",
    },
    update_right_master: {
      path: "/right_master",
      method: "PUT",
    },
    delete_right_master: {
      path: "/right_master",
      method: "DELETE",
    },
    get_right_master: {
      path: "/right_master/{id}",
      method: "GET",
    },
 
    /* ===== RIGHT STATUS MASTER ===== */
    list_right_status: {
      path: "/right_status",
      method: "GET",
    },
    create_right_status: {
      path: "/right_status",
      method: "POST",
    },
    update_right_status: {
      path: "/right_status",
      method: "PUT",
    },
    delete_right_status: {
      path: "/right_status",
      method: "DELETE",
    },
    get_right_status: {
      path: "/right_status/{id}",
      method: "GET",
    },
 
    /* ===== RIGHTS SCOPE MASTER ===== */
    list_rights_scope: {
      path: "/rights_scope",
      method: "GET",
    },
    create_rights_scope: {
      path: "/rights_scope",
      method: "POST",
    },
    update_rights_scope: {
      path: "/rights_scope",
      method: "PUT",
    },
    delete_rights_scope: {
      path: "/rights_scope",
      method: "DELETE",
    },
    get_rights_scope: {
      path: "/rights_scope/{id}",
      method: "GET",
    },
 
    /* ===== SCHEDULER EVENT TYPE MASTER ===== */
    list_scheduler_event_type: {
      path: "/scheduler_event_type",
      method: "GET",
    },
    create_scheduler_event_type: {
      path: "/scheduler_event_type",
      method: "POST",
    },
    update_scheduler_event_type: {
      path: "/scheduler_event_type",
      method: "PUT",
    },
    delete_scheduler_event_type: {
      path: "/scheduler_event_type",
      method: "DELETE",
    },
    get_scheduler_event_type: {
      path: "/scheduler_event_type/{id}",
      method: "GET",
    },
 
    /* ===== TENANT PROFILE TYPE MASTER ===== */
    list_tenant_profile_type: {
      path: "/tenant_profile_type",
      method: "GET",
    },
    create_tenant_profile_type: {
      path: "/tenant_profile_type",
      method: "POST",
    },
    update_tenant_profile_type: {
      path: "/tenant_profile_type",
      method: "PUT",
    },
    delete_tenant_profile_type: {
      path: "/tenant_profile_type",
      method: "DELETE",
    },
    get_tenant_profile_type: {
      path: "/tenant_profile_type/{id}",
      method: "GET",
    },
 
    /* ===== TERRITORY MASTER ===== */
    list_territory: {
      path: "/territory",
      method: "GET",
    },
    create_territory: {
      path: "/territory",
      method: "POST",
    },
    update_territory: {
      path: "/territory",
      method: "PUT",
    },
    delete_territory: {
      path: "/territory",
      method: "DELETE",
    },
    get_territory: {
      path: "/territory/{id}",
      method: "GET",
    },
 
    /* ===== TRANSFER TYPE MASTER ===== */
    list_transfer_type: {
      path: "/transfer_type",
      method: "GET",
    },
    create_transfer_type: {
      path: "/transfer_type",
      method: "POST",
    },
    update_transfer_type: {
      path: "/transfer_type",
      method: "PUT",
    },
    delete_transfer_type: {
      path: "/transfer_type",
      method: "DELETE",
    },
    get_transfer_type: {
      path: "/transfer_type/{id}",
      method: "GET",
    },
 
    /* ===== UTILISATION STATUS MASTER ===== */
    list_utilisation_status: {
      path: "/utilisation_status",
      method: "GET",
    },
    create_utilisation_status: {
      path: "/utilisation_status",
      method: "POST",
    },
    update_utilisation_status: {
      path: "/utilisation_status",
      method: "PUT",
    },
    delete_utilisation_status: {
      path: "/utilisation_status",
      method: "DELETE",
    },
    get_utilisation_status: {
      path: "/utilisation_status/{id}",
      method: "GET",
    },
 
    /* ===== WORK TYPE MASTER ===== */
    list_work_type: {
      path: "/work_type",
      method: "GET",
    },
    create_work_type: {
      path: "/work_type",
      method: "POST",
    },
    update_work_type: {
      path: "/work_type",
      method: "PUT",
    },
    delete_work_type: {
      path: "/work_type",
      method: "DELETE",
    },
    get_work_type: {
      path: "/work_type/{id}",
      method: "GET",
    },
 
    /* ===== WORK TYPE RIGHT MAP MASTER ===== */
    list_work_type_right_map: {
      path: "/work_type_right_map",
      method: "GET",
    },
    create_work_type_right_map: {
      path: "/work_type_right_map",
      method: "POST",
    },
    update_work_type_right_map: {
      path: "/work_type_right_map",
      method: "PUT",
    },
    delete_work_type_right_map: {
      path: "/work_type_right_map",
      method: "DELETE",
    },
    get_work_type_right_map: {
      path: "/work_type_right_map/{id}",
      method: "GET",
    },
    
 list_user_designation: {
      path: "/user_designation",
      method: "GET",
    },
    create_user_designation: {
      path: "/user_designation",
      method: "POST",
    },
    update_user_designation: {
      path: "/user_designation",
      method: "PUT",
    },
    delete_user_designation: {
      path: "/user_designation",
      method: "DELETE",
    },
    get_user_designation: {
      path: "/user_designation/{id}",
      method: "GET",
    },
 
 
    //Profile Onboarding APIs
//     addressFieldConfig: {
//   path: "/address_field_config/get_address_field_config",
//   method: "POST",
// }
  },
 
  /* =========================
   * Resilience
   * =======================*/
  circuitBreaker: {
    errorThreshold: 3,
    resetTimeout: 30000,
  },
 
  retryConfig: {
    maxRetries: 3,
    delayMs: 1000,
    statusCodesToRetry: [408, 500, 502, 503, 504],
  },
 
  auth: {
    refreshEndpoint: "/auth/refresh",
  },
};
 