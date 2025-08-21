"use client";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "../../components/ui/button";
import { Role } from "../../types/management.types";

interface RoleColumnActions {
  onEdit: (role: Role) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, currentStatus: boolean) => void;
  onManagePermissions: (role: Role) => void;
}

export function createRoleColumns(actions: RoleColumnActions): ColumnDef<Role>[] {
  return [
    {
      accessorKey: "name",
      header: "Nombre",
      cell: ({ row }) => {
        const role = row.original;
        return (
          <div>
            <div className="font-medium">{role.name}</div>
            {role.description && (
              <div className="text-sm text-gray-500">{role.description}</div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "is_active",
      header: "Estado",
      cell: ({ row }) => {
        const role = row.original;
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              role.is_active
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {role.is_active ? "Activo" : "Inactivo"}
          </span>
        );
      },
    },
    {
      accessorKey: "is_default",
      header: "Por Defecto",
      cell: ({ row }) => {
        const role = row.original;
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              role.is_default
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {role.is_default ? "Sí" : "No"}
          </span>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Fecha Creación",
      cell: ({ row }) => {
        const role = row.original;
        return new Date(role.created_at).toLocaleDateString();
      },
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => {
        const role = row.original;
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => actions.onEdit(role)}
            >
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => actions.onToggleStatus(role.id, role.is_active)}
            >
              {role.is_active ? "Desactivar" : "Activar"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => actions.onManagePermissions(role)}
            >
              Permisos
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => actions.onDelete(role.id)}
            >
              Eliminar
            </Button>
          </div>
        );
      },
    },
  ];
}
