"use client";
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '../common/hooks/useManagement';
import { useAuthState } from '../auth';

interface ProtectedComponentProps {
  children: React.ReactNode;
  permissions?: string | string[];
  fallback?: React.ReactNode;
  requireAll?: boolean; // Si true, requiere todos los permisos. Si false, requiere al menos uno
}

/**
 * Componente que protege contenido basado en permisos del usuario
 */
export function ProtectedComponent({
  children,
  permissions = [],
  fallback = null,
  requireAll = false
}: ProtectedComponentProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Si no se especifican permisos, mostrar el contenido
  if (!permissions || (Array.isArray(permissions) && permissions.length === 0)) {
    return <>{children}</>;
  }

  // Convertir a array si es string
  const permissionArray = Array.isArray(permissions) ? permissions : [permissions];

  // Verificar permisos
  let hasAccess = false;

  if (requireAll) {
    hasAccess = hasAllPermissions(permissionArray);
  } else {
    hasAccess = hasAnyPermission(permissionArray);
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  permissions?: string | string[];
  redirectTo?: string;
  requireAll?: boolean;
}

/**
 * Componente que protege rutas basado en permisos del usuario
 */
export function ProtectedRoute({
  children,
  permissions = [],
  redirectTo = '/login',
  requireAll = false
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated, isInitialized } = useAuthState();
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading: permissionsLoading } = usePermissions();

  const loading = authLoading || permissionsLoading;

  // Redirigir a login si no está autenticado después de inicializar
  useEffect(() => {
    if (isInitialized && !isAuthenticated && !authLoading) {
      router.replace(redirectTo);
    }
  }, [isInitialized, isAuthenticated, authLoading, router, redirectTo]);

  // Mostrar loading mientras se inicializa o verifica autenticación
  if (!isInitialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, no mostrar nada (la redirección se maneja en useEffect)
  if (!isAuthenticated) {
    return null;
  }

  // Si no se especifican permisos, permitir acceso
  if (!permissions || (Array.isArray(permissions) && permissions.length === 0)) {
    return <>{children}</>;
  }

  // Convertir a array si es string
  const permissionArray = Array.isArray(permissions) ? permissions : [permissions];

  // Verificar permisos
  let hasAccess = false;

  if (requireAll) {
    hasAccess = hasAllPermissions(permissionArray);
  } else {
    hasAccess = hasAnyPermission(permissionArray);
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full text-center p-8">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
          <p className="text-gray-600 mb-6">
            No tienes permisos suficientes para acceder a esta página.
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

interface AdminOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Componente que solo muestra contenido a administradores
 */
export function AdminOnly({ children, fallback = null }: AdminOnlyProps) {
  const { isAdmin, loading } = usePermissions();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return isAdmin() ? <>{children}</> : <>{fallback}</>;
}

interface SuperAdminOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Componente que solo muestra contenido a super administradores
 */
export function SuperAdminOnly({ children, fallback = null }: SuperAdminOnlyProps) {
  const { isSuperAdmin, loading } = usePermissions();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return isSuperAdmin() ? <>{children}</> : <>{fallback}</>;
}

interface PermissionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  permissions?: string | string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
}

/**
 * Botón que se muestra solo si el usuario tiene los permisos necesarios
 */
export function PermissionButton({
  children,
  permissions = [],
  requireAll = false,
  fallback = null,
  ...buttonProps
}: PermissionButtonProps) {
  return (
    <ProtectedComponent
      permissions={permissions}
      requireAll={requireAll}
      fallback={fallback}
    >
      <button {...buttonProps}>
        {children}
      </button>
    </ProtectedComponent>
  );
}
