"use client";

import { ColumnDef } from "@tanstack/react-table";
import { PurchaseOrder } from "../../types/management.types";
import { Button } from "../../components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { ProtectedComponent } from "../../components/ProtectedComponent";

interface PurchaseOrderColumnsProps {
  onEdit: (order: PurchaseOrder) => void;
  onDelete: (order: PurchaseOrder) => void;
}

export const createPurchaseOrderColumns = ({ onEdit, onDelete }: PurchaseOrderColumnsProps): ColumnDef<PurchaseOrder>[] => [
  {
    accessorKey: "order_number",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Número de Orden
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "supplier.name",
    header: "Proveedor",
  },
  {
    accessorKey: "order_date",
    header: "Fecha de Orden",
    cell: ({ row }) => {
      const date = new Date(row.getValue("order_date"));
      return <div>{date.toLocaleDateString()}</div>;
    },
  },
  {
    accessorKey: "total_amount",
    header: "Monto Total",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("total_amount"));
      const formatted = new Intl.NumberFormat("es-PE", {
        style: "currency",
        currency: "PEN",
      }).format(amount);
      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      let color = "";
      switch (status) {
        case "draft":
          color = "bg-gray-100 text-gray-800";
          break;
        case "pending":
          color = "bg-yellow-100 text-yellow-800";
          break;
        case "approved":
          color = "bg-blue-100 text-blue-800";
          break;
        case "received":
          color = "bg-green-100 text-green-800";
          break;
        case "cancelled":
          color = "bg-red-100 text-red-800";
          break;
      }
      return (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${color}`}
        >
          {status}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => {
      const order = row.original;

      return (
        <div className="flex items-center space-x-2">
          <ProtectedComponent permissions={["purchase_orders_update"]}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(order)}
            >
              Editar
            </Button>
          </ProtectedComponent>
          <ProtectedComponent permissions={["purchase_orders_delete"]}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(order)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
            >
              Eliminar
            </Button>
          </ProtectedComponent>
        </div>
      );
    },
  },
];
