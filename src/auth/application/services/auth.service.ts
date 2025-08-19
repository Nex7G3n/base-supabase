import { supabase } from '../../infrastructure/api/supabase';
import { UserManagementService } from '../../../services/management/users.service';
import { RoleService } from './role.service';
import { PermissionService } from './permission.service';
import { AuthUser } from '../../domain/types/auth.interfaces';

/**
 * Servicio principal de autenticación que coordina entre los diferentes servicios
 */
export class AuthenticationService {
  /**
   * Obtener el usuario actual autenticado con roles y permisos
   */
  static async getCurrentAuthUser(): Promise<AuthUser | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        return null;
      }

      // Obtener datos completos del usuario desde la tabla public.users
      let userData = await UserManagementService.getUserById(user.id);
      
      // Si el usuario no existe en public.users, crearlo
      if (!userData) {
        console.log('Usuario no encontrado en public.users, intentando crearlo...');
        userData = await AuthenticationService.createPublicUserIfNotExists(user);
        
        // Si aún no se puede crear, intentar obtenerlo de nuevo (pudo haberse creado por otro proceso)
        if (!userData) {
          console.log('Reintentando obtener usuario después de crear...');
          userData = await UserManagementService.getUserById(user.id);
        }
        
        if (!userData) {
          console.error('No se pudo obtener ni crear el usuario en public.users');
          return null;
        }
      }

      let roles: any[] = [];
      let permissions: string[] = [];
      let isAdmin = false;

      try {
        // Intentar obtener roles y permisos si las tablas existen
        roles = await RoleService.getUserRoles(user.id);
        permissions = await PermissionService.getUserPermissions(user.id);
        isAdmin = await RoleService.isAdmin(user.id);
      } catch (roleError) {
        console.warn('Las tablas de roles/permisos no están disponibles aún:', roleError);
        // Usar rol por defecto basado en email o lógica simple
        isAdmin = user.email?.includes('admin') || false;
      }
      
      return {
        id: user.id,
        email: user.email!,
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone: userData.phone,
        avatar_url: userData.avatar_url,
        is_active: userData.is_active,
        last_login: userData.last_login,
        created_at: userData.created_at,
        updated_at: userData.updated_at,
        roles,
        permissions,
        // Mantener compatibilidad con código existente
        role: isAdmin ? 'admin' : 'user',
        user_roles: userData.user_roles || [],
        user_permissions: userData.user_permissions || []
      };
    } catch (error) {
      console.error('Error al obtener usuario actual:', error);
      return null;
    }
  }

  /**
   * Cerrar sesión (funciona para cualquier método de autenticación)
   */
  static async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw new Error(`Error al cerrar sesión: ${error.message}`);
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  }

  /**
   * Verificar si hay una sesión activa
   */
  static async hasActiveSession(): Promise<boolean> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        throw new Error(`Error al obtener sesión: ${error.message}`);
      }
      
      return session !== null;
    } catch (error) {
      console.error('Error al verificar sesión:', error);
      return false;
    }
  }

  /**
   * Escuchar cambios en el estado de autenticación
   */
  static onAuthStateChange(callback: (user: any | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (session?.user) {
          const authUser = await this.getCurrentAuthUser();
          callback(authUser);
        } else {
          callback(null);
        }
      } catch (error) {
        console.error('Error en onAuthStateChange:', error);
        callback(null);
      }
    });
  }

  /**
   * Crear usuario en public.users si no existe (respaldo para cuando el trigger falla)
   */
  private static async createPublicUserIfNotExists(authUser: any): Promise<any | null> {
    try {
      console.log('Intentando crear usuario en public.users:', authUser.id);
      
      // Primero verificar si ya existe
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (existingUser) {
        console.log('Usuario ya existe en public.users');
        return existingUser;
      }

      // Si hay error pero no es "no encontrado", loggearlo
      if (checkError && checkError.code !== 'PGRST116') {
        console.warn('Error al verificar usuario existente:', checkError);
      }
      
      // Extraer nombre y apellido de los metadatos del usuario
      const firstName = authUser.user_metadata?.full_name?.split(' ')[0] || 
                       authUser.user_metadata?.first_name || 
                       authUser.email?.split('@')[0] || 
                       '';
      const lastName = authUser.user_metadata?.full_name?.split(' ').slice(1).join(' ') || 
                      authUser.user_metadata?.last_name || 
                      '';

      console.log('Creando nuevo usuario con datos:', { 
        id: authUser.id, 
        firstName, 
        lastName, 
        email: authUser.email 
      });

      // Insertar en public.users
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          first_name: firstName,
          last_name: lastName,
          avatar_url: authUser.user_metadata?.avatar_url || null,
          is_active: true,
          last_login: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error al crear usuario en public.users:', insertError);
        
        // Si es un error de clave duplicada, intentar obtener el usuario existente
        if (insertError.code === '23505') {
          console.log('Usuario ya existe (clave duplicada), obteniendo datos...');
          const { data: duplicateUser } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single();
          return duplicateUser;
        }
        
        throw insertError;
      }

      // Asignar rol por defecto si existe
      try {
        const { data: defaultRole } = await supabase
          .from('roles')
          .select('id')
          .eq('is_default', true)
          .eq('is_active', true)
          .single();

        if (defaultRole) {
          await supabase
            .from('user_roles')
            .insert({
              user_id: authUser.id,
              role_id: defaultRole.id,
              is_active: true
            });
        }
      } catch (roleError) {
        console.warn('No se pudo asignar rol por defecto:', roleError);
      }

      console.log('Usuario creado exitosamente en public.users');
      return newUser;
    } catch (error) {
      console.error('Error al crear usuario en public.users:', error);
      return null;
    }
  }

  /**
   * Obtener información del método de autenticación usado
   */
  static async getAuthMethod(): Promise<'email' | 'google' | 'unknown'> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) return 'unknown';
      
      // Verificar si el usuario tiene el proveedor de Google
      const isGoogle = user.app_metadata?.providers?.includes('google') || 
                      user.identities?.some(identity => identity.provider === 'google') || 
                      false;
      
      if (isGoogle) return 'google';
      
      const hasSession = await this.hasActiveSession();
      if (hasSession) return 'email';
      
      return 'unknown';
    } catch (error) {
      console.error('Error al obtener método de autenticación:', error);
      return 'unknown';
    }
  }
}
