import { useAuth } from '../context/AuthContext';
import { PermissionService } from '../services/permission.service';
import { RoleService } from '../services/role.service';

/**
 * Hook personalizado para manejo de permisos
 */
export function usePermissions() {
  const { user, hasPermission, hasRole, hasAnyRole, hasModuleAccess } = useAuth();

  /**
   * Verificar si el usuario tiene un permiso específico
   */
  const checkPermission = (permission: string): boolean => {
    return hasPermission(permission);
  };

  /**
   * Verificar si el usuario tiene un rol específico
   */
  const checkRole = (roleName: string): boolean => {
    return hasRole(roleName);
  };

  /**
   * Verificar si el usuario tiene alguno de los roles especificados
   */
  const checkAnyRole = (roleNames: string[]): boolean => {
    return hasAnyRole(roleNames);
  };

  /**
   * Verificar si el usuario es administrador
   */
  const isAdmin = (): boolean => {
    return hasAnyRole(['super_admin', 'admin']);
  };

  /**
   * Verificar si el usuario es super administrador
   */
  const isSuperAdmin = (): boolean => {
    return hasRole('super_admin');
  };

  /**
   * Verificar si el usuario puede gestionar usuarios
   */
  const canManageUsers = (): boolean => {
    return hasPermission('users.manage') || isAdmin();
  };

  /**
   * Verificar si el usuario puede gestionar roles
   */
  const canManageRoles = (): boolean => {
    return hasPermission('roles.manage') || isSuperAdmin();
  };

  /**
   * Verificar si el usuario puede gestionar permisos
   */
  const canManagePermissions = (): boolean => {
    return hasPermission('permissions.manage') || isSuperAdmin();
  };

  /**
   * Verificar si el usuario puede acceder al dashboard
   */
  const canAccessDashboard = (): boolean => {
    return hasPermission('dashboard_read') || isAdmin();
  };

  /**
   * Verificar si el usuario puede ver reportes
   */
  const canViewReports = (): boolean => {
    return hasPermission('reports_read') || hasAnyRole(['admin', 'manager']);
  };

  /**
   * Verificar si el usuario puede crear/editar contenido
   */
  const canEditContent = (): boolean => {
    return hasPermission('content.create') || hasPermission('content.update') || isAdmin();
  };

  /**
   * Obtener permisos del usuario actual
   */
  const getUserPermissions = (): string[] => {
    return user?.permissions || [];
  };

  /**
   * Obtener roles del usuario actual
   */
  const getUserRoles = () => {
    return user?.roles || [];
  };

  /**
   * Verificar múltiples permisos a la vez
   */
  const checkMultiplePermissions = (permissions: string[], requireAll: boolean = false): boolean => {
    if (!user) return false;
    
    if (requireAll) {
      return permissions.every(permission => hasPermission(permission));
    } else {
      return permissions.some(permission => hasPermission(permission));
    }
  };

  /**
   * Verificar acceso a módulo de forma síncrona usando los permisos ya cargados
   */
  const canAccessModule = (moduleName: string): boolean => {
    const modulePermissions = user?.permissions.filter(p => p.startsWith(moduleName)) || [];
    return modulePermissions.length > 0 || isAdmin();
  };

  return {
    user,
    checkPermission,
    checkRole,
    checkAnyRole,
    isAdmin,
    isSuperAdmin,
    canManageUsers,
    canManageRoles,
    canManagePermissions,
    canAccessDashboard,
    canViewReports,
    canEditContent,
    getUserPermissions,
    getUserRoles,
    checkMultiplePermissions,
    canAccessModule,
    hasModuleAccess, // Método asíncrono del contexto
    // Alias para compatibilidad
    hasPermission: checkPermission,
    hasRole: checkRole,
    hasAnyRole: checkAnyRole,
  };
}
