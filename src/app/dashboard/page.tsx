"use client";
import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../components/ProtectedComponent';
import { useAuthState } from '../../auth';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import Link from 'next/link';
import { 
  CustomLineChart, 
  CustomBarChart, 
  CustomDonutChart, 
  CustomMultiLineChart 
} from '../../components/charts';
import { 
  DashboardService, 
  DashboardStats, 
  UserRegistrationTrend, 
  PurchaseOrderStats, 
  MonthlyGrowth, 
  ChartData 
} from '../../services/analytics/dashboard.service';
import { 
  Users, 
  UserCheck, 
  Building2, 
  Truck, 
  ShoppingCart, 
  TrendingUp,
  Activity,
  DollarSign,
  BarChart3,
  Calendar
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthState();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [userTrend, setUserTrend] = useState<UserRegistrationTrend[]>([]);
  const [purchaseOrderStats, setPurchaseOrderStats] = useState<PurchaseOrderStats[]>([]);
  const [monthlyGrowth, setMonthlyGrowth] = useState<MonthlyGrowth[]>([]);
  const [weeklyActivity, setWeeklyActivity] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [
          dashboardStats,
          registrationTrend,
          orderStats,
          growthData,
          activityData
        ] = await Promise.all([
          DashboardService.getDashboardStats(),
          DashboardService.getUserRegistrationTrend(30),
          DashboardService.getPurchaseOrderStats(),
          DashboardService.getMonthlyGrowth(6),
          DashboardService.getWeeklyActivity(8)
        ]);

        setStats(dashboardStats);
        setUserTrend(registrationTrend);
        setPurchaseOrderStats(orderStats);
        setMonthlyGrowth(growthData);
        setWeeklyActivity(activityData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <ProtectedRoute permissions={['dashboard_read']}>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute permissions={['dashboard_read']}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-2 text-lg text-gray-600">
                ¡Bienvenido, {user?.first_name || user?.email?.split('@')[0]}! Este es tu panel de control principal
              </p>
            </div>
            <div className="flex gap-2 mt-4 sm:mt-0">
              <Button variant="outline" className="bg-white">
                <Calendar className="w-4 h-4 mr-2" />
                Exportar Reporte
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Activity className="w-4 h-4 mr-2" />
                Actualizar Datos
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Users Card */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-blue-800">Total Usuarios</h3>
                    <p className="text-2xl font-bold text-blue-900">{stats?.totalUsers || 0}</p>
                    <p className="text-xs text-blue-600 mt-1">
                      {stats?.activeUsers || 0} activos en 30 días
                    </p>
                  </div>
                  <div className="p-3 bg-blue-500 rounded-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Clients Card */}
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-green-800">Total Clientes</h3>
                    <p className="text-2xl font-bold text-green-900">{stats?.totalClients || 0}</p>
                    <p className="text-xs text-green-600 mt-1">
                      Clientes registrados
                    </p>
                  </div>
                  <div className="p-3 bg-green-500 rounded-lg">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Suppliers Card */}
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-orange-800">Total Proveedores</h3>
                    <p className="text-2xl font-bold text-orange-900">{stats?.totalSuppliers || 0}</p>
                    <p className="text-xs text-orange-600 mt-1">
                      Proveedores activos
                    </p>
                  </div>
                  <div className="p-3 bg-orange-500 rounded-lg">
                    <Truck className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Purchase Orders Card */}
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-purple-800">Órdenes de Compra</h3>
                    <p className="text-2xl font-bold text-purple-900">{stats?.totalPurchaseOrders || 0}</p>
                    <p className="text-xs text-purple-600 mt-1">
                      {stats?.recentActivity || 0} nuevas esta semana
                    </p>
                  </div>
                  <div className="p-3 bg-purple-500 rounded-lg">
                    <ShoppingCart className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Registration Trend */}
            <CustomLineChart
              data={userTrend}
              title="Tendencia de Registro de Usuarios"
              dataKey="count"
              xAxisKey="date"
              color="#3b82f6"
              height={300}
            />

            {/* Purchase Order Status Distribution */}
            <CustomDonutChart
              data={purchaseOrderStats.map(stat => ({
                name: stat.status.charAt(0).toUpperCase() + stat.status.slice(1),
                value: stat.count
              }))}
              title="Estado de Órdenes de Compra"
              dataKey="value"
              height={300}
            />
          </div>

          {/* Monthly Growth Chart */}
          <div className="grid grid-cols-1 gap-6">
            <CustomMultiLineChart
              data={monthlyGrowth}
              title="Crecimiento Mensual por Categoría"
              xAxisKey="month"
              height={400}
              lines={[
                { dataKey: 'users', color: '#3b82f6', name: 'Usuarios' },
                { dataKey: 'clients', color: '#10b981', name: 'Clientes' },
                { dataKey: 'suppliers', color: '#f59e0b', name: 'Proveedores' },
                { dataKey: 'orders', color: '#8b5cf6', name: 'Órdenes' }
              ]}
            />
          </div>

          {/* Weekly Activity Chart */}
          <div className="grid grid-cols-1 gap-6">
            <CustomBarChart
              data={weeklyActivity}
              title="Actividad Semanal"
              dataKey="users"
              xAxisKey="date"
              color="#10b981"
              height={300}
            />
          </div>

          {/* Quick Actions & Account Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Link href="/users">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      <Users className="w-4 h-4 mr-2" />
                      Ver Usuarios
                    </Button>
                  </Link>
                  <Link href="/clients">
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      <Building2 className="w-4 h-4 mr-2" />
                      Ver Clientes
                    </Button>
                  </Link>
                  <Link href="/suppliers">
                    <Button className="w-full bg-orange-600 hover:bg-orange-700">
                      <Truck className="w-4 h-4 mr-2" />
                      Ver Proveedores
                    </Button>
                  </Link>
                  <Link href="/purchase-orders">
                    <Button className="w-full bg-purple-600 hover:bg-purple-700">
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Ver Órdenes
                    </Button>
                  </Link>
                </div>
                <div className="pt-4 border-t">
                  <Link href="/reports/purchases">
                    <Button variant="outline" className="w-full bg-white">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Ver Reportes
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Información de la Cuenta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {user?.first_name || 'No especificado'} {user?.last_name || ''}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Estado</label>
                    <div className="flex items-center mt-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                        Activo
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Último acceso</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {user?.last_login ? new Date(user.last_login).toLocaleString() : 'No disponible'}
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <Link href="/settings">
                    <Button variant="outline" className="w-full bg-white">
                      Configurar Perfil
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </ProtectedRoute>
  );
}
