import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Eye, Ban, RotateCcw, Trash2, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type Worker = Tables<'workers'>;

const PAGE_SIZE = 15;

const statusBadge: Record<string, string> = {
  active: 'bg-success/10 text-success',
  suspended: 'bg-destructive/10 text-destructive',
  inactive: 'bg-muted text-muted-foreground',
};

const AdminWorkers = () => {
  const { user } = useAuth();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [confirmAction, setConfirmAction] = useState<{ type: string; worker: Worker } | null>(null);

  useEffect(() => {
    fetchWorkers();
  }, [page, statusFilter, categoryFilter]);

  const fetchWorkers = async () => {
    setLoading(true);
    let query = supabase.from('workers').select('*', { count: 'exact' });

    if (statusFilter) query = query.eq('status', statusFilter);
    if (categoryFilter) query = query.eq('category', categoryFilter as any);
    if (search.trim()) {
      query = query.or(`name.ilike.%${search.trim()}%,phone.ilike.%${search.trim()}%,pincode.ilike.%${search.trim()}%`);
    }

    const { data, count } = await query
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    setWorkers(data || []);
    setTotal(count || 0);
    setLoading(false);
  };

  const handleSearch = () => {
    setPage(0);
    fetchWorkers();
  };

  const logAction = async (actionType: string, workerId: string, description: string) => {
    if (!user) return;
    await supabase.from('admin_actions' as any).insert({
      admin_id: user.id,
      action_type: actionType,
      target_worker_id: workerId,
      description,
    });
  };

  const suspendWorker = async (worker: Worker) => {
    const { error } = await supabase.from('workers').update({ status: 'suspended' }).eq('id', worker.id);
    if (error) { toast.error(error.message); return; }
    await logAction('suspend_worker', worker.id, `Suspended worker: ${worker.name}`);
    toast.success(`${worker.name} suspended`);
    fetchWorkers();
  };

  const reactivateWorker = async (worker: Worker) => {
    const { error } = await supabase.from('workers').update({ status: 'active' }).eq('id', worker.id);
    if (error) { toast.error(error.message); return; }
    await logAction('reactivate_worker', worker.id, `Reactivated worker: ${worker.name}`);
    toast.success(`${worker.name} reactivated`);
    fetchWorkers();
  };

  const deleteWorker = async (worker: Worker) => {
    const { error } = await supabase.from('workers').delete().eq('id', worker.id);
    if (error) { toast.error(error.message); return; }
    await logAction('delete_worker', worker.id, `Deleted worker: ${worker.name}`);
    toast.success(`${worker.name} deleted permanently`);
    fetchWorkers();
  };

  const executeAction = () => {
    if (!confirmAction) return;
    const { type, worker } = confirmAction;
    if (type === 'suspend') suspendWorker(worker);
    else if (type === 'reactivate') reactivateWorker(worker);
    else if (type === 'delete') deleteWorker(worker);
    setConfirmAction(null);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const selectClass = "px-3 py-2 rounded-lg border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold text-foreground">Workers</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search name, phone, pincode..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }} className={selectClass}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="inactive">Inactive</option>
        </select>
        <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(0); }} className={selectClass}>
          <option value="">All Categories</option>
          {['electrician','plumber','carpenter','ac_technician','painter','mason','welder','driver'].map(c => (
            <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <button onClick={handleSearch} className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:opacity-90">
          Search
        </button>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Worker</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">City</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Phone</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Rating</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12"><Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" /></td></tr>
              ) : workers.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">No workers found</td></tr>
              ) : (
                workers.map(worker => (
                  <motion.tr key={worker.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={worker.image_url || `https://api.dicebear.com/7.x/personas/svg?seed=${worker.name}`}
                          alt={worker.name}
                          className="w-8 h-8 rounded-lg object-cover bg-muted shrink-0"
                        />
                        <div>
                          <p className="font-medium text-foreground text-sm">{worker.name}</p>
                          <p className="text-xs text-muted-foreground">{worker.pincode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground capitalize">{worker.category.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground">{worker.city}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">{worker.phone}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-foreground">⭐ {Number(worker.rating).toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground ml-1">({worker.total_reviews})</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${statusBadge[worker.status] || 'bg-muted text-muted-foreground'}`}>
                        {worker.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/admin/workers/${worker.id}`} className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="View">
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </Link>
                        {worker.status === 'active' ? (
                          <button onClick={() => setConfirmAction({ type: 'suspend', worker })} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors" title="Suspend">
                            <Ban className="w-4 h-4 text-destructive" />
                          </button>
                        ) : worker.status === 'suspended' ? (
                          <button onClick={() => setConfirmAction({ type: 'reactivate', worker })} className="p-1.5 rounded-lg hover:bg-success/10 transition-colors" title="Reactivate">
                            <RotateCcw className="w-4 h-4 text-success" />
                          </button>
                        ) : null}
                        <button onClick={() => setConfirmAction({ type: 'delete', worker })} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === 'delete' ? 'Delete Worker Permanently?' : 
               confirmAction?.type === 'suspend' ? 'Suspend Worker?' : 'Reactivate Worker?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === 'delete' 
                ? `This will permanently remove ${confirmAction.worker.name} and all their data. This cannot be undone.`
                : confirmAction?.type === 'suspend'
                ? `${confirmAction?.worker.name} will be hidden from search results and unable to receive bookings.`
                : `${confirmAction?.worker.name} will be visible in search results and able to receive bookings again.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeAction} className={confirmAction?.type === 'delete' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}>
              {confirmAction?.type === 'delete' ? 'Delete' : confirmAction?.type === 'suspend' ? 'Suspend' : 'Reactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminWorkers;
