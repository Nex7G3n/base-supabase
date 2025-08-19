"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../common/supabaseClient";

export default function AuthCallbackPage() {
    const router = useRouter();

    useEffect(() => {
        const handleAuthCallback = async () => {
            const { data, error } = await supabase.auth.getSession();

            if (error) {
                console.error("Error durante el callback de autenticación:", error);
                router.push("/login?error=auth_error");
                return;
            }

            if (data.session?.user) {
                // Usuario autenticado exitosamente, redirigir a la plataforma
                router.push("/");
            } else {
                // No hay sesión, redirigir al login
                router.push("/login");
            }
        };

        handleAuthCallback();
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Procesando autenticación...</p>
            </div>
        </div>
    );
}
