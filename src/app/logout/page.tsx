"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "../../auth";

export default function LogoutPage() {
  const router = useRouter();
  const { logout } = useAuthActions();
  const hasLoggedOut = useRef(false);

  useEffect(() => {
    if (hasLoggedOut.current) return; // Prevent multiple executions
    
    async function handleLogout() {
      hasLoggedOut.current = true;
      try {
        await logout();
        // Redirect to home page after logout
        router.replace("/");
      } catch (error) {
        console.error("Logout error:", error);
        // Even if logout fails, redirect to home
        router.replace("/");
      }
    }
    
    handleLogout();

    // Timeout de seguridad para asegurar redirección
    const timeoutId = setTimeout(() => {
      router.replace("/");
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, []); // Empty dependency array to run only once

  return (
    <div className="page-container">
      <div className="flex items-center justify-center min-h-screen">
        <div className="auth-card">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cerrando sesión...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
