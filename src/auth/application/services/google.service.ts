import { supabase } from '../../infrastructure/api/supabase';

export class GoogleAuthService {
  /**
   * Iniciar sesión con Google OAuth
   */
  static async signInWithGoogle(): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    
    if (error) {
      throw new Error(`Error al iniciar sesión con Google: ${error.message}`);
    }
  }

  /**
   * Obtener el usuario actual de Google después del callback
   */
  static async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      throw new Error(`Error al obtener usuario: ${error.message}`);
    }
    
    return user;
  }

  /**
   * Verificar si el usuario actual se autenticó con Google
   */
  static async isGoogleUser(): Promise<boolean> {
    const user = await this.getCurrentUser();
    
    if (!user) return false;
    
    // Verificar si el usuario tiene el proveedor de Google
    return user.app_metadata?.providers?.includes('google') || 
           user.identities?.some(identity => identity.provider === 'google') || 
           false;
  }
}
