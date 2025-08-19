import React, { ReactNode } from 'react';
import { usePermissions } from '../hooks/usePermissions';

interface ProtectedComponentProps {
  children: ReactNode;
  permission?: string;
  permissions?: string[];
  role?: string;
  roles?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  adminOnly?: boolean;
  superAdminOnly?: boolean;
}

/**
 * Componente para proteger contenido basado en permisos y roles
 */
export function ProtectedComponent({
  children,
  permission,
  permissions,
  role,
  roles,
  requireAll = false,
  fallback = null,
  adminOnly = false,
  superAdminOnly = false,
}: ProtectedComponentProps) {
  const {
    checkPermission,
    checkRole,
    checkAnyRole,
    checkMultiplePermissions,
    isAdmin,
    isSuperAdmin,
  } = usePermissions();

  // Verificar acceso de super admin
  if (superAdminOnly && !isSuperAdmin()) {
    return <>{fallback}</>;
  }

  // Verificar acceso de admin
  if (adminOnly && !isAdmin()) {
    return <>{fallback}</>;
  }

  // Verificar permiso único
  if (permission && !checkPermission(permission)) {
    return <>{fallback}</>;
  }

  // Verificar múltiples permisos
  if (permissions && !checkMultiplePermissions(permissions, requireAll)) {
    return <>{fallback}</>;
  }

  // Verificar rol único
  if (role && !checkRole(role)) {
    return <>{fallback}</>;
  }

  // Verificar múltiples roles
  if (roles && !checkAnyRole(roles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Hook para verificar si el contenido debe ser mostrado
 */
export function useCanShow({
  permission,
  permissions,
  role,
  roles,
  requireAll = false,
  adminOnly = false,
  superAdminOnly = false,
}: Omit<ProtectedComponentProps, 'children' | 'fallback'>): boolean {
  const {
    checkPermission,
    checkRole,
    checkAnyRole,
    checkMultiplePermissions,
    isAdmin,
    isSuperAdmin,
  } = usePermissions();

  // Verificar acceso de super admin
  if (superAdminOnly) {
    return isSuperAdmin();
  }

  // Verificar acceso de admin
  if (adminOnly) {
    return isAdmin();
  }

  // Verificar permiso único
  if (permission) {
    return checkPermission(permission);
  }

  // Verificar múltiples permisos
  if (permissions) {
    return checkMultiplePermissions(permissions, requireAll);
  }

  // Verificar rol único
  if (role) {
    return checkRole(role);
  }

  // Verificar múltiples roles
  if (roles) {
    return checkAnyRole(roles);
  }

  // Si no se especifican restricciones, mostrar el contenido
  return true;
}
