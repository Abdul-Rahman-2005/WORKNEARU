import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Ban, RotateCcw, Trash2, MapPin, Phone, Briefcase, Star, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type Worker = Tables<'workers'>;

const AdminWorkerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [worker, setWorker] = useState<Worker | null>(null);
  const [portfolio, setPortfolio] = useState<{ id: string; image_url: string }[]>([]);
  const [reviews, setReviews] = useState<{ id: string; rating: number; review_text: string | null; reviewer_name: string | null; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchWorker();
  }, [id]);

  const fetchWorker = async () => {
    const [workerRes, portfolioRes, reviewsRes] = await Promise.all([
      supabase.from('workers').select('*').eq('id', id!).single(),
      supabase.from('worker_portfolio').select('id, image_url').eq('worker_id', id!),
      supabase.from('reviews').select('id, rating, review_text, reviewer_name, created_at').eq('worker_id', id!).order('created_at', { ascending: false }).limit(20),
    ]);
    setWorker(workerRes.data);
    setPortfolio(portfolioRes.data || []);
    setReviews(reviewsRes.data || []);
    setLoading(false);
  };

  const logAction = async (actionType: string, description: string) => {
    if (!user) return;
    await supabase.from('admin_actions' as any).insert({
      admin_id: user.id,
      action_type: actionType,
      target_worker_id: id,
      description,
    });
  };

  const handleAction = async () => {
    if (!worker || !confirmAction) return;
    if (confirmAction === 'suspend') {
      await supabase.from('workers').update({ status: 'suspended' }).eq('id', worker.id);
      await logAction('suspend_worker', `Suspended worker: ${worker.name}`);
      toast.success('Worker suspended');
    } else if (confirmAction === 'reactivate') {
      await supabase.from('workers').update({ status: 'active' }).eq('id', worker.id);
      await logAction('reactivate_worker', `Reactivated worker: ${worker.name}`);
      toast.success('Worker reactivated');
    } else if (confirmAction === 'delete') {
      await supabase.from('workers').delete().eq('id', worker.id);
      await logAction('delete_worker', `Deleted worker: ${worker.name}`);
      toast.success('Worker deleted');
      navigate('/admin/workers');
      return;
    }
    setConfirmAction(null);
    fetchWorker();
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  if (!worker) {
    return <div className="text-center py-20 text-muted-foreground">Worker not found</div>;
  }

  const statusBadge: Record<string, string> = {
    active: 'bg-success/10 text-success',
    suspended: 'bg-destructive/10 text-destructive',
    inactive: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <button onClick={() => navigate('/admin/workers')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Workers
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-start gap-5">
          <img
            src={worker.image_url || `https://api.dicebear.com/7.x/personas/svg?seed=${worker.name}`}
            alt={worker.name}
            className="w-20 h-20 rounded-2xl object-cover bg-muted shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="font-heading text-xl font-bold text-foreground">{worker.name}</h1>
                <p className="text-sm text-primary capitalize">{worker.category.replace(/_/g, ' ')}</p>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize shrink-0 ${statusBadge[worker.status] || 'bg-muted text-muted-foreground'}`}>
                {worker.status}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {worker.phone}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {worker.city}, {worker.pincode}</span>
              <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {worker.experience} yrs</span>
              <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {Number(worker.rating).toFixed(1)} ({worker.total_reviews} reviews)</span>
            </div>
            {worker.description && <p className="text-sm text-muted-foreground mt-3">{worker.description}</p>}
          </div>
        </div>

        {/* Admin actions */}
        <div className="flex gap-2 mt-5 pt-5 border-t border-border">
          {worker.status === 'active' ? (
            <button onClick={() => setConfirmAction('suspend')} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition-colors">
              <Ban className="w-3.5 h-3.5" /> Suspend Worker
            </button>
          ) : worker.status === 'suspended' ? (
            <button onClick={() => setConfirmAction('reactivate')} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-success/10 text-success text-xs font-medium hover:bg-success/20 transition-colors">
              <RotateCcw className="w-3.5 h-3.5" /> Reactivate Worker
            </button>
          ) : null}
          <button onClick={() => setConfirmAction('delete')} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Delete Worker
          </button>
        </div>
      </motion.div>

      {/* Portfolio */}
      {portfolio.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-heading font-semibold text-foreground text-sm mb-3">Portfolio ({portfolio.length})</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {portfolio.map(img => (
              <img key={img.id} src={img.image_url} alt="Portfolio" className="w-full aspect-square rounded-xl object-cover bg-muted" />
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-heading font-semibold text-foreground text-sm mb-3">Reviews ({reviews.length})</h3>
          <div className="space-y-3">
            {reviews.map(review => (
              <div key={review.id} className="p-3 rounded-xl bg-muted/50 border border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">{review.reviewer_name || 'Anonymous'}</span>
                  <span className="text-xs text-warning">{'⭐'.repeat(review.rating)}</span>
                </div>
                {review.review_text && <p className="text-xs text-muted-foreground mt-1">{review.review_text}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === 'delete' ? 'Delete Worker Permanently?' :
               confirmAction === 'suspend' ? 'Suspend Worker?' : 'Reactivate Worker?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === 'delete'
                ? `This will permanently remove ${worker.name}. This cannot be undone.`
                : confirmAction === 'suspend'
                ? `${worker.name} will be hidden from customers and unable to receive bookings.`
                : `${worker.name} will be visible to customers again.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} className={confirmAction === 'delete' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminWorkerDetail;
