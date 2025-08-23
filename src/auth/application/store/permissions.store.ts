"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Permission, Module } from '../../domain/types/auth.interfaces';
import { PermissionService } from '../services/permission.service';

interface PermissionsStore {
  // Estado
  permissions: string[];
  detailedPermissions: Permission[];
  modules: Module[];
  accessibleModules: Module[];
  isLoaded: boolean;
  loading: boolean;
  error: string | null;
  lastLoadTime: number | null;
  loadingPromise: Promise<void> | null; // Para evitar múltiples cargas concurrentes

  // Acciones
  loadUserPermissions: (userId: string, forceReload?: boolean) => Promise<void>;
  clearPermissions: () => void;
  hasPermission: (permission: string) => boolean;
  hasModuleAccess: (modulePath: string) => boolean;
  getModulePermissions: (moduleId: string) => Permission[];
  isPermissionExpired: () => boolean;
  refreshIfNeeded: (userId: string) => Promise<void>;
}

// Tiempo de expiración en milisegundos (30 minutos)
const CACHE_EXPIRATION_TIME = 30 * 60 * 1000;

export const usePermissionsStore = create<PermissionsStore>()(
  persist(
    (set, get) => ({
      // Estado inicial
      permissions: [],
      detailedPermissions: [],
      modules: [],
      accessibleModules: [],
      isLoaded: false,
      loading: false,
      error: null,
      lastLoadTime: null,
      loadingPromise: null,

      // Cargar permisos del usuario
      loadUserPermissions: async (userId: string, forceReload = false) => {
        const state = get();
        
        // Si ya están cargados y no se fuerza la recarga, no hacer nada
        if (state.isLoaded && !forceReload && !state.isPermissionExpired()) {
          return;
        }

        // Si ya hay una carga en progreso, esperar a que termine
        if (state.loadingPromise) {
          return state.loadingPromise;
        }

        const loadingPromise = (async () => {
          try {
            set({ loading: true, error: null });

            // Cargar permisos básicos, detallados y módulos en paralelo
            const [
              permissions,
              detailedPermissions,
              accessibleModules
            ] = await Promise.all([
              PermissionService.getUserPermissions(userId),
              PermissionService.getUserDetailedPermissions(userId),
              PermissionService.getUserAccessibleModules(userId)
            ]);

            // Obtener todos los módulos únicos
            const allModulesMap = new Map<string, Module>();
            detailedPermissions.forEach(permission => {
              if (permission.module) {
                allModulesMap.set(permission.module.id, permission.module);
              }
            });

            set({
              permissions,
              detailedPermissions,
              modules: Array.from(allModulesMap.values()),
              accessibleModules,
              isLoaded: true,
              loading: false,
              error: null,
              lastLoadTime: Date.now(),
              loadingPromise: null
            });

          } catch (error: any) {
            console.error('Error al cargar permisos:', error);
            set({
              loading: false,
              error: error?.message || 'Error al cargar permisos',
              loadingPromise: null,
              // Mantener datos anteriores si existen
              isLoaded: state.isLoaded
            });
          }
        })();

        set({ loadingPromise });
        return loadingPromise;
      },

      // Limpiar permisos
      clearPermissions: () => {
        set({
          permissions: [],
          detailedPermissions: [],
          modules: [],
          accessibleModules: [],
          isLoaded: false,
          loading: false,
          error: null,
          lastLoadTime: null,
          loadingPromise: null
        });
      },

      // Verificar si el usuario tiene un permiso específico
      hasPermission: (permission: string): boolean => {
        const { permissions } = get();
        return permissions.includes(permission);
      },

      // Verificar si el usuario tiene acceso a un módulo
      hasModuleAccess: (modulePath: string): boolean => {
        const { accessibleModules } = get();
        return accessibleModules.some(module => module.path === modulePath);
      },

      // Obtener permisos de un módulo específico
      getModulePermissions: (moduleId: string): Permission[] => {
        const { detailedPermissions } = get();
        return detailedPermissions.filter(permission => permission.module_id === moduleId);
      },

      // Verificar si los permisos han expirado
      isPermissionExpired: (): boolean => {
        const { lastLoadTime } = get();
        if (!lastLoadTime) return true;
        return Date.now() - lastLoadTime > CACHE_EXPIRATION_TIME;
      },

      // Actualizar permisos si es necesario
      refreshIfNeeded: async (userId: string): Promise<void> => {
        const state = get();
        if (!state.isLoaded || state.isPermissionExpired()) {
          await state.loadUserPermissions(userId, true);
        }
      }
    }),
    {
      name: 'permissions-storage',
      partialize: (state) => ({
        permissions: state.permissions,
        detailedPermissions: state.detailedPermissions,
        modules: state.modules,
        accessibleModules: state.accessibleModules,
        isLoaded: state.isLoaded,
        lastLoadTime: state.lastLoadTime
      }),
      version: 1,
      // Migrar datos si cambia la estructura
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Limpiar datos antiguos si es necesario
          return {
            permissions: [],
            detailedPermissions: [],
            modules: [],
            accessibleModules: [],
            isLoaded: false,
            loading: false,
            error: null,
            lastLoadTime: null,
            loadingPromise: null
          };
        }
        return {
          ...persistedState,
          loadingPromise: null // Siempre reiniciar el promise de carga
        };
      }
    }
  )
);

// Hook personalizado para usar los permisos de forma más conveniente
export const usePermissions = () => {
  const {
    permissions,
    detailedPermissions,
    modules,
    accessibleModules,
    isLoaded,
    loading,
    error,
    hasPermission,
    hasModuleAccess,
    getModulePermissions,
    loadUserPermissions,
    clearPermissions,
    refreshIfNeeded
  } = usePermissionsStore();

  return {
    // Estado
    permissions,
    detailedPermissions,
    modules,
    accessibleModules,
    isLoaded,
    loading,
    error,

    // Funciones de verificación
    hasPermission,
    hasModuleAccess,
    getModulePermissions,

    // Funciones de gestión
    loadUserPermissions,
    clearPermissions,
    refreshIfNeeded,

    // Funciones de conveniencia
    canCreate: (module: string) => hasPermission(`${module}.create`),
    canRead: (module: string) => hasPermission(`${module}.read`),
    canUpdate: (module: string) => hasPermission(`${module}.update`),
    canDelete: (module: string) => hasPermission(`${module}.delete`),
    canExecute: (module: string) => hasPermission(`${module}.execute`),

    // Verificar múltiples permisos
    hasAnyPermission: (permissionList: string[]) => 
      permissionList.some(permission => hasPermission(permission)),
    
    hasAllPermissions: (permissionList: string[]) => 
      permissionList.every(permission => hasPermission(permission)),

    // Obtener módulos por categoría o filtro
    getModulesByPath: (pathPrefix: string) => 
      accessibleModules.filter(module => module.path?.startsWith(pathPrefix)),
    
    getActiveModules: () => 
      accessibleModules.filter(module => module.is_active),
  };
};
