import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Search, Filter, ChevronDown, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import heroBg from '@/assets/hero-bg.jpg';
import WorkerCard from '@/components/WorkerCard';
import { CATEGORY_KEYS, CATEGORY_GROUPS } from '@/data/mockWorkers';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Worker = Tables<'workers'>;

const HomePage = () => {
  const { t } = useTranslation();
  const [pincode, setPincode] = useState('');
  const [searchedPincode, setSearchedPincode] = useState('');
  const [category, setCategory] = useState('');
  const [minExperience, setMinExperience] = useState(0);
  const [minRating, setMinRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const fetchWorkers = async (pc?: string) => {
    setLoading(true);
    let query = supabase
      .from('workers')
      .select('*')
      .eq('status', 'active')
      .order('rating', { ascending: false });

    if (pc) query = query.eq('pincode', pc);
    if (category) query = query.eq('category', category as any);
    if (minExperience) query = query.gte('experience', minExperience);
    if (minRating) query = query.gte('rating', minRating);

    const { data } = await query.limit(30);
    setWorkers(data || []);
    setLoading(false);
  };

  // Load popular workers on mount
  useEffect(() => {
    fetchWorkers();
  }, []);

  // Refetch when filters change
  useEffect(() => {
    fetchWorkers(searchedPincode || undefined);
  }, [category, minExperience, minRating]);

  const handleSearch = () => {
    setSearchedPincode(pincode.trim());
    setHasSearched(true);
    fetchWorkers(pincode.trim() || undefined);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden min-h-[420px] md:min-h-[500px] flex items-center">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroBg})` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <div className="container relative py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl text-left"
          >
            <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground leading-tight">
              {t('hero_title')}
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-lg">
              {t('hero_subtitle')}
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-8 flex flex-col sm:flex-row gap-3 max-w-xl"
            >
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={t('search_placeholder')}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-base"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-opacity shrink-0"
              >
                {t('search_button')}
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-6 flex flex-wrap gap-2"
            >
              <button
                onClick={() => setCategory('')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  !category ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:border-primary/30'
                }`}
              >
                {t('all_categories')}
              </button>
              {CATEGORY_KEYS.slice(0, 8).map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(category === cat ? '' : cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    category === cat ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:border-primary/30'
                  }`}
                >
                  {t(`categories.${cat}`)}
                </button>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Results */}
      <section className="container pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading font-bold text-xl text-foreground">
            {hasSearched
              ? `${workers.length} workers${searchedPincode ? ` in ${searchedPincode}` : ''}`
              : 'Popular Workers'}
          </h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Filter className="w-4 h-4" /> {t('filter_experience')}
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex flex-wrap gap-4 mb-6 p-4 bg-card rounded-xl border border-border"
          >
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('category')}</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">{t('all_categories')}</option>
                {Object.entries(CATEGORY_GROUPS).map(([group, cats]) => (
                  <optgroup key={group} label={t(`category_groups.${group}`)}>
                    {cats.map(cat => (
                      <option key={cat} value={cat}>{t(`categories.${cat}`)}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('filter_experience')}</label>
              <select
                value={minExperience}
                onChange={(e) => setMinExperience(Number(e.target.value))}
                className="px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value={0}>{t('any_experience')}</option>
                {[2, 5, 8, 10].map(y => (
                  <option key={y} value={y}>{t('years_plus', { count: y })}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('filter_rating')}</label>
              <select
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value={0}>{t('any_rating')}</option>
                {[3, 3.5, 4, 4.5].map(r => (
                  <option key={r} value={r}>{t('stars_up', { count: r })}</option>
                ))}
              </select>
            </div>
          </motion.div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : workers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workers.map((worker, i) => (
              <WorkerCard key={worker.id} worker={worker} index={i} />
            ))}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <p className="text-lg font-medium text-foreground">{t('no_workers_found')}</p>
            <p className="text-muted-foreground mt-1">{t('try_different')}</p>
          </motion.div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
