// Exportar tipos
export type { AuthUser, Role, Permission, Module, UserRole, UserPermission } from './domain/types/auth.interfaces';

// Exportar servicios principales
export { AuthenticationService } from './application/services/auth.service';
export { EmailAuthService } from './application/services/email.service';
export { GoogleAuthService } from './application/services/google.service';
export { RoleService } from './application/services/role.service';
export { PermissionService } from './application/services/permission.service';

// Exportar store de Zustand
export { useAuthStore } from './application/store/auth.store';

// Exportar hooks personalizados
export {
  useAuthActions,
  useAuthState,
  useProtectedRoute,
  useRedirectIfAuthenticated,
  useAuthInit
} from './application/hooks/useAuth';

// Exportar componentes
export { ProtectedComponent, useCanShow } from './application/components/ProtectedComponent';
