"use client";
import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { AuthUser } from '../../domain/types/auth.interfaces';
import { useAuthStore } from '../store/auth.store';
import { usePermissionsStore } from '../store/permissions.store';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (roleName: string) => boolean;
  hasAnyRole: (roleNames: string[]) => boolean;
  hasModuleAccess: (modulePath: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { 
    user, 
    loading, 
    checkAuth, 
    logout, 
    hasPermission: authHasPermission,
    hasRole,
    hasAnyRole,
    hasModuleAccess,
    isInitialized
  } = useAuthStore();

  const { hasPermission: permissionsHasPermission } = usePermissionsStore();

  const refreshUser = async () => {
    await checkAuth();
  };

  const signOut = async () => {
    await logout();
  };

  // Usar la función de permisos del store de permisos (más optimizada)
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    // Priorizar el store de permisos si está cargado
    const permissionsStore = usePermissionsStore.getState();
    if (permissionsStore.isLoaded) {
      return permissionsHasPermission(permission);
    }
    // Fallback al store de auth
    return authHasPermission(permission);
  };

  useEffect(() => {
    // Solo inicializar una vez al montar el provider y si no está ya inicializado
    if (!isInitialized) {
      checkAuth();
    }
  }, [checkAuth, isInitialized]);

  const value: AuthContextType = {
    user,
    loading,
    signOut,
    refreshUser,
    hasPermission,
    hasRole,
    hasAnyRole,
    hasModuleAccess,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useAuthUser() {
  const { user } = useAuth();
  return user;
}

export function useAuthLoading() {
  const { loading } = useAuth();
  return loading;
}
