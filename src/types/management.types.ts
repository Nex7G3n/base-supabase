// ============================================================================
// TIPOS PARA EL SISTEMA DE GESTIÓN
// ============================================================================

export interface User {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  user_roles?: UserRole[];
  user_permissions?: UserPermission[];
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  assigned_by?: string;
  assigned_at: string;
  is_active: boolean;
  roles?: Role;
}

export interface UserPermission {
  id: string;
  user_id: string;
  permission_id: string;
  granted: boolean;
  assigned_by?: string;
  assigned_at: string;
  expires_at?: string;
  permissions?: Permission;
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
  user?: User;
  role?: Role;
  assigned_by_user?: User;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  granted: boolean;
  created_at: string;
  role?: Role;
  permission?: Permission;
}

export interface UserPermission {
  id: string;
  user_id: string;
  permission_id: string;
  granted: boolean;
  assigned_by?: string;
  assigned_at: string;
  expires_at?: string;
  user?: User;
  permission?: Permission;
  assigned_by_user?: User;
}

// ============================================================================
// TIPOS DE RESPUESTA PARA APIs
// ============================================================================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// TIPOS PARA FORMULARIOS
// ============================================================================

export interface CreateUserRequest {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role_ids?: string[];
}

export interface UpdateUserRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  is_active?: boolean;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  permission_ids?: string[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  is_active?: boolean;
}

export interface CreateModuleRequest {
  name: string;
  description?: string;
  path?: string;
  icon?: string;
  parent_id?: string;
  sort_order?: number;
}

export interface UpdateModuleRequest {
  name?: string;
  description?: string;
  path?: string;
  icon?: string;
  is_active?: boolean;
  parent_id?: string;
  sort_order?: number;
}

export interface AssignRoleRequest {
  user_id: string;
  role_id: string;
}

export interface AssignPermissionRequest {
  role_id?: string;
  user_id?: string;
  permission_id: string;
  granted: boolean;
  expires_at?: string;
}

// ============================================================================
// TIPOS PARA CONTEXTO DE AUTENTICACIÓN
// ============================================================================

export interface AuthUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  roles: Role[];
  permissions: string[];
  avatar_url?: string;
  is_active: boolean;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  permissions: string[];
  roles: string[];
}

// ============================================================================
// TIPOS PARA FILTROS Y BÚSQUEDAS
// ============================================================================

export interface UserFilters {
  search?: string;
  is_active?: boolean;
  role_id?: string;
  created_from?: string;
  created_to?: string;
}

export interface RoleFilters {
  search?: string;
  is_active?: boolean;
}

export interface ModuleFilters {
  search?: string;
  is_active?: boolean;
  parent_id?: string;
}

export interface PermissionFilters {
  search?: string;
  module_id?: string;
  action?: string;
  is_active?: boolean;
}

// ============================================================================
// TIPOS PARA CREACIÓN Y ACTUALIZACIÓN
// ============================================================================

export interface CreateRoleRequest {
  name: string;
  description?: string;
  is_active?: boolean;
  is_default?: boolean;
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  is_active?: boolean;
  is_default?: boolean;
}

export interface CreatePermissionRequest {
  name: string;
  description?: string;
  module_id?: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'execute';
  is_active?: boolean;
}

export interface UpdatePermissionRequest {
  name?: string;
  description?: string;
  module_id?: string;
  action?: 'create' | 'read' | 'update' | 'delete' | 'execute';
  is_active?: boolean;
}

export interface CreateModuleRequest {
  name: string;
  description?: string;
  path?: string;
  icon?: string;
  parent_id?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface UpdateModuleRequest {
  name?: string;
  description?: string;
  path?: string;
  icon?: string;
  parent_id?: string;
  sort_order?: number;
  is_active?: boolean;
}

// ============================================================================
// TIPOS PARA NAVEGACIÓN Y MENÚS
// ============================================================================

export interface MenuItem {
  id: string;
  label: string;
  path?: string;
  icon?: string;
  children?: MenuItem[];
  permissions?: string[];
  visible: boolean;
}

export interface NavigationConfig {
  items: MenuItem[];
  user: AuthUser;
}

// ============================================================================
// CONSTANTES
// ============================================================================

export const ROLE_NAMES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user'
} as const;

export const PERMISSION_ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  EXECUTE: 'execute'
} as const;

export const MODULE_NAMES = {
  DASHBOARD: 'dashboard',
  USERS: 'users',
  ROLES: 'roles',
  PERMISSIONS: 'permissions',
  MODULES: 'modules',
  REPORTS: 'reports',
  SETTINGS: 'settings',
  TASKS: 'tasks'
} as const;

// ============================================================================
// TIPOS PARA TAREAS
// ============================================================================

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  assigned_to?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  created_by_user?: User;
  assigned_to_user?: User;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  status?: Task['status'];
  priority?: Task['priority'];
  due_date?: string;
  assigned_to?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: Task['status'];
  priority?: Task['priority'];
  due_date?: string;
  assigned_to?: string;
}

export interface TaskFilters {
  search?: string;
  status?: Task['status'];
  priority?: Task['priority'];
  assigned_to?: string;
  created_by?: string;
  due_date_from?: string;
  due_date_to?: string;
}
