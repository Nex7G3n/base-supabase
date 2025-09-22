import { supabase } from '../../infrastructure/api/supabase';
import { Permission, Module, Role } from '../../domain/types/auth.interfaces';
import { CacheService } from './cache.service';

/**
 * Servicio para la gestión de permisos y módulos
 */
export class PermissionService {
  /**
   * Verificar si un usuario tiene un permiso específico
   */
  static async userHasPermission(userId: string, permissionName: string): Promise<boolean> {
    // Verificar caché primero
    const cacheKey = CacheService.getPermissionCheckCacheKey(userId, permissionName);
    const cachedResult = CacheService.get<boolean>(cacheKey);
    if (cachedResult !== null) {
      return cachedResult;
    }

    try {
      const { data, error } = await supabase
        .rpc('user_has_permission', {
          user_id: userId,
          permission_name: permissionName
        });

      if (error) {
        console.error('Error al verificar permiso:', error);
        return false;
      }

      const result = data || false;
      
      // Guardar en caché por 15 minutos
      CacheService.set(cacheKey, result, 15 * 60 * 1000);
      
      return result;
    } catch (error) {
      console.error('Error en userHasPermission:', error);
      return false;
    }
  }

  /**
   * Obtener todos los permisos de un usuario (por roles y específicos)
   */
  static async getUserPermissions(userId: string): Promise<string[]> {
    // Verificar caché primero
    const cacheKey = CacheService.getUserPermissionsCacheKey(userId);
    const cachedPermissions = CacheService.get<string[]>(cacheKey);
    if (cachedPermissions !== null) {
      return cachedPermissions;
    }

    try {
      let allPermissions = new Set<string>();

      // Intentar obtener permisos por roles
      try {
        const { data: rolePermissions, error: roleError } = await supabase
          .from('user_roles')
          .select(`
            roles!role_id (
              role_permissions!inner (
                granted,
                permissions!inner (name)
              )
            )
          `)
          .eq('user_id', userId)
          .eq('is_active', true)
          .eq('roles.is_active', true);

        if (!roleError && rolePermissions) {
          rolePermissions.forEach((ur: any) => {
            ur.roles?.role_permissions?.forEach((rp: any) => {
              if (rp.permissions?.name && rp.granted !== false) {
                allPermissions.add(rp.permissions.name);
              }
            });
          });
        } else if (roleError && !roleError.message.includes('does not exist')) {
          console.warn('Error al obtener permisos por roles:', roleError);
        }
      } catch (error) {
        console.warn('Tablas de roles/permisos no disponibles:', error);
      }

      // Intentar obtener permisos específicos del usuario
      try {
        const { data: userPermissions, error: userError } = await supabase
          .from('user_permissions')
          .select(`
            permissions!inner (name)
          `)
          .eq('user_id', userId)
          .eq('granted', true)
          .or('expires_at.is.null,expires_at.gt.now()');

        if (!userError && userPermissions) {
          userPermissions.forEach((up: any) => {
            if (up.permissions?.name) {
              allPermissions.add(up.permissions.name);
            }
          });
        } else if (userError && !userError.message.includes('does not exist')) {
          console.warn('Error al obtener permisos específicos:', userError);
        }
      } catch (error) {
        console.warn('Tabla user_permissions no disponible:', error);
      }

      const result = Array.from(allPermissions);
      
      // Guardar en caché por 30 minutos
      CacheService.set(cacheKey, result, 30 * 60 * 1000);
      
      return result;
    } catch (error) {
      console.error('Error en getUserPermissions:', error);
      return [];
    }
  }

