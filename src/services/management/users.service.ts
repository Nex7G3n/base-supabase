import { supabase } from '../../common/supabaseClient';
import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserFilters,
  PaginatedResponse,
  ApiResponse
} from '../../types/management.types';
import { ToastHelper } from '../../common/utils/toastHelper';

export class UserManagementService {
  /**
   * Obtener lista paginada de usuarios
   */
  static async getUsers(
    page: number = 1,
    limit: number = 10,
    filters?: UserFilters
  ): Promise<PaginatedResponse<User>> {
    try {
      const offset = (page - 1) * limit;

      // Usar la función personalizada para obtener usuarios con datos de auth
      const { data: userData, error: userError } = await supabase.rpc('get_users_with_auth', {
        p_limit: limit,
        p_offset: offset,
        p_search: filters?.search || null,
        p_is_active: filters?.is_active ?? null,
        p_created_from: filters?.created_from || null,
        p_created_to: filters?.created_to || null
      });

      if (userError) {
        console.error('Error en get_users_with_auth:', userError);
        return await this.getUsersFallback(page, limit, filters);
      }

      // Contar total de registros
      const { data: countData, error: countError } = await supabase.rpc('count_users_with_auth', {
        p_search: filters?.search || null,
        p_is_active: filters?.is_active ?? null,
        p_created_from: filters?.created_from || null,
        p_created_to: filters?.created_to || null
      });

      if (countError) {
        console.error('Error en count_users_with_auth:', countError);
        return await this.getUsersFallback(page, limit, filters);
      }

      const total = countData || 0;

      // Obtener roles para cada usuario
      const userIds = userData?.map((u: any) => u.id) || [];
      let usersWithRoles = userData || [];

      if (userIds.length > 0) {
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select(`
            user_id,
            id,
            role_id,
            is_active,
            roles (
              id,
              name,
              description,
              is_default
            )
          `)
          .in('user_id', userIds)
          .eq('is_active', true);

        // Agregar roles a cada usuario y mapear campos de auth
        usersWithRoles = userData.map((user: any) => ({
          ...user,
          email: user.email,
          last_login: user.auth_last_sign_in_at,
          user_roles: rolesData?.filter((role: any) => role.user_id === user.id) || []
        }));
      }

      return {
        data: usersWithRoles,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error en getUsers:', error);
      // Fallback a método anterior si hay cualquier error
      return await this.getUsersFallback(page, limit, filters);
    }
  }

  /**
   * Método fallback para obtener usuarios (método anterior)
   */
  private static async getUsersFallback(
    page: number = 1,
    limit: number = 10,
    filters?: UserFilters
  ): Promise<PaginatedResponse<User>> {
    try {
      let query = supabase
        .from('users')
        .select(`
          *,
          user_roles!user_id (
            id,
            role_id,
            is_active,
            roles (
              id,
              name,
              description,
              is_default
            )
          )
        `, { count: 'exact' });

      // Aplicar filtros
      if (filters?.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%`);
      }

      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      if (filters?.role_id) {
        query = query.eq('user_roles.role_id', filters.role_id);
      }

      if (filters?.created_from) {
        query = query.gte('created_at', filters.created_from);
      }

      if (filters?.created_to) {
        query = query.lte('created_at', filters.created_to);
      }

      // Paginación
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        throw new Error(`Error al obtener usuarios: ${error.message}`);
      }

      // Obtener email y avatar de auth.users para cada usuario
      if (data && data.length > 0) {
        for (const user of data) {
          try {
            const { data: authUser } = await supabase.auth.admin.getUserById(user.id);
            if (authUser?.user) {
              user.email = authUser.user.email;
              user.last_login = authUser.user.last_sign_in_at;
              // Usar avatar_url de auth.users si no está en public.users
              if (!user.avatar_url && authUser.user.user_metadata?.avatar_url) {
                user.avatar_url = authUser.user.user_metadata.avatar_url;
              }
            }
          } catch (authError) {
            console.warn(`No se pudo obtener datos de auth para usuario ${user.id}:`, authError);
          }
        }
      }

      return {
        data: data || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('Error en getUsersFallback:', error);
      throw error;
    }
  }

  /**
   * Obtener usuario por ID
   */
  static async getUserById(id: string): Promise<User | null> {
    try {
      // Usar la función personalizada para obtener usuario con datos de auth
      const { data: userData, error: userError } = await supabase.rpc('get_user_with_auth_by_id', {
        user_id: id
      });

      if (userError || !userData || userData.length === 0) {
        console.warn('Error o no se encontró usuario con función personalizada:', userError);
        return await this.getUserByIdFallback(id);
      }

      const user = userData[0];

      // Obtener roles del usuario
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select(`
          id,
          role_id,
          is_active,
          roles (
            id,
            name,
            description,
            is_default
          )
        `)
        .eq('user_id', id)
        .eq('is_active', true);

      return {
        ...user,
        email: user.email,
        last_login: user.auth_last_sign_in_at,
        user_roles: rolesData || []
      };
    } catch (error) {
      console.error('Error en getUserById:', error);
      return await this.getUserByIdFallback(id);
    }
  }

  /**
   * Método fallback para obtener usuario por ID
   */
  private static async getUserByIdFallback(id: string): Promise<User | null> {
    try {
      // Consulta simple primero
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error en consulta simple de usuario:', error);
        throw new Error(`Error al obtener usuario: ${error.message}`);
      }

      // Obtener email y avatar de auth.users
      try {
        const { data: authUser } = await supabase.auth.admin.getUserById(id);
        if (authUser?.user) {
          data.email = authUser.user.email;
          data.last_login = authUser.user.last_sign_in_at;
          // Usar avatar_url de auth.users si no está en public.users
          if (!data.avatar_url && authUser.user.user_metadata?.avatar_url) {
            data.avatar_url = authUser.user.user_metadata.avatar_url;
          }
        }
      } catch (authError) {
        console.warn(`No se pudo obtener datos de auth para usuario ${id}:`, authError);
      }

      // Intentar obtener relaciones
      try {
        const { data: userWithRoles, error: rolesError } = await supabase
          .from('users')
          .select(`
            *,
            user_roles!user_id (
              id,
              role_id,
              is_active,
              roles (
                id,
                name,
                description,
                is_default
              )
            )
          `)
          .eq('id', id)
          .single();

        if (!rolesError && userWithRoles) {
          // Agregar email al resultado con roles
          userWithRoles.email = data.email;
          userWithRoles.last_login = data.last_login;
          return userWithRoles;
        } else {
          console.warn('Error al obtener roles, devolviendo usuario sin roles:', rolesError);
          return data;
        }
      } catch (relationError) {
        console.warn('Las tablas de roles no existen aún, devolviendo usuario básico:', relationError);
        return data;
      }
    } catch (error) {
      console.error('Error en getUserById:', error);
      throw error;
    }
  }

  /**
   * Crear nuevo usuario
   */
  static async createUser(userData: CreateUserRequest): Promise<ApiResponse<User>> {
    try {
      // Crear usuario en auth.users
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        user_metadata: {
          first_name: userData.first_name,
          last_name: userData.last_name
        }
      });

      if (authError) {
        throw new Error(`Error al crear usuario de autenticación: ${authError.message}`);
      }

      // Actualizar datos adicionales en public.users
      const { data: user, error: userError } = await supabase
        .from('users')
        .update({
          first_name: userData.first_name,
          last_name: userData.last_name,
          phone: userData.phone
        })
        .eq('id', authUser.user.id)
        .select()
        .single();

      if (userError) {
        throw new Error(`Error al actualizar datos del usuario: ${userError.message}`);
      }

      // Asignar roles si se especificaron
      if (userData.role_ids && userData.role_ids.length > 0) {
        await this.assignRoles(authUser.user.id, userData.role_ids);
      }

      ToastHelper.success('Usuario creado exitosamente', {
        title: 'Éxito',
        description: `${user.first_name} ${user.last_name} ha sido creado`
      });

      return {
        success: true,
        data: user,
        message: 'Usuario creado exitosamente'
      };
    } catch (error) {
      console.error('Error en createUser:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      ToastHelper.error('Error al crear usuario', {
        title: 'Error',
        description: errorMessage
      });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Actualizar usuario
   */
  static async updateUser(id: string, userData: UpdateUserRequest): Promise<ApiResponse<User>> {
    try {
      // Separar role_ids del resto de datos
      const { role_ids, ...userDataWithoutRoles } = userData as any;

      // Actualizar datos básicos del usuario (sin role_ids)
      const { data, error } = await supabase
        .from('users')
        .update({
          ...userDataWithoutRoles,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Error al actualizar usuario: ${error.message}`);
      }

      // Si se proporcionaron roles, actualizarlos por separado
      if (role_ids && Array.isArray(role_ids)) {
        const rolesResult = await this.assignRoles(id, role_ids);
        if (!rolesResult.success) {
          console.warn('Error al actualizar roles:', rolesResult.error);
          // No fallar completamente si solo los roles fallaron
        }
      }

      ToastHelper.success('Usuario actualizado exitosamente', {
        title: 'Éxito',
        description: `${data.first_name} ${data.last_name} ha sido actualizado`
      });

      return {
        success: true,
        data,
        message: 'Usuario actualizado exitosamente'
      };
    } catch (error) {
      console.error('Error en updateUser:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      ToastHelper.error('Error al actualizar usuario', {
        title: 'Error',
        description: errorMessage
      });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Eliminar usuario (desactivar)
   */
  static async deleteUser(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        throw new Error(`Error al eliminar usuario: ${error.message}`);
      }

      ToastHelper.success('Usuario desactivado exitosamente', {
        title: 'Éxito',
        description: 'El usuario ha sido desactivado del sistema'
      });

      return {
        success: true,
        message: 'Usuario eliminado exitosamente'
      };
    } catch (error) {
      console.error('Error en deleteUser:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      ToastHelper.error('Error al desactivar usuario', {
        title: 'Error',
        description: errorMessage
      });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Asignar roles a un usuario
   */
  static async assignRoles(userId: string, roleIds: string[]): Promise<ApiResponse<void>> {
    try {
      // Obtener el usuario actual que asigna los roles
      const { data: currentUser } = await supabase.auth.getUser();

      // Primero eliminar roles existentes
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Asignar nuevos roles
      const userRoles = roleIds.map(roleId => ({
        user_id: userId,
        role_id: roleId,
        assigned_by: currentUser.user?.id,
        is_active: true
      }));

      const { error } = await supabase
        .from('user_roles')
        .insert(userRoles);

      if (error) {
        throw new Error(`Error al asignar roles: ${error.message}`);
      }

      return {
        success: true,
        message: 'Roles asignados exitosamente'
      };
    } catch (error) {
      console.error('Error en assignRoles:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Obtener roles de un usuario
   */
  static async getUserRoles(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          id,
          role_id,
          is_active,
          roles (
            id,
            name,
            description,
            is_default
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        throw new Error(`Error al obtener roles del usuario: ${error.message}`);
      }

      return data?.map(ur => ur.roles) || [];
    } catch (error) {
      console.error('Error en getUserRoles:', error);
      throw error;
    }
  }

  /**
   * Verificar si un usuario tiene un permiso específico
   */
  static async userHasPermission(userId: string, permissionName: string): Promise<boolean> {
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

      return data || false;
    } catch (error) {
      console.error('Error en userHasPermission:', error);
      return false;
    }
  }

  /**
   * Obtener permisos de un usuario
   */
  static async getUserPermissions(userId: string): Promise<string[]> {
    try {
      // Permisos por roles
      const { data: rolePermissions, error: roleError } = await supabase
        .from('user_roles')
        .select(`
          roles!inner (
            role_permissions!inner (
              granted,
              permissions!inner (name)
            )
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (roleError) {
        throw new Error(`Error al obtener permisos por roles: ${roleError.message}`);
      }

      // Permisos específicos del usuario
      const { data: userPermissions, error: userError } = await supabase
        .from('user_permissions')
        .select(`
          permissions!inner (name)
        `)
        .eq('user_id', userId)
        .eq('granted', true)
        .or('expires_at.is.null,expires_at.gt.now()');

      if (userError) {
        throw new Error(`Error al obtener permisos específicos: ${userError.message}`);
      }

      // Combinar permisos
      const allPermissions = new Set<string>();

      // Agregar permisos por roles (solo los que están granted)
      rolePermissions?.forEach((ur: any) => {
        ur.roles?.role_permissions?.forEach((rp: any) => {
          if (rp.permissions?.name && rp.granted !== false) {
            allPermissions.add(rp.permissions.name);
          }
        });
      });

      // Agregar permisos específicos
      userPermissions?.forEach((up: any) => {
        if (up.permissions?.name) {
          allPermissions.add(up.permissions.name);
        }
      });

      return Array.from(allPermissions);
    } catch (error) {
      console.error('Error en getUserPermissions:', error);
      return [];
    }
  }
}
