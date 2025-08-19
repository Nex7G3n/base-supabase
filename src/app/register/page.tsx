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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-100 to-blue-200">
      <Card className="p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-green-700">Registrarse</h2>
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <Input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <Input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={loading}
          />
          <Input
            type="password"
            placeholder="Confirmar contraseña"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
          />
          <Button 
            type="submit" 
            className="bg-green-600 text-white hover:bg-green-700"
            disabled={loading}
          >
            {loading ? "Creando cuenta..." : "Registrarse"}
          </Button>
        </form>
        <div className="flex flex-col items-center mt-6 gap-2">
          <Button 
            variant="outline" 
            onClick={handleGoogleRegister} 
            className="flex items-center gap-2"
            disabled={loading}
          >
            <GoogleIcon className="w-5 h-5" />
            Registrarse con Google
          </Button>
          <a href="/login" className="text-green-600 hover:underline text-sm">
            ¿Ya tienes cuenta? Inicia sesión
          </a>
        </div>
        {(error || validationError) && (
          <p className="text-red-500 text-center mt-4">
            {validationError || error}
          </p>
        )}
      </Card>
    </div>
  );
}
