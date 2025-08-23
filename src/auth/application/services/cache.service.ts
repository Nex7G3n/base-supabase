/**
 * Servicio de caché para optimizar consultas repetidas
 */
export class CacheService {
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  /**
   * Obtener un valor del caché
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
   * Guardar un valor en el caché
   */
  static set<T>(key: string, data: T, ttl: number = 30 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Invalidar una entrada del caché
   */
  static invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidar todas las entradas que coincidan con un patrón
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

  /**
   * Obtener el tamaño del caché
   */
  static size(): number {
    return this.cache.size;
  }

  /**
   * Generar una clave de caché para permisos de usuario
   */
  static getUserPermissionsCacheKey(userId: string): string {
    return `user_permissions_${userId}`;
  }

  /**
   * Generar una clave de caché para módulos accesibles
   */
  static getUserModulesCacheKey(userId: string): string {
    return `user_modules_${userId}`;
  }

  /**
   * Generar una clave de caché para verificación de permiso específico
   */
  static getPermissionCheckCacheKey(userId: string, permission: string): string {
    return `permission_check_${userId}_${permission}`;
  }

  /**
   * Generar una clave de caché para verificación de acceso a módulo
   */
  static getModuleAccessCacheKey(userId: string, modulePath: string): string {
    return `module_access_${userId}_${modulePath}`;
  }

  /**
   * Invalidar todo el caché relacionado con un usuario
   */
  static invalidateUserCache(userId: string): void {
    this.invalidatePattern(`^(user_permissions|user_modules|permission_check|module_access)_${userId}`);
  }
}
