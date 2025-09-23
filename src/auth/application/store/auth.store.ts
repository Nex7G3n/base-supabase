"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthUser } from '../../domain/types/auth.interfaces';
import { EmailAuthService } from '../services/email.service';
import { GoogleAuthService } from '../services/google.service';
import { AuthenticationService } from '../services/auth.service';
import { PermissionService } from '../services/permission.service';
import { CacheService } from '../services/cache.service';
import { usePermissionsStore } from './permissions.store';
import { ToastHelper } from '../../../common/utils/toastHelper';

interface AuthStore {
  // Estado
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
  isCheckingAuth: boolean;

  // Acciones de autenticación
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;

  // Funciones de autorización
  hasPermission: (permission: string) => boolean;
  hasRole: (roleName: string) => boolean;
  hasAnyRole: (roleNames: string[]) => boolean;
  hasModuleAccess: (modulePath: string) => Promise<boolean>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      loading: false,
      error: null,
      isInitialized: false,
      isCheckingAuth: false,

      // Acciones
      login: async (email: string, password: string) => {
        try {
          set({ loading: true, error: null });

          const user = await EmailAuthService.signIn(email, password);

          if (user) {
            // Cargar permisos del usuario solo si no están en caché válido
            const permissionsStore = usePermissionsStore.getState();
            await permissionsStore.loadUserPermissions(user.id, false); // false = no forzar recarga

            ToastHelper.success('Bienvenido de nuevo', {
              title: 'Inicio de sesión exitoso',
              description: `Hola, ${user.first_name || user.email}`
            });

            set({
              user,
              loading: false,
              error: null
            });
            return true;
          } else {
            ToastHelper.error('Credenciales inválidas', {
              title: 'Error de autenticación',
              description: 'Por favor verifica tu email y contraseña'
            });

            set({
              loading: false,
              error: 'Credenciales inválidas'
            });
            return false;
          }
        } catch (error: any) {
          const errorMessage = error?.message || 'Error inesperado durante el login';
          
          ToastHelper.error('Error al iniciar sesión', {
            title: 'Error',
            description: errorMessage
          });

          set({
            loading: false,
            error: errorMessage
          });
          return false;
        }
      },

      register: async (email: string, password: string) => {
        try {
          set({ loading: true, error: null });

          const user = await EmailAuthService.signUp(email, password);

          if (user) {
            // Cargar permisos del usuario solo si no están en caché válido
            const permissionsStore = usePermissionsStore.getState();
            await permissionsStore.loadUserPermissions(user.id, false); // false = no forzar recarga

            ToastHelper.success('Cuenta creada exitosamente', {
              title: 'Registro exitoso',
              description: 'Tu cuenta ha sido creada. ¡Bienvenido!'
            });

            set({
              user,
              loading: false,
              error: null
            });
            return true;
          } else {
            ToastHelper.error('Error al crear la cuenta', {
              title: 'Error de registro',
              description: 'No se pudo crear tu cuenta. Inténtalo de nuevo.'
            });

            set({
              loading: false,
              error: 'Error al crear la cuenta'
            });
            return false;
          }
        } catch (error: any) {
          const errorMessage = error?.message || 'Error inesperado durante el registro';
          
          ToastHelper.error('Error al registrarse', {
            title: 'Error',
            description: errorMessage
          });

          set({
            loading: false,
            error: errorMessage
          });
          return false;
        }
      },

      loginWithGoogle: async () => {
        try {
          set({ loading: true, error: null });

          await GoogleAuthService.signInWithGoogle();
          // Con Google OAuth, el usuario será redirigido
          // El estado se actualizará cuando regrese del callback
          return true;
        } catch (error: any) {
          set({
            loading: false,
            error: error?.message || 'Error inesperado durante el login con Google'
          });
          return false;
        }
      },

