import { supabase } from '../../infrastructure/api/supabase';
import { AuthUser, Role } from '../../domain/types/auth.interfaces';

export class EmailAuthService {
  /**
   * Iniciar sesión con email y contraseña
   */
  static async signIn(email: string, password: string): Promise<AuthUser | null> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        throw new Error(`Error al iniciar sesión: ${error.message}`);
      }
      
      if (!data.user) {
        return null;
      }

      // Obtener el rol del usuario directamente
      const role = await this.getUserRoleInternal(data.user.id);
      
      return {
        id: data.user.id,
        email: data.user.email!,
        role,
      };
    } catch (error) {
      console.error('Error en signIn:', error);
      throw error;
    }
  }

  /**
   * Registrar nuevo usuario con email y contraseña
   */
  static async signUp(email: string, password: string): Promise<AuthUser | null> {
    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password 
      });
      
      if (error) {
        throw new Error(`Error al registrar usuario: ${error.message}`);
      }
      
      if (!data.user) {
        return null;
      }

      // Asignar rol por defecto al nuevo usuario
      const defaultRole = await this.getDefaultRoleInternal();
      await this.setUserRoleInternal(data.user.id, defaultRole);
      
      return {
        id: data.user.id,
        email: data.user.email!,
        role: defaultRole,
      };
    } catch (error) {
      console.error('Error en signUp:', error);
      throw error;
    }
  }

  /**
   * Cerrar sesión
   */
  static async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw new Error(`Error al cerrar sesión: ${error.message}`);
      }
    } catch (error) {
      console.error('Error en signOut:', error);
      throw error;
    }
  }

  /**
   * Enviar email de recuperación de contraseña
   */
  static async resetPassword(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) {
        throw new Error(`Error al enviar email de recuperación: ${error.message}`);
      }
    } catch (error) {
      console.error('Error en resetPassword:', error);
      throw error;
    }
  }

  /**
   * Cambiar contraseña del usuario actual
   */
  static async updatePassword(newPassword: string): Promise<void> {
    try {
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });
      
      if (error) {
        throw new Error(`Error al actualizar contraseña: ${error.message}`);
      }
    } catch (error) {
      console.error('Error en updatePassword:', error);
      throw error;
    }
  }

  /**
   * Verificar si hay una sesión activa
   */
  static async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        throw new Error(`Error al obtener sesión: ${error.message}`);
      }
      
      return session;
    } catch (error) {
      console.error('Error en getCurrentSession:', error);
      throw error;
    }
  }

  // Métodos internos para manejo de roles (para evitar dependencias circulares)
  
  private static async getUserRoleInternal(userId: string): Promise<Role> {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      if (error || !data) {
        const defaultRole = await this.getDefaultRoleInternal();
        console.log(`Asignando rol ${defaultRole} al usuario ${userId} (primer login)`);
        await this.setUserRoleInternal(userId, defaultRole);
        return defaultRole;
      }
      
      return data.role as Role;
    } catch (error) {
      console.error('Error al obtener rol del usuario:', error);
      return 'user'; // Fallback seguro
    }
  }

  private static async setUserRoleInternal(userId: string, role: Role): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert({ 
          user_id: userId, 
          role,
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('Error al asignar rol:', error);
      }
    } catch (error) {
      console.error('Error al asignar rol:', error);
    }
  }

  private static async getDefaultRoleInternal(): Promise<Role> {
    try {
      const isFirstUser = await this.isFirstUserInternal();
      return isFirstUser ? 'admin' : 'user';
    } catch (error) {
      console.error('Error al obtener rol por defecto:', error);
      return 'user';
    }
  }

  private static async isFirstUserInternal(): Promise<boolean> {
    try {
      const { count, error } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error('Error al verificar cantidad de usuarios:', error);
        return false;
      }
      
      return count === 0;
    } catch (error) {
      console.error('Error en isFirstUser:', error);
      return false;
    }
  }
}
