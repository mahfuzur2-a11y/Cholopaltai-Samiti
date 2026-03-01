
import React, { useMemo, useState, useEffect } from 'react';
import { Coins, TrendingUp, UserPlus, AlertCircle, FileText, Percent, PieChart, Printer, FileCheck, History } from 'lucide-react';
import { db } from '../db';
import { Transaction } from '../types';

interface ProfitViewProps {
  onBack: () => void;
  onDistribute: () => void;
}

const ProfitView: React.FC<ProfitViewProps> = ({ onBack, onDistribute }) => {
  /* Fix: Correctly store txs in state and fetch in useEffect */
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchTransactions = async () => {
      try {
        const data = await db.getTransactions();
        if (isMounted) {
          setTransactions(data);
        }
      } catch (err) {
        console.error("ProfitView fetchTransactions failed", err);
      }
    };
    fetchTransactions();
    return () => { isMounted = false; };
  }, []);

  const profitData = useMemo(() => {
    // 1. Profit from loan interest (approx 9.09% of total installment collection if interest is 10% on top)
    const loanCollectionProfit = transactions
      .filter(t => t.type === 'loan_collection')
      .reduce((sum, t) => sum + (t.amount * 0.0909), 0); 

    // 2. Admission Fees (100% is profit)
    const admissionFees = transactions
      .filter(t => t.type === 'admission_fee')
      .reduce((sum, t) => sum + t.amount, 0);

    // 3. Loan Form Fees (100% is profit)
    const formFees = transactions
      .filter(t => t.type === 'form_fee')
      .reduce((sum, t) => sum + t.amount, 0);

    // 4. Penalties (Savings and Loan Penalties)
    const penalties = transactions
      .filter(t => t.type === 'savings_penalty' || t.type === 'loan_penalty')
      .reduce((sum, t) => sum + t.amount, 0);

    // 5. Distributed Profit (Subtract this from the total income)
    const distributedProfit = transactions
      .filter(t => t.type === 'profit_distribution')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      loanCollectionProfit: Math.round(loanCollectionProfit),
      admissionFees,
      formFees,
      penalties,
      distributedProfit,
      totalProfit: Math.round(loanCollectionProfit) + admissionFees + formFees + penalties - distributedProfit
    };
  }, [transactions]);

  const categories = [
    { 
      label: 'ঋণ আদায়ের মুনাফা (১০%)', 
      amount: profitData.loanCollectionProfit, 
      icon: <Percent className="text-emerald-600" />, 
      color: 'bg-emerald-50', 
      description: 'সংগৃহীত কিস্তির মুনাফা অংশ' 
    },
    { 
      label: 'মোট ভর্তি ফি', 
      amount: profitData.admissionFees, 
      icon: <UserPlus className="text-blue-600" />, 
      color: 'bg-blue-50', 
      description: 'নতুন সদস্য ভর্তি থেকে আয়' 
    },
    { 
      label: 'জরিমানা আদায়', 
      amount: profitData.penalties, 
      icon: <History className="text-rose-600" />, 
      color: 'bg-rose-50', 
      description: 'সঞ্চয় ও ঋণ খেলাপী জরিমানা' 
    },
    { 
      label: 'ঋণ ফরম ফি', 
      amount: profitData.formFees, 
      icon: <FileCheck className="text-amber-600" />, 
      color: 'bg-amber-50', 
      description: 'ঋণ আবেদন ফরম থেকে আয়' 
    },
    { 
      label: 'বন্টিত মুনাফা (-)', 
      amount: profitData.distributedProfit, 
      icon: <PieChart className="text-pink-600" />, 
      color: 'bg-pink-50', 
      description: 'সদস্যদের মাঝে বন্টিত লভ্যাংশ' 
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Coins className="text-amber-500" /> মুনাফা ও আয় হিসাব
          </h2>
          <p className="text-slate-500">সমিতির অর্জিত মোট মুনাফা ও আয়ের উৎসসমূহ</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onDistribute}
            className="flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 shadow-lg font-bold transition-all active:scale-95"
          >
            <PieChart size={18} className="mr-2" /> মুনাফা বন্টন করুন
          </button>
          <button onClick={() => window.print()} className="flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-semibold">
            <Printer size={18} className="mr-2" /> প্রিন্ট
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-amber-100 font-medium mb-1">সর্বমোট অর্জিত মুনাফা ও আয়</p>
          <h3 className="text-5xl font-black">৳ {profitData.totalProfit.toLocaleString()}</h3>
        </div>
        <Coins size={180} className="absolute -right-10 -bottom-10 text-white/10 rotate-12" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((cat, index) => (
          <div key={index} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md flex flex-col justify-between group">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${cat.color} group-hover:scale-110 transition-transform`}>
                {cat.icon}
              </div>
            </div>
            <div>
              <h4 className="text-slate-500 font-medium text-sm mb-1">{cat.label}</h4>
              <p className="text-2xl font-bold text-slate-800">৳ {cat.amount.toLocaleString()}</p>
              <p className="text-xs text-slate-400 mt-2 italic">{cat.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfitView;
