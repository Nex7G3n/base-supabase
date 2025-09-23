"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Supplier } from "../../types/management.types";
import { Button } from "../../components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { ProtectedComponent } from "../../components/ProtectedComponent";

interface SupplierColumnsProps {
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
}

export const createSupplierColumns = ({ onEdit, onDelete }: SupplierColumnsProps): ColumnDef<Supplier>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nombre
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "contact_person",
    header: "Contacto",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "phone",
    header: "Teléfono",
  },
  {
    accessorKey: "is_active",
    header: "Estado",
    cell: ({ row }) => {
      const isActive = row.getValue("is_active");
      return (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            isActive
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {isActive ? "Activo" : "Inactivo"}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => {
      const supplier = row.original;

      return (
        <div className="flex items-center space-x-2">
          <ProtectedComponent permissions={["suppliers_update"]}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(supplier)}
            >
              Editar
            </Button>
          </ProtectedComponent>
          <ProtectedComponent permissions={["suppliers_delete"]}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(supplier)}
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
