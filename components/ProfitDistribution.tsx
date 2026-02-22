
import React, { useState, useMemo, useEffect } from 'react';
import { 
  CheckCircle2, 
  Search,
  CheckSquare,
  Square,
  Calculator,
  TrendingUp,
  TrendingDown,
  Wallet
} from 'lucide-react';
import { db } from '../db';
import { Member, Transaction } from '../types';

interface ProfitDistributionProps {
  onBack: () => void;
}

const ProfitDistribution: React.FC<ProfitDistributionProps> = ({ onBack }) => {
  const [profitRate, setProfitRate] = useState<string>('10');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [distributionDate, setDistributionDate] = useState(new Date().toISOString().split('T')[0]);

  /* Fix: Correctly store members and txs in state and fetch in useEffect */
  const [members, setMembers] = useState<Member[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

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
          setTransactions(txsData);
        }
      } catch (err) {
        console.error("ProfitDistribution fetchData failed", err);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, []);

  // Calculate Net Profit for reference
  const netProfitMetrics = useMemo(() => {
    const loanCollectionProfit = transactions
      .filter(t => t.type === 'loan_collection')
      .reduce((sum, t) => sum + (t.amount * 0.0909), 0); 

    const admissionFees = transactions
      .filter(t => t.type === 'admission_fee')
      .reduce((sum, t) => sum + t.amount, 0);

    const formFees = transactions
      .filter(t => t.type === 'form_fee')
      .reduce((sum, t) => sum + t.amount, 0);

    const penalties = transactions
      .filter(t => t.type === 'savings_penalty' || t.type === 'loan_penalty')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalIncome = Math.round(loanCollectionProfit + admissionFees + formFees + penalties);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses
    };
  }, [transactions]);

  const filteredMembers = useMemo(() => {
    return members.filter(m => 
      m.name.includes(searchTerm) || m.id.includes(searchTerm)
    );
  }, [members, searchTerm]);

  const toggleSelectAll = () => {
    if (selectedMemberIds.size === filteredMembers.length) {
      setSelectedMemberIds(new Set());
    } else {
      setSelectedMemberIds(new Set(filteredMembers.map(m => m.id)));
    }
  };

  const toggleMember = (id: string) => {
    const newSet = new Set(selectedMemberIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedMemberIds(newSet);
  };

  const calculateProfit = (savings: number) => {
    const rate = parseFloat(profitRate) || 0;
    return Math.round((savings * rate) / 100);
  };

  const totalDistributedProfit = useMemo(() => {
    let total = 0;
    members.forEach(m => {
      if (selectedMemberIds.has(m.id)) {
        total += calculateProfit(m.totalSavings);
      }
    });
    return total;
  }, [selectedMemberIds, profitRate, members]);

  const handleDistribute = () => {
    if (selectedMemberIds.size === 0) {
      alert('সদস্য নির্বাচন করুন।');
      return;
    }

    if (window.confirm(`${selectedMemberIds.size} জন সদস্যের সঞ্চয়ে মোট ৳${totalDistributedProfit.toLocaleString()} মুনাফা বন্টন করা হবে। আপনি কি নিশ্চিত?`)) {
      setProcessing(true);
      
      setTimeout(async () => {
        const rateNum = parseFloat(profitRate);
        const distributionPromises = members
          .filter(m => selectedMemberIds.has(m.id))
          .map(m => {
            const p = calculateProfit(m.totalSavings);
            if (p > 0) {
              return db.addTransaction({
                id: `DIST-${Date.now()}-${m.id}`,
                memberId: m.id,
                memberName: m.name,
                date: distributionDate,
                amount: p,
                type: 'savings',
                remarks: `মুনাফা বন্টন (${rateNum}%)`
              });
            }
            return Promise.resolve();
          });

        await Promise.all(distributionPromises);

        setProcessing(false);
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          onBack();
        }, 3000);
      }, 1500);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Calculator className="text-pink-600" /> বার্ষিক মুনাফা বন্টন
          </h2>
          <p className="text-slate-500">সদস্যদের জমাকৃত সঞ্চয়ের ওপর লভ্যাংশ যোগ করুন</p>
        </div>
      </div>

      {showSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl flex items-center gap-3">
          <CheckCircle2 className="text-emerald-500" />
          <span className="font-bold">মুনাফা সফলভাবে বন্টন করা হয়েছে।</span>
        </div>
      )}

      {/* Net Profit Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-600 mb-2 font-black text-[10px] uppercase">
            <TrendingUp size={14} /> মোট আয় ও মুনাফা
          </div>
          <p className="text-xl font-black text-slate-800">৳ {netProfitMetrics.totalIncome.toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-rose-100 shadow-sm">
          <div className="flex items-center gap-2 text-rose-600 mb-2 font-black text-[10px] uppercase">
            <TrendingDown size={14} /> মোট ব্যয় (-)
          </div>
          <p className="text-xl font-black text-slate-800">৳ {netProfitMetrics.totalExpenses.toLocaleString()}</p>
        </div>
        <div className="bg-indigo-600 p-5 rounded-3xl shadow-lg shadow-indigo-100 text-white">
          <div className="flex items-center gap-2 text-indigo-100 mb-2 font-black text-[10px] uppercase">
            <Wallet size={14} /> নীট মুনাফা (বন্টনযোগ্য)
          </div>
          <p className="text-xl font-black">৳ {netProfitMetrics.netProfit.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">মুনাফার হার (%)</label>
              <input 
                type="number"
                value={profitRate}
                onChange={(e) => setProfitRate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-pink-100 bg-pink-50/30 focus:ring-2 focus:ring-pink-500 outline-none font-black text-xl text-pink-700"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">তারিখ</label>
              <input 
                type="date"
                value={distributionDate}
                onChange={(e) => setDistributionDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pink-500 outline-none font-bold"
              />
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between pt-4 border-t border-slate-50">
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="সদস্য খুঁজুন..."
              className="w-full md:w-64 px-4 py-2 rounded-xl border bg-slate-50 font-bold"
            />
            <button onClick={toggleSelectAll} className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl font-bold hover:bg-slate-200 transition-colors">
              {selectedMemberIds.size === filteredMembers.length ? <CheckSquare size={18} className="text-pink-600" /> : <Square size={18} className="text-slate-400" />}
              {selectedMemberIds.size === filteredMembers.length ? 'সব মুছুন' : 'সবাইকে সিলেক্ট করুন'}
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-pink-600 to-rose-700 p-6 rounded-3xl text-white shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-pink-100 font-bold text-sm uppercase mb-4 tracking-widest">বন্টন সারসংক্ষেপ</h3>
            <div className="space-y-1">
              <p className="text-4xl font-black">৳ {totalDistributedProfit.toLocaleString()}</p>
              <p className="text-xs text-pink-200 font-bold">সিলেক্টেড সদস্য: {selectedMemberIds.size} জন</p>
            </div>
            <div className="mt-8">
              <button 
                disabled={processing || selectedMemberIds.size === 0}
                onClick={handleDistribute}
                className="w-full py-4 bg-white text-pink-600 rounded-2xl font-black text-lg disabled:opacity-50 hover:bg-pink-50 transition-colors shadow-lg active:scale-95"
              >
                {processing ? 'প্রসেসিং...' : 'মুনাফা যোগ করুন'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 text-center w-20">সিলেক্ট</th>
                <th className="px-6 py-4">সদস্য তথ্য</th>
                <th className="px-6 py-4">মোট সঞ্চয়</th>
                <th className="px-6 py-4 text-pink-600">প্রাপ্য মুনাফা</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredMembers.map((m) => {
                const isSelected = selectedMemberIds.has(m.id);
                const p = calculateProfit(m.totalSavings);
                return (
                  <tr key={m.id} onClick={() => toggleMember(m.id)} className={`cursor-pointer transition-colors ${isSelected ? 'bg-pink-50/50' : 'hover:bg-slate-50/50'}`}>
                    <td className="px-6 py-4 text-center">
                      <div className={`mx-auto w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-pink-600 border-pink-600 text-white shadow-sm' : 'border-slate-300 bg-white'}`}>
                        {isSelected && <CheckCircle2 size={16} />}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{m.name}</div>
                      <div className="text-[10px] text-slate-400 font-black tracking-widest uppercase">ID: #{m.id}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-600">৳ {m.totalSavings.toLocaleString()}</td>
                    <td className="px-6 py-4 font-black text-pink-600">৳ {p.toLocaleString()}</td>
                  </tr>
                );
              })}
              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">কোনো সদস্য পাওয়া যায়নি।</td>
                </tr>
              )}
            </tbody>
          </table>
      </div>
    </div>
  );
};

export default ProfitDistribution;
