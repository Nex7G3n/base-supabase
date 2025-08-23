import { supabase } from '../../common/supabaseClient';
import {
  Module,
  CreateModuleRequest,
  UpdateModuleRequest,
  ModuleFilters,
  PaginatedResponse,
  ApiResponse,
  MenuItem
} from '../../types/management.types';

export class ModuleManagementService {
  /**
   * Obtener lista paginada de módulos
   */
  static async getModules(
    page: number = 1,
    limit: number = 10,
    filters?: ModuleFilters
  ): Promise<PaginatedResponse<Module>> {
    try {
      let query = supabase
        .from('modules')
        .select('*', { count: 'exact' });

      // Aplicar filtros
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      if (filters?.parent_id) {
        query = query.eq('parent_id', filters.parent_id);
      }

      // Paginación
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query
        .order('sort_order', { ascending: true })
        .range(from, to);

      if (error) {
        throw new Error(`Error al obtener módulos: ${error.message}`);
      }

      return {
        data: data || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('Error en getModules:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los módulos activos en estructura jerárquica
   */
  static async getModulesHierarchy(): Promise<Module[]> {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) {
        throw new Error(`Error al obtener jerarquía de módulos: ${error.message}`);
      }

      // Construir jerarquía
      const modulesMap = new Map<string, Module>();
      const rootModules: Module[] = [];

      // Crear mapa de módulos
      data?.forEach(module => {
        modulesMap.set(module.id, { ...module, children: [] });
      });

      // Construir jerarquía
      data?.forEach(module => {
        const moduleWithChildren = modulesMap.get(module.id)!;

        if (module.parent_id) {
          const parent = modulesMap.get(module.parent_id);
          if (parent) {
            parent.children!.push(moduleWithChildren);
          }
        } else {
          rootModules.push(moduleWithChildren);
        }
      });

      return rootModules;
    } catch (error) {
      console.error('Error en getModulesHierarchy:', error);
      throw error;
    }
  }

  /**
   * Obtener módulo por ID
   */
  static async getModuleById(id: string): Promise<Module | null> {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Error al obtener módulo: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error en getModuleById:', error);
      throw error;
    }
  }

  /**
   * Crear nuevo módulo
   */
  static async createModule(moduleData: CreateModuleRequest): Promise<ApiResponse<Module>> {
    try {
      const { data, error } = await supabase
        .from('modules')
        .insert({
          name: moduleData.name,
          description: moduleData.description,
          path: moduleData.path,
          icon: moduleData.icon,
          parent_id: moduleData.parent_id,
          sort_order: moduleData.sort_order || 0,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Error al crear módulo: ${error.message}`);
      }

      // Crear permisos básicos para el módulo
      await this.createModulePermissions(data.id, data.name);

      return {
        success: true,
        data,
        message: 'Módulo creado exitosamente'
      };
    } catch (error) {
      console.error('Error en createModule:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Actualizar módulo
   */
  static async updateModule(id: string, moduleData: UpdateModuleRequest): Promise<ApiResponse<Module>> {
    try {
      const { data, error } = await supabase
        .from('modules')
        .update({
          ...moduleData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Error al actualizar módulo: ${error.message}`);
      }

      return {
        success: true,
        data,
        message: 'Módulo actualizado exitosamente'
      };
    } catch (error) {
      console.error('Error en updateModule:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Eliminar módulo (desactivar)
   */
  static async deleteModule(id: string): Promise<ApiResponse<void>> {
    try {
      // Verificar si el módulo tiene hijos
      const { data: children } = await supabase
        .from('modules')
        .select('id')
        .eq('parent_id', id)
        .eq('is_active', true)
        .limit(1);

      if (children && children.length > 0) {
        return {
          success: false,
          error: 'No se puede eliminar un módulo que tiene submódulos activos'
        };
      }

      const { error } = await supabase
        .from('modules')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        throw new Error(`Error al eliminar módulo: ${error.message}`);
      }

      return {
        success: true,
        message: 'Módulo eliminado exitosamente'
      };
    } catch (error) {
      console.error('Error en deleteModule:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Crear permisos básicos para un módulo
   */
  private static async createModulePermissions(moduleId: string, moduleName: string): Promise<void> {
    try {
      const actions = ['create', 'read', 'update', 'delete'];
      const permissions = actions.map(action => ({
        name: `${moduleName}_${action}`,
        description: `${action} permissions for ${moduleName} module`,
        module_id: moduleId,
        action,
        is_active: true
      }));

      const { error } = await supabase
        .from('permissions')
        .insert(permissions);

      if (error) {
        console.error('Error al crear permisos del módulo:', error);
      }
    } catch (error) {
      console.error('Error en createModulePermissions:', error);
    }
  }

  /**
   * Obtener módulos accesibles para un usuario
   */
  static async getUserAccessibleModules(userId: string): Promise<Module[]> {
    try {
      // Obtener permisos del usuario
      const { data: userPermissions, error: permError } = await supabase
        .from('user_roles')
        .select(`
          roles!inner (
            role_permissions!inner (
              permissions!inner (
                action,
                modules!inner (
                  id,
                  name,
                  description,
                  path,
                  icon,
                  parent_id,
                  sort_order,
                  is_active
                )
              )
            )
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (permError) {
        throw new Error(`Error al obtener permisos: ${permError.message}`);
      }

      // Extraer módulos únicos donde el usuario tiene al menos permiso de lectura
      const moduleIds = new Set<string>();
      const modulesMap = new Map<string, Module>();

      userPermissions?.forEach((ur: any) => {
        ur.roles?.role_permissions?.forEach((rp: any) => {
          const permission = rp.permissions;
          const moduleData = permission.modules;

          if (permission.action === 'read' && moduleData.is_active) {
            if (!moduleIds.has(moduleData.id)) {
              moduleIds.add(moduleData.id);
              modulesMap.set(moduleData.id, moduleData);
            }
          }
        });
      });

      return Array.from(modulesMap.values()).sort((a, b) => a.sort_order - b.sort_order);
    } catch (error) {
      console.error('Error en getUserAccessibleModules:', error);
      return [];
    }
  }

  /**
   * Generar menú de navegación para un usuario
   */
  static async generateUserNavigation(userId: string): Promise<MenuItem[]> {
    try {
      const modules = await this.getUserAccessibleModules(userId);

      // Obtener permisos específicos del usuario
      const userPermissions = await this.getUserModulePermissions(userId);

      const menuItems: MenuItem[] = modules.map(module => ({
        id: module.id,
        label: module.name,
        path: module.path,
        icon: module.icon,
        children: [],
        permissions: userPermissions[module.id] || [],
        visible: true
      }));

      return menuItems;
    } catch (error) {
      console.error('Error en generateUserNavigation:', error);
      return [];
    }
  }

  /**
   * Obtener permisos de usuario por módulo
   */
  private static async getUserModulePermissions(userId: string): Promise<Record<string, string[]>> {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          roles!inner (
            role_permissions!inner (
              permissions!inner (
                name,
                action,
                module_id
              )
            )
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        throw new Error(`Error al obtener permisos por módulo: ${error.message}`);
      }

      const modulePermissions: Record<string, string[]> = {};

      data?.forEach((ur: any) => {
        ur.roles?.role_permissions?.forEach((rp: any) => {
          const permission = rp.permissions;
          const moduleId = permission.module_id;

          if (!modulePermissions[moduleId]) {
            modulePermissions[moduleId] = [];
          }

          if (!modulePermissions[moduleId].includes(permission.name)) {
            modulePermissions[moduleId].push(permission.name);
          }
        });
      });

      return modulePermissions;
    } catch (error) {
      console.error('Error en getUserModulePermissions:', error);
      return {};
    }
  }

  /**
   * Reordenar módulos
   */
  static async reorderModules(moduleOrders: { id: string; sort_order: number }[]): Promise<ApiResponse<void>> {
    try {
      const updates = moduleOrders.map(({ id, sort_order }) =>
        supabase
          .from('modules')
          .update({ sort_order, updated_at: new Date().toISOString() })
          .eq('id', id)
      );

      await Promise.all(updates);

      return {
        success: true,
        message: 'Orden de módulos actualizado exitosamente'
      };
    } catch (error) {
      console.error('Error en reorderModules:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Obtener módulos con estructura jerárquica
   */
  static async getModulesTree(): Promise<Module[]> {
    try {
      // Obtener todos los módulos activos
      const { data: allModules, error } = await supabase
        .from('modules')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error('Error al obtener módulos:', error);
        return [];
      }

      if (!allModules || allModules.length === 0) {
        return [];
      }

      // Crear un mapa para fácil acceso
      const moduleMap = new Map<string, Module>();
      allModules.forEach(module => {
        moduleMap.set(module.id, { ...module, children: [] });
      });

      // Construir la estructura jerárquica
      const rootModules: Module[] = [];

      moduleMap.forEach(module => {
        if (module.parent_id && moduleMap.has(module.parent_id)) {
          const parent = moduleMap.get(module.parent_id);
          if (parent) {
            if (!parent.children) parent.children = [];
            parent.children.push(module);
          }
        } else {
          rootModules.push(module);
        }
      });

      return rootModules;
    } catch (error) {
      console.error('Error en getModulesTree:', error);
      return [];
    }
  }

  /**
   * Obtener todos los módulos activos sin jerarquía
   */
  static async getAllActiveModules(): Promise<Module[]> {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error('Error al obtener módulos activos:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error en getAllActiveModules:', error);
      return [];
    }
  }

  /**
   * Activar/Desactivar un módulo
   */
  static async toggleModuleStatus(id: string, is_active: boolean): Promise<ApiResponse<Module>> {
    try {
      const { data, error } = await supabase
        .from('modules')
        .update({
          is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Error al cambiar estado del módulo: ${error.message}`);
      }

      return {
        success: true,
        data,
        message: `Módulo ${is_active ? 'activado' : 'desactivado'} exitosamente`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
}
