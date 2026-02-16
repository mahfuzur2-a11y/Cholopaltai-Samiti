
import React, { useState } from 'react';
import { Printer, Download, Calendar, FileText, PieChart, Coins, Briefcase } from 'lucide-react';

interface MonthlySheetProps {
  onBack: () => void;
}

const MonthlySheet: React.FC<MonthlySheetProps> = ({ onBack }) => {
  const [selectedMonth, setSelectedMonth] = useState('2026-01');

  // Dummy Financial Data (In a real app, this would be fetched based on selectedMonth)
  const financialData = {
    previousBalance: 125400,
    savingsCollection: 52400,
    loanCollection: 35000,
    netIncome: 8500,
    bankWithdrawal: 20000,
    expensesAndWithdrawals: 15200,
    bankDeposit: 40000,
    
    currentInvestment: 185000,
    investmentCollected: 35000,
    newLoanDistribution: 50000,
    
    bankBalance: 245000
  };

  // 1️⃣ মাসিক স্থিতি calculation
  const monthlyBalance = (
    financialData.previousBalance + 
    financialData.savingsCollection + 
    financialData.loanCollection + 
    financialData.netIncome
  ) - (
    financialData.bankWithdrawal + 
    financialData.expensesAndWithdrawals + 
    financialData.bankDeposit
  );

  // 2️⃣ কিস্তি হিসাব calculation
  const totalInvestment = (
    financialData.currentInvestment - 
    financialData.investmentCollected + 
    financialData.newLoanDistribution
  );

  // 3️⃣ মূলধন হিসাব calculation
  const totalCapital = monthlyBalance + financialData.bankBalance + totalInvestment;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="text-emerald-600" /> মাসিক রিপোর্ট শীট
          </h2>
          <p className="text-slate-500">সমিতির মাসিক আয়-ব্যয় এবং মূলধনের বিস্তারিত বিবরণ</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="month" 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <button onClick={handlePrint} className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-md font-bold transition-all active:scale-95">
            <Printer size={18} className="mr-2" /> প্রিন্ট / PDF
          </button>
        </div>
      </div>

      {/* Printable Area Start */}
      <div id="printable-report" className="bg-white p-6 md:p-12 rounded-3xl shadow-sm border border-slate-100 print:shadow-none print:border-none print:p-0">
        
        {/* Header - Only for Print */}
        <div className="hidden print:block text-center mb-10">
          <h1 className="text-3xl font-black text-slate-900 mb-1">চলো পাল্টায় যুব কল্যাণ সমিতি</h1>
          <p className="text-lg text-slate-600 font-bold underline underline-offset-4 decoration-2">মাসিক রিপোর্ট শীট</p>
          <p className="mt-2 font-bold text-slate-800">মাস: {selectedMonth.split('-')[1] === '01' ? 'জানুয়ারি' : 'মাস'} ২০২৬</p>
        </div>

        <div className="grid grid-cols-1 gap-10">
          
          {/* Section 1: মাসিক হিসাব */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-700 font-black border-b-2 border-indigo-100 pb-2 mb-4">
              <PieChart size={20} />
              <span>১️⃣ মাসিক হিসাব (Monthly Summary)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 border text-slate-700 font-bold">পূর্ববর্তী স্থিতি</th>
                    <th className="px-4 py-3 border text-emerald-700 font-bold">সঞ্চয় আদায় (+)</th>
                    <th className="px-4 py-3 border text-emerald-700 font-bold">ঋণ আদায় (+)</th>
                    <th className="px-4 py-3 border text-emerald-700 font-bold">নীট আয় (+)</th>
                    <th className="px-4 py-3 border text-rose-700 font-bold">ব্যাংক উত্তোলন (-)</th>
                    <th className="px-4 py-3 border text-rose-700 font-bold">ব্যয় / সঞ্চয় উত্তোলন (-)</th>
                    <th className="px-4 py-3 border text-rose-700 font-bold">ব্যাংক জমা (-)</th>
                    <th className="px-4 py-3 border bg-indigo-600 text-white font-black">মাসিক স্থিতি (=)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="text-center font-bold text-slate-800">
                    <td className="px-4 py-4 border">৳ {financialData.previousBalance.toLocaleString()}</td>
                    <td className="px-4 py-4 border text-emerald-600">৳ {financialData.savingsCollection.toLocaleString()}</td>
                    <td className="px-4 py-4 border text-emerald-600">৳ {financialData.loanCollection.toLocaleString()}</td>
                    <td className="px-4 py-4 border text-emerald-600">৳ {financialData.netIncome.toLocaleString()}</td>
                    <td className="px-4 py-4 border text-rose-500">৳ {financialData.bankWithdrawal.toLocaleString()}</td>
                    <td className="px-4 py-4 border text-rose-500">৳ {financialData.expensesAndWithdrawals.toLocaleString()}</td>
                    <td className="px-4 py-4 border text-rose-500">৳ {financialData.bankDeposit.toLocaleString()}</td>
                    <td className="px-4 py-4 border bg-indigo-50 text-indigo-800 text-lg">৳ {monthlyBalance.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-slate-400 italic">সূত্র: মাসিক স্থিতি = (পূর্ববর্তী স্থিতি + সঞ্চয় আদায় + ঋণ আদায় + নীট আয়) – (ব্যাংক উত্তোলন + ব্যয় + ব্যাংক জমা)</p>
          </section>

          {/* Section 2: কিস্তি হিসাব */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-amber-700 font-black border-b-2 border-amber-100 pb-2 mb-4">
              <Coins size={20} />
              <span>২️⃣ কিস্তি হিসাব</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm max-w-2xl">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 border text-slate-700 font-bold">বর্তমান বিনিয়োগ</th>
                    <th className="px-4 py-3 border text-rose-700 font-bold">বিনিয়োগ আদায় (-)</th>
                    <th className="px-4 py-3 border text-emerald-700 font-bold">নতুন ঋণ বিতরণ (+)</th>
                    <th className="px-4 py-3 border bg-amber-500 text-white font-black">মোট বিনিয়োগ (=)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="text-center font-bold text-slate-800">
                    <td className="px-4 py-4 border">৳ {financialData.currentInvestment.toLocaleString()}</td>
                    <td className="px-4 py-4 border text-rose-500">৳ {financialData.investmentCollected.toLocaleString()}</td>
                    <td className="px-4 py-4 border text-emerald-600">৳ {financialData.newLoanDistribution.toLocaleString()}</td>
                    <td className="px-4 py-4 border bg-amber-50 text-amber-800 text-lg">৳ {totalInvestment.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-slate-400 italic">সূত্র: মোট বিনিয়োগ = বর্তমান বিনিয়োগ - বিনিয়োগ আদায় + নতুন ঋণ বিতরণ</p>
          </section>

          {/* Section 3: মূলধন হিসাব */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-700 font-black border-b-2 border-emerald-100 pb-2 mb-4">
              <Briefcase size={20} />
              <span>৩️⃣ মূলধন হিসাব</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm max-w-2xl">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 border text-slate-700 font-bold">মাসিক স্থিতি / হাতে নগদ</th>
                    <th className="px-4 py-3 border text-blue-700 font-bold">ব্যাংক জমা</th>
                    <th className="px-4 py-3 border text-amber-700 font-bold">বর্তমান বিনিয়োগ</th>
                    <th className="px-4 py-3 border bg-emerald-600 text-white font-black">মোট মূলধন (=)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="text-center font-bold text-slate-800">
                    <td className="px-4 py-4 border">৳ {monthlyBalance.toLocaleString()}</td>
                    <td className="px-4 py-4 border text-blue-600">৳ {financialData.bankBalance.toLocaleString()}</td>
                    <td className="px-4 py-4 border text-amber-600">৳ {totalInvestment.toLocaleString()}</td>
                    <td className="px-4 py-4 border bg-emerald-50 text-emerald-800 text-xl">৳ {totalCapital.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-slate-400 italic">সূত্র: মোট মূলধন = হাতে নগদ + ব্যাংক জমা + বর্তমান বিনিয়োগ</p>
          </section>
          
          {/* Signatures - Only for Print */}
          <div className="hidden print:flex justify-between mt-24 px-10">
            <div className="text-center">
              <div className="w-40 border-t border-slate-900 pt-1 font-black text-slate-800">ক্যাশিয়ার</div>
            </div>
            <div className="text-center">
              <div className="w-40 border-t border-slate-900 pt-1 font-black text-slate-800">সাধারণ সম্পাদক</div>
            </div>
            <div className="text-center">
              <div className="w-40 border-t border-slate-900 pt-1 font-black text-slate-800">সভাপতি</div>
            </div>
          </div>

        </div>
      </div>
      {/* Printable Area End */}

    </div>
  );
};

export default MonthlySheet;