  /**
   * Obtener permisos detallados de un usuario con información del módulo
   */
  static async getUserDetailedPermissions(userId: string): Promise<Permission[]> {
    try {
      // Permisos por roles
      const { data: rolePermissions, error: roleError } = await supabase
        .from('user_roles')
        .select(`
          roles!role_id (
            role_permissions!inner (
              granted,
              permissions!inner (
                id,
                name,
                description,
                action,
                module_id,
                modules (
                  id,
                  name,
                  description,
                  path,
                  icon
                )
              )
            )
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .eq('roles.is_active', true);

      if (roleError) {
        throw new Error(`Error al obtener permisos detallados por roles: ${roleError.message}`);
      }

      // Permisos específicos del usuario
      const { data: userPermissions, error: userError } = await supabase
        .from('user_permissions')
        .select(`
          granted,
          permissions!inner (
            id,
            name,
            description,
            action,
            module_id,
            modules (
              id,
              name,
              description,
              path,
              icon
            )
          )
        `)
        .eq('user_id', userId)
        .eq('granted', true)
        .or('expires_at.is.null,expires_at.gt.now()');

      if (userError) {
        throw new Error(`Error al obtener permisos específicos detallados: ${userError.message}`);
      }

      const permissionsMap = new Map<string, Permission>();

      // Procesar permisos por roles
      rolePermissions?.forEach((ur: any) => {
        ur.roles?.role_permissions?.forEach((rp: any) => {
          if (rp.permissions && rp.granted !== false) {
            const permission = rp.permissions;
            permissionsMap.set(permission.id, {
              ...permission,
              module: permission.modules
            });
          }
        });
      });

      // Procesar permisos específicos
      userPermissions?.forEach((up: any) => {
        if (up.permissions) {
          const permission = up.permissions;
          permissionsMap.set(permission.id, {
            ...permission,
            module: permission.modules
          });
        }
      });

      return Array.from(permissionsMap.values());
    } catch (error) {
      console.error('Error en getUserDetailedPermissions:', error);
      return [];
    }
  }

  /**
   * Obtener módulos accesibles para un usuario
   */
  static async getUserAccessibleModules(userId: string): Promise<Module[]> {
    try {
      const permissions = await this.getUserDetailedPermissions(userId);
      const moduleMap = new Map<string, Module>();

      permissions.forEach(permission => {
        if (permission.module) {
          moduleMap.set(permission.module.id, permission.module);
        }
      });

      return Array.from(moduleMap.values()).sort((a, b) => a.sort_order - b.sort_order);
    } catch (error) {
      console.error('Error en getUserAccessibleModules:', error);
      return [];
    }
  }

  /**
   * Verificar si un usuario tiene acceso a un módulo específico
   */
  static async userHasModuleAccess(userId: string, modulePath: string): Promise<boolean> {
    // Verificar caché primero
    const cacheKey = CacheService.getModuleAccessCacheKey(userId, modulePath);
    const cachedResult = CacheService.get<boolean>(cacheKey);
    if (cachedResult !== null) {
      return cachedResult;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          roles!role_id (
            role_permissions!inner (
              granted,
              permissions!inner (
                modules!inner (path)
              )
            )
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .eq('roles.is_active', true)
        .eq('permissions.modules.path', modulePath);

      if (error) {
        console.error('Error al verificar acceso al módulo:', error);
        return false;
      }

      const result = data && data.length > 0;
      
      // Guardar en caché por 15 minutos
      CacheService.set(cacheKey, result, 15 * 60 * 1000);
      
      return result;
    } catch (error) {
      console.error('Error en userHasModuleAccess:', error);
      return false;
    }
  }

  /**
   * Asignar permiso específico a un usuario
   */
  static async assignUserPermission(
    userId: string,
    permissionId: string,
    assignedBy: string,
    expiresAt?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_permissions')
        .upsert({
          user_id: userId,
          permission_id: permissionId,
          granted: true,
          assigned_by: assignedBy,
          assigned_at: new Date().toISOString(),
          expires_at: expiresAt
        });

      if (error) {
        console.error('Error al asignar permiso específico:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error en assignUserPermission:', error);
      return false;
    }
  }

  /**
   * Revocar permiso específico de un usuario
   */
  static async revokeUserPermission(userId: string, permissionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', userId)
        .eq('permission_id', permissionId);

      if (error) {
        console.error('Error al revocar permiso específico:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error en revokeUserPermission:', error);
      return false;
    }
  }

  /**
   * Obtener todos los permisos disponibles en el sistema
   */
  static async getAllPermissions(): Promise<Permission[]> {
    try {
      const { data, error } = await supabase
        .from('permissions')
        .select(`
          *,
          modules (
            id,
            name,
            description,
            path,
            icon
          )
        `)
        .eq('is_active', true)
        .order('name');

      if (error) {
        throw new Error(`Error al obtener permisos: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error en getAllPermissions:', error);
      return [];
    }
  }

  /**
   * Obtener todos los módulos del sistema
   */
  static async getAllModules(): Promise<Module[]> {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) {
        throw new Error(`Error al obtener módulos: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error en getAllModules:', error);
      return [];
    }
  }
}
