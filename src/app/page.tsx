"use client";
import { useAuthState } from "../auth";
import { Button } from "../components/ui/button";
import Link from "next/link";

export default function Home() {
  // Obtener estado de autenticación
  const { user, isAuthenticated, loading } = useAuthState();

  // Mostrar skeleton mientras carga
  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-4" />
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-6" />
            <div className="h-10 bg-gray-200 rounded w-32 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  // Si está autenticado, mostrar contenido con el layout global
  if (isAuthenticated) {
    return (
      <div className="home-container">
        <div className="max-w-6xl mx-auto">
          <div className="welcome-card">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-blue-600 mb-4">¡Bienvenido!</h1>
              <p className="text-gray-600 mb-6 text-lg">
                Hola, {user?.first_name || user?.email?.split('@')[0]}
              </p>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Card de Dashboard */}
                  <Link href="/dashboard">
                    <div className="base-card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:from-blue-100 hover:to-blue-150 transition-all duration-200 cursor-pointer">
                      <div className="flex items-center mb-3">
                        <div className="p-2 bg-blue-500 rounded-lg mr-3">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-blue-800">Dashboard</h3>
                      </div>
                      <p className="text-blue-600">Panel de control principal</p>
                    </div>
                  </Link>

                  {/* Card de Usuarios */}
                  <Link href="/users">
                    <div className="base-card bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:from-green-100 hover:to-green-150 transition-all duration-200 cursor-pointer">
                      <div className="flex items-center mb-3">
                        <div className="p-2 bg-green-500 rounded-lg mr-3">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-green-800">Usuarios</h3>
                      </div>
                      <p className="text-green-600">Gestión de usuarios del sistema</p>
                    </div>
                  </Link>

                  {/* Card de Configuración */}
                  <Link href="/settings">
                    <div className="base-card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:from-purple-100 hover:to-purple-150 transition-all duration-200 cursor-pointer">
                      <div className="flex items-center mb-3">
                        <div className="p-2 bg-purple-500 rounded-lg mr-3">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-purple-800">Configuración</h3>
                      </div>
                      <p className="text-purple-600">Ajustes y configuración</p>
                    </div>
                  </Link>
                  
                  {/* Card de Clientes */}
                  <Link href="/clients">
                    <div className="base-card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:from-orange-100 hover:to-orange-150 transition-all duration-200 cursor-pointer">
                      <div className="flex items-center mb-3">
                        <div className="p-2 bg-orange-500 rounded-lg mr-3">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-orange-800">Clientes</h3>
                      </div>
                      <p className="text-orange-600">Gestión de clientes</p>
                    </div>
                  </Link>

                  {/* Card de Proveedores */}
                  <Link href="/suppliers">
                    <div className="base-card bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200 hover:from-teal-100 hover:to-teal-150 transition-all duration-200 cursor-pointer">
                      <div className="flex items-center mb-3">
                        <div className="p-2 bg-teal-500 rounded-lg mr-3">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-teal-800">Proveedores</h3>
                      </div>
                      <p className="text-teal-600">Gestión de proveedores</p>
                    </div>
                  </Link>

                  {/* Card de Roles */}
                  <Link href="/roles">
                    <div className="base-card bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 hover:from-indigo-100 hover:to-indigo-150 transition-all duration-200 cursor-pointer">
                      <div className="flex items-center mb-3">
                        <div className="p-2 bg-indigo-500 rounded-lg mr-3">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-indigo-800">Roles</h3>
                      </div>
                      <p className="text-indigo-600">Gestión de roles y permisos</p>
                    </div>
                  </Link>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">
                        Conectado como: <span className="font-medium text-gray-700">{user?.first_name || user?.email?.split('@')[0]}</span>
                      </p>
                      <p className="text-sm text-gray-500">
                        Email: {user?.email}
                      </p>
                    </div>
                    <Link href="/logout">
                      <Button variant="outline" className="hover:bg-red-50 hover:border-red-300 hover:text-red-600">
                        Cerrar Sesión
                      </Button>
                    </Link>
                  </div>
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
    <div className="auth-container">
      <div className="auth-card">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="auth-title">Bienvenido</h2>
          <p className="auth-subtitle">Ingresa tus credenciales para acceder</p>
        </div>
        
        <div className="space-y-4">
          <Link href="/login" className="w-full">
            <Button className="w-full bg-blue-600 text-white hover:bg-blue-700 py-3 text-base font-medium">
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
