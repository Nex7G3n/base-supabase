"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ClientForm } from "@/components/forms/ClientForm";
import { createClientsColumns } from "./columns";
import { Client, ClientFilters } from "@/types/management.types";
import { ClientsService } from "@/services/management/clients.service";
import { useToast } from "@/common/hooks/useToast";
import { useAuthSimple } from "@/auth/application/hooks/useAuthSimple";
import { ProtectedComponent } from "@/components/ProtectedComponent";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showClientForm, setShowClientForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
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
  };

  const columns = createClientsColumns(handleEditClient, handleDeleteClient);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Gestiona los clientes de tu organización
          </p>
        </div>
        
        <ProtectedComponent permissions={["clients_create"]}>
          <Button onClick={handleNewClient} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Cliente
          </Button>
        </ProtectedComponent>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Clientes registrados
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Con Email</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withEmail}</div>
            <p className="text-xs text-muted-foreground">
              Contacto por email
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Con Teléfono</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withPhone}</div>
            <p className="text-xs text-muted-foreground">
              Contacto telefónico
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentlyAdded}</div>
            <p className="text-xs text-muted-foreground">
              Últimos 30 días
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <CardDescription>
            Administra y visualiza todos los clientes registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar clientes por nombre, email o teléfono..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
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
  );
}