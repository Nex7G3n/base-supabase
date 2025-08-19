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
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-blue-300">
            <Card className="p-8 w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center text-blue-700">Iniciar sesión</h2>
                <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
                    <Input
                        type="email"
                        placeholder="Correo"
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
                    <Button 
                        type="submit" 
                        className="bg-blue-600 text-white hover:bg-blue-700"
                        disabled={loading}
                    >
                        {loading ? "Iniciando sesión..." : "Entrar"}
                    </Button>
                </form>
                <div className="flex flex-col items-center mt-6 gap-2">
                    <Button 
                        variant="outline" 
                        onClick={handleGoogleLogin} 
                        className="flex items-center gap-2"
                        disabled={loading}
                    >
                        <GoogleIcon className="w-5 h-5" />
                        Entrar con Google
                    </Button>
                    <a href="/register" className="text-blue-600 hover:underline text-sm">
                        ¿No tienes cuenta? Regístrate
                    </a>
                </div>
                {error && <p className="text-red-500 text-center mt-4">{error}</p>}
            </Card>
        </div>
    );
}
