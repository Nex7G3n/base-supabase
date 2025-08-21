"use client";

import { useEffect } from 'react';
import { useAuthStore } from '../store/auth.store';
import { usePermissionsStore } from '../store/permissions.store';

/**
 * Hook simplificado para evitar loops infinitos
 */
export const useAuthSimple = () => {
  // Solo el estado básico del auth store
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
    hasAnyRole
  } = useAuthStore();

  // Solo el estado básico del permissions store
  const {
    permissions,
    modules,
    accessibleModules,
    isLoaded: permissionsLoaded,
    loading: permissionsLoading,
    error: permissionsError,
    hasPermission,
    loadUserPermissions,
    clearPermissions
  } = usePermissionsStore();

  // Inicializar autenticación una sola vez
  useEffect(() => {
    if (!isInitialized && !isCheckingAuth) {
      console.log('🔵 Inicializando autenticación...');
      checkAuth();
    }
  }, [isInitialized, isCheckingAuth, checkAuth]);

  // Cargar permisos cuando el usuario esté disponible
  useEffect(() => {
    if (user && !permissionsLoaded && !permissionsLoading) {
      console.log('🟢 Cargando permisos para usuario:', user.id);
      loadUserPermissions(user.id);
    }
  }, [user, permissionsLoaded, permissionsLoading, loadUserPermissions]);

  // Limpiar permisos cuando no hay usuario
  useEffect(() => {
    if (!user && permissionsLoaded) {
      console.log('🔴 Limpiando permisos - no hay usuario');
      clearPermissions();
    }
  }, [user, permissionsLoaded, clearPermissions]);

  // Estados combinados
  const isAuthenticated = !!user;
  const loading = authLoading || (isAuthenticated && permissionsLoading);
  const error = authError || permissionsError;

  // Funciones básicas
  const isAdmin = () => hasAnyRole(['admin', 'super_admin']);
  const isSuperAdmin = () => hasRole('super_admin');

  const getUserName = () => {
    if (!user) return '';
    return user.first_name && user.last_name 
      ? `${user.first_name} ${user.last_name}`
      : user.first_name || user.email?.split('@')[0] || 'Usuario';
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return (user.first_name?.[0] || user.email?.[0] || 'U').toUpperCase();
  };

  return {
    // Estado básico
    user,
    isAuthenticated,
    isInitialized,
    loading,
    error,
    
    // Estado de permisos
    permissions,
    modules,
    accessibleModules,
    permissionsLoaded,

    // Acciones básicas
    login,
    register,
    loginWithGoogle,
    logout,
    clearError,

    // Verificaciones básicas
    hasPermission,
    hasRole,
    hasAnyRole,
    isAdmin,
    isSuperAdmin,

    // Utilidades
    getUserName,
    getUserInitials,

    // Debug
    debug: {
      authLoading,
      permissionsLoading,
      isCheckingAuth,
      authError,
      permissionsError
    }
  };
};
