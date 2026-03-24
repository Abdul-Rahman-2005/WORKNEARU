import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

interface ReportDialogProps {
  worker: Tables<'workers'>;
  open: boolean;
  onClose: () => void;
}

const REPORT_REASONS = [
  { value: 'fake_profile', label: 'Fake Profile' },
  { value: 'fraud', label: 'Fraud' },
  { value: 'bad_behaviour', label: 'Bad Behaviour' },
  { value: 'spam', label: 'Spam' },
  { value: 'other', label: 'Other' },
] as const;

const ReportDialog = ({ worker, open, onClose }: ReportDialogProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      toast({ title: 'Please select a reason', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: 'Please login to report a worker', variant: 'destructive' });
        return;
      }

      // Try to find customer profile
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const { error } = await supabase.from('reports').insert({
        worker_id: worker.id,
        customer_id: customer?.id || null,
        reason,
        description: description.trim() || null,
      });

      if (error) throw error;

      toast({ title: 'Report submitted', description: 'Thank you. We will review this report.' });
      setReason('');
      setDescription('');
      onClose();
    } catch (err: any) {
      toast({ title: 'Failed to submit report', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Report Worker
          </DialogTitle>
          <DialogDescription>
            Report <span className="font-semibold text-foreground">{worker.name}</span> for inappropriate behaviour or violation.
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          <motion.div
            key="report-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-5 pt-2"
          >
            <div className="space-y-3">
              <Label className="text-sm font-medium">Reason for reporting</Label>
              <RadioGroup value={reason} onValueChange={setReason} className="space-y-2">
                {REPORT_REASONS.map((r) => (
                  <div key={r.value} className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                    <RadioGroupItem value={r.value} id={r.value} />
                    <Label htmlFor={r.value} className="cursor-pointer flex-1 text-sm">{r.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="report-desc" className="text-sm font-medium">Additional details (optional)</Label>
              <Textarea
                id="report-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                placeholder="Describe the issue..."
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">{description.length}/500</p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!reason || submitting}
              className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Send className="w-4 h-4 mr-2" />
              {submitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDialog;
