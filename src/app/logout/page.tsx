"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "../../auth";

export default function LogoutPage() {
  const router = useRouter();
  const { logout } = useAuthActions();

  useEffect(() => {
    async function handleLogout() {
      await logout();
      router.replace("/");
    }
    handleLogout();
  }, [logout, router]);

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
