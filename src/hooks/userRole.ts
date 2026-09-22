// src/hooks/useRole.ts
import { SecureStorage } from "@/services/storage";
import type { AuthSession } from "@/services/auth/authService";

export const useRole = () => {
  const session = SecureStorage.get<AuthSession>("auth.session");

  // Primary source: explicit roleScope + designation fields
  // Fallback: parse from uiMode string (handles old sessions & missing DB fields)
  const resolveFromUiMode = (uiMode: string | null) => {
    switch (uiMode) {
      case 'platform_admin':   return { scope: 'PLATFORM' as const, designation: 'super_admin' as const };
      case 'platform_manager': return { scope: 'PLATFORM' as const, designation: 'manager'     as const };
      case 'platform_analyst': return { scope: 'PLATFORM' as const, designation: 'analyst'     as const };
      case 'user_admin':       return { scope: 'USER'     as const, designation: 'super_admin' as const };
      case 'user_manager':     return { scope: 'USER'     as const, designation: 'manager'     as const };
      case 'user_analyst':     return { scope: 'USER'     as const, designation: 'analyst'     as const };
      default:                 return { scope: 'USER'     as const, designation: 'super_admin' as const };
    }
  };

  // Use explicit fields if present, otherwise fall back to uiMode parsing
  const fallback = resolveFromUiMode(session?.uiMode ?? null);
  const scope       = session?.roleScope   ?? fallback.scope;
  const designation = session?.designation ?? fallback.designation;

  const isPlatform   = scope === 'PLATFORM';
  const isUser       = scope === 'USER';
  const isSuperAdmin = designation === 'super_admin';
  const isManager    = designation === 'manager';
  const isAnalyst    = designation === 'analyst';

  const isPlatformAdmin   = isPlatform && isSuperAdmin;
  const isPlatformManager = isPlatform && isManager;
  const isPlatformAnalyst = isPlatform && isAnalyst;
  const isUserAdmin       = isUser && isSuperAdmin;
  const isUserManager     = isUser && isManager;
  const isUserAnalyst     = isUser && isAnalyst;

  return {
    scope, designation,
    isPlatform, isUser,
    isPlatformAdmin, isPlatformManager, isPlatformAnalyst,
    isUserAdmin, isUserManager, isUserAnalyst,

    canCreateProject:     isUser,
    canEditProject:       isUser,
    canViewProject:       isUser,
    canDeleteProject:     isUserAdmin,

    canCreateManagerUser: isUserAdmin,
    canDeleteManagerUser: isUserAdmin,
    canCreateAnalystUser: isUserAdmin || isUserManager,
    canDeleteAnalystUser: isUserAdmin || isUserManager,

    canEditUser: (targetDesignation: string) => {
      const t = targetDesignation?.toLowerCase();
      if (isUserAdmin)   return true;
      if (isUserManager) return t === 'analyst';
      return false;
    },
    canDeleteUser: (targetDesignation: string) => {
      const t = targetDesignation?.toLowerCase();
      if (isUserAdmin)   return true;
      if (isUserManager) return t === 'analyst';
      return false;
    },

    canAccessTenantSettings: isUserAdmin,
    canAccessWorkbench:      isPlatform,
    canAssignToAnalyst:      isPlatformAdmin || isPlatformManager,
    canReviewItems:          isPlatformAdmin || isPlatformAnalyst,
  };
};