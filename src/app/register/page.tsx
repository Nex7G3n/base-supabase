"use client";
import React, { useState } from "react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { GoogleIcon } from "../../components/ui/icons";
import { useAuthActions, useAuthState, useRedirectIfAuthenticated } from "../../auth";

export default function RegisterPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [validationError, setValidationError] = useState("");
    
    // Usar los nuevos hooks de Zustand
    const { register, loginWithGoogle, clearError } = useAuthActions();
    const { loading, error } = useAuthState();
    
    // Redirigir si ya está autenticado
    useRedirectIfAuthenticated();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        setValidationError("");
        
        if (!email || !password || !confirmPassword) {
            setValidationError("Todos los campos son obligatorios");
            return;
        }

        if (password !== confirmPassword) {
            setValidationError("Las contraseñas no coinciden");
            return;
        }

        if (password.length < 6) {
            setValidationError("La contraseña debe tener al menos 6 caracteres");
            return;
        }
        
        await register(email, password);
    };

    const handleGoogleRegister = async () => {
        clearError();
        setValidationError("");
        await loginWithGoogle();
    };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="auth-title">Crear cuenta</h2>
          <p className="auth-subtitle">Completa los datos para registrarte</p>
        </div>
        
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={loading}
              className="h-12 px-4 text-base"
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Contraseña (mínimo 6 caracteres)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={loading}
              className="h-12 px-4 text-base"
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Confirmar contraseña"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              className="h-12 px-4 text-base"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-green-600 text-white hover:bg-green-700 h-12 text-base font-medium"
            disabled={loading}
          >
            {loading ? "Creando cuenta..." : "Crear Cuenta"}
          </Button>
        </form>
        
        <div className="mt-6 space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">O regístrate con</span>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            onClick={handleGoogleRegister} 
            className="w-full flex items-center justify-center gap-3 h-12 text-base"
            disabled={loading}
          >
            <GoogleIcon className="w-5 h-5" />
            Google
          </Button>
          
          <div className="text-center">
            <a href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
              ¿Ya tienes cuenta? Inicia sesión aquí
            </a>
          </div>
        </div>
        
        {(error || validationError) && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm text-center">
              {validationError || error}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
