"use client";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "../../components/ui/button";
import { Module } from "../../types/management.types";

interface ModuleColumnActions {
  onEdit: (module: Module) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, currentStatus: boolean) => void;
}

export function createModuleColumns(actions: ModuleColumnActions): ColumnDef<Module>[] {
  return [
    {
      accessorKey: "name",
      header: "Nombre",
      cell: ({ row }) => {
        const moduleItem = row.original;
        return (
          <div>
            <div className="font-medium flex items-center">
              {moduleItem.icon && <span className="mr-2">{moduleItem.icon}</span>}
              {moduleItem.name}
            </div>
            {moduleItem.description && (
              <div className="text-sm text-gray-500">{moduleItem.description}</div>
            )}
            {moduleItem.path && (
              <div className="text-xs text-blue-600">{moduleItem.path}</div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "parent_id",
      header: "Módulo Padre",
      cell: ({ row }) => {
        const moduleItem = row.original;
        return (
          <span className="text-sm">
            {moduleItem.parent_id ? (
              <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                Tiene padre
              </span>
            ) : (
              <span className="bg-blue-100 px-2 py-1 rounded text-xs">
                Módulo padre
              </span>
            )}
          </span>
        );
      },
    },
    {
      accessorKey: "sort_order",
      header: "Orden",
      cell: ({ row }) => {
        const moduleItem = row.original;
        return (
          <span className="text-sm font-mono">
            {moduleItem.sort_order}
          </span>
        );
      },
    },
    {
      accessorKey: "is_active",
      header: "Estado",
      cell: ({ row }) => {
        const moduleItem = row.original;
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              moduleItem.is_active
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {moduleItem.is_active ? "Activo" : "Inactivo"}
          </span>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Fecha Creación",
      cell: ({ row }) => {
        const moduleItem = row.original;
        return new Date(moduleItem.created_at).toLocaleDateString();
      },
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => {
        const moduleItem = row.original;
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => actions.onEdit(moduleItem)}
            >
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => actions.onToggleStatus(moduleItem.id, moduleItem.is_active)}
            >
              {moduleItem.is_active ? "Desactivar" : "Activar"}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => actions.onDelete(moduleItem.id)}
            >
              Eliminar
            </Button>
          </div>
        );
      },
    },
  ];
}
