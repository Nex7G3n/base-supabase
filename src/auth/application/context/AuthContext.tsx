"use client";
import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { AuthUser } from '../../domain/types/auth.interfaces';
import { PermissionService } from '../services/permission.service';
import { useAuthStore } from '../store/auth.store';

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
  const { user, loading, checkAuth, logout } = useAuthStore();

  const refreshUser = async () => {
    await checkAuth();
  };

  const signOut = async () => {
    await logout();
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission);
  };

  const hasRole = (roleName: string): boolean => {
    if (!user) return false;
    return user.roles.some(role => role.name === roleName);
  };

  const hasAnyRole = (roleNames: string[]): boolean => {
    if (!user) return false;
    return user.roles.some(role => roleNames.includes(role.name));
  };

  const hasModuleAccess = async (modulePath: string): Promise<boolean> => {
    if (!user) return false;
    return await PermissionService.userHasModuleAccess(user.id, modulePath);
  };

  useEffect(() => {
    // Solo inicializar una vez al montar el provider
    checkAuth();
  }, []);

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
