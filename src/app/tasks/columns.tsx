"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "../../components/ui/button";
import { ProtectedComponent } from "../../components/ProtectedComponent";
import { Task } from "../../types/management.types";

interface TaskColumnsProps {
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: Task['status']) => void;
}

export const createTaskColumns = ({ onEdit, onDelete, onStatusChange }: TaskColumnsProps): ColumnDef<Task>[] => [
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
        >
          Título
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const task = row.original;
      return (
        <div>
          <div className="font-medium">{task.title}</div>
          {task.description && (
            <div className="text-sm text-gray-500 truncate max-w-xs">
              {task.description}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const task = row.original;
      const status = row.getValue("status") as string;
      const statusMap = {
        pending: { label: "Pendiente", class: "bg-yellow-100 text-yellow-800" },
        in_progress: { label: "En Progreso", class: "bg-blue-100 text-blue-800" },
        completed: { label: "Completada", class: "bg-green-100 text-green-800" },
        cancelled: { label: "Cancelada", class: "bg-red-100 text-red-800" }
      };
      
      const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.pending;
      
      return (
        <select
          value={status}
          onChange={(e) => onStatusChange(task.id, e.target.value as Task['status'])}
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border-0 ${statusInfo.class} cursor-pointer`}
        >
          <option value="pending">Pendiente</option>
          <option value="in_progress">En Progreso</option>
          <option value="completed">Completada</option>
          <option value="cancelled">Cancelada</option>
        </select>
      );
    },
  },
  {
    accessorKey: "priority",
    header: "Prioridad",
    cell: ({ row }) => {
      const priority = row.getValue("priority") as string;
      const priorityMap = {
        low: { label: "Baja", class: "bg-gray-100 text-gray-800" },
        medium: { label: "Media", class: "bg-yellow-100 text-yellow-800" },
        high: { label: "Alta", class: "bg-orange-100 text-orange-800" },
        urgent: { label: "Urgente", class: "bg-red-100 text-red-800" }
      };
      
      const priorityInfo = priorityMap[priority as keyof typeof priorityMap] || priorityMap.medium;
      
      return (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${priorityInfo.class}`}>
          {priorityInfo.label}
        </span>
      );
    },
  },
  {
    id: "assigned_user",
    header: "Asignado a",
    cell: ({ row }) => {
      const task = row.original;
      if (task.assigned_to_user) {
        return (
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center mr-2">
              <span className="text-xs font-medium text-gray-700">
                {task.assigned_to_user.first_name?.[0] || 'U'}
              </span>
            </div>
            <div>
              <div className="text-sm font-medium">
                {task.assigned_to_user.first_name && task.assigned_to_user.last_name 
                  ? `${task.assigned_to_user.first_name} ${task.assigned_to_user.last_name}`
                  : task.assigned_to_user.id
                }
              </div>
            </div>
          </div>
        );
      }
      return <span className="text-sm text-gray-500">Sin asignar</span>;
    },
  },
  {
    accessorKey: "due_date",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
        >
          Fecha Límite
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const dueDate = row.getValue("due_date") as string;
      if (!dueDate) return <span className="text-sm text-gray-500">Sin fecha</span>;
      
      const date = new Date(dueDate);
      const today = new Date();
      const isOverdue = date < today;
      const isDueSoon = date <= new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 días
      
      return (
        <div className={`text-sm ${
          isOverdue ? 'text-red-600 font-medium' : 
          isDueSoon ? 'text-orange-600' : 
          'text-gray-900'
        }`}>
          {date.toLocaleDateString()}
          {isOverdue && <span className="block text-xs text-red-500">Vencida</span>}
          {!isOverdue && isDueSoon && <span className="block text-xs text-orange-500">Próxima</span>}
        </div>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
        >
          Creada
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"));
      return <div className="text-sm">{date.toLocaleDateString()}</div>;
    },
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => {
      const task = row.original;

      return (
        <div className="flex items-center space-x-2">
          <ProtectedComponent permissions={["tasks_update"]}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(task)}
            >
              Editar
            </Button>
          </ProtectedComponent>
          <ProtectedComponent permissions={["tasks_delete"]}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(task)}
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
