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
        const module = row.original;
        return (
          <div>
            <div className="font-medium flex items-center">
              {module.icon && <span className="mr-2">{module.icon}</span>}
              {module.name}
            </div>
            {module.description && (
              <div className="text-sm text-gray-500">{module.description}</div>
            )}
            {module.path && (
              <div className="text-xs text-blue-600">{module.path}</div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "parent_id",
      header: "Módulo Padre",
      cell: ({ row }) => {
        const module = row.original;
        return (
          <span className="text-sm">
            {module.parent_id ? (
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
        const module = row.original;
        return (
          <span className="text-sm font-mono">
            {module.sort_order}
          </span>
        );
      },
    },
    {
      accessorKey: "is_active",
      header: "Estado",
      cell: ({ row }) => {
        const module = row.original;
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              module.is_active
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {module.is_active ? "Activo" : "Inactivo"}
          </span>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Fecha Creación",
      cell: ({ row }) => {
        const module = row.original;
        return new Date(module.created_at).toLocaleDateString();
      },
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => {
        const module = row.original;
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => actions.onEdit(module)}
            >
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => actions.onToggleStatus(module.id, module.is_active)}
            >
              {module.is_active ? "Desactivar" : "Activar"}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => actions.onDelete(module.id)}
            >
              Eliminar
            </Button>
          </div>
        );
      },
    },
  ];
}
