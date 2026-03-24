import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Phone, MessageCircle, Star, CheckCircle, MapPin, Briefcase, CalendarPlus, Flag } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import BookingModal from './BookingModal';
import ReportDialog from './ReportDialog';

interface WorkerCardProps {
  worker: Tables<'workers'>;
  index: number;
}

const WorkerCard = ({ worker, index }: WorkerCardProps) => {
  const { t } = useTranslation();
  const [bookingOpen, setBookingOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const phoneClean = worker.phone.replace(/\s/g, '');
  const whatsappUrl = `https://wa.me/${phoneClean.replace('+', '').replace(/\D/g, '')}?text=${encodeURIComponent('Hi, I found you on Work Near U. I need your service.')}`;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.4, delay: index * 0.05 }}
        className="bg-card rounded-2xl border border-border p-5 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group"
      >
        <div className="flex gap-4">
          <div className="relative shrink-0">
            <img
              src={worker.image_url || `https://api.dicebear.com/7.x/personas/svg?seed=${worker.name.replace(/ /g, '')}`}
              alt={worker.name}
              className="w-16 h-16 rounded-xl object-cover bg-muted"
              loading="lazy"
            />
            <span
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card ${
                worker.status === 'active' ? 'bg-success' : 'bg-muted-foreground/40'
              }`}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-heading font-semibold text-foreground truncate flex items-center gap-1.5">
                  {worker.name}
                  {worker.verified && <CheckCircle className="w-4 h-4 text-primary shrink-0" />}
                </h3>
                <p className="text-sm text-primary font-medium">{t(`categories.${worker.category}`)}</p>
              </div>
              <span className={`shrink-0 text-xs font-medium px-2 py-1 rounded-full ${
                worker.status === 'active' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
              }`}>
                {worker.status === 'active' ? `🟢 ${t('active')}` : `⚪ ${t('offline')}`}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {worker.city}</span>
              <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {t('experience_years', { count: worker.experience })}</span>
              <span className="flex items-center gap-1"><Star className="w-3 h-3 text-warning fill-warning" /> {Number(worker.rating).toFixed(1)} ({t('reviews', { count: worker.total_reviews })})</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <a
            href={`tel:${phoneClean}`}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Phone className="w-4 h-4" /> {t('call')}
          </a>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-success text-success-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <MessageCircle className="w-4 h-4" /> {t('whatsapp')}
          </a>
          <button
            onClick={() => setBookingOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors"
          >
            <CalendarPlus className="w-4 h-4" /> Book
          </button>
          <button
            onClick={() => setReportOpen(true)}
            className="flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Report worker"
          >
            <Flag className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      <BookingModal worker={worker} open={bookingOpen} onClose={() => setBookingOpen(false)} />
      <ReportDialog worker={worker} open={reportOpen} onClose={() => setReportOpen(false)} />
    </>
  );
};

export default WorkerCard;
