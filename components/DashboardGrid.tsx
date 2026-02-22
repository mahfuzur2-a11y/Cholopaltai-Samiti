
import React, { useMemo, useState, useEffect } from 'react';
import { 
  UserPlus, 
  Users, 
  Wallet, 
  HandCoins, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  FileText, 
  MinusCircle, 
  BarChart3,
  Coins,
  Building2,
  BookOpen,
  PieChart,
  Lock,
  LogOut,
  ArrowDownLeft
} from 'lucide-react';
import { ViewType, Member, Transaction } from '../types';
import { db } from '../db';

interface DashboardGridProps {
  onNavigate: (view: ViewType) => void;
  userRole: 'admin' | 'user';
  onLogout: () => void;
}

const DashboardGrid: React.FC<DashboardGridProps> = ({ onNavigate, userRole, onLogout }) => {
  const isAdmin = userRole === 'admin';

  /* Fix: Store fetched data in state since db.getMembers() and db.getTransactions() return Promises */
  const [members, setMembers] = useState<Member[]>([]);
  const [txs, setTxs] = useState<Transaction[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [membersData, txsData] = await Promise.all([
          db.getMembers(),
          db.getTransactions()
        ]);
        if (isMounted) {
          setMembers(membersData);
          setTxs(txsData);
        }
      } catch (err) {
        console.error("Dashboard fetchData failed", err);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, []);

  const metrics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().slice(0, 7);

    return {
      totalMembers: members.length,
      monthlyCollection: txs
        .filter(t => t.date.startsWith(thisMonth) && (t.type === 'savings' || t.type === 'loan_collection'))
        .reduce((sum, t) => sum + t.amount, 0),
      todayCollection: txs
        .filter(t => t.date === today && (t.type === 'savings' || t.type === 'loan_collection'))
        .reduce((sum, t) => sum + t.amount, 0),
      totalLoan: members.reduce((sum, m) => sum + m.totalLoan, 0),
      // Dummy logic for due since we don't have a scheduled repayment tracking yet
      totalDue: members.filter(m => m.totalLoan > 0).reduce((sum, m) => sum + (m.totalLoan * 0.1), 0)
    };
  }, [members, txs]);

  const cards = [
    { type: ViewType.NEW_MEMBER, label: 'নতুন সদস্য', icon: <UserPlus className="text-blue-500" />, color: 'bg-blue-50', restricted: false },
    { type: ViewType.MEMBER_LIST, label: 'সদস্য তালিকা', icon: <Users className="text-emerald-500" />, color: 'bg-emerald-50', restricted: false },
    { type: ViewType.MEMBER_LEDGER, label: 'সদস্য লেজার', icon: <BookOpen className="text-indigo-600" />, color: 'bg-indigo-50', restricted: false },
    { type: ViewType.SAVINGS_COLLECTION, label: 'সঞ্চয় আদায়', icon: <Wallet className="text-amber-500" />, color: 'bg-amber-50', restricted: false },
    { type: ViewType.LOAN_COLLECTION, label: 'ঋণ আদায়', icon: <HandCoins className="text-indigo-500" />, color: 'bg-indigo-50', restricted: false },
    { type: ViewType.LOAN_DISTRIBUTION, label: 'ঋণ বিতরণ', icon: <TrendingUp className="text-purple-500" />, color: 'bg-purple-50', restricted: false },
    { type: ViewType.PROFIT, label: 'মুনাফা ও আয়', icon: <Coins className="text-amber-600" />, color: 'bg-amber-100/50', restricted: false },
    { type: ViewType.PROFIT_DISTRIBUTION, label: 'মুনাফা বন্টন', icon: <PieChart className="text-pink-600" />, color: 'bg-pink-50', restricted: true },
    { type: ViewType.EXPENSE, label: 'ব্যয়', icon: <TrendingDown className="text-rose-500" />, color: 'bg-rose-50', restricted: false },
    { type: ViewType.BANK_DEPOSIT, label: 'ব্যাংক জমা', icon: <Building2 className="text-blue-600" />, color: 'bg-blue-100/30', restricted: false },
    { type: ViewType.BANK_WITHDRAWAL, label: 'ব্যাংক উত্তোলন', icon: <ArrowDownLeft className="text-rose-600" />, color: 'bg-rose-100/30', restricted: false },
    { type: ViewType.SAVINGS_DUE, label: 'বকেয়া সঞ্চয়', icon: <Clock className="text-orange-500" />, color: 'bg-orange-50', restricted: false },
    { type: ViewType.LOAN_DUE, label: 'বকেয়া ঋণ', icon: <Clock className="text-red-500" />, color: 'bg-red-50', restricted: false },
    { type: ViewType.SAVINGS_VIEW, label: 'সঞ্চয় আদায় ভিউ', icon: <FileText className="text-teal-500" />, color: 'bg-teal-50', restricted: false },
    { type: ViewType.LOAN_VIEW, label: 'ঋণ আদায় ও বিতরণ', icon: <FileText className="text-cyan-500" />, color: 'bg-cyan-50', restricted: false },
    { type: ViewType.SAVINGS_WITHDRAWAL, label: 'সঞ্চয় উত্তোলন', icon: <MinusCircle className="text-pink-500" />, color: 'bg-pink-50', restricted: false },
    { type: ViewType.REPORTS, label: 'রিপোর্ট', icon: <BarChart3 className="text-emerald-600" />, color: 'bg-emerald-100/50', restricted: false },
    { type: ViewType.MONTHLY_SHEET, label: 'মাসিক শীট', icon: <FileText className="text-indigo-600" />, color: 'bg-indigo-50', restricted: false },
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 flex justify-between items-start md:items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">চলো পাল্টায় যুব কল্যাণ সমিতি</h2>
          <p className="text-slate-500 text-sm">স্বাগতম, {userRole === 'admin' ? 'অ্যাডমিন' : 'সদস্য'} প্যানেলে!</p>
        </div>
        <button 
          onClick={onLogout}
          className="hidden md:flex items-center gap-2 px-4 py-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all font-bold text-sm shadow-sm"
        >
          <LogOut size={18} /> লগআউট
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {cards.map((card) => {
          const isLocked = card.restricted && !isAdmin;
          return (
            <button
              key={card.type}
              onClick={() => !isLocked && onNavigate(card.type)}
              className={`
                relative flex flex-col items-center justify-center p-6 rounded-[2rem] shadow-sm border border-slate-100 transition-all 
                ${isLocked ? 'opacity-60 cursor-not-allowed bg-slate-100 grayscale' : `${card.color} hover:shadow-xl hover:-translate-y-1 active:scale-95 group`}
              `}
            >
              {isLocked && (
                <div className="absolute top-4 right-4 text-slate-400">
                  <Lock size={16} />
                </div>
              )}
              <div className={`p-4 bg-white rounded-2xl shadow-sm mb-4 transition-transform ${!isLocked && 'group-hover:scale-110'}`}>
                {React.cloneElement(card.icon as React.ReactElement<any>, { size: 32 })}
              </div>
              <span className={`text-sm md:text-base font-black text-center ${isLocked ? 'text-slate-400' : 'text-slate-700'}`}>{card.label}</span>
            </button>
          );
        })}
      </div>

      {/* Summary Section */}
      <div className="mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-2">মোট সদস্য</h3>
          <p className="text-2xl font-black text-slate-800">{metrics.totalMembers}+</p>
        </div>
        
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-2">চলতি মাসে আদায়</h3>
          <p className="text-2xl font-black text-emerald-600">৳ {metrics.monthlyCollection.toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-blue-100 hover:shadow-md transition-shadow">
          <h3 className="text-blue-600 text-[10px] font-black uppercase tracking-wider mb-2">আজকের আদায়</h3>
          <p className="text-2xl font-black text-blue-700">৳ {metrics.todayCollection.toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-2">চলমান ঋণ</h3>
          <p className="text-2xl font-black text-indigo-600">৳ {metrics.totalLoan.toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-rose-100 hover:shadow-md transition-shadow">
          <h3 className="text-rose-600 text-[10px] font-black uppercase tracking-wider mb-2">বকেয়া ঋণ (আনুমানিক)</h3>
          <p className="text-2xl font-black text-rose-700">৳ {metrics.totalDue.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardGrid;
