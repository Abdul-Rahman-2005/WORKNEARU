import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, UserCheck, UserX, Trash2, ShoppingBag, Flag, Star, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import ChangePassword from '@/components/ChangePassword';

interface Stats {
  totalWorkers: number;
  activeWorkers: number;
  suspendedWorkers: number;
  totalCustomers: number;
  totalBookings: number;
  pendingReports: number;
  totalReviews: number;
  bookingsByStatus: { name: string; value: number }[];
  workersByCategory: { name: string; count: number }[];
}

const COLORS = ['hsl(25, 95%, 53%)', 'hsl(142, 70%, 45%)', 'hsl(0, 84%, 60%)', 'hsl(38, 92%, 50%)', 'hsl(220, 14%, 46%)'];

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const [workers, customers, bookings, reports, reviews] = await Promise.all([
      supabase.from('workers').select('id, status, category'),
      supabase.from('customers').select('id', { count: 'exact', head: true }),
      supabase.from('bookings').select('id, status'),
      supabase.from('reports').select('id, status'),
      supabase.from('reviews').select('id', { count: 'exact', head: true }),
    ]);

    const workerData = workers.data || [];
    const bookingData = bookings.data || [];
    const reportData = reports.data || [];

    // Bookings by status
    const bookingStatusMap: Record<string, number> = {};
    bookingData.forEach(b => { bookingStatusMap[b.status] = (bookingStatusMap[b.status] || 0) + 1; });
    const bookingsByStatus = Object.entries(bookingStatusMap).map(([name, value]) => ({ name, value }));

    // Workers by category
    const catMap: Record<string, number> = {};
    workerData.forEach(w => { catMap[w.category] = (catMap[w.category] || 0) + 1; });
    const workersByCategory = Object.entries(catMap)
      .map(([name, count]) => ({ name: name.replace(/_/g, ' '), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    setStats({
      totalWorkers: workerData.length,
      activeWorkers: workerData.filter(w => w.status === 'active').length,
      suspendedWorkers: workerData.filter(w => w.status === 'suspended').length,
      totalCustomers: customers.count || 0,
      totalBookings: bookingData.length,
      pendingReports: reportData.filter(r => r.status === 'pending').length,
      totalReviews: reviews.count || 0,
      bookingsByStatus,
      workersByCategory,
    });
    setLoading(false);
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const cards = [
    { label: 'Total Workers', value: stats.totalWorkers, icon: Users, color: 'text-primary' },
    { label: 'Active Workers', value: stats.activeWorkers, icon: UserCheck, color: 'text-success' },
    { label: 'Suspended', value: stats.suspendedWorkers, icon: UserX, color: 'text-destructive' },
    { label: 'Total Customers', value: stats.totalCustomers, icon: UserPlus, color: 'text-primary' },
    { label: 'Total Bookings', value: stats.totalBookings, icon: ShoppingBag, color: 'text-primary' },
    { label: 'Pending Reports', value: stats.pendingReports, icon: Flag, color: 'text-warning' },
    { label: 'Total Reviews', value: stats.totalReviews, icon: Star, color: 'text-warning' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-2xl border border-border p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <p className="text-2xl font-heading font-bold text-foreground">{card.value.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-heading font-semibold text-foreground text-sm mb-4">Bookings by Status</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={stats.bookingsByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                {stats.bookingsByStatus.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-heading font-semibold text-foreground text-sm mb-4">Workers by Category</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.workersByCategory}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(25, 95%, 53%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Change Password */}
      <div className="mt-8 max-w-md">
        <ChangePassword />
      </div>
    </div>
  );
};

export default AdminDashboard;
