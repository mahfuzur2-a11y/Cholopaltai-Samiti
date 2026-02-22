
import React, { useState, useMemo, useEffect } from 'react';
import { Search, Printer, Calendar, Download } from 'lucide-react';
import { db } from '../db';
import { Transaction } from '../types';

interface TransactionListProps {
  type: 'savings' | 'loan';
  onBack: () => void;
}

const TransactionList: React.FC<TransactionListProps> = ({ type, onBack }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  /* Fix: Correctly initialize state and fetch data in useEffect */
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
        console.error("TransactionList fetchTransactions failed", err);
      }
    };
    fetchTransactions();
    return () => { isMounted = false; };
  }, []);

  const monthNames = [
    { en: 'all', bn: 'সকল মাস' },
    { en: '01', bn: 'জানুয়ারি' },
    { en: '02', bn: 'ফেব্রুয়ারি' },
    { en: '03', bn: 'মার্চ' },
    { en: '04', bn: 'এপ্রিল' },
    { en: '05', bn: 'মে' },
    { en: '06', bn: 'জুন' },
    { en: '07', bn: 'জুলাই' },
    { en: '08', bn: 'আগস্ট' },
    { en: '09', bn: 'সেপ্টেম্বর' },
    { en: '10', bn: 'অক্টোবর' },
    { en: '11', bn: 'নভেম্বর' },
    { en: '12', bn: 'ডিসেম্বর' },
  ];

  const filteredData = useMemo(() => {
    if (type === 'savings') {
      return transactions.filter((t) => {
        if (t.type !== 'savings' && t.type !== 'savings_withdrawal') return false;
        const transactionMonth = t.date.split('-')[1];
        const matchesMonth = selectedMonth === 'all' || transactionMonth === selectedMonth;
        const matchesSearch = t.memberName.includes(searchTerm) || t.memberId.includes(searchTerm);
        return matchesMonth && matchesSearch;
      });
    } else {
      // Show ongoing loans or loan collection history
      return transactions.filter((t) => {
        if (t.type !== 'loan_distribution' && t.type !== 'loan_collection') return false;
        const transactionMonth = t.date.split('-')[1];
        const matchesMonth = selectedMonth === 'all' || transactionMonth === selectedMonth;
        const matchesSearch = t.memberName.includes(searchTerm) || t.memberId.includes(searchTerm);
        return matchesMonth && matchesSearch;
      });
    }
  }, [transactions, selectedMonth, searchTerm, type]);

  const totalSummaryAmount = useMemo(() => {
    return filteredData.reduce((acc, curr) => acc + curr.amount, 0);
  }, [filteredData]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-500 print:shadow-none print:border-none">
      <div className="p-6 border-b border-slate-100 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {type === 'savings' ? 'সঞ্চয় আদায় ভিউ' : 'ঋণ আদায় ও বিতরণ ভিউ'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">সমিতির সংরক্ষিত সকল লেনদেনের তালিকা</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => window.print()} className="flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 shadow-sm active:scale-95 transition-all">
              <Printer size={18} className="mr-2" /> প্রিন্ট
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              placeholder="সার্চ করুন..." 
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none font-bold" 
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)} 
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white appearance-none cursor-pointer font-bold"
            >
              {monthNames.map((m) => <option key={m.en} value={m.en}>{m.bn}</option>)}
            </select>
          </div>

          <div className={`px-4 py-2.5 rounded-xl border flex items-center justify-between ${type === 'savings' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'}`}>
            <span className="text-sm font-semibold">মোট পরিমাণ:</span>
            <span className="text-lg font-bold">৳ {totalSummaryAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">আইডি</th>
              <th className="px-6 py-4">তারিখ</th>
              <th className="px-6 py-4">সদস্যের নাম</th>
              <th className="px-6 py-4">ধরণ</th>
              <th className="px-6 py-4 text-right">পরিমাণ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData.map((tx) => (
              <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-slate-400 font-medium">#{tx.memberId}</td>
                <td className="px-6 py-4 text-slate-600 font-bold">{tx.date}</td>
                <td className="px-6 py-4 font-black text-slate-800">{tx.memberName}</td>
                <td className="px-6 py-4 capitalize">
                   <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                     tx.type.includes('withdrawal') || tx.type.includes('expense') ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                   }`}>
                     {tx.type.replace('_', ' ')}
                   </span>
                </td>
                <td className={`px-6 py-4 font-black text-right ${
                  tx.type.includes('withdrawal') || tx.type.includes('expense') ? 'text-rose-600' : 'text-emerald-700'
                }`}>
                  ৳ {tx.amount.toLocaleString()}
                </td>
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-slate-400 italic">কোনো লেনদেন পাওয়া যায়নি।</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionList;
