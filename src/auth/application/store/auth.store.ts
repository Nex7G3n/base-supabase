"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthUser } from '../../domain/types/auth.interfaces';
import { EmailAuthService } from '../services/email.service';
import { GoogleAuthService } from '../services/google.service';
import { AuthenticationService } from '../services/auth.service';
import { PermissionService } from '../services/permission.service';

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
            set({
              user,
              loading: false,
              error: null
            });
            return true;
          } else {
            set({
              loading: false,
              error: 'Credenciales inválidas'
            });
            return false;
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error?.message || 'Error inesperado durante el login'
          });
          return false;
        }
      },

      register: async (email: string, password: string) => {
        try {
          set({ loading: true, error: null });

          const user = await EmailAuthService.signUp(email, password);

          if (user) {
            set({
              user,
              loading: false,
              error: null
            });
            return true;
          } else {
            set({
              loading: false,
              error: 'Error al crear la cuenta'
            });
            return false;
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error?.message || 'Error inesperado durante el registro'
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
          set({ loading: true });
          await AuthenticationService.signOut();
          set({
            user: null,
            loading: false,
            error: null
          });
        } catch (error) {
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
          return;
        }

        // Si ya está inicializado y tenemos un usuario, no hacer nada
        if (state.isInitialized && state.user) {
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

          set({
            user,
            loading: false,
            error: null,
            isInitialized: true,
            isCheckingAuth: false
          });
        } catch (error) {
          console.error('Error during auth check:', error);
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

      // Funciones de autorización
      hasPermission: (permission: string): boolean => {
        const { user } = get();
        if (!user) return false;
        return user.permissions.includes(permission);
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
        return await PermissionService.userHasModuleAccess(user.id, modulePath);
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }), // Solo persistir el usuario
    }
  )
);
