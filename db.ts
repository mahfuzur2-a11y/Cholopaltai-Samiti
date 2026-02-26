
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
    if (!id) throw new Error("ID is required");
    try {
      // 1. Delete associated transactions first
      const { error: txError } = await supabase
        .from(COLLECTIONS.TRANSACTIONS)
        .delete()
        .eq('memberId', id);
      
      if (txError) throw txError;

      // 2. Delete the member
      const { error } = await supabase
        .from(COLLECTIONS.MEMBERS)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (e: any) {
      console.error("Delete member failed:", e);
      throw new Error(e.message || "সদস্য ডিলিট করতে সমস্যা হয়েছে");
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
      const amount = Number(tx.amount);
      if (isNaN(amount)) throw new Error("Invalid amount");

      const { error: txError } = await supabase
        .from(COLLECTIONS.TRANSACTIONS)
        .insert([{ 
          memberId: tx.memberId,
          memberName: tx.memberName,
          date: tx.date, // Already formatted as DD-MM-YY
          amount: amount,
          type: tx.type,
          remarks: tx.remarks || ''
        }]);
      
      if (txError) throw txError;

      if (tx.memberId && tx.memberId !== 'SYSTEM') {
        const { data: mData, error: mError } = await supabase
          .from(COLLECTIONS.MEMBERS)
          .select('*')
          .eq('id', tx.memberId)
          .maybeSingle();
        
        if (mError) throw mError;

        if (mData) {
          let totalSavings = Number(mData.totalSavings || 0);
          let totalLoan = Number(mData.totalLoan || 0);
          
          if (tx.type === 'savings') {
            totalSavings += amount;
          } else if (tx.type === 'admission_fee') {
            // Admission fee is income, not member savings. Do not update totalSavings.
          } else if (tx.type === 'savings_withdrawal') {
            totalSavings -= amount;
          } else if (tx.type === 'loan_distribution') {
            totalLoan += (amount * 1.10);
          } else if (tx.type === 'loan_collection') {
            totalLoan -= amount;
          }

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
    } catch (e: any) {
      console.error("Add transaction failed:", e);
      throw new Error(e.message || "লেনদেন সংরক্ষণ করতে সমস্যা হয়েছে");
    }
  },

  clearAllData: async (): Promise<boolean> => {
    try {
      const { error: txError } = await supabase.from(COLLECTIONS.TRANSACTIONS).delete().neq('id', '0');
      const { error: mError } = await supabase.from(COLLECTIONS.MEMBERS).delete().neq('id', '0');
      const { error: uError } = await supabase.from(COLLECTIONS.USERS).delete().neq('id', '1'); // Keep admin
      
      if (txError || mError || uError) throw new Error("Delete failed");
      return true;
    } catch (e) {
      console.error("Clear all data failed", e);
      return false;
    }
  }
};
