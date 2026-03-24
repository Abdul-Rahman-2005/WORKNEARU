import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, Ban, Trash2, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Report {
  id: string;
  worker_id: string;
  customer_id: string | null;
  reason: string;
  description: string | null;
  status: string;
  created_at: string;
  worker_name?: string;
  customer_name?: string;
}

const statusBadge: Record<string, string> = {
  pending: 'bg-warning/10 text-warning',
  reviewed: 'bg-primary/10 text-primary',
  resolved: 'bg-success/10 text-success',
  dismissed: 'bg-muted text-muted-foreground',
};

const AdminReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ type: string; report: Report } | null>(null);

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const fetchReports = async () => {
    setLoading(true);
    let query = supabase.from('reports').select('*').order('created_at', { ascending: false });
    if (statusFilter) query = query.eq('status', statusFilter);
    const { data } = await query;

    if (data && data.length > 0) {
      const workerIds = [...new Set(data.map(r => r.worker_id))];
      const customerIds = [...new Set(data.filter(r => r.customer_id).map(r => r.customer_id!))];

      const [workersRes, customersRes] = await Promise.all([
        supabase.from('workers').select('id, name').in('id', workerIds),
        customerIds.length > 0 ? supabase.from('customers').select('id, name').in('id', customerIds) : { data: [] },
      ]);

      const workerMap = new Map((workersRes.data || []).map(w => [w.id, w.name]));
      const customerMap = new Map((customersRes.data || []).map(c => [c.id, c.name]));

      setReports(data.map(r => ({
        ...r,
        worker_name: workerMap.get(r.worker_id) || 'Unknown',
        customer_name: r.customer_id ? customerMap.get(r.customer_id) || 'Unknown' : 'Anonymous',
      })));
    } else {
      setReports([]);
    }
    setLoading(false);
  };

  const logAction = async (actionType: string, reportId: string, workerId: string, description: string) => {
    if (!user) return;
    await supabase.from('admin_actions' as any).insert({
      admin_id: user.id,
      action_type: actionType,
      target_worker_id: workerId,
      target_report_id: reportId,
      description,
    });
  };

  const resolveReport = async (report: Report) => {
    await supabase.from('reports').update({ status: 'resolved' } as any).eq('id', report.id);
    await logAction('resolve_report', report.id, report.worker_id, `Resolved report against ${report.worker_name}`);
    toast.success('Report resolved');
    fetchReports();
  };

  const dismissReport = async (report: Report) => {
    await supabase.from('reports').update({ status: 'dismissed' } as any).eq('id', report.id);
    await logAction('resolve_report', report.id, report.worker_id, `Dismissed report against ${report.worker_name}`);
    toast.success('Report dismissed');
    fetchReports();
  };

  const suspendWorker = async (report: Report) => {
    await supabase.from('workers').update({ status: 'suspended' }).eq('id', report.worker_id);
    await supabase.from('reports').update({ status: 'resolved' } as any).eq('id', report.id);
    await logAction('suspend_worker', report.id, report.worker_id, `Suspended worker from report: ${report.worker_name}`);
    toast.success(`${report.worker_name} suspended & report resolved`);
    fetchReports();
  };

  const executeAction = () => {
    if (!confirmAction) return;
    const { type, report } = confirmAction;
    if (type === 'resolve') resolveReport(report);
    else if (type === 'dismiss') dismissReport(report);
    else if (type === 'suspend') suspendWorker(report);
    setConfirmAction(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-foreground">Reports</h1>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-border bg-card text-foreground text-xs">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Worker</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Reporter</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Reason</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12"><Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" /></td></tr>
              ) : reports.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">No reports found</td></tr>
              ) : (
                reports.map(report => (
                  <motion.tr key={report.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link to={`/admin/workers/${report.worker_id}`} className="text-sm font-medium text-primary hover:underline">
                        {report.worker_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground">{report.customer_name}</td>
                    <td className="px-4 py-3 text-xs text-foreground capitalize">{report.reason.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">{new Date(report.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${statusBadge[report.status] || 'bg-muted text-muted-foreground'}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/admin/workers/${report.worker_id}`} className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="View Worker">
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </Link>
                        {report.status === 'pending' && (
                          <>
                            <button onClick={() => setConfirmAction({ type: 'suspend', report })} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors" title="Suspend Worker">
                              <Ban className="w-4 h-4 text-destructive" />
                            </button>
                            <button onClick={() => setConfirmAction({ type: 'resolve', report })} className="p-1.5 rounded-lg hover:bg-success/10 transition-colors" title="Resolve">
                              <CheckCircle className="w-4 h-4 text-success" />
                            </button>
                            <button onClick={() => setConfirmAction({ type: 'dismiss', report })} className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="Dismiss">
                              <XCircle className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === 'suspend' ? 'Suspend Worker?' :
               confirmAction?.type === 'resolve' ? 'Resolve Report?' : 'Dismiss Report?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === 'suspend'
                ? `${confirmAction.report.worker_name} will be suspended and hidden from customers.`
                : confirmAction?.type === 'resolve'
                ? 'This report will be marked as resolved.'
                : 'This report will be dismissed.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeAction} className={confirmAction?.type === 'suspend' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminReports;
