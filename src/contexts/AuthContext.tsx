import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import type { Tables } from '@/integrations/supabase/types';

type WorkerProfile = Tables<'workers'>;

interface CustomerProfile {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  city: string;
  district: string;
  pincode: string;
  created_at: string;
}

type UserRole = 'worker' | 'customer' | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  workerProfile: WorkerProfile | null;
  customerProfile: CustomerProfile | null;
  role: UserRole;
  loading: boolean;
  signUpWorker: (phone: string, password: string, profileData: Omit<WorkerProfile, 'id' | 'user_id' | 'rating' | 'total_reviews' | 'status' | 'verified' | 'created_at' | 'updated_at'>) => Promise<{ error: string | null }>;
  signUpCustomer: (phone: string, password: string, profileData: Omit<CustomerProfile, 'id' | 'user_id' | 'created_at'>) => Promise<{ error: string | null }>;
  signInWorker: (phone: string, password: string) => Promise<{ error: string | null }>;
  signInCustomer: (phone: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const workerPhoneToEmail = (phone: string) => {
  const clean = phone.replace(/\D/g, '');
  return `worker_${clean}@worknear.local`;
};

const customerPhoneToEmail = (phone: string) => {
  const clean = phone.replace(/\D/g, '');
  return `customer_${clean}@worknear.local`;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [workerProfile, setWorkerProfile] = useState<WorkerProfile | null>(null);
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfiles = async (userId: string) => {
    const [workerRes, customerRes] = await Promise.all([
      supabase.from('workers').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('customers').select('*').eq('user_id', userId).maybeSingle(),
    ]);
    setWorkerProfile(workerRes.data);
    setCustomerProfile(customerRes.data as CustomerProfile | null);
    if (workerRes.data) setRole('worker');
    else if (customerRes.data) setRole('customer');
    else setRole(null);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfiles(user.id);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => fetchProfiles(session.user.id), 0);
      } else {
        setWorkerProfile(null);
        setCustomerProfile(null);
        setRole(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfiles(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUpWorker = async (phone: string, password: string, profileData: Omit<WorkerProfile, 'id' | 'user_id' | 'rating' | 'total_reviews' | 'status' | 'verified' | 'created_at' | 'updated_at'>) => {
    const email = workerPhoneToEmail(phone);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    if (!data.user) return { error: 'Signup failed' };

    const { error: profileError } = await supabase.from('workers').insert({
      user_id: data.user.id,
      ...profileData,
    });
    if (profileError) return { error: profileError.message };
    await fetchProfiles(data.user.id);
    return { error: null };
  };

  const signUpCustomer = async (phone: string, password: string, profileData: Omit<CustomerProfile, 'id' | 'user_id' | 'created_at'>) => {
    const email = customerPhoneToEmail(phone);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    if (!data.user) return { error: 'Signup failed' };

    const { error: profileError } = await supabase.from('customers').insert({
      user_id: data.user.id,
      name: profileData.name,
      phone: profileData.phone,
      city: profileData.city,
      district: profileData.district,
      pincode: profileData.pincode,
    } as any);
    if (profileError) return { error: profileError.message };
    await fetchProfiles(data.user.id);
    return { error: null };
  };

  const signInWorker = async (phone: string, password: string) => {
    const email = workerPhoneToEmail(phone);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signInCustomer = async (phone: string, password: string) => {
    const email = customerPhoneToEmail(phone);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setWorkerProfile(null);
    setCustomerProfile(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{
      user, session, workerProfile, customerProfile, role, loading,
      signUpWorker, signUpCustomer, signInWorker, signInCustomer, signOut, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
