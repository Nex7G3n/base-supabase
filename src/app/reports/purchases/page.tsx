"use client";
import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '../../../components/ProtectedComponent';
import { PurchaseOrderManagementService } from '../../../services/management/purchase-orders.service';
import { SupplierManagementService } from '../../../services/management/suppliers.service';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { PurchaseReport, Supplier } from '../../../types/management.types';

export default function PurchasesReportPage() {
  const [reportData, setReportData] = useState<PurchaseReport[]>([]);
  const [suppliers, setSuppliers] = useState<Pick<Supplier, 'id' | 'name'>[]>([]);
  const [filters, setFilters] = useState({
    date_from: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    date_to: new Date().toISOString().split('T')[0],
    supplier_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const activeSuppliers = await SupplierManagementService.getAllActiveSuppliers();
      setSuppliers(activeSuppliers);
    } catch (err) {
      console.error('Error al cargar proveedores:', err);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await PurchaseOrderManagementService.generatePurchaseReport(filters);
      setReportData(data);
    } catch (err) {
      setError('Error al generar el reporte');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute permissions={['reports_read']}>
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Reporte de Compras</h2>
          <p className="text-gray-600">Reporte de compras por proveedor y rango de fechas</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex items-end space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
            <Input
              type="date"
              value={filters.date_from}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
            <Input
              type="date"
              value={filters.date_to}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
            <select
              value={filters.supplier_id}
              onChange={(e) => handleFilterChange('supplier_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Todos</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
              ))}
            </select>
          </div>
          <Button onClick={generateReport} disabled={loading}>
            {loading ? 'Generando...' : 'Generar Reporte'}
          </Button>
        </div>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="p-2">Proveedor</th>
                <th className="p-2">Total Órdenes</th>
                <th className="p-2">Monto Total</th>
                <th className="p-2">Última Orden</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map(row => (
                <tr key={row.supplier_id} className="border-t">
                  <td className="p-2">{row.supplier_name}</td>
                  <td className="p-2">{row.total_orders}</td>
                  <td className="p-2">{new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(row.total_amount)}</td>
                  <td className="p-2">{row.last_order_date ? new Date(row.last_order_date).toLocaleDateString() : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ProtectedRoute>
  );
}
