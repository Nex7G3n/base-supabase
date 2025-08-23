/**
 * Servicio de caché específico para operaciones de management
 */
export class ManagementCacheService {
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  // TTL por defecto: 5 minutos para datos de management
  private static readonly DEFAULT_TTL = 5 * 60 * 1000;

  /**
   * Obtener datos del caché
   */
  static get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // Verificar si ha expirado
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * Guardar datos en el caché
   */
  static set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Invalidar entrada específica
   */
  static invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidar por patrón
   */
  static invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Limpiar todo el caché
   */
  static clear(): void {
    this.cache.clear();
  }

  // Claves específicas para roles
  static getRolesCacheKey(page: number, limit: number, filters?: any): string {
    const filterStr = filters ? JSON.stringify(filters) : '';
    return `roles_${page}_${limit}_${filterStr}`;
  }

  static getAllActiveRolesCacheKey(): string {
    return 'active_roles_all';
  }

  // Claves específicas para usuarios
  static getUsersCacheKey(page: number, limit: number, filters?: any): string {
    const filterStr = filters ? JSON.stringify(filters) : '';
    return `users_${page}_${limit}_${filterStr}`;
  }

  // Claves específicas para permisos
  static getPermissionsCacheKey(page: number, limit: number, filters?: any): string {
    const filterStr = filters ? JSON.stringify(filters) : '';
    return `permissions_${page}_${limit}_${filterStr}`;
  }

  static getAllActivePermissionsCacheKey(): string {
    return 'active_permissions_all';
  }

  // Claves específicas para módulos
  static getModulesCacheKey(page: number, limit: number, filters?: any): string {
    const filterStr = filters ? JSON.stringify(filters) : '';
    return `modules_${page}_${limit}_${filterStr}`;
  }

  static getAllActiveModulesCacheKey(): string {
    return 'active_modules_all';
  }

  /**
   * Invalidar caché relacionado con roles
   */
  static invalidateRolesCache(): void {
    this.invalidatePattern('^(roles|active_roles)');
  }

  /**
   * Invalidar caché relacionado con usuarios
   */
  static invalidateUsersCache(): void {
    this.invalidatePattern('^users');
  }

  /**
   * Invalidar caché relacionado con permisos
   */
  static invalidatePermissionsCache(): void {
    this.invalidatePattern('^(permissions|active_permissions)');
  }

  /**
   * Invalidar caché relacionado con módulos
   */
  static invalidateModulesCache(): void {
    this.invalidatePattern('^(modules|active_modules)');
  }

  /**
   * Invalidar todo el caché de management
   */
  static invalidateAllManagementCache(): void {
    this.invalidatePattern('^(roles|users|permissions|modules|active_)');
  }
}
