# Sistema de Permisos y Módulos con Zustand

Este sistema implementa un manejo eficiente de permisos y módulos usando Zustand, donde los datos se cargan una vez al iniciar sesión y se almacenan en localStorage para acceso rápido.

## 🏗️ Arquitectura

### Stores Separados

- **`auth.store.ts`**: Maneja la autenticación del usuario (login, logout, user data)
- **`permissions.store.ts`**: Maneja permisos y módulos con caché en localStorage

### Características Principales

1. **Carga única**: Los permisos se cargan una sola vez al iniciar sesión
2. **Caché persistente**: Se almacenan en localStorage usando Zustand persist
3. **Expiración automática**: Los permisos expiran después de 30 minutos
4. **Recarga manual**: Botón para forzar actualización de permisos
5. **Sincronización**: Los stores se mantienen sincronizados automáticamente

## 🔧 Uso Básico

### Hook Principal

```tsx
import { useAuth } from '@/auth';

function MyComponent() {
  const {
    // Estado de autenticación
    user,
    isAuthenticated,
    loading,
    
    // Estado de permisos
    permissions,
    modules,
    accessibleModules,
    permissionsLoaded,
    
    // Verificaciones de permisos
    hasPermission,
    hasRole,
    hasAnyRole,
    
    // Funciones CRUD
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    
    // Funciones específicas
    canManageUsers,
    canManageRoles,
    isAdmin,
    isSuperAdmin,
    
    // Funciones de utilidad
    reloadPermissions,
    getUserName,
    getUserInitials
  } = useAuth();
  
  // Usar en el componente...
}
```

### Verificaciones de Permisos

```tsx
// Verificar permiso específico
if (hasPermission('users.create')) {
  // Mostrar botón de crear usuario
}

// Verificar rol
if (isAdmin()) {
  // Mostrar panel de administración
}

// Verificar acceso CRUD
if (canCreate('users')) {
  // Permitir crear usuarios
}

// Verificar múltiples permisos
if (hasAnyPermission(['users.read', 'users.write'])) {
  // Mostrar sección de usuarios
}
```

### Renderizado Condicional

```tsx
// Mostrar contenido basado en permisos
{canManageUsers() && (
  <UserManagementPanel />
)}

// Mostrar diferente contenido según rol
{isAdmin() ? (
  <AdminDashboard />
) : (
  <UserDashboard />
)}
```

## 📊 Gestión de Módulos

### Obtener Módulos Accesibles

```tsx
const { accessibleModules, getActiveModules, getModulesByPath } = useAuth();

// Todos los módulos accesibles
console.log(accessibleModules);

// Solo módulos activos
const activeModules = getActiveModules();

// Módulos por ruta específica
const adminModules = getModulesByPath('/admin');
```

### Verificar Acceso a Módulos

```tsx
// Verificación síncrona (recomendada)
if (hasModuleAccessSync('/admin/users')) {
  // Mostrar sección
}

// Verificación asíncrona (si es necesario)
const hasAccess = await hasModuleAccess('/admin/users');
```

## 🔄 Actualización de Permisos

### Recarga Manual

```tsx
// Forzar recarga de permisos
await reloadPermissions(true);

// Refrescar si es necesario (automático)
await refreshIfNeeded();
```

### Limpieza de Caché

```tsx
// Al hacer logout se limpian automáticamente
await logout();

// Limpieza manual (raro)
const { clearPermissions } = usePermissionsStore();
clearPermissions();
```

## 📝 Ejemplos Prácticos

### Componente de Navegación

```tsx
function Navigation() {
  const { 
    accessibleModules, 
    hasPermission, 
    isAdmin 
  } = useAuth();
  
  return (
    <nav>
      {accessibleModules.map(module => (
        <NavItem key={module.id} module={module} />
      ))}
      
      {isAdmin() && (
        <AdminNavSection />
      )}
    </nav>
  );
}
```

### Componente de Acciones

```tsx
function UserActions({ userId }: { userId: string }) {
  const { canUpdate, canDelete, hasPermission } = useAuth();
  
  return (
    <div>
      {canUpdate('users') && (
        <EditButton userId={userId} />
      )}
      
      {canDelete('users') && (
        <DeleteButton userId={userId} />
      )}
      
      {hasPermission('users.suspend') && (
        <SuspendButton userId={userId} />
      )}
    </div>
  );
}
```

### Página Protegida

```tsx
function AdminPage() {
  const { isAdmin, loading, isAuthenticated } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <LoginPrompt />;
  if (!isAdmin()) return <AccessDenied />;
  
  return <AdminContent />;
}
```

## 🚀 Flujo de Inicialización

1. **Usuario inicia sesión** → `login()` en auth store
2. **Auth store carga user** → Llama a `loadUserPermissions()` 
3. **Permissions store carga datos** → Guarda en localStorage
4. **Datos disponibles** → Hook `useAuth()` tiene todo disponible
5. **Componentes renderizan** → Con permisos ya cargados

## ⚡ Optimizaciones

- **Carga una sola vez**: No hay peticiones repetidas
- **Caché persistente**: Funciona offline después de cargar
- **Verificaciones síncronas**: No bloquean el renderizado
- **Expiración inteligente**: Se actualiza automáticamente cuando es necesario
- **Limpieza automática**: Se limpia al hacer logout

## 🔧 Configuración

### Tiempo de Expiración

```tsx
// En permissions.store.ts
const CACHE_EXPIRATION_TIME = 30 * 60 * 1000; // 30 minutos
```

### Configuración de Persist

```tsx
// En permissions.store.ts
{
  name: 'permissions-storage',
  partialize: (state) => ({
    // Solo persistir datos necesarios
    permissions: state.permissions,
    detailedPermissions: state.detailedPermissions,
    modules: state.modules,
    accessibleModules: state.accessibleModules,
    isLoaded: state.isLoaded,
    lastLoadTime: state.lastLoadTime
  })
}
```

## 🐛 Debug

### Información de Debug

```tsx
const { debug } = useAuth();
console.log('Auth State:', debug.authStore);
console.log('Permissions State:', debug.permissionsStore);
```

### Estado de Caché

```tsx
const { permissionsLoaded, lastLoadTime } = useAuth();
console.log('Permisos cargados:', permissionsLoaded);
console.log('Última carga:', new Date(lastLoadTime));
```

## 📚 Migración desde Context API

Si vienes de un sistema basado en Context API:

1. **Reemplaza** `useAuthContext()` → `useAuth()`
2. **Los permisos** ya están disponibles inmediatamente
3. **No necesitas** `useEffect` para cargar permisos
4. **Funciones** tienen nombres más descriptivos

```tsx
// Antes (Context API)
const { user } = useAuthContext();
const { permissions, loading } = usePermissions();

useEffect(() => {
  if (user) {
    loadPermissions(user.id);
  }
}, [user]);

// Ahora (Zustand)
const { user, permissions, permissionsLoaded } = useAuth();
// Todo está disponible inmediatamente
```
