"use client";
import React, { useState } from "react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { GoogleIcon } from "../../components/ui/icons";
import { useAuthActions, useAuthState, useRedirectIfAuthenticated } from "../../auth";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    
    // Usar los nuevos hooks de Zustand
    const { login, loginWithGoogle, clearError } = useAuthActions();
    const { loading, error } = useAuthState();
    
    // Redirigir si ya está autenticado
    useRedirectIfAuthenticated();

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        
        if (!email || !password) {
            return;
        }
        
        await login(email, password);
    };

    const handleGoogleLogin = async () => {
        clearError();
        await loginWithGoogle();
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="text-center mb-8">
                    <div className="mx-auto w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h2 className="auth-title">Iniciar sesión</h2>
                    <p className="auth-subtitle">Ingresa tus credenciales para continuar</p>
                </div>
                <form onSubmit={handleEmailLogin} className="space-y-4">
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
                            placeholder="Contraseña"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            disabled={loading}
                            className="h-12 px-4 text-base"
                        />
                    </div>
                    <Button 
                        type="submit" 
                        className="w-full bg-blue-600 text-white hover:bg-blue-700 h-12 text-base font-medium"
                        disabled={loading}
                    >
                        {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                    </Button>
                </form>
                
                <div className="mt-6 space-y-4">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">O continúa con</span>
                        </div>
                    </div>
                    
                    <Button 
                        variant="outline" 
                        onClick={handleGoogleLogin} 
                        className="w-full flex items-center justify-center gap-3 h-12 text-base"
                        disabled={loading}
                    >
                        <GoogleIcon className="w-5 h-5" />
                        Google
                    </Button>
                    
                    <div className="text-center">
                        <a href="/register" className="text-blue-600 hover:text-blue-800 font-medium">
                            ¿No tienes cuenta? Regístrate aquí
                        </a>
                    </div>
                </div>
                
                {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600 text-sm text-center">{error}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
