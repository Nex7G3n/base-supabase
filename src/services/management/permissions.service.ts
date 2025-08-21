import { supabase } from '../../common/supabaseClient';
import {
  Permission,
  CreatePermissionRequest,
  UpdatePermissionRequest,
  PermissionFilters,
  PaginatedResponse,
  ApiResponse
} from '../../types/management.types';

export class PermissionManagementService {
  /**
   * Obtener lista paginada de permisos
   */
  static async getPermissions(
    page: number = 1,
    limit: number = 10,
    filters?: PermissionFilters
  ): Promise<PaginatedResponse<Permission>> {
    try {
      let query = supabase
        .from('permissions')
        .select(`
          *,
          module:modules (
            id,
            name,
            description,
            path,
            icon
          )
        `, { count: 'exact' });

      // Aplicar filtros
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      if (filters?.module_id) {
        query = query.eq('module_id', filters.module_id);
      }

      if (filters?.action) {
        query = query.eq('action', filters.action);
      }

      // Ordenamiento
      query = query.order('created_at', { ascending: false });

      // Paginación
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Error al obtener permisos: ${error.message}`);
      }

      const totalPages = count ? Math.ceil(count / limit) : 0;

      return {
        data: data || [],
        total: count || 0,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      throw new Error(`Error en el servicio de permisos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Obtener un permiso por ID
   */
  static async getPermissionById(id: string): Promise<ApiResponse<Permission>> {
    try {
      const { data, error } = await supabase
        .from('permissions')
        .select(`
          *,
          module:modules (
            id,
            name,
            description,
            path,
            icon
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(`Error al obtener el permiso: ${error.message}`);
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Crear un nuevo permiso
   */
  static async createPermission(permissionData: CreatePermissionRequest): Promise<ApiResponse<Permission>> {
    try {
      const { data, error } = await supabase
        .from('permissions')
        .insert([{
          name: permissionData.name,
          description: permissionData.description,
          module_id: permissionData.module_id,
          action: permissionData.action,
          is_active: permissionData.is_active ?? true
        }])
        .select(`
          *,
          module:modules (
            id,
            name,
            description,
            path,
            icon
          )
        `)
        .single();

      if (error) {
        throw new Error(`Error al crear el permiso: ${error.message}`);
      }

      return {
        success: true,
        data,
        message: 'Permiso creado exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Actualizar un permiso existente
   */
  static async updatePermission(id: string, permissionData: UpdatePermissionRequest): Promise<ApiResponse<Permission>> {
    try {
      const { data, error } = await supabase
        .from('permissions')
        .update({
          name: permissionData.name,
          description: permissionData.description,
          module_id: permissionData.module_id,
          action: permissionData.action,
          is_active: permissionData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          module:modules (
            id,
            name,
            description,
            path,
            icon
          )
        `)
        .single();

      if (error) {
        throw new Error(`Error al actualizar el permiso: ${error.message}`);
      }

      return {
        success: true,
        data,
        message: 'Permiso actualizado exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Eliminar un permiso
   */
  static async deletePermission(id: string): Promise<ApiResponse<void>> {
    try {
      // Verificar si el permiso está asignado a roles
      const { data: rolePermissions, error: checkError } = await supabase
        .from('role_permissions')
        .select('id')
        .eq('permission_id', id)
        .eq('granted', true);

      if (checkError) {
        throw new Error(`Error al verificar asignaciones del permiso: ${checkError.message}`);
      }

      if (rolePermissions && rolePermissions.length > 0) {
        throw new Error('No se puede eliminar un permiso que está asignado a roles');
      }

      // Verificar si el permiso está asignado a usuarios
      const { data: userPermissions, error: userCheckError } = await supabase
        .from('user_permissions')
        .select('id')
        .eq('permission_id', id)
        .eq('granted', true);

      if (userCheckError) {
        throw new Error(`Error al verificar asignaciones del permiso a usuarios: ${userCheckError.message}`);
      }

      if (userPermissions && userPermissions.length > 0) {
        throw new Error('No se puede eliminar un permiso que está asignado a usuarios');
      }

      const { error } = await supabase
        .from('permissions')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Error al eliminar el permiso: ${error.message}`);
      }

      return {
        success: true,
        message: 'Permiso eliminado exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Obtener todos los permisos activos (para selects)
   */
  static async getAllActivePermissions(): Promise<Permission[]> {
    try {
      const { data, error } = await supabase
        .from('permissions')
        .select(`
          *,
          module:modules (
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
        throw new Error(`Error al obtener permisos activos: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error al obtener permisos activos:', error);
      return [];
    }
  }

  /**
   * Activar/Desactivar un permiso
   */
  static async togglePermissionStatus(id: string, is_active: boolean): Promise<ApiResponse<Permission>> {
    try {
      const { data, error } = await supabase
        .from('permissions')
        .update({
          is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          module:modules (
            id,
            name,
            description,
            path,
            icon
          )
        `)
        .single();

      if (error) {
        throw new Error(`Error al cambiar estado del permiso: ${error.message}`);
      }

      return {
        success: true,
        data,
        message: `Permiso ${is_active ? 'activado' : 'desactivado'} exitosamente`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Obtener permisos por módulo
   */
  static async getPermissionsByModule(moduleId: string): Promise<Permission[]> {
    try {
      const { data, error } = await supabase
        .from('permissions')
        .select(`
          *,
          module:modules (
            id,
            name,
            description,
            path,
            icon
          )
        `)
        .eq('module_id', moduleId)
        .eq('is_active', true)
        .order('action');

      if (error) {
        throw new Error(`Error al obtener permisos del módulo: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error al obtener permisos del módulo:', error);
      return [];
    }
  }

  /**
   * Obtener acciones disponibles
   */
  static getAvailableActions(): Array<{ value: string; label: string }> {
    return [
      { value: 'create', label: 'Crear' },
      { value: 'read', label: 'Leer' },
      { value: 'update', label: 'Actualizar' },
      { value: 'delete', label: 'Eliminar' },
      { value: 'execute', label: 'Ejecutar' }
    ];
  }
}
