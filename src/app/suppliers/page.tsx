"use client";
import React, { useState, useEffect } from 'react';
import { ProtectedRoute, ProtectedComponent } from '../../components/ProtectedComponent';
import { SupplierManagementService } from '../../services/management/suppliers.service';
import { Button } from '../../components/ui/button';
import { DataTable } from '../../components/ui/data-table';
import { TableSkeleton } from '../../components/ui/skeleton';
import { SupplierForm } from '../../components/forms/SupplierForm';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { createSupplierColumns } from './columns';
import { Supplier } from '../../types/management.types';
import { useToast } from '../../common/hooks/useToast';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const { success, error: showError } = useToast();

  useEffect(() => {
    loadSuppliers();
  }, [currentPage]);

  const loadSuppliers = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await SupplierManagementService.getSuppliers(currentPage, 10);
      setSuppliers(result.data);
      setTotalPages(result.totalPages);
    } catch (err) {
      setError('Error al cargar proveedores');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSupplier = async (supplierData: any) => {
    setLoading(true);
    try {
      const response = await SupplierManagementService.createSupplier(supplierData);
      if (response.success) {
        setShowCreateForm(false);
        loadSuppliers();
        success('Proveedor creado exitosamente');
      } else {
        showError(response.error || 'Error al crear proveedor');
      }
    } catch (err) {
      showError('Error al crear proveedor');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSupplier = async (supplierId: string, supplierData: any) => {
    setLoading(true);
    try {
      const response = await SupplierManagementService.updateSupplier(supplierId, supplierData);
      if (response.success) {
        setSelectedSupplier(null);
        loadSuppliers();
        success('Proveedor actualizado exitosamente');
      } else {
        showError(response.error || 'Error al actualizar proveedor');
      }
    } catch (err) {
      showError('Error al actualizar proveedor');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSupplier = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
  };

  const confirmDeleteSupplier = async () => {
    if (!supplierToDelete) return;
    setLoading(true);
    try {
      const response = await SupplierManagementService.deleteSupplier(supplierToDelete.id);
      if (response.success) {
        loadSuppliers();
        setSupplierToDelete(null);
        success('Proveedor eliminado exitosamente');
      } else {
        showError(response.error || 'Error al eliminar proveedor');
      }
    } catch (err) {
      showError('Error al eliminar proveedor');
    } finally {
      setLoading(false);
    }
  };

  const columns = createSupplierColumns({
    onEdit: (supplier: Supplier) => setSelectedSupplier(supplier),
    onDelete: handleDeleteSupplier
  });

  return (
    <ProtectedRoute permissions={['suppliers_read']}>
      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Proveedores</h2>
            <p className="text-gray-600">Gestiona los proveedores del sistema</p>
          </div>
          <ProtectedComponent permissions={['suppliers_create']}>
            <Button onClick={() => setShowCreateForm(true)}>
              Crear Proveedor
            </Button>
          </ProtectedComponent>
        </div>

        {loading && suppliers.length === 0 ? (
          <TableSkeleton rows={5} columns={6} />
        ) : (
          <DataTable
            columns={columns}
            data={suppliers}
            searchKey="name"
            searchPlaceholder="Buscar por nombre..."
          />
        )}

        {error && <p className="text-red-500 mt-4">{error}</p>}

        {showCreateForm && (
          <SupplierForm
            onSubmit={handleCreateSupplier}
            onCancel={() => setShowCreateForm(false)}
            loading={loading}
            open={showCreateForm}
          />
        )}

        {selectedSupplier && (
          <SupplierForm
            supplier={selectedSupplier}
            onSubmit={(data) => handleUpdateSupplier(selectedSupplier.id, data)}
            onCancel={() => setSelectedSupplier(null)}
            loading={loading}
            open={!!selectedSupplier}
          />
        )}

        {supplierToDelete && (
          <ConfirmDialog
            open={!!supplierToDelete}
            title="Eliminar Proveedor"
            description={`¿Estás seguro de que quieres eliminar al proveedor "${supplierToDelete.name}"?`}
            onConfirm={confirmDeleteSupplier}
            onCancel={() => setSupplierToDelete(null)}
            loading={loading}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
