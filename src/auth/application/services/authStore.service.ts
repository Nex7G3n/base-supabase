import { AuthUser } from '../../domain/types/auth.interfaces';
import { AuthenticationService } from './auth.service';
import { EmailAuthService } from './email.service';
import { GoogleAuthService } from './google.service';

interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

/**
 * Servicio adaptador para el store de Zustand
 * Proporciona una interfaz unificada para todas las operaciones de autenticación
 */
class AuthStoreService {
  async login(email: string, password: string): Promise<AuthResult> {
    try {
      const user = await EmailAuthService.signIn(email, password);
      
      if (user) {
        return {
          success: true,
          user
        };
      } else {
        return {
          success: false,
          error: 'Credenciales inválidas'
        };
      }
    } catch (error: any) {
      console.error('Error en login:', error);
      return {
        success: false,
        error: error?.message || 'Error inesperado durante el login'
      };
    }
  }

  async register(email: string, password: string): Promise<AuthResult> {
    try {
      const user = await EmailAuthService.signUp(email, password);
      
      if (user) {
        return {
          success: true,
          user
        };
      } else {
        return {
          success: false,
          error: 'Error al crear la cuenta'
        };
      }
    } catch (error: any) {
      console.error('Error en register:', error);
      return {
        success: false,
        error: error?.message || 'Error inesperado durante el registro'
      };
    }
  }

  async loginWithGoogle(): Promise<AuthResult> {
    try {
      await GoogleAuthService.signInWithGoogle();
      // Con Google OAuth, el usuario será redirigido, así que consideramos éxito
      return {
        success: true
      };
    } catch (error: any) {
      console.error('Error en login con Google:', error);
      return {
        success: false,
        error: error?.message || 'Error inesperado durante el login con Google'
      };
    }
  }

  async logout(): Promise<void> {
    await AuthenticationService.signOut();
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    return await AuthenticationService.getCurrentAuthUser();
  }

  async hasActiveSession(): Promise<boolean> {
    return await AuthenticationService.hasActiveSession();
  }

  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return AuthenticationService.onAuthStateChange(callback);
  }
}

export const authStoreService = new AuthStoreService();
