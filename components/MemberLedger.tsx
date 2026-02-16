
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Printer, 
  User, 
  BookOpen, 
  Search,
  ChevronRight,
  History,
  Info
} from 'lucide-react';
import { db } from '../db';
import { Member, Transaction } from '../types';

interface MemberLedgerProps {
  onBack: () => void;
}

const MemberLedger: React.FC<MemberLedgerProps> = ({ onBack }) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  /* Fix: Correctly store members and txs in state and fetch in useEffect */
  const [members, setMembers] = useState<Member[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [membersData, txsData] = await Promise.all([
        db.getMembers(),
        db.getTransactions()
      ]);
      setMembers(membersData);
      setAllTransactions(txsData);
    };
    fetchData();
  }, []);

  const selectedMember = members.find(m => m.id === selectedMemberId);

  const { openingSavings, openingLoan, ledgerRows, columnTotals } = useMemo(() => {
    if (!selectedMemberId) return { openingSavings: 0, openingLoan: 0, ledgerRows: [], columnTotals: null };
    
    const targetYear = selectedYear;
    const memberTxs = allTransactions
      .filter(t => t.memberId === selectedMemberId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let runningSavings = 0;
    let runningLoan = 0;
    
    // Calculate Opening Balances (Transactions before target year)
    memberTxs.forEach(t => {
      const entryYear = t.date.split('-')[0];
      if (entryYear < targetYear) {
        if (t.type === 'savings') runningSavings += t.amount;
        if (t.type === 'savings_withdrawal') runningSavings -= t.amount;
        
        // Loan logic: distribution adds 110% of amount (Principal + 10% Profit)
        if (t.type === 'loan_distribution') {
          runningLoan += (t.amount + (t.amount * 0.10));
        }
        if (t.type === 'loan_collection') {
          runningLoan -= t.amount;
        }
      }
    });

    const startSavings = runningSavings;
    const startLoan = runningLoan;

    // Filter current year transactions and calculate running balance for rows
    const currentYearTxs = memberTxs.filter(t => t.date.startsWith(targetYear));
    
    const rows = currentYearTxs.map(t => {
      const row = {
        date: t.date,
        savingsCollection: 0,
        savingsWithdrawal: 0,
        savingsPenalty: 0,
        savingsBalance: runningSavings,
        loanDistribution: 0,
        loanCollection: 0,
        loanPenalty: 0,
        loanBalance: runningLoan,
        remarks: t.remarks || ''
      };

      if (t.type === 'savings') {
        row.savingsCollection = t.amount;
        runningSavings += t.amount;
      } else if (t.type === 'savings_withdrawal') {
        row.savingsWithdrawal = t.amount;
        runningSavings -= t.amount;
      } else if (t.type === 'savings_penalty') {
        row.savingsPenalty = t.amount;
      } else if (t.type === 'loan_distribution') {
        row.loanDistribution = t.amount;
        // The balance increases by (Amount + 10% Profit)
        runningLoan += (t.amount + (t.amount * 0.10));
      } else if (t.type === 'loan_collection') {
        row.loanCollection = t.amount;
        // Payment is subtracted directly from the marked-up balance
        runningLoan -= t.amount;
      } else if (t.type === 'loan_penalty') {
        row.loanPenalty = t.amount;
      }

      row.savingsBalance = runningSavings;
      row.loanBalance = runningLoan;
      
      return row;
    });

    const totals = rows.reduce((acc, row) => ({
      savingsCollection: acc.savingsCollection + row.savingsCollection,
      savingsWithdrawal: acc.savingsWithdrawal + row.savingsWithdrawal,
      savingsPenalty: acc.savingsPenalty + row.savingsPenalty,
      loanDistribution: acc.loanDistribution + row.loanDistribution,
      loanCollection: acc.loanCollection + row.loanCollection,
      loanPenalty: acc.loanPenalty + row.loanPenalty,
    }), {
      savingsCollection: 0,
      savingsWithdrawal: 0,
      savingsPenalty: 0,
      loanDistribution: 0,
      loanCollection: 0,
      loanPenalty: 0,
    });

    return { openingSavings: startSavings, openingLoan: startLoan, ledgerRows: rows, columnTotals: totals };
  }, [selectedMemberId, selectedYear, allTransactions]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 print:pb-0">
      {/* Control Panel (Hidden on Print) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <BookOpen className="text-emerald-600" size={28} /> সদস্য ব্যক্তিগত লেজার
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">সদস্য নির্বাচন</label>
            <div className="relative">
               <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
               <select 
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-emerald-500 outline-none font-bold appearance-none cursor-pointer"
              >
                <option value="">সদস্য আইডি বা নাম বেছে নিন</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.id} - {m.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">অর্থ বছর</label>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-emerald-500 outline-none font-bold cursor-pointer"
            >
              {["2024", "2025", "2026", "2027"].map(y => (
                <option key={y} value={y}>{y} ইং</option>
              ))}
            </select>
          </div>

          <button onClick={() => window.print()} className="bg-slate-900 text-white py-3 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-slate-800 shadow-lg transition-all active:scale-95">
            <Printer size={20} /> লেজার প্রিন্ট / PDF
          </button>
        </div>
      </div>

      {selectedMember ? (
        <div className="bg-white p-4 md:p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 print:shadow-none print:border-none print:p-0">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-slate-900 mb-1">চলো পাল্টায় যুব কল্যাণ সমিতি</h1>
            <p className="text-slate-500 font-bold flex items-center justify-center gap-2">
              সদস্য ব্যক্তিগত লেজার বহী <ChevronRight size={14} /> বছর: {selectedYear}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 bg-slate-50 p-6 rounded-3xl border border-slate-100">
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">সদস্যের নাম</p>
              <p className="font-black text-slate-800 text-lg leading-tight">{selectedMember.name}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">সদস্য আইডি</p>
              <p className="font-black text-emerald-600 text-lg">#{selectedMember.id}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">পিতার নাম</p>
              <p className="font-bold text-slate-700">{selectedMember.fatherName}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">মোবাইল</p>
              <p className="font-bold text-slate-700">{selectedMember.phone}</p>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-300 rounded-xl shadow-sm">
            <table className="w-full text-[11px] border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border-b border-r border-slate-300 py-3 text-slate-600 font-black" colSpan={5}>সঞ্চয় অংশ (Savings Section)</th>
                  <th className="border-b border-r border-slate-300 py-3 text-slate-600 font-black" colSpan={5}>বিনিয়োগ / ঋণ অংশ (Investment Section)</th>
                  <th className="border-b border-slate-300" colSpan={2}>অন্যান্য</th>
                </tr>
                <tr className="bg-slate-50 text-slate-500 font-black border-b border-slate-300">
                  <th className="border-r border-slate-300 p-2 w-20">তারিখ</th>
                  <th className="border-r border-slate-300 p-2">সঞ্চয় আদায়</th>
                  <th className="border-r border-slate-300 p-2">সঞ্চয় উত্তোলন</th>
                  <th className="border-r border-slate-300 p-2">সঞ্চয় জরিমানা</th>
                  <th className="border-r border-slate-300 p-2 bg-emerald-100/50 text-emerald-800">সঞ্চয় স্থিতি</th>
                  
                  <th className="border-r border-slate-300 p-2 w-20">তারিখ</th>
                  <th className="border-r border-slate-300 p-2">বিনিয়োগ (ঋণ)</th>
                  <th className="border-r border-slate-300 p-2">বিনিয়োগ আদায়</th>
                  <th className="border-r border-slate-300 p-2">বিনিয়োগ জরিমানা</th>
                  <th className="border-r border-slate-300 p-2 bg-indigo-100/50 text-indigo-800">বিনিয়োগ স্থিতি</th>
                  
                  <th className="border-r border-slate-300 p-2">মন্তব্য</th>
                  <th className="p-2">স্বাক্ষর</th>
                </tr>
              </thead>
              <tbody className="text-center font-bold text-slate-700 divide-y divide-slate-200">
                <tr className="bg-amber-50/20 italic text-slate-400">
                  <td className="border-r border-slate-200 p-2">01-01-{selectedYear}</td>
                  <td colSpan={3} className="border-r border-slate-200 p-2 text-right pr-4 font-black">বিগত বছরের স্থিতি (B/F):</td>
                  <td className="border-r border-slate-200 p-2 font-black text-emerald-700 bg-emerald-50/40">৳ {openingSavings.toLocaleString()}</td>
                  <td className="border-r border-slate-200 p-2">01-01-{selectedYear}</td>
                  <td colSpan={3} className="border-r border-slate-200 p-2 text-right pr-4 font-black italic">বিগত বছরের ঋণ স্থিতি (আসল + ১০% মুনাফা):</td>
                  <td className="border-r border-slate-200 p-2 font-black text-indigo-700 bg-indigo-50/40">৳ {openingLoan.toLocaleString()}</td>
                  <td className="border-r border-slate-200 p-2"></td>
                  <td></td>
                </tr>

                {ledgerRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="border-r border-slate-200 p-2 text-slate-400 font-medium">{row.date}</td>
                    <td className="border-r border-slate-200 p-2 text-emerald-600">{row.savingsCollection > 0 ? `৳ ${row.savingsCollection.toLocaleString()}` : '—'}</td>
                    <td className="border-r border-slate-200 p-2 text-rose-500">{row.savingsWithdrawal > 0 ? `৳ ${row.savingsWithdrawal.toLocaleString()}` : '—'}</td>
                    <td className="border-r border-slate-200 p-2 text-amber-600">{row.savingsPenalty > 0 ? `৳ ${row.savingsPenalty.toLocaleString()}` : '—'}</td>
                    <td className="border-r border-slate-200 p-2 font-black text-slate-900 bg-emerald-50/20">৳ {row.savingsBalance.toLocaleString()}</td>
                    
                    <td className="border-r border-slate-200 p-2 text-slate-400 font-medium">{row.date}</td>
                    <td className="border-r border-slate-200 p-2 text-indigo-600">{row.loanDistribution > 0 ? `৳ ${row.loanDistribution.toLocaleString()}` : '—'}</td>
                    <td className="border-r border-slate-200 p-2 text-emerald-600">{row.loanCollection > 0 ? `৳ ${row.loanCollection.toLocaleString()}` : '—'}</td>
                    <td className="border-r border-slate-200 p-2 text-amber-600">{row.loanPenalty > 0 ? `৳ ${row.loanPenalty.toLocaleString()}` : '—'}</td>
                    <td className="border-r border-slate-200 p-2 font-black text-slate-900 bg-indigo-50/20">৳ {row.loanBalance.toLocaleString()}</td>
                    
                    <td className="border-r border-slate-200 p-2 text-[9px] text-slate-400 max-w-[80px] truncate">{row.remarks}</td>
                    <td className="p-2"></td>
                  </tr>
                ))}

                {ledgerRows.length < 12 && Array.from({ length: 12 - ledgerRows.length }).map((_, i) => (
                  <tr key={`empty-${i}`} className="h-9">
                    <td className="border-r border-slate-200"></td>
                    <td className="border-r border-slate-200"></td>
                    <td className="border-r border-slate-200"></td>
                    <td className="border-r border-slate-200"></td>
                    <td className="border-r border-slate-200"></td>
                    <td className="border-r border-slate-200"></td>
                    <td className="border-r border-slate-200"></td>
                    <td className="border-r border-slate-200"></td>
                    <td className="border-r border-slate-200"></td>
                    <td className="border-r border-slate-200"></td>
                    <td className="border-r border-slate-200"></td>
                    <td></td>
                  </tr>
                ))}

                {/* Total Row */}
                {columnTotals && (
                  <tr className="font-black text-slate-900 border-t-2 border-slate-300 bg-white">
                    <td className="border-r border-slate-200 p-2 text-right">সর্বমোট:</td>
                    <td className="border-r border-slate-200 p-2">৳ {columnTotals.savingsCollection.toLocaleString()}</td>
                    <td className="border-r border-slate-200 p-2">৳ {columnTotals.savingsWithdrawal.toLocaleString()}</td>
                    <td className="border-r border-slate-200 p-2">৳ {columnTotals.savingsPenalty.toLocaleString()}</td>
                    <td className="border-r border-slate-200 p-2"></td>
                    
                    <td className="border-r border-slate-200 p-2 text-right">সর্বমোট:</td>
                    <td className="border-r border-slate-200 p-2">৳ {columnTotals.loanDistribution.toLocaleString()}</td>
                    <td className="border-r border-slate-200 p-2">৳ {columnTotals.loanCollection.toLocaleString()}</td>
                    <td className="border-r border-slate-200 p-2">৳ {columnTotals.loanPenalty.toLocaleString()}</td>
                    <td className="border-r border-slate-200 p-2"></td>
                    
                    <td className="border-r border-slate-200 p-2"></td>
                    <td></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-20 flex justify-between items-end px-10">
             <div className="text-center group">
                <div className="mb-2 hidden print:block text-slate-300">................................................</div>
                <p className="border-t border-slate-300 pt-1 px-8 text-[11px] font-black text-slate-700 uppercase">ক্যাশিয়ার</p>
             </div>
             <div className="text-center group">
                <div className="mb-2 hidden print:block text-slate-300">................................................</div>
                <p className="border-t border-slate-300 pt-1 px-8 text-[11px] font-black text-slate-700 uppercase">সাধারণ সম্পাদক</p>
             </div>
             <div className="text-center group">
                <div className="mb-2 hidden print:block text-slate-300">................................................</div>
                <p className="border-t border-slate-300 pt-1 px-8 text-[11px] font-black text-slate-700 uppercase">সভাপতি</p>
             </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-24 rounded-[3rem] border-4 border-dashed border-slate-100 text-center space-y-6">
          <div className="w-24 h-24 bg-emerald-50 text-emerald-300 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
            <History size={48} />
          </div>
          <div className="max-w-xs mx-auto">
            <h3 className="text-xl font-black text-slate-800 mb-2">সদস্য নির্বাচন করুন</h3>
            <p className="text-slate-400 text-sm font-bold">ব্যক্তিগত লেজার বহী দেখতে উপরের তালিকা থেকে একজন সদস্য নির্বাচন করুন</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberLedger;
