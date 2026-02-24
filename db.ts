
import { createClient } from '@supabase/supabase-js';
import { User, Member, Transaction } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://gbqtzytvtlrxfzlciwjd.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdicXR6eXR2dGxyeGZ6bGNpd2pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MTYzMjMsImV4cCI6MjA4NzQ5MjMyM30.9fSNZ1ZC3y3tSR3VGJyr_cEfebOwxXFTo18u6KGttxQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const COLLECTIONS = {
  USERS: 'users',
  MEMBERS: 'members',
  TRANSACTIONS: 'transactions'
};

const SESSION_KEYS = {
  CURRENT_USER: 'somity_current_user'
};

const DEFAULT_USERS: User[] = [
  { id: '1', username: 'admin', name: 'অ্যাডমিন', role: 'admin', password: 'admin' },
  { id: '2', username: 'user', name: 'অফিসার', role: 'user', password: 'user' }
];

export const db = {
  isCloudEnabled: () => true,

  init: async () => {
    try {
      const { data: users, error } = await supabase.from(COLLECTIONS.USERS).select('id').limit(1);
      if (error) throw error;
      
      if (!users || users.length === 0) {
        const { error: insertError } = await supabase.from(COLLECTIONS.USERS).insert(DEFAULT_USERS);
        if (insertError) throw insertError;
        console.log("Supabase initialized with default users.");
      }
    } catch (e: any) {
      console.error("Supabase Init Error: ", e.message);
      alert("ডাটাবেজ কানেক্ট হতে পারছে না। দয়া করে Supabase টেবিল এবং পারমিশন চেক করুন।");
    }
  },

  resetDatabase: async () => {
    if (confirm("এটি করলে শুধুমাত্র ব্রাউজারের লগইন সেশন রিসেট হবে।")) {
      sessionStorage.clear();
      window.location.reload();
    }
  },

  getUsers: async (): Promise<User[]> => {
    try {
      const { data, error } = await supabase.from(COLLECTIONS.USERS).select('*');
      if (error) throw error;
      return data && data.length > 0 ? data : DEFAULT_USERS;
    } catch (e: any) {
      console.error("Get users failed", e);
      return DEFAULT_USERS;
    }
  },

  saveUsers: async (users: User[]): Promise<void> => {
    try {
      const { error } = await supabase.from(COLLECTIONS.USERS).upsert(users);
      if (error) throw error;
    } catch (e) {
      console.error("Save users failed", e);
    }
  },

  getCurrentUser: (): User | null => {
    try {
      const user = sessionStorage.getItem(SESSION_KEYS.CURRENT_USER);
      return user ? JSON.parse(user) : null;
    } catch { return null; }
  },

  setCurrentUser: (user: User | null) => {
    if (user) sessionStorage.setItem(SESSION_KEYS.CURRENT_USER, JSON.stringify(user));
    else sessionStorage.removeItem(SESSION_KEYS.CURRENT_USER);
  },

  getMembers: async (): Promise<Member[]> => {
    try {
      const { data, error } = await supabase.from(COLLECTIONS.MEMBERS).select('*');
      if (error) throw error;
      return data || [];
    } catch (e: any) {
      console.error("Get members failed", e);
      return [];
    }
  },

  addMember: async (member: Member): Promise<void> => {
    try {
      const { error } = await supabase.from(COLLECTIONS.MEMBERS).upsert(member);
      if (error) throw error;
    } catch (e) {
      console.error("Add member failed", e);
      throw e;
    }
  },

  deleteMember: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase.from(COLLECTIONS.MEMBERS).delete().eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.error("Delete member failed", e);
    }
  },

  getTransactions: async (): Promise<Transaction[]> => {
    try {
      const { data, error } = await supabase.from(COLLECTIONS.TRANSACTIONS).select('*');
      if (error) throw error;
      return data || [];
    } catch (e: any) {
      console.error("Get transactions failed", e);
      return [];
    }
  },

  addTransaction: async (tx: Transaction): Promise<void> => {
    try {
      // Insert transaction
      const { data: newTx, error: txError } = await supabase
        .from(COLLECTIONS.TRANSACTIONS)
        .insert([{ ...tx, id: undefined }]) // Let Supabase generate UUID if not provided
        .select()
        .single();
      
      if (txError) throw txError;

      if (tx.memberId !== 'SYSTEM') {
        const { data: mData, error: mError } = await supabase
          .from(COLLECTIONS.MEMBERS)
          .select('*')
          .eq('id', tx.memberId)
          .single();
        
        if (mError) throw mError;

        if (mData) {
          let { totalSavings, totalLoan } = mData;
          
          if (tx.type === 'savings' || tx.type === 'admission_fee') totalSavings += tx.amount;
          else if (tx.type === 'savings_withdrawal') totalSavings -= tx.amount;
          else if (tx.type === 'loan_distribution') totalLoan += (tx.amount * 1.10);
          else if (tx.type === 'loan_collection') totalLoan -= tx.amount;

          const { error: updateError } = await supabase
            .from(COLLECTIONS.MEMBERS)
            .update({ 
              totalSavings: Math.max(0, totalSavings), 
              totalLoan: Math.max(0, totalLoan) 
            })
            .eq('id', tx.memberId);
          
          if (updateError) throw updateError;
        }
      }
    } catch (e) {
      console.error("Add transaction failed", e);
      throw e;
    }
  }
};
