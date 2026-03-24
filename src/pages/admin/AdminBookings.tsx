import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Booking {
  id: string;
  worker_id: string;
  customer_id: string;
  job_description: string;
  booking_date: string;
  booking_time: string;
  status: string;
  created_at: string;
  worker_name?: string;
  customer_name?: string;
}

const PAGE_SIZE = 15;

const statusBadge: Record<string, string> = {
  pending: 'bg-warning/10 text-warning',
  accepted: 'bg-primary/10 text-primary',
  rejected: 'bg-destructive/10 text-destructive',
  completed: 'bg-success/10 text-success',
};

const AdminBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => { fetchBookings(); }, [page, statusFilter]);

  const fetchBookings = async () => {
    setLoading(true);
    let query = supabase.from('bookings').select('*', { count: 'exact' });
    if (statusFilter) query = query.eq('status', statusFilter);
    const { data, count } = await query
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (data && data.length > 0) {
      const workerIds = [...new Set(data.map(b => b.worker_id))];
      const customerIds = [...new Set(data.map(b => b.customer_id))];
      const [workersRes, customersRes] = await Promise.all([
        supabase.from('workers').select('id, name').in('id', workerIds),
        supabase.from('customers').select('id, name').in('id', customerIds),
      ]);
      const workerMap = new Map((workersRes.data || []).map(w => [w.id, w.name]));
      const customerMap = new Map((customersRes.data || []).map(c => [c.id, c.name]));
      setBookings(data.map(b => ({
        ...b,
        worker_name: workerMap.get(b.worker_id) || 'Unknown',
        customer_name: customerMap.get(b.customer_id) || 'Unknown',
      })));
    } else {
      setBookings([]);
    }
    setTotal(count || 0);
    setLoading(false);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-foreground">Bookings</h1>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }} className="px-3 py-2 rounded-lg border border-border bg-card text-foreground text-xs">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Worker</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Description</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Date/Time</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12"><Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" /></td></tr>
              ) : bookings.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">No bookings found</td></tr>
              ) : (
                bookings.map(b => (
                  <motion.tr key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{b.customer_name}</td>
                    <td className="px-4 py-3 text-sm text-primary">{b.worker_name}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell max-w-[200px] truncate">{b.job_description}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {b.booking_date}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {b.booking_time}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${statusBadge[b.status] || 'bg-muted text-muted-foreground'}`}>
                        {b.status}
                      </span>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBookings;
