import { supabase } from '../../common/supabaseClient';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export interface DashboardStats {
  totalUsers: number;
  totalClients: number;
  totalSuppliers: number;
  totalPurchaseOrders: number;
  activeUsers: number;
  recentActivity: number;
}

export interface ChartData {
  date: string;
  users: number;
  clients: number;
  suppliers: number;
  purchaseOrders: number;
}

export interface UserRegistrationTrend {
  date: string;
  count: number;
}

export interface PurchaseOrderStats {
  status: string;
  count: number;
  total: number;
}

export interface MonthlyGrowth {
  month: string;
  users: number;
  clients: number;
  suppliers: number;
  orders: number;
}

export class DashboardService {
  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Total users
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Total clients
      const { count: totalClients } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });

      // Total suppliers
      const { count: totalSuppliers } = await supabase
        .from('suppliers')
        .select('*', { count: 'exact', head: true });

      // Total purchase orders
      const { count: totalPurchaseOrders } = await supabase
        .from('purchase_orders')
        .select('*', { count: 'exact', head: true });

      // Active users (logged in within last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: activeUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('last_login', thirtyDaysAgo.toISOString());

      // Recent activity (created in last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count: recentUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());

      const { count: recentClients } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());

      const { count: recentSuppliers } = await supabase
        .from('suppliers')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());

      const recentActivity = (recentUsers || 0) + (recentClients || 0) + (recentSuppliers || 0);

      return {
        totalUsers: totalUsers || 0,
        totalClients: totalClients || 0,
        totalSuppliers: totalSuppliers || 0,
        totalPurchaseOrders: totalPurchaseOrders || 0,
        activeUsers: activeUsers || 0,
        recentActivity
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        totalUsers: 0,
        totalClients: 0,
        totalSuppliers: 0,
        totalPurchaseOrders: 0,
        activeUsers: 0,
        recentActivity: 0
      };
    }
  }

  static async getUserRegistrationTrend(days: number = 30): Promise<UserRegistrationTrend[]> {
    try {
      const startDate = subDays(new Date(), days);
      
      const { data, error } = await supabase
        .from('users')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at');

      if (error) throw error;

      // Group by date
      const dateMap = new Map<string, number>();
      
      // Initialize all dates with 0
      for (let i = 0; i < days; i++) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        dateMap.set(date, 0);
      }

      // Count actual registrations
      data?.forEach(user => {
        const date = format(new Date(user.created_at), 'yyyy-MM-dd');
        dateMap.set(date, (dateMap.get(date) || 0) + 1);
      });

      return Array.from(dateMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('Error fetching user registration trend:', error);
      return [];
    }
  }

  static async getPurchaseOrderStats(): Promise<PurchaseOrderStats[]> {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('status, total_amount');

      if (error) throw error;

      const statusMap = new Map<string, { count: number; total: number }>();

      data?.forEach(order => {
        const status = order.status || 'draft';
        const current = statusMap.get(status) || { count: 0, total: 0 };
        statusMap.set(status, {
          count: current.count + 1,
          total: current.total + (parseFloat(order.total_amount) || 0)
        });
      });

      return Array.from(statusMap.entries()).map(([status, stats]) => ({
        status,
        count: stats.count,
        total: stats.total
      }));
    } catch (error) {
      console.error('Error fetching purchase order stats:', error);
      return [];
    }
  }

  static async getMonthlyGrowth(months: number = 6): Promise<MonthlyGrowth[]> {
    try {
      const results: MonthlyGrowth[] = [];

      for (let i = months - 1; i >= 0; i--) {
        const targetDate = subMonths(new Date(), i);
        const monthStart = startOfMonth(targetDate);
        const monthEnd = endOfMonth(targetDate);
        const monthLabel = format(targetDate, 'MMM yyyy');

        // Users count for this month
        const { count: usersCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString());

        // Clients count for this month
        const { count: clientsCount } = await supabase
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString());

        // Suppliers count for this month
        const { count: suppliersCount } = await supabase
          .from('suppliers')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString());

        // Purchase orders count for this month
        const { count: ordersCount } = await supabase
          .from('purchase_orders')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString());

        results.push({
          month: monthLabel,
          users: usersCount || 0,
          clients: clientsCount || 0,
          suppliers: suppliersCount || 0,
          orders: ordersCount || 0
        });
      }

      return results;
    } catch (error) {
      console.error('Error fetching monthly growth:', error);
      return [];
    }
  }

  static async getWeeklyActivity(weeks: number = 8): Promise<ChartData[]> {
    try {
      const results: ChartData[] = [];

      for (let i = weeks - 1; i >= 0; i--) {
        const weekStart = subDays(new Date(), (i + 1) * 7);
        const weekEnd = subDays(new Date(), i * 7);
        const weekLabel = format(weekStart, 'MMM dd');

        // Get counts for this week
        const { count: usersCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', weekStart.toISOString())
          .lt('created_at', weekEnd.toISOString());

        const { count: clientsCount } = await supabase
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', weekStart.toISOString())
          .lt('created_at', weekEnd.toISOString());

        const { count: suppliersCount } = await supabase
          .from('suppliers')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', weekStart.toISOString())
          .lt('created_at', weekEnd.toISOString());

        const { count: ordersCount } = await supabase
          .from('purchase_orders')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', weekStart.toISOString())
          .lt('created_at', weekEnd.toISOString());

        results.push({
          date: weekLabel,
          users: usersCount || 0,
          clients: clientsCount || 0,
          suppliers: suppliersCount || 0,
          purchaseOrders: ordersCount || 0
        });
      }

      return results;
    } catch (error) {
      console.error('Error fetching weekly activity:', error);
      return [];
    }
  }
}