"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Role } from '../../domain/types/auth.interfaces';

interface UseProtectedRouteOptions {
  redirectTo?: string;
  allowedRoles?: Role[];
  requireAuth?: boolean;
}

export function useProtectedRoute(options: UseProtectedRouteOptions = {}) {
  const {
    redirectTo = '/login',
    allowedRoles,
    requireAuth = true,
  } = options;
  
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Si requiere autenticación y no hay usuario, redirigir
    if (requireAuth && !user) {
      router.push(redirectTo);
      return;
    }

    // Si hay roles permitidos y el usuario no tiene el rol correcto, redirigir
    if (user && allowedRoles && !allowedRoles.includes(user.role)) {
      router.push('/platform'); // Redirigir a una página segura
      return;
    }

    // Si no requiere autenticación pero hay usuario, redirigir (ej: páginas de login)
    if (!requireAuth && user) {
      router.push('/platform');
      return;
    }
  }, [user, loading, router, redirectTo, allowedRoles, requireAuth]);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    hasRole: (role: Role) => user?.role === role,
    hasAnyRole: (roles: Role[]) => user ? roles.includes(user.role) : false,
  };
}

export function useAdminRoute() {
  return useProtectedRoute({
    allowedRoles: ['admin'],
    requireAuth: true,
  });
}

export function useGuestRoute() {
  return useProtectedRoute({
    requireAuth: false,
  });
}
