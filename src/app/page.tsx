"use client";
import { useAuthState } from "../auth";
import { Button } from "../components/ui/button";
import { PageSkeleton, LoginSkeleton } from "../components/ui/skeleton";
import Link from "next/link";

export default function Home() {
  // Obtener estado de autenticación
  const { user, isAuthenticated, loading } = useAuthState();

  // Mostrar skeleton mientras carga
  if (loading) {
    return <PageSkeleton isAuthenticated={isAuthenticated} />;
  }

  // Si está autenticado, mostrar contenido con el layout global
  if (isAuthenticated) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-green-600 mb-4">¡Hola mundo!</h1>
              <p className="text-gray-600 mb-6">
                Bienvenido, {user?.first_name || user?.email?.split('@')[0]}
              </p>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Card de Dashboard */}
                  <Link href="/dashboard">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 hover:bg-blue-100 transition-colors cursor-pointer">
                      <div className="flex items-center mb-2">
                        <svg className="w-8 h-8 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-blue-800">Dashboard</h3>
                      </div>
                      <p className="text-blue-600">Panel de control principal</p>
                    </div>
                  </Link>

                  {/* Card de Usuarios */}
                  <Link href="/users">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 hover:bg-green-100 transition-colors cursor-pointer">
                      <div className="flex items-center mb-2">
                        <svg className="w-8 h-8 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-green-800">Usuarios</h3>
                      </div>
                      <p className="text-green-600">Gestión de usuarios del sistema</p>
                    </div>
                  </Link>

                  {/* Card de Configuración */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                    <div className="flex items-center mb-2">
                      <svg className="w-8 h-8 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <h3 className="text-lg font-semibold text-purple-800">Configuración</h3>
                    </div>
                    <p className="text-purple-600">Ajustes y configuración</p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-500 mb-4">
                    Email: {user?.email}
                  </p>
                  <Link href="/logout">
                    <Button variant="outline">
                      Cerrar Sesión
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si no está autenticado, mostrar página de inicio de sesión
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Iniciar Sesión</h2>
          <p className="text-gray-600">Ingresa tus credenciales para acceder</p>
        </div>
        
        <div className="space-y-4">
          <Link href="/login" className="w-full">
            <Button className="w-full bg-blue-600 text-white hover:bg-blue-700">
              Iniciar Sesión
            </Button>
          </Link>
          
          <div className="text-center">
            <span className="text-gray-600">¿No tienes una cuenta? </span>
            <Link href="/register" className="text-blue-600 hover:text-blue-800 font-medium">
              Regístrate aquí
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
