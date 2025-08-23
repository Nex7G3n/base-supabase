"use client";

import { useEffect } from 'react';
import { useAuthStore } from '../store/auth.store';
import { usePermissions } from '../store/permissions.store';

/**
 * Hook principal para autenticación y permisos
 * Combina la funcionalidad de autenticación con el manejo de permisos
 */
export const useAuth = () => {
  // Estado de autenticación
  const {
    user,
    loading: authLoading,
    error: authError,
    isInitialized,
    isCheckingAuth,
    login,
    register,
    loginWithGoogle,
    logout,
    checkAuth,
    clearError,
    hasRole,
    hasAnyRole,
    hasModuleAccess
  } = useAuthStore();

  // Inicializar autenticación si no está inicializada
  useEffect(() => {
    if (!isInitialized && !isCheckingAuth) {
      checkAuth();
    }
  }, [isInitialized, isCheckingAuth, checkAuth]);

  // Estado y funciones de permisos
  const {
    permissions,
    detailedPermissions,
    modules,
    accessibleModules,
    isLoaded: permissionsLoaded,
    loading: permissionsLoading,
    error: permissionsError,
    hasPermission,
    hasModuleAccess: hasModuleAccessSync,
    getModulePermissions,
    loadUserPermissions,
    refreshIfNeeded,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canExecute,
    hasAnyPermission,
    hasAllPermissions,
    getModulesByPath,
    getActiveModules
  } = usePermissions();

  // Estados combinados
  const isAuthenticated = !!user;
  const loading = authLoading || permissionsLoading;
  const error = authError || permissionsError;

  // Funciones de conveniencia para roles comunes
  const isAdmin = () => hasAnyRole(['admin', 'super_admin']);
  const isSuperAdmin = () => hasRole('super_admin');
  const isManager = () => hasAnyRole(['manager', 'admin', 'super_admin']);

  // Funciones de permisos específicos por módulo
  const canManageUsers = () => hasPermission('users.manage') || isAdmin();
  const canManageRoles = () => hasPermission('roles.manage') || isSuperAdmin();
  const canManagePermissions = () => hasPermission('permissions.manage') || isSuperAdmin();
  const canManageModules = () => hasPermission('modules.manage') || isSuperAdmin();
  const canAccessDashboard = () => hasPermission('dashboard_read') || isAuthenticated;
  const canViewReports = () => hasPermission('reports_read') || isManager();

  // Funciones para refrescar datos
  const refreshUserData = async () => {
    if (user) {
      await Promise.all([
        checkAuth(),
        refreshIfNeeded(user.id)
      ]);
    }
  };

  // Función para cargar permisos manualmente
  const reloadPermissions = async (forceReload = true) => {
    if (user) {
      await loadUserPermissions(user.id, forceReload);
    }
  };

  return {
    // Estado de autenticación
    user,
    isAuthenticated,
    isInitialized,
    isCheckingAuth,
    loading,
    error,

    // Estado de permisos
    permissions,
    detailedPermissions,
    modules,
    accessibleModules,
    permissionsLoaded,

    // Acciones de autenticación
    login,
    register,
    loginWithGoogle,
    logout,
    checkAuth,
    clearError,

    // Funciones de verificación de roles
    hasRole,
    hasAnyRole,
    isAdmin,
    isSuperAdmin,
    isManager,

    // Funciones de verificación de permisos
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasModuleAccess,
    hasModuleAccessSync,

    // Funciones CRUD por módulo
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canExecute,

    // Funciones de permisos específicos
    canManageUsers,
    canManageRoles,
    canManagePermissions,
    canManageModules,
    canAccessDashboard,
    canViewReports,

    // Funciones de gestión de módulos
    getModulePermissions,
    getModulesByPath,
    getActiveModules,

    // Funciones de actualización
    refreshUserData,
    reloadPermissions,
    refreshIfNeeded: () => user ? refreshIfNeeded(user.id) : Promise.resolve(),

    // Funciones de utilidad
    getUserName: () => {
      if (!user) return '';
      return user.first_name && user.last_name 
        ? `${user.first_name} ${user.last_name}`
        : user.first_name || user.email?.split('@')[0] || 'Usuario';
    },

    getUserInitials: () => {
      if (!user) return 'U';
      if (user.first_name && user.last_name) {
        return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
      }
      return (user.first_name?.[0] || user.email?.[0] || 'U').toUpperCase();
    },

    // Debug
    debug: {
      authStore: { user, loading: authLoading, error: authError, isInitialized },
      permissionsStore: { 
        permissions, 
        isLoaded: permissionsLoaded, 
        loading: permissionsLoading, 
        error: permissionsError 
      }
    }
  };
};

/**
 * Hook solo para acciones de autenticación (sin permisos)
 */
export const useAuthActions = () => {
  const { 
    login, 
    register, 
    loginWithGoogle, 
    logout, 
    checkAuth, 
    clearError 
  } = useAuthStore();
  
  return {
    login,
    register,
    loginWithGoogle,
    logout,
    checkAuth,
    clearError
  };
};

/**
 * Hook solo para el estado de autenticación (sin permisos)
 */
export const useAuthState = () => {
  const { user, loading, error, isInitialized, isCheckingAuth } = useAuthStore();
  
  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isInitialized,
    isCheckingAuth
  };
};

/**
 * Hook para inicializar la autenticación en el layout principal
 */
export const useAuthInit = () => {
  const { checkAuth, isInitialized } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) {
      checkAuth();
    }
  }, [checkAuth, isInitialized]);

  return { checkAuth };
};
