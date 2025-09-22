"use client";
import React, { useState, useEffect } from 'react';
import { ProtectedRoute, ProtectedComponent } from '../../components/ProtectedComponent';
import { useTaskManagement, useUserManagement } from '../../common/hooks/useManagement';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { DataTable } from '../../components/ui/data-table';
import { TableSkeleton } from '../../components/ui/skeleton';
import TaskForm from '../../components/forms/TaskForm';
import { DeleteConfirmDialog } from '../../components/forms/DeleteConfirmDialog';
import { createTaskColumns } from './columns';
import { Task, User } from '../../types/management.types';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [deleteTask, setDeleteTask] = useState<Task | null>(null);

  const { getTasks, createTask, updateTask, deleteTask: deleteTaskService, updateTaskStatus, loading, error } = useTaskManagement();
  const { getUsers } = useUserManagement();

  // Cargar tareas cuando cambie la página o búsqueda
  useEffect(() => {
    loadTasks();
  }, [currentPage, searchTerm]);

  // Cargar usuarios solo una vez al montar el componente
  useEffect(() => {
    loadUsers();
  }, []);

  const loadTasks = async () => {
    try {
      const filters = searchTerm ? { search: searchTerm } : undefined;
      const result = await getTasks(currentPage, 10, filters);
      setTasks(result.data);
      setTotalPages(Math.ceil(result.total / 10));
    } catch (error) {
      console.error('Error al cargar tareas:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const result = await getUsers(1, 100); // Cargar todos los usuarios para el selector
      setUsers(result.data);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    }
  };

  const handleCreateTask = async (taskData: any) => {
    try {
      // Actualización optimista: agregar la tarea temporalmente
      const tempTask: Task = {
        id: 'temp-' + Date.now(),
        title: taskData.title,
        description: taskData.description,
        status: taskData.status || 'pending',
        priority: taskData.priority || 'medium',
        due_date: taskData.due_date,
        assigned_to: taskData.assigned_to,
        created_by: 'current-user', // Se actualizará con la respuesta del servidor
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        assigned_to_user: users.find(u => u.id === taskData.assigned_to)
      };

      // Agregar optimísticamente
      setTasks(prev => [tempTask, ...prev]);
      setShowCreateForm(false);

      const response = await createTask(taskData);
      
      if (response.success && response.data) {
        // Reemplazar la tarea temporal con la real
        setTasks(prev => prev.map(task => 
          task.id === tempTask.id ? response.data! : task
        ));
      } else {
        // Rollback: remover la tarea temporal
        setTasks(prev => prev.filter(task => task.id !== tempTask.id));
        setShowCreateForm(true); // Mostrar el formulario de nuevo
      }
    } catch (error) {
      // Rollback en caso de error
      setTasks(prev => prev.filter(task => !task.id.startsWith('temp-')));
      setShowCreateForm(true);
      console.error('Error al crear tarea:', error);
    }
  };

  const handleUpdateTask = async (taskId: string, taskData: any) => {
    // Guardar el estado anterior para rollback
    const originalTasks = [...tasks];
    
    try {
      // Actualización optimista
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              ...taskData, 
              assigned_to_user: users.find(u => u.id === taskData.assigned_to) || task.assigned_to_user,
              updated_at: new Date().toISOString() 
            }
          : task
      ));
      setSelectedTask(null);

      const response = await updateTask(taskId, taskData);
      
      if (response.success && response.data) {
        // Actualizar con los datos reales del servidor
        setTasks(prev => prev.map(task => 
          task.id === taskId ? response.data! : task
        ));
      } else {
        // Rollback
        setTasks(originalTasks);
        setSelectedTask(tasks.find(t => t.id === taskId) || null);
      }
    } catch (error) {
      // Rollback en caso de error
      setTasks(originalTasks);
      setSelectedTask(tasks.find(t => t.id === taskId) || null);
      console.error('Error al actualizar tarea:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    // Guardar el estado anterior para rollback
    const originalTasks = [...tasks];
    
    try {
      // Actualización optimista: remover la tarea
      setTasks(prev => prev.filter(task => task.id !== taskId));
      setDeleteTask(null);

      const response = await deleteTaskService(taskId);
      
      if (!response.success) {
        // Rollback: restaurar la tarea
        setTasks(originalTasks);
      }
    } catch (error) {
      // Rollback en caso de error
      setTasks(originalTasks);
      console.error('Error al eliminar tarea:', error);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    // Guardar el estado anterior para rollback
    const originalTasks = [...tasks];
    
    try {
      // Actualización optimista
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, status: newStatus, updated_at: new Date().toISOString() }
          : task
      ));

      const response = await updateTaskStatus(taskId, newStatus);
      
      if (response.success && response.data) {
        // Actualizar con los datos reales del servidor
        setTasks(prev => prev.map(task => 
          task.id === taskId ? response.data! : task
        ));
      } else {
        // Rollback
        setTasks(originalTasks);
      }
    } catch (error) {
      // Rollback en caso de error
      setTasks(originalTasks);
      console.error('Error al actualizar estado:', error);
    }
  };

  // Crear las columnas de la tabla
  const columns = createTaskColumns({
    onEdit: (task: Task) => setSelectedTask(task),
    onDelete: (task: Task) => setDeleteTask(task),
    onStatusChange: handleStatusChange
  });

  return (
    <ProtectedRoute permissions={['tasks_read']}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Tareas</h2>
              <p className="text-gray-600">Gestiona las tareas del sistema</p>
            </div>
            <ProtectedComponent permissions={['tasks_create']}>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Crear Tarea
              </Button>
            </ProtectedComponent>
          </div>
        </div>

        {/* Tabla de tareas */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Lista de Tareas ({tasks.length})
              </h3>
            </div>
            <div className="p-6">
              {loading && tasks.length === 0 ? (
                <TableSkeleton rows={5} columns={6} />
              ) : (
                <DataTable
                  columns={columns}
                  data={tasks}
                  searchKey="title"
                  searchPlaceholder="Buscar por título..."
                />
              )}
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Formulario de crear tarea */}
        {showCreateForm && (
          <TaskForm
            users={users}
            isOpen={showCreateForm}
            onClose={() => setShowCreateForm(false)}
            onSubmit={handleCreateTask}
          />
        )}

        {/* Formulario de editar tarea */}
        {selectedTask && (
          <TaskForm
            task={selectedTask}
            users={users}
            isOpen={!!selectedTask}
            onClose={() => setSelectedTask(null)}
            onSubmit={(taskData: any) => handleUpdateTask(selectedTask.id, taskData)}
          />
        )}

        {/* Dialog de confirmación de eliminación */}
        {deleteTask && (
          <DeleteConfirmDialog
            open={!!deleteTask}
            onOpenChange={(open: boolean) => !open && setDeleteTask(null)}
            onConfirm={() => deleteTask && handleDeleteTask(deleteTask.id)}
            title="Eliminar Tarea"
            description={`¿Estás seguro de que quieres eliminar la tarea "${deleteTask?.title}"? Esta acción no se puede deshacer.`}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
