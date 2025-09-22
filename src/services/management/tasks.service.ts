import { supabase } from '../../common/supabaseClient';
import {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskFilters,
  PaginatedResponse,
  ApiResponse
} from '../../types/management.types';

export class TaskManagementService {
  /**
   * Obtener lista paginada de tareas
   */
  static async getTasks(
    page: number = 1,
    limit: number = 10,
    filters?: TaskFilters
  ): Promise<PaginatedResponse<Task>> {
    try {
      let query = supabase
        .from('tasks')
        .select('*', { count: 'exact' });

      // Aplicar filtros
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }

      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }

      if (filters?.created_by) {
        query = query.eq('created_by', filters.created_by);
      }

      if (filters?.due_date_from) {
        query = query.gte('due_date', filters.due_date_from);
      }

      if (filters?.due_date_to) {
        query = query.lte('due_date', filters.due_date_to);
      }

      // Paginación
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        throw new Error(`Error al obtener tareas: ${error.message}`);
      }

      // Obtener información de usuarios por separado
      const tasks = data || [];
      const userIds = [
        ...new Set([
          ...tasks.map(t => t.created_by).filter(Boolean),
          ...tasks.map(t => t.assigned_to).filter(Boolean)
        ])
      ];

      let usersMap = new Map();
      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, first_name, last_name')
          .in('id', userIds);
        
        if (users) {
          users.forEach(user => usersMap.set(user.id, user));
        }
      }

      // Enriquecer las tareas con información de usuarios
      const enrichedTasks = tasks.map(task => ({
        ...task,
        created_by_user: task.created_by ? usersMap.get(task.created_by) : undefined,
        assigned_to_user: task.assigned_to ? usersMap.get(task.assigned_to) : undefined,
      })) as Task[];

      return {
        data: enrichedTasks,
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('Error en getTasks:', error);
      throw error;
    }
  }

  /**
   * Obtener tarea por ID
   */
  static async getTaskById(id: string): Promise<Task | null> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Error al obtener tarea: ${error.message}`);
      }

      // Obtener información de usuarios por separado si es necesario
      let enrichedTask = data as Task;
      const userIds = [data.created_by, data.assigned_to].filter(Boolean);
      
      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, first_name, last_name')
          .in('id', userIds);
        
        if (users) {
          const usersMap = new Map(users.map(user => [user.id, user]));
          enrichedTask = {
            ...data,
            created_by_user: data.created_by ? usersMap.get(data.created_by) : undefined,
            assigned_to_user: data.assigned_to ? usersMap.get(data.assigned_to) : undefined,
          } as Task;
        }
      }

      return enrichedTask;
    } catch (error) {
      console.error('Error en getTaskById:', error);
      throw error;
    }
  }

  /**
   * Crear nueva tarea
   */
  static async createTask(taskData: CreateTaskRequest): Promise<ApiResponse<Task>> {
    try {
      // Obtener el usuario actual
      const { data: currentUser } = await supabase.auth.getUser();
      
      if (!currentUser.user) {
        throw new Error('Usuario no autenticado');
      }

      const newTask = {
        title: taskData.title,
        description: taskData.description,
        status: taskData.status || 'pending',
        priority: taskData.priority || 'medium',
        due_date: taskData.due_date,
        assigned_to: taskData.assigned_to,
        created_by: currentUser.user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert(newTask)
        .select(`
          *,
          created_by_user:users!created_by (
            id,
            first_name,
            last_name
          ),
          assigned_to_user:users!assigned_to (
            id,
            first_name,
            last_name
          )
        `)
        .single();

      if (error) {
        throw new Error(`Error al crear tarea: ${error.message}`);
      }

      return {
        success: true,
        data,
        message: 'Tarea creada exitosamente'
      };
    } catch (error) {
      console.error('Error en createTask:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Actualizar tarea
   */
  static async updateTask(id: string, taskData: UpdateTaskRequest): Promise<ApiResponse<Task>> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          ...taskData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          created_by_user:users!created_by (
            id,
            first_name,
            last_name
          ),
          assigned_to_user:users!assigned_to (
            id,
            first_name,
            last_name
          )
        `)
        .single();

      if (error) {
        throw new Error(`Error al actualizar tarea: ${error.message}`);
      }

      return {
        success: true,
        data,
        message: 'Tarea actualizada exitosamente'
      };
    } catch (error) {
      console.error('Error en updateTask:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Eliminar tarea
   */
  static async deleteTask(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Error al eliminar tarea: ${error.message}`);
      }

      return {
        success: true,
        message: 'Tarea eliminada exitosamente'
      };
    } catch (error) {
      console.error('Error en deleteTask:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Cambiar estado de una tarea
   */
  static async updateTaskStatus(id: string, status: Task['status']): Promise<ApiResponse<Task>> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          created_by_user:users!created_by (
            id,
            first_name,
            last_name
          ),
          assigned_to_user:users!assigned_to (
            id,
            first_name,
            last_name
          )
        `)
        .single();

      if (error) {
        throw new Error(`Error al actualizar estado de tarea: ${error.message}`);
      }

      return {
        success: true,
        data,
        message: `Tarea marcada como ${status === 'completed' ? 'completada' : status}`
      };
    } catch (error) {
      console.error('Error en updateTaskStatus:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Obtener tareas asignadas a un usuario
   */
  static async getTasksByUser(userId: string): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          created_by_user:users!created_by (
            id,
            first_name,
            last_name
          ),
          assigned_to_user:users!assigned_to (
            id,
            first_name,
            last_name
          )
        `)
        .eq('assigned_to', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Error al obtener tareas del usuario: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error en getTasksByUser:', error);
      throw error;
    }
  }
}
