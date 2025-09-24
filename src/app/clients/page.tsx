"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Download, Settings2, Users, Mail, Phone, FileText, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ClientForm } from "@/components/forms/ClientForm";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClientsColumns } from "./columns";
import { Client, ClientFilters } from "@/types/management.types";
import { ClientsService } from "@/services/management/clients.service";
import { useToast } from "@/common/hooks/useToast";
import { useAuthSimple } from "@/auth/application/hooks/useAuthSimple";
import { ProtectedComponent } from "@/components/ProtectedComponent";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showClientForm, setShowClientForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    email: true,
    phone: true,
    tax_id: true,
    address: true,
    created_at: true,
    actions: true
  });
  const [stats, setStats] = useState({
    total: 0,
    withEmail: 0,
    withPhone: 0,
    recentlyAdded: 0
  });
  const { toast } = useToast();
  const { } = useAuthSimple();

  useEffect(() => {
    loadClients();
    loadStats();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadClients = async (filters?: ClientFilters) => {
    setLoading(true);
    try {
      const response = await ClientsService.getAll(filters);
      
      if (response.success && response.data) {
        setClients(response.data);
      } else {
        toast({
          title: "Error",
          description: response.error || "Error al cargar clientes",
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Error al cargar clientes:", error);
      toast({
        title: "Error",
        description: "Error inesperado al cargar clientes",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await ClientsService.getStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    const filters: ClientFilters = {};
    
    if (value.trim()) {
      filters.search = value.trim();
    }

    loadClients(filters);
  };

  const toggleColumn = (columnKey: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey as keyof typeof prev]
    }));
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setShowClientForm(true);
  };

  const handleDeleteClient = (client: Client) => {
    setClientToDelete(client);
  };

  const confirmDeleteClient = async () => {
    if (!clientToDelete) return;

    try {
      const response = await ClientsService.delete(clientToDelete.id);
      
      if (response.success) {
        toast({
          title: "Éxito",
          description: response.message,
          variant: "success",
        });
        
        loadClients();
        loadStats();
      } else {
        toast({
          title: "Error",
          description: response.error || response.message,
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Error al eliminar cliente:", error);
      toast({
        title: "Error",
        description: "Error inesperado al eliminar cliente",
        variant: "error",
      });
    } finally {
      setClientToDelete(null);
    }
  };

  const handleClientFormSuccess = () => {
    loadClients();
    loadStats();
    setSelectedClient(null);
  };



  const handleNewClient = () => {
    setSelectedClient(null);
    setShowClientForm(true);
  };

  const exportToCSV = () => {
    if (clients.length === 0) {
      toast({
        title: "Información",
        description: "No hay datos para exportar",
        variant: "info",
      });
      return;
    }

    const headers = ["Nombre", "Email", "Teléfono", "NIT/CC", "Dirección", "Fecha de Registro"];
    const csvContent = [
      headers.join(","),
      ...clients.map(client => [
        `"${client.name}"`,
        `"${client.email || ""}"`,
        `"${client.phone || ""}"`,
        `"${client.tax_id || ""}"`,
        `"${client.address || ""}"`,
        `"${new Date(client.created_at).toLocaleDateString("es-ES")}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `clientes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Éxito",
      description: "Archivo CSV descargado correctamente",
      variant: "success",
    });
  };

  // Crear columnas con filtrado por visibilidad
  const allColumns = createClientsColumns(handleEditClient, handleDeleteClient);
  const columns = allColumns.filter(column => {
    const accessorKey = (column as any).accessorKey || (column as any).id;
    if (accessorKey === 'actions') return visibleColumns.actions;
    return visibleColumns[accessorKey as keyof typeof visibleColumns] ?? true;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Clientes</h1>
            <p className="mt-2 text-lg text-gray-600">Administra la información de todos los clientes de tu organización</p>
          </div>
          <ProtectedComponent permissions={["clients_create"]}>
            <Button
              onClick={handleNewClient}
              className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Cliente
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
                  <p className="text-sm text-blue-600">Total Clientes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-500 rounded-lg text-white mr-4">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-800">{stats.withEmail}</div>
                  <p className="text-sm text-green-600">Con Email</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-orange-500 rounded-lg text-white mr-4">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-800">{stats.withPhone}</div>
                  <p className="text-sm text-orange-600">Con Teléfono</p>
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
                placeholder="Buscar clientes por nombre, email o teléfono..."
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
                  checked={visibleColumns.name}
                  onCheckedChange={() => toggleColumn('name')}
                >
                  Nombre
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.email}
                  onCheckedChange={() => toggleColumn('email')}
                >
                  Email
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.phone}
                  onCheckedChange={() => toggleColumn('phone')}
                >
                  Teléfono
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.tax_id}
                  onCheckedChange={() => toggleColumn('tax_id')}
                >
                  NIT/CC
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.address}
                  onCheckedChange={() => toggleColumn('address')}
                >
                  Dirección
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
            <CardTitle>Lista de Clientes</CardTitle>
            <CardDescription>
              Visualiza y administra todos los clientes registrados en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={clients}
            />
          </CardContent>
        </Card>

      {/* Client Form Dialog */}
      <ClientForm
        open={showClientForm}
        onOpenChange={setShowClientForm}
        client={selectedClient}
        onSuccess={handleClientFormSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!clientToDelete}
        title="Eliminar Cliente"
        description={`¿Estás seguro de que deseas eliminar al cliente "${clientToDelete?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        onConfirm={confirmDeleteClient}
        onCancel={() => setClientToDelete(null)}
        variant="destructive"
      />
      </div>
    </div>
  );
}