      logout: async () => {
        try {
          const { user } = get();
          set({ loading: true });
          
          await AuthenticationService.signOut();
          
          // Limpiar permisos al hacer logout
          const permissionsStore = usePermissionsStore.getState();
          permissionsStore.clearPermissions();
          
          // Limpiar caché del usuario
          if (user) {
            CacheService.invalidateUserCache(user.id);
          }
          
          ToastHelper.info('Sesión cerrada exitosamente', {
            title: 'Hasta pronto',
            description: 'Has cerrado sesión correctamente'
          });

          set({
            user: null,
            loading: false,
            error: null
          });
        } catch (error) {
          ToastHelper.error('Error al cerrar sesión', {
            title: 'Error',
            description: 'Hubo un problema al cerrar la sesión'
          });

          set({
            loading: false,
            error: 'Error durante el logout'
          });
        }
      },

      checkAuth: async () => {
        const state = get();

        // Evitar múltiples llamadas simultáneas
        if (state.isCheckingAuth) {
          // Esperar a que termine la verificación actual
          let attempts = 0;
          while (get().isCheckingAuth && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
          }
          return;
        }

        // Si ya está inicializado y tenemos un usuario, solo verificar permisos si es necesario
        if (state.isInitialized && state.user) {
          const permissionsStore = usePermissionsStore.getState();
          if (permissionsStore.isPermissionExpired()) {
            await permissionsStore.refreshIfNeeded(state.user.id);
          }
          return;
        }

        try {
          set({ loading: true, isCheckingAuth: true });

          // Timeout para evitar loading infinito
          const timeout = new Promise<AuthUser | null>((_, reject) =>
            setTimeout(() => reject(new Error('Auth check timeout')), 10000)
          );

          const authCheck = AuthenticationService.getCurrentAuthUser();

          const user = await Promise.race([authCheck, timeout]);

          if (user) {
            // Cargar permisos del usuario solo si no están en caché válido
            const permissionsStore = usePermissionsStore.getState();
            await permissionsStore.loadUserPermissions(user.id, false); // false = no forzar recarga
          } else {
            // Limpiar permisos si no hay usuario
            const permissionsStore = usePermissionsStore.getState();
            permissionsStore.clearPermissions();
          }

          set({
            user,
            loading: false,
            error: null,
            isInitialized: true,
            isCheckingAuth: false
          });
        } catch (error) {
          console.error('Error during auth check:', error);
          // Limpiar permisos en caso de error
          const permissionsStore = usePermissionsStore.getState();
          permissionsStore.clearPermissions();
          
          set({
            user: null,
            loading: false,
            error: null,
            isInitialized: true,
            isCheckingAuth: false
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ loading });
      },

      // Funciones de autorización (delegadas al store de permisos)
      hasPermission: (permission: string): boolean => {
        const permissionsStore = usePermissionsStore.getState();
        return permissionsStore.hasPermission(permission);
      },

      hasRole: (roleName: string): boolean => {
        const { user } = get();
        if (!user) return false;
        return user.roles.some(role => role.name === roleName);
      },

      hasAnyRole: (roleNames: string[]): boolean => {
        const { user } = get();
        if (!user) return false;
        return user.roles.some(role => roleNames.includes(role.name));
      },

      hasModuleAccess: async (modulePath: string): Promise<boolean> => {
        const { user } = get();
        if (!user) return false;
        
        const permissionsStore = usePermissionsStore.getState();
        
        // Si los permisos están cargados y no han expirado, usar caché
        if (permissionsStore.isLoaded && !permissionsStore.isPermissionExpired()) {
          return permissionsStore.hasModuleAccess(modulePath);
        }
        
        // Si los permisos están expirados, recargar
        if (permissionsStore.isPermissionExpired()) {
          await permissionsStore.refreshIfNeeded(user.id);
          return permissionsStore.hasModuleAccess(modulePath);
        }
        
        // Como último recurso, usar el servicio directo
        return await PermissionService.userHasModuleAccess(user.id, modulePath);
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }), // Solo persistir el usuario
    }
  )
);
