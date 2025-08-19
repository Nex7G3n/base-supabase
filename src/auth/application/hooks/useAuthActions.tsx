"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EmailAuthService } from '../services/email.service';
import { GoogleAuthService } from '../services/google.service';
import { useAuth } from '../context/AuthContext';
import { AuthUser } from '../../domain/types/auth.interfaces';

interface UseAuthActionsReturn {
  loading: boolean;
  error: string | null;
  signInWithEmail: (email: string, password: string) => Promise<AuthUser | null>;
  signUpWithEmail: (email: string, password: string) => Promise<AuthUser | null>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

export function useAuthActions(): UseAuthActionsReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refreshUser } = useAuth();
  const router = useRouter();

  const clearError = () => setError(null);

  const signInWithEmail = async (email: string, password: string): Promise<AuthUser | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const user = await EmailAuthService.signIn(email, password);
      
      if (user) {
        await refreshUser();
        router.push('/platform');
      }
      
      return user;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al iniciar sesión';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string): Promise<AuthUser | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const user = await EmailAuthService.signUp(email, password);
      
      if (user) {
        await refreshUser();
        router.push('/platform');
      }
      
      return user;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al registrar usuario';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await GoogleAuthService.signInWithGoogle();
      // El callback manejará la redirección después de la autenticación exitosa
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al iniciar sesión con Google';
      setError(errorMessage);
      setLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await EmailAuthService.resetPassword(email);
      // Mostrar mensaje de éxito o redirigir
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al enviar email de recuperación';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    resetPassword,
    clearError,
  };
}
