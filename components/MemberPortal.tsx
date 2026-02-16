
import React, { useState, useMemo, useEffect } from 'react';
import { User, Phone, Search, ChevronLeft, Wallet, HandCoins, History, LogOut } from 'lucide-react';
import { db } from '../db';
import { Member, Transaction } from '../types';

interface MemberPortalProps {
  onBack: () => void;
}

const MemberPortal: React.FC<MemberPortalProps> = ({ onBack }) => {
  const [memberId, setMemberId] = useState('');
  const [lastDigits, setLastDigits] = useState('');
  const [error, setError] = useState('');
  const [loggedInMember, setLoggedInMember] = useState<Member | null>(null);
  
  /* Fix: Correctly store transactions in state and fetch in useEffect or search */
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const fetchTxs = async () => {
      const data = await db.getTransactions();
      setAllTransactions(data);
    };
    fetchTxs();
  }, []);

  /* Fix: handleSearch now awaits the async db.getMembers() call */
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const members = await db.getMembers();
    const found = members.find(m => 
      m.id === memberId && m.phone.endsWith(lastDigits)
    );

    if (found) {
      setLoggedInMember(found);
      setError('');
    } else {
      setError('সদস্য আইডি বা মোবাইল নম্বর সঠিক নয়!');
      setTimeout(() => setError(''), 3000);
    }
  };

  const memberTransactions = useMemo(() => {
    if (!loggedInMember) return [];
    return allTransactions
      .filter(t => t.memberId === loggedInMember.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [loggedInMember, allTransactions]);

  if (loggedInMember) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-500 pb-10">
        <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner">
              {loggedInMember.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800">{loggedInMember.name}</h2>
              <p className="text-slate-500 font-bold">সদস্য আইডি: #{loggedInMember.id}</p>
            </div>
          </div>
          <button 
            onClick={() => setLoggedInMember(null)}
            className="flex items-center gap-2 px-6 py-2.5 bg-rose-50 text-rose-600 rounded-xl font-black hover:bg-rose-100 transition-all shadow-sm"
          >
            <LogOut size={18} /> প্রস্থান করুন
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-8 rounded-[2.5rem] text-white shadow-xl shadow-emerald-100 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <p className="text-emerald-100 font-bold uppercase tracking-widest text-xs">আপনার মোট সঞ্চয়</p>
              <Wallet size={24} className="opacity-40" />
            </div>
            <h3 className="text-4xl font-black mt-4">৳ {loggedInMember.totalSavings.toLocaleString()}</h3>
          </div>

          <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <p className="text-indigo-100 font-bold uppercase tracking-widest text-xs">আপনার বর্তমান ঋণ</p>
              <HandCoins size={24} className="opacity-40" />
            </div>
            <h3 className="text-4xl font-black mt-4">৳ {loggedInMember.totalLoan.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center gap-2 text-slate-800 font-black">
            <History size={20} className="text-emerald-600" /> সাম্প্রতিক লেনদেন সমূহ
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">তারিখ</th>
                  <th className="px-6 py-4">ধরণ</th>
                  <th className="px-6 py-4 text-right">পরিমাণ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {memberTransactions.length > 0 ? memberTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-500">{t.date}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        t.type.includes('withdrawal') || t.type.includes('distribution') ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {t.type === 'savings' ? 'সঞ্চয় জমা' : t.type === 'loan_collection' ? 'কিস্তি জমা' : 'লেনদেন'}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-right font-black ${
                      t.type.includes('withdrawal') || t.type.includes('distribution') ? 'text-rose-600' : 'text-emerald-700'
                    }`}>
                      ৳ {t.amount.toLocaleString()}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={3} className="p-10 text-center text-slate-400 font-bold italic">কোনো লেনদেন খুঁজে পাওয়া যায়নি।</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 space-y-8 animate-in zoom-in-95 duration-500 border border-slate-100">
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
            <User size={40} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">সদস্য কর্নার</h2>
          <p className="text-slate-500 font-bold mt-2">আপনার হিসাব পরীক্ষা করুন</p>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm font-black text-center animate-pulse">
            {error}
          </div>
        )}

        <form onSubmit={handleSearch} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">সদস্য আইডি</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Search size={20} />
              </div>
              <input 
                required
                type="text" 
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                placeholder="যেমন: 101"
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 font-black text-lg transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">মোবাইল শেষ ৪ ডিজিট</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Phone size={20} />
              </div>
              <input 
                required
                type="password" 
                maxLength={4}
                value={lastDigits}
                onChange={(e) => setLastDigits(e.target.value)}
                placeholder="XXXX"
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 font-black text-lg transition-all"
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-xl shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
          >
            সার্চ করুন <Search size={22} />
          </button>
        </form>

        <button 
          onClick={onBack}
          className="w-full text-slate-400 hover:text-slate-600 font-black flex items-center justify-center gap-2 transition-colors py-2"
        >
          <ChevronLeft size={20} /> ফিরে যান
        </button>
      </div>
    </div>
  );
};

export default MemberPortal;
