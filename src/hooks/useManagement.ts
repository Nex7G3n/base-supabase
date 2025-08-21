"use client";
import { useState, useEffect, useCallback } from 'react';
import { UserManagementService } from '../services/management/users.service';
import { RoleManagementService } from '../services/management/roles.service';
import { ModuleManagementService } from '../services/management/modules.service';
import { PermissionManagementService } from '../services/management/permissions.service';
import { useAuthState } from '../auth';

export function usePermissions() {
  const { user, isAuthenticated, isInitialized } = useAuthState();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUserId, setLastUserId] = useState<string | null>(null);

  // Cargar permisos del usuario
  const loadPermissions = useCallback(async () => {
    // No cargar si no está autenticado o si ya tenemos los permisos para este usuario
    if (!user?.id || !isAuthenticated || !isInitialized || user.id === lastUserId) {
      if (!user?.id || !isAuthenticated) {
        setPermissions([]);
        setLastUserId(null);
      }
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userPermissions = await UserManagementService.getUserPermissions(user.id);
      setPermissions(userPermissions);
      setLastUserId(user.id);
    } catch (error) {
      console.error('Error al cargar permisos:', error);
      setPermissions([]);
      setLastUserId(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id, isAuthenticated, isInitialized, lastUserId]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  // Verificar si el usuario tiene un permiso específico
  const hasPermission = useCallback((permissionName: string): boolean => {
    return permissions.includes(permissionName);
  }, [permissions]);

  // Verificar si el usuario tiene alguno de los permisos especificados
  const hasAnyPermission = useCallback((permissionNames: string[]): boolean => {
    return permissionNames.some(permission => permissions.includes(permission));
  }, [permissions]);

  // Verificar si el usuario tiene todos los permisos especificados
  const hasAllPermissions = useCallback((permissionNames: string[]): boolean => {
    return permissionNames.every(permission => permissions.includes(permission));
  }, [permissions]);

  // Verificar permisos por módulo y acción
  const hasModulePermission = useCallback((moduleName: string, action: string): boolean => {
    const permissionName = `${moduleName}_${action}`;
    return permissions.includes(permissionName);
  }, [permissions]);

  // Verificar si el usuario es administrador
  const isAdmin = useCallback((): boolean => {
    return hasAnyPermission(['super_admin', 'admin']) ||
      hasModulePermission('users', 'create') ||
      hasModulePermission('roles', 'create');
  }, [hasAnyPermission, hasModulePermission]);

  // Verificar si el usuario es super administrador
  const isSuperAdmin = useCallback((): boolean => {
    return hasPermission('super_admin') ||
      hasModulePermission('permissions', 'delete');
  }, [hasPermission, hasModulePermission]);

  return {
    permissions,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasModulePermission,
    isAdmin,
    isSuperAdmin,
    refetch: loadPermissions
  };
}

export function useUserManagement() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getUsers = useCallback(async (page: number, limit: number, filters?: any) => {
    try {
      setLoading(true);
      setError(null);
      return await UserManagementService.getUsers(page, limit, filters);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createUser = useCallback(async (userData: any) => {
    try {
      setLoading(true);
      setError(null);
      return await UserManagementService.createUser(userData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUser = useCallback(async (id: string, userData: any) => {
    try {
      setLoading(true);
      setError(null);
      return await UserManagementService.updateUser(id, userData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteUser = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      return await UserManagementService.deleteUser(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const assignRoles = useCallback(async (userId: string, roleIds: string[]) => {
    try {
      setLoading(true);
      setError(null);
      return await UserManagementService.assignRoles(userId, roleIds);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    assignRoles
  };
}

export function useRoleManagement() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRoles = useCallback(async (page: number, limit: number, filters?: any) => {
    try {
      setLoading(true);
      setError(null);
      return await RoleManagementService.getRoles(page, limit, filters);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAllActiveRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      return await RoleManagementService.getAllActiveRoles();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createRole = useCallback(async (roleData: any) => {
    try {
      setLoading(true);
      setError(null);
      return await RoleManagementService.createRole(roleData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateRole = useCallback(async (id: string, roleData: any) => {
    try {
      setLoading(true);
      setError(null);
      return await RoleManagementService.updateRole(id, roleData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteRole = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      return await RoleManagementService.deleteRole(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const assignPermissions = useCallback(async (roleId: string, permissionIds: string[]) => {
    try {
      setLoading(true);
      setError(null);
      return await RoleManagementService.assignPermissions(roleId, permissionIds);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleRoleStatus = useCallback(async (id: string, isActive: boolean) => {
    try {
      setLoading(true);
      setError(null);
      return await RoleManagementService.toggleRoleStatus(id, isActive);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getRolePermissions = useCallback(async (roleId: string) => {
    try {
      setLoading(true);
      setError(null);
      return await RoleManagementService.getRolePermissions(roleId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const assignPermissionsToRole = useCallback(async (roleId: string, permissionIds: string[]) => {
    try {
      setLoading(true);
      setError(null);
      return await RoleManagementService.assignPermissionsToRole(roleId, permissionIds);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getRoles,
    getAllActiveRoles,
    createRole,
    updateRole,
    deleteRole,
    assignPermissions,
    toggleRoleStatus,
    getRolePermissions,
    assignPermissionsToRole
  };
}

export function useModuleManagement() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getModules = useCallback(async (page: number, limit: number, filters?: any) => {
    try {
      setLoading(true);
      setError(null);
      return await ModuleManagementService.getModules(page, limit, filters);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getModulesHierarchy = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      return await ModuleManagementService.getModulesHierarchy();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getUserAccessibleModules = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      return await ModuleManagementService.getUserAccessibleModules(userId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const generateUserNavigation = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      return await ModuleManagementService.generateUserNavigation(userId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAllActiveModules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      return await ModuleManagementService.getAllActiveModules();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createModule = useCallback(async (moduleData: any) => {
    try {
      setLoading(true);
      setError(null);
      return await ModuleManagementService.createModule(moduleData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateModule = useCallback(async (id: string, moduleData: any) => {
    try {
      setLoading(true);
      setError(null);
      return await ModuleManagementService.updateModule(id, moduleData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteModule = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      return await ModuleManagementService.deleteModule(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleModuleStatus = useCallback(async (id: string, isActive: boolean) => {
    try {
      setLoading(true);
      setError(null);
      return await ModuleManagementService.toggleModuleStatus(id, isActive);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reorderModules = useCallback(async (moduleOrders: { id: string; sort_order: number }[]) => {
    try {
      setLoading(true);
      setError(null);
      return await ModuleManagementService.reorderModules(moduleOrders);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getModules,
    getModulesHierarchy,
    getUserAccessibleModules,
    generateUserNavigation,
    getAllActiveModules,
    createModule,
    updateModule,
    deleteModule,
    toggleModuleStatus,
    reorderModules
  };
}

// ============================================================================
// HOOK PARA GESTIÓN DE PERMISOS
// ============================================================================

export function usePermissionManagement() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPermissions = useCallback(async (page = 1, limit = 10, filters?: any) => {
    try {
      setLoading(true);
      setError(null);
      return await PermissionManagementService.getPermissions(page, limit, filters);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPermissionById = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      return await PermissionManagementService.getPermissionById(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createPermission = useCallback(async (permissionData: any) => {
    try {
      setLoading(true);
      setError(null);
      return await PermissionManagementService.createPermission(permissionData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePermission = useCallback(async (id: string, permissionData: any) => {
    try {
      setLoading(true);
      setError(null);
      return await PermissionManagementService.updatePermission(id, permissionData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePermission = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      return await PermissionManagementService.deletePermission(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const togglePermissionStatus = useCallback(async (id: string, isActive: boolean) => {
    try {
      setLoading(true);
      setError(null);
      return await PermissionManagementService.togglePermissionStatus(id, isActive);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAllActivePermissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      return await PermissionManagementService.getAllActivePermissions();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPermissionsByModule = useCallback(async (moduleId: string) => {
    try {
      setLoading(true);
      setError(null);
      return await PermissionManagementService.getPermissionsByModule(moduleId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAvailableActions = useCallback(() => {
    return PermissionManagementService.getAvailableActions();
  }, []);

  return {
    loading,
    error,
    getPermissions,
    getPermissionById,
    createPermission,
    updatePermission,
    deletePermission,
    togglePermissionStatus,
    getAllActivePermissions,
    getPermissionsByModule,
    getAvailableActions
  };
}
