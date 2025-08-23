"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/auth.store';

/**
 * Hook para manejar acciones de autenticación
 */
export const useAuthActions = () => {
  const { 
    login, 
    register, 
    loginWithGoogle, 
    logout, 
    checkAuth, 
    clearError,
    hasPermission,
    hasRole,
    hasAnyRole,
    hasModuleAccess
  } = useAuthStore();
  
  return {
    login,
    register,
    loginWithGoogle,
    logout,
    checkAuth,
    clearError,
    hasPermission,
    hasRole,
    hasAnyRole,
    hasModuleAccess
  };
};

/**
 * Hook para obtener el estado de autenticación
 */
export const useAuthState = () => {
  const { user, loading, error, isInitialized } = useAuthStore();
  
  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isInitialized
  };
};

/**
 * Hook para proteger rutas que requieren autenticación
 */
export const useProtectedRoute = (redirectTo: string = '/login') => {
  const { user, loading, checkAuth, isInitialized, isCheckingAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Solo hacer checkAuth si no está inicializado y no está ya verificando
    if (!isInitialized && !isCheckingAuth) {
      checkAuth();
    }
  }, [checkAuth, isInitialized, isCheckingAuth]);

  useEffect(() => {
    if (isInitialized && !loading && !user) {
      router.push(redirectTo);
    }
  }, [user, loading, router, redirectTo, isInitialized]);

  return { user, loading, isAuthenticated: !!user };
};

/**
 * Hook para redirigir usuarios autenticados (útil en páginas de login/register)
 */
export const useRedirectIfAuthenticated = (redirectTo: string = '/platform') => {
  const { user, loading, checkAuth, isInitialized, isCheckingAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Solo hacer checkAuth si no está inicializado y no está ya verificando
    if (!isInitialized && !isCheckingAuth) {
      checkAuth();
    }
  }, [checkAuth, isInitialized, isCheckingAuth]);

  useEffect(() => {
    if (isInitialized && !loading && user) {
      router.push(redirectTo);
    }
  }, [user, loading, router, redirectTo, isInitialized]);

  return { user, loading, isAuthenticated: !!user };
};

/**
 * Hook para inicializar la autenticación en el layout principal
 */
export const useAuthInit = () => {
  const { checkAuth, setLoading, isInitialized, isCheckingAuth } = useAuthStore();

  useEffect(() => {
    // Solo inicializar si no está ya inicializado y no está verificando
    if (!isInitialized && !isCheckingAuth) {
      checkAuth();
    }
  }, [checkAuth, isInitialized, isCheckingAuth]);

  return { checkAuth, setLoading };
};
