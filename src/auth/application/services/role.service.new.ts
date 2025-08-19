import { supabase } from '../../infrastructure/api/supabase';
import { Role, UserRole } from '../../domain/types/auth.interfaces';

/**
 * Servicio para la gestión de roles
 */
export class RoleService {
  /**
   * Obtener todos los roles activos
   */
  static async getAllRoles(): Promise<Role[]> {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        throw new Error(`Error al obtener roles: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error en getAllRoles:', error);
      return [];
    }
  }

  /**
   * Obtener rol por ID
   */
  static async getRoleById(roleId: string): Promise<Role | null> {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('id', roleId)
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
      return null;
    }
  }

  /**
   * Obtener roles de un usuario
   */
  static async getUserRoles(userId: string): Promise<Role[]> {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          roles!inner (*)
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .eq('roles.is_active', true);

      if (error) {
        throw new Error(`Error al obtener roles del usuario: ${error.message}`);
      }

      return data?.map((ur: any) => ur.roles) || [];
    } catch (error) {
      console.error('Error en getUserRoles:', error);
      return [];
    }
  }

  /**
   * Verificar si un usuario tiene un rol específico
   */
  static async userHasRole(userId: string, roleName: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          roles!inner (name)
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .eq('roles.name', roleName)
        .eq('roles.is_active', true);

      if (error) {
        console.error('Error al verificar rol:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Error en userHasRole:', error);
      return false;
    }
  }

  /**
   * Verificar si un usuario tiene alguno de los roles especificados
   */
  static async userHasAnyRole(userId: string, roleNames: string[]): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          roles!inner (name)
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .in('roles.name', roleNames)
        .eq('roles.is_active', true);

      if (error) {
        console.error('Error al verificar roles:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Error en userHasAnyRole:', error);
      return false;
    }
  }

  /**
   * Asignar rol a un usuario
   */
  static async assignRoleToUser(
    userId: string,
    roleId: string,
    assignedBy?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role_id: roleId,
          assigned_by: assignedBy,
          assigned_at: new Date().toISOString(),
          is_active: true
        });

      if (error) {
        console.error('Error al asignar rol:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error en assignRoleToUser:', error);
      return false;
    }
  }

  /**
   * Remover rol de un usuario
   */
  static async removeRoleFromUser(userId: string, roleId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('role_id', roleId);

      if (error) {
        console.error('Error al remover rol:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error en removeRoleFromUser:', error);
      return false;
    }
  }

  /**
   * Obtener el rol por defecto
   */
  static async getDefaultRole(): Promise<Role | null> {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('is_default', true)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Error al obtener rol por defecto: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error en getDefaultRole:', error);
      return null;
    }
  }

  // Mantener compatibilidad con el código existente
  static async isAdmin(userId: string): Promise<boolean> {
    return await this.userHasAnyRole(userId, ['super_admin', 'admin']);
  }

  static async getAvailableRoles(): Promise<string[]> {
    const roles = await this.getAllRoles();
    return roles.map(role => role.name);
  }

  static async getUserRole(userId: string): Promise<'admin' | 'user'> {
    const isAdmin = await this.isAdmin(userId);
    return isAdmin ? 'admin' : 'user';
  }

  static async setUserRole(userId: string, role: 'admin' | 'user'): Promise<void> {
    // Implementación simplificada para compatibilidad
    const roles = await this.getAllRoles();
    const targetRole = role === 'admin' ? 
      roles.find(r => r.name === 'admin') : 
      roles.find(r => r.name === 'user');
    
    if (targetRole) {
      await this.assignRoleToUser(userId, targetRole.id);
    }
  }

  private static async isFirstUser(): Promise<boolean> {
    try {
      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Error al verificar primer usuario:', error);
        return false;
      }

      return (count || 0) === 0;
    } catch (error) {
      console.error('Error en isFirstUser:', error);
      return false;
    }
  }
}
