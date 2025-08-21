import { supabase } from '../../common/supabaseClient';
import {
  Role,
  CreateRoleRequest,
  UpdateRoleRequest,
  RoleFilters,
  PaginatedResponse,
  ApiResponse,
  Permission,
  AssignPermissionRequest
} from '../../types/management.types';

export class RoleManagementService {
  /**
   * Obtener lista paginada de roles
   */
  static async getRoles(
    page: number = 1,
    limit: number = 10,
    filters?: RoleFilters
  ): Promise<PaginatedResponse<Role>> {
    try {
      let query = supabase
        .from('roles')
        .select('*', { count: 'exact' });

      // Aplicar filtros
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      // Paginación
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        throw new Error(`Error al obtener roles: ${error.message}`);
      }

      return {
        data: data || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('Error en getRoles:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los roles activos (para selects)
   */
  static async getAllActiveRoles(): Promise<Role[]> {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        throw new Error(`Error al obtener roles activos: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error en getAllActiveRoles:', error);
      throw error;
    }
  }

  /**
   * Obtener rol por ID
   */
  static async getRoleById(id: string): Promise<Role | null> {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Error al obtener rol: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error en getRoleById:', error);
      throw error;
    }
  }

  /**
   * Crear nuevo rol
   */
  static async createRole(roleData: CreateRoleRequest): Promise<ApiResponse<Role>> {
    try {
      const { data, error } = await supabase
        .from('roles')
        .insert({
          name: roleData.name,
          description: roleData.description,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Error al crear rol: ${error.message}`);
      }

      // Asignar permisos si se especificaron
      if (roleData.permission_ids && roleData.permission_ids.length > 0) {
        await this.assignPermissions(data.id, roleData.permission_ids);
      }

      return {
        success: true,
        data,
        message: 'Rol creado exitosamente'
      };
    } catch (error) {
      console.error('Error en createRole:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Actualizar rol
   */
  static async updateRole(id: string, roleData: UpdateRoleRequest): Promise<ApiResponse<Role>> {
    try {
      const { data, error } = await supabase
        .from('roles')
        .update({
          ...roleData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Error al actualizar rol: ${error.message}`);
      }

      return {
        success: true,
        data,
        message: 'Rol actualizado exitosamente'
      };
    } catch (error) {
      console.error('Error en updateRole:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Eliminar rol (desactivar)
   */
  static async deleteRole(id: string): Promise<ApiResponse<void>> {
    try {
      // Verificar si el rol está siendo usado
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('id')
        .eq('role_id', id)
        .eq('is_active', true)
        .limit(1);

      if (userRoles && userRoles.length > 0) {
        return {
          success: false,
          error: 'No se puede eliminar un rol que está siendo usado por usuarios'
        };
      }

      const { error } = await supabase
        .from('roles')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        throw new Error(`Error al eliminar rol: ${error.message}`);
      }

      return {
        success: true,
        message: 'Rol eliminado exitosamente'
      };
    } catch (error) {
      console.error('Error en deleteRole:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Asignar permisos a un rol
   */
  static async assignPermissions(roleId: string, permissionIds: string[]): Promise<ApiResponse<void>> {
    try {
      // Eliminar permisos existentes
      await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', roleId);

      // Asignar nuevos permisos
      const rolePermissions = permissionIds.map(permissionId => ({
        role_id: roleId,
        permission_id: permissionId,
        granted: true
      }));

      const { error } = await supabase
        .from('role_permissions')
        .insert(rolePermissions);

      if (error) {
        throw new Error(`Error al asignar permisos: ${error.message}`);
      }

      return {
        success: true,
        message: 'Permisos asignados exitosamente'
      };
    } catch (error) {
      console.error('Error en assignPermissions:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Obtener permisos de un rol
   */
  static async getRolePermissions(roleId: string): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select(`
          *,
          permission:permissions (
            id,
            name,
            description,
            action,
            module:modules (
              id,
              name,
              description
            )
          )
        `)
        .eq('role_id', roleId)
        .eq('granted', true);

      if (error) {
        throw new Error(`Error al obtener permisos del rol: ${error.message}`);
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Obtener todos los permisos disponibles
   */
  static async getAllPermissions(): Promise<Permission[]> {
    try {
      const { data, error } = await supabase
        .from('permissions')
        .select(`
          *,
          modules!inner (
            id,
            name,
            description
          )
        `)
        .eq('is_active', true)
        .order('name');

      if (error) {
        throw new Error(`Error al obtener permisos: ${error.message}`);
      }

      return data?.map((p: any) => ({
        ...p,
        module: p.modules
      })) || [];
    } catch (error) {
      console.error('Error en getAllPermissions:', error);
      throw error;
    }
  }

  /**
   * Verificar si un rol tiene un permiso específico
   */
  static async roleHasPermission(roleId: string, permissionName: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select(`
          permissions!inner (name)
        `)
        .eq('role_id', roleId)
        .eq('granted', true)
        .eq('permissions.name', permissionName)
        .limit(1);

      if (error) {
        console.error('Error al verificar permiso del rol:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Error en roleHasPermission:', error);
      return false;
    }
  }

  /**
   * Obtener usuarios asignados a un rol
   */
  static async getRoleUsers(roleId: string) {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          id,
          assigned_at,
          is_active,
          users!inner (
            id,
            first_name,
            last_name,
            email,
            is_active
          )
        `)
        .eq('role_id', roleId)
        .eq('is_active', true);

      if (error) {
        throw new Error(`Error al obtener usuarios del rol: ${error.message}`);
      }

      return data?.map((ur: any) => ({
        ...ur.users,
        assigned_at: ur.assigned_at
      })) || [];
    } catch (error) {
      console.error('Error en getRoleUsers:', error);
      throw error;
    }
  }

  /**
   * Activar/Desactivar un rol
   */
  static async toggleRoleStatus(id: string, is_active: boolean): Promise<ApiResponse<Role>> {
    try {
      const { data, error } = await supabase
        .from('roles')
        .update({
          is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Error al cambiar estado del rol: ${error.message}`);
      }

      return {
        success: true,
        data,
        message: `Rol ${is_active ? 'activado' : 'desactivado'} exitosamente`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Asignar permisos a un rol
   */
  static async assignPermissionsToRole(
    roleId: string, 
    permissionIds: string[]
  ): Promise<ApiResponse<void>> {
    try {
      // Primero eliminar permisos existentes
      await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', roleId);

      // Insertar nuevos permisos
      if (permissionIds.length > 0) {
        const rolePermissions = permissionIds.map(permissionId => ({
          role_id: roleId,
          permission_id: permissionId,
          granted: true
        }));

        const { error } = await supabase
          .from('role_permissions')
          .insert(rolePermissions);

        if (error) {
          throw new Error(`Error al asignar permisos: ${error.message}`);
        }
      }

      return {
        success: true,
        message: 'Permisos asignados exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
}
