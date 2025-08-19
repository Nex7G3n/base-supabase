export interface Role {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: string;
  name: string;
  description?: string;
  path?: string;
  icon?: string;
  is_active: boolean;
  parent_id?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  children?: Module[];
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  module_id?: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'execute';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  module?: Module;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  assigned_by?: string;
  assigned_at: string;
  is_active: boolean;
  role?: Role;
}

export interface UserPermission {
  id: string;
  user_id: string;
  permission_id: string;
  granted: boolean;
  assigned_by?: string;
  assigned_at: string;
  expires_at?: string;
  permission?: Permission;
}

export interface AuthUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  roles: Role[];
  permissions: string[];
  user_roles?: UserRole[];
  user_permissions?: UserPermission[];
  // Mantener compatibilidad con código existente
  role?: 'admin' | 'user';
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
}

export interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (roleName: string) => boolean;
  hasAnyRole: (roleNames: string[]) => boolean;
}
