"use client";
import React, { useState, useEffect } from 'react';
import { Search, Download, Settings2, Plus, Users, Mail, Shield, Clock, Check } from 'lucide-react';
import { ProtectedRoute, ProtectedComponent, PermissionButton } from '../../components/ProtectedComponent';
import { useUserManagement, useRoleManagement } from '../../common/hooks/useManagement';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { DataTable } from '../../components/ui/data-table';
import { TableSkeleton } from '../../components/ui/skeleton';
import { UserForm } from '../../components/forms/UserForm';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { createUserColumns } from './columns';
import { User, Role } from '../../types/management.types';
import { useToast } from '../../common/hooks/useToast';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    first_name: true,
    last_name: true,
    email: true,
    roles: true,
    is_active: true,
    created_at: true,
    actions: true
  });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    withEmail: 0,
    recentlyAdded: 0
  });

  const { getUsers, createUser, updateUser, deleteUser, assignRoles, loading, error } = useUserManagement();
  const { getAllActiveRoles } = useRoleManagement();
  const { toast } = useToast();

  // Cargar datos iniciales
  useEffect(() => {
    loadUsers();
    loadRoles();
    loadStats();
  }, []);

  // Cargar usuarios cuando cambie la página o búsqueda
  useEffect(() => {
    loadUsers();
  }, [currentPage, searchTerm]);

  const loadUsers = async () => {
    try {
      const filters = searchTerm ? { search: searchTerm } : undefined;
      const result = await getUsers(currentPage, 10, filters);
      setUsers(result.data);
      setTotalPages(Math.ceil(result.total / 10));
      
      // Actualizar stats después de cargar usuarios
      setTimeout(() => {
        loadStats();
      }, 100);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      toast({
        title: "Error",
        description: "Error al cargar usuarios",
        variant: "error",
      });
    }
  };

  const loadRoles = async () => {
    try {
      const rolesData = await getAllActiveRoles();
      setRoles(rolesData);
    } catch (error) {
      console.error('Error al cargar roles:', error);
    }
  };

  const loadStats = async () => {
    try {
      // Simular stats básicas basadas en los usuarios cargados
      // En una implementación real, esto vendría del backend
      const totalUsers = users.length;
      const activeUsers = users.filter(user => user.is_active).length;
      const usersWithEmail = users.filter(user => user.email).length;
      const recentUsers = users.filter(user => {
        const userDate = new Date(user.created_at);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return userDate > thirtyDaysAgo;
      }).length;

      setStats({
        total: totalUsers,
        active: activeUsers,
        withEmail: usersWithEmail,
        recentlyAdded: recentUsers
      });
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset a la primera página al buscar
  };

  const toggleColumn = (columnKey: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey as keyof typeof prev]
    }));
  };

  const exportToCSV = () => {
    if (users.length === 0) {
      toast({
        title: "Información",
        description: "No hay datos para exportar",
        variant: "info",
      });
      return;
    }

    const headers = ["Nombre", "Apellido", "Email", "Activo", "Roles", "Fecha de Registro"];
    const csvContent = [
      headers.join(","),
      ...users.map(user => [
        `"${user.first_name}"`,
        `"${user.last_name}"`,
        `"${user.email}"`,
        user.is_active ? "Sí" : "No",
        `"${(user as any).roles?.map((r: any) => r.name).join(", ") || ""}"`,
        `"${new Date(user.created_at).toLocaleDateString()}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `usuarios_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "Éxito",
      description: "Archivo CSV descargado correctamente",
      variant: "success",
    });
  };

  const handleCreateUser = async (userData: any) => {
    try {
      const response = await createUser(userData);
      if (response.success) {
        setShowCreateForm(false);
        loadUsers();
        // Si hay roles seleccionados, asignarlos
        if (userData.role_ids && userData.role_ids.length > 0 && response.data?.id) {
          await assignRoles(response.data.id, userData.role_ids);
        }
        toast({
          title: "Éxito",
          description: "Usuario creado correctamente",
          variant: "success",
        });
      }
    } catch (error) {
      console.error('Error al crear usuario:', error);
      toast({
        title: "Error",
        description: "Error al crear usuario",
        variant: "error",
      });
    }
  };

  const handleUpdateUser = async (userId: string, userData: any) => {
    try {
      const response = await updateUser(userId, userData);
      if (response.success) {
        setSelectedUser(null);
        loadUsers();
        // Si hay roles seleccionados, asignarlos
        if (userData.role_ids) {
          await assignRoles(userId, userData.role_ids);
        }
        toast({
          title: "Éxito",
          description: "Usuario actualizado correctamente",
          variant: "success",
        });
      }
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      toast({
        title: "Error",
        description: "Error al actualizar usuario",
        variant: "error",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setUserToDelete(user);
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const response = await deleteUser(userToDelete.id);
      if (response.success) {
        loadUsers();
        setUserToDelete(null);
        toast({
          title: "Éxito",
          description: "Usuario eliminado correctamente",
          variant: "success",
        });
      }
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      toast({
        title: "Error",
        description: "Error al eliminar usuario",
        variant: "error",
      });
    }
  };

  // Crear las columnas de la tabla
  const allColumns = createUserColumns({
    onEdit: (user: User) => setSelectedUser(user),
    onDelete: handleDeleteUser
  });

  // Filtrar columnas basado en visibilidad
  const columns = allColumns.filter(column => {
    const accessorKey = (column as any).accessorKey || (column as any).id;
    if (accessorKey === 'actions') return visibleColumns.actions;
    return visibleColumns[accessorKey as keyof typeof visibleColumns] ?? true;
  });

  return (
    <ProtectedRoute permissions={['users_read']}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
              <p className="mt-2 text-lg text-gray-600">Administra los usuarios del sistema y sus permisos</p>
            </div>
            <ProtectedComponent permissions={['users_create']}>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Usuario
              </Button>
            </ProtectedComponent>
          </div>

          {/* Stats Section */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-500 rounded-lg text-white mr-4">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-800">{stats.total}</div>
                    <p className="text-sm text-blue-600">Total Usuarios</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-500 rounded-lg text-white mr-4">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-800">{stats.active}</div>
                    <p className="text-sm text-green-600">Usuarios Activos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-orange-500 rounded-lg text-white mr-4">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-800">{stats.withEmail}</div>
                    <p className="text-sm text-orange-600">Con Email</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-500 rounded-lg text-white mr-4">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-800">{stats.recentlyAdded}</div>
                    <p className="text-sm text-purple-600">Últimos 30 días</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters Section - FUERA DE LA CARD */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Barra de búsqueda */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar usuarios por nombre, apellido o email..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            {/* Botones de acción */}
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Settings2 className="h-4 w-4" />
                    Columnas
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.first_name}
                    onCheckedChange={() => toggleColumn('first_name')}
                  >
                    Nombre
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.last_name}
                    onCheckedChange={() => toggleColumn('last_name')}
                  >
                    Apellido
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.email}
                    onCheckedChange={() => toggleColumn('email')}
                  >
                    Email
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.roles}
                    onCheckedChange={() => toggleColumn('roles')}
                  >
                    Roles
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.is_active}
                    onCheckedChange={() => toggleColumn('is_active')}
                  >
                    Estado
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.created_at}
                    onCheckedChange={() => toggleColumn('created_at')}
                  >
                    Fecha de Registro
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.actions}
                    onCheckedChange={() => toggleColumn('actions')}
                  >
                    Acciones
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button
                variant="outline"
                onClick={exportToCSV}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>

          {/* Table Section - DENTRO DE CARD */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Usuarios</CardTitle>
              <CardDescription>
                Visualiza y administra todos los usuarios registrados en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading && users.length === 0 ? (
                <TableSkeleton rows={5} columns={6} />
              ) : (
                <DataTable
                  columns={columns}
                  data={users}
                />
              )}
            </CardContent>
          </Card>

          {/* Error display */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <p className="text-sm text-red-600">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Formulario de crear usuario */}
          {showCreateForm && (
            <UserForm
              roles={roles}
              onSubmit={handleCreateUser}
              onCancel={() => setShowCreateForm(false)}
              loading={loading}
              open={showCreateForm}
            />
          )}

          {/* Formulario de editar usuario */}
          {selectedUser && (
            <UserForm
              user={selectedUser}
              roles={roles}
              onSubmit={(userData) => handleUpdateUser(selectedUser.id, userData)}
              onCancel={() => setSelectedUser(null)}
              loading={loading}
              open={!!selectedUser}
            />
          )}

          {/* Dialog de confirmación para eliminar */}
          {userToDelete && (
            <ConfirmDialog
              open={!!userToDelete}
              title="Eliminar Usuario"
              description={`¿Estás seguro de que quieres eliminar al usuario "${userToDelete.first_name} ${userToDelete.last_name}" (${userToDelete.email})? Esta acción no se puede deshacer.`}
              confirmText="Eliminar"
              cancelText="Cancelar"
              variant="destructive"
              onConfirm={confirmDeleteUser}
              onCancel={() => setUserToDelete(null)}
              loading={loading}
            />
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
