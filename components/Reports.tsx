
import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  Printer, 
  PieChart as PieIcon, 
  Coins, 
  Briefcase, 
  ChevronLeft, 
  TableProperties, 
  BarChart3,
  ClipboardList,
  FileSpreadsheet,
  Wallet,
  Building2,
  TrendingUp,
  FileText,
  History,
  HandIcon,
  Download
} from 'lucide-react';
import { db } from '../db';
import { Member, Transaction } from '../types';

interface ReportsProps {
  onBack: () => void;
}

type ReportView = 'selection' | 'overview' | 'monthly_sheet' | 'individual_member' | 'yearly_sheet';

const Reports: React.FC<ReportsProps> = ({ onBack }) => {
  const [activeReport, setActiveReport] = useState<ReportView>('selection');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  /* Fix: Correctly store members and txs in state and fetch in useEffect */
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
        console.error("Reports fetchData failed", err);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, []);

  // Helper function to export CSV with Excel compatibility (UTF-8 BOM)
  const downloadCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).map(val => `"${val}"`).join(','));
    
    // Using \uFEFF (UTF-8 BOM) ensures Excel opens Bengali characters correctly
    const csvContent = "\uFEFF" + headers + "\n" + rows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper to format Bengali Month/Year
  const formatBengaliTitle = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const monthNamesBn: {[key: string]: string} = {
      '01': 'জানুয়ারি', '02': 'ফেব্রুয়ারি', '03': 'মার্চ', '04': 'এপ্রিল', '05': 'মে', '06': 'জুন',
      '07': 'জুলাই', '08': 'আগস্ট', '09': 'সেপ্টেম্বর', '10': 'অক্টোবর', '11': 'নভেম্বর', '12': 'ডিসেম্বর'
    };
    const yearBn = year.replace(/\d/g, (d: string) => "০১২৩৪৫৬৭৮৯"[parseInt(d)]);
    return `${monthNamesBn[month]}/ ${yearBn}`;
  };

  // --- DYNAMIC CALCULATION FOR SUMMARY ---
  const summaryMetrics = useMemo(() => {
    const totalSavings = txs.filter(t => t.type === 'savings').reduce((sum, t) => sum + t.amount, 0);
    const totalSavingsWithdrawal = txs.filter(t => t.type === 'savings_withdrawal').reduce((sum, t) => sum + t.amount, 0);
    const currentLoan = members.reduce((sum, m) => sum + m.totalLoan, 0);
    
    const totalInvestmentDist = txs.filter(t => t.type === 'loan_distribution').reduce((sum, t) => sum + t.amount, 0);
    const totalLoanCollection = txs.filter(t => t.type === 'loan_collection').reduce((sum, t) => sum + t.amount, 0);

    const admissionFees = txs.filter(t => t.type === 'admission_fee').reduce((s, t) => s + t.amount, 0);
    const formFees = txs.filter(t => t.type === 'form_fee').reduce((s, t) => s + t.amount, 0);
    const penalties = txs.filter(t => t.type === 'savings_penalty' || t.type === 'loan_penalty').reduce((s, t) => s + t.amount, 0);
    const interestIncome = txs.filter(t => t.type === 'loan_collection').reduce((s, t) => s + (t.amount * 0.0909), 0);
    
    const totalProfitIncome = Math.round(admissionFees + formFees + penalties + interestIncome);
    const totalExpenses = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const netProfit = totalProfitIncome - totalExpenses;

    const bankDeposit = txs.filter(t => t.type === 'bank_deposit').reduce((s, t) => s + t.amount, 0);
    const bankWithdrawal = txs.filter(t => t.type === 'bank_withdrawal').reduce((s, t) => s + t.amount, 0);
    const netBankBalance = bankDeposit - bankWithdrawal;

    const totalInflow = totalSavings + totalProfitIncome + bankWithdrawal + totalLoanCollection;
    const totalOutflow = totalSavingsWithdrawal + totalInvestmentDist + totalExpenses + bankDeposit;
    const cashInHand = totalInflow - totalOutflow;

    const netCapital = (totalSavings - totalSavingsWithdrawal) + netProfit;

    return {
      totalSavings,
      totalSavingsWithdrawal,
      totalInvestmentDist,
      totalLoanCollection,
      currentLoan,
      bankBalance: netBankBalance,
      totalProfitIncome,
      totalExpenses,
      netProfit,
      cashInHand: Math.max(0, cashInHand),
      netCapital
    };
  }, [members, txs]);

  // --- CHART DATA GENERATION ---
  const pieData = [
    { name: 'সঞ্চয় তহবিল', value: summaryMetrics.totalSavings - summaryMetrics.totalSavingsWithdrawal },
    { name: 'চলমান ঋণ', value: summaryMetrics.currentLoan },
    { name: 'মুনাফা', value: summaryMetrics.netProfit },
  ];

  const chartData = useMemo(() => {
    const last4Months = [];
    for (let i = 3; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mKey = d.toISOString().slice(0, 7);
      const mName = d.toLocaleDateString('bn-BD', { month: 'long' });
      const mSavings = txs.filter(t => t.date.startsWith(mKey) && t.type === 'savings').reduce((s, t) => s + t.amount, 0);
      const mLoan = txs.filter(t => t.date.startsWith(mKey) && t.type === 'loan_collection').reduce((s, t) => s + t.amount, 0);
      last4Months.push({ name: mName, সঞ্চয়: mSavings, ঋণ: mLoan });
    }
    return last4Months;
  }, [txs]);

  const COLORS = ['#10b981', '#6366f1', '#f59e0b'];

  const FinancialOverview = () => (
    <div className="space-y-8 animate-in fade-in duration-500 pb-16">
      <div className="flex items-center justify-between mb-4 print:hidden">
        <h2 className="text-2xl font-bold text-slate-800">আর্থিক সংক্ষিপ্ত বিবরণী</h2>
        <div className="flex gap-2">
           <button onClick={() => downloadCSV([summaryMetrics], 'financial_summary')} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold hover:bg-slate-200">
             <Download size={18} /> এক্সেল
           </button>
           <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-bold shadow-lg">
             <Printer size={18} /> প্রিন্ট
           </button>
           <button onClick={() => setActiveReport('selection')} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg font-bold">
             <ChevronLeft size={20} /> মেনু
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><BarChart3 size={18} className="text-emerald-500"/> মাসিক সঞ্চয় বনাম ঋণ আদায়</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="সঞ্চয়" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ঋণ" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><PieIcon size={18} className="text-indigo-500"/> তহবিল বিভাজন (Fund Distribution)</h3>
          <div className="h-80 flex flex-col items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-2 text-indigo-700 font-bold border-b border-indigo-100 pb-2">
          <Wallet size={20} /> সর্বমোট তহবিল ও স্থিতি (Financial Summary)
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-100">
            <div className="flex items-center gap-2 text-emerald-600 mb-2 font-black text-[10px] uppercase"><Coins size={14} />সদস্য সঞ্চয়</div>
            <p className="text-xl font-black text-slate-800">৳ {summaryMetrics.totalSavings.toLocaleString()}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-amber-100">
            <div className="flex items-center gap-2 text-amber-600 mb-2 font-black text-[10px] uppercase"><TrendingUp size={14} />মোট মুনাফা</div>
            <p className="text-xl font-black text-slate-800">৳ {summaryMetrics.totalProfitIncome.toLocaleString()}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-indigo-100">
            <div className="flex items-center gap-2 text-indigo-600 mb-2 font-black text-[10px] uppercase"><Briefcase size={14} />বর্তমান ঋণ</div>
            <p className="text-xl font-black text-slate-800">৳ {summaryMetrics.currentLoan.toLocaleString()}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-blue-100">
            <div className="flex items-center gap-2 text-blue-600 mb-2 font-black text-[10px] uppercase"><HandIcon size={14} />হাতে নগদ</div>
            <p className="text-xl font-black text-slate-800">৳ {summaryMetrics.cashInHand.toLocaleString()}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 text-slate-600 mb-2 font-black text-[10px] uppercase"><Building2 size={14} />ব্যাংক স্থিতি</div>
            <p className="text-xl font-black text-slate-800">৳ {summaryMetrics.bankBalance.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const ReportSelection = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800">রিপোর্ট কেন্দ্র</h2>
          <p className="text-slate-500 font-bold">সমিতির আর্থিক তথ্যাদি এবং বার্ষিক পরিসংখ্যান</p>
        </div>
        <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-slate-800 transition-all">
          <Printer size={18} /> পূর্ণাঙ্গ ড্যাশবোর্ড প্রিন্ট
        </button>
      </div>

      <FinancialOverview />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
        <button onClick={() => setActiveReport('individual_member')} className="group bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all text-left flex items-center gap-6">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
            <ClipboardList size={32} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800">মাসিক আদায় রিপোর্ট</h3>
            <p className="text-slate-500 text-sm font-bold">সদস্যদের আদায় তালিকার শিট</p>
          </div>
        </button>

        <button onClick={() => setActiveReport('monthly_sheet')} className="group bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all text-left flex items-center gap-6">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <TableProperties size={32} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800">মাসিক ক্যাশ শীট</h3>
            <p className="text-slate-500 text-sm font-bold">আয়-ব্যয় ও ক্যাশ রিপোর্ট</p>
          </div>
        </button>

        <button onClick={() => setActiveReport('yearly_sheet')} className="group bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all text-left flex items-center gap-6">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <FileSpreadsheet size={32} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800">বার্ষিক রিপোর্ট শীট</h3>
            <p className="text-slate-500 text-sm font-bold">পুরো বছরের ব্যালেন্স শীট</p>
          </div>
        </button>
      </div>
    </div>
  );

  const MonthlyCollectionSheet = () => {
    const data = members.map((m, idx) => {
      const monthTxs = txs.filter(t => t.memberId === m.id && t.date.startsWith(selectedMonth));
      
      const sTx = monthTxs.find(t => t.type === 'savings');
      const sDate = sTx ? sTx.date : '';
      const sAmt = monthTxs.filter(t => t.type === 'savings').reduce((s, t) => s + t.amount, 0);
      const sFine = monthTxs.filter(t => t.type === 'savings_penalty').reduce((s, t) => s + t.amount, 0);

      const lTx = monthTxs.find(t => t.type === 'loan_collection');
      const lDate = lTx ? lTx.date : '';
      const lAmt = monthTxs.filter(t => t.type === 'loan_collection').reduce((s, t) => s + t.amount, 0);
      const lFine = monthTxs.filter(t => t.type === 'loan_penalty').reduce((s, t) => s + t.amount, 0);
      
      // Calculate split for Loan Collection: 90.9% Principal, 9.1% Profit
      const lPrincipal = Math.round(lAmt * 0.909);
      const lProfit = lAmt - lPrincipal;

      const admissionFee = monthTxs.filter(t => t.type === 'admission_fee').reduce((s, t) => s + t.amount, 0);
      const loanFormFee = monthTxs.filter(t => t.type === 'form_fee').reduce((s, t) => s + t.amount, 0);
      const totalForm = admissionFee + loanFormFee;

      const loanDistTx = monthTxs.find(t => t.type === 'loan_distribution');
      const ldDate = loanDistTx ? loanDistTx.date : '';
      const ldAmt = loanDistTx ? loanDistTx.amount : 0;

      return { sl: idx+1, id: m.id, name: m.name, sDate, sAmt, sFine, lDate, lPrincipal, lProfit, lAmt, lFine, totalForm, ldDate, ldAmt };
    });

    // Calculate Column Totals
    const totals = data.reduce((acc, r) => {
      acc.sAmt += r.sAmt;
      acc.sFine += r.sFine;
      acc.lPrincipal += r.lPrincipal;
      acc.lProfit += r.lProfit;
      acc.lAmt += r.lAmt;
      acc.lFine += r.lFine;
      acc.totalForm += r.totalForm;
      acc.ldAmt += r.ldAmt;
      return acc;
    }, { sAmt: 0, sFine: 0, lPrincipal: 0, lProfit: 0, lAmt: 0, lFine: 0, totalForm: 0, ldAmt: 0 });

    return (
      <div className="animate-in slide-in-from-bottom-4 duration-500 pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 print:hidden">
          <button onClick={() => setActiveReport('selection')} className="flex items-center gap-2 p-2 bg-slate-100 rounded-lg font-bold hover:bg-slate-200"><ChevronLeft /> ফিরে যান</button>
          <div className="flex gap-2">
            <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="px-4 py-2 border rounded-xl font-bold outline-none" />
            <button onClick={() => downloadCSV(data, `collection_${selectedMonth}`)} className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl font-bold flex items-center gap-2">
              <Download size={18} /> এক্সেল
            </button>
            <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2">
              <Printer size={18} /> প্রিন্ট করুন
            </button>
          </div>
        </div>
        <div className="bg-white p-10 rounded-3xl shadow-xl border border-slate-100 print:shadow-none print:border-none print:p-0 overflow-x-auto">
          <div className="text-center mb-8"><h1 className="text-3xl font-black">চলো পাল্টায় যুব কল্যাণ সমিতি</h1><p className="font-bold text-slate-600 text-lg">মাসিক আদায় তালিকা - {formatBengaliTitle(selectedMonth)}</p></div>
          <table className="w-full text-[10px] border-collapse border border-slate-300">
            <thead className="bg-slate-50 font-black text-center">
              <tr>
                <th className="border border-slate-300 p-3">ক্রমিক</th>
                <th className="border border-slate-300 p-3 text-left">সদস্যের নাম</th>
                <th className="border border-slate-300 p-3" colSpan={3}>সঞ্চয়</th>
                <th className="border border-slate-300 p-3" colSpan={5}>ঋণ আদায়</th>
                <th className="border border-slate-300 p-3">ফর্ম</th>
                <th className="border border-slate-300 p-3" colSpan={2}>ঋণ বিতরণ</th>
                <th className="border border-slate-300 p-3">মন্তব্য</th>
              </tr>
              <tr>
                <th></th><th></th>
                <th className="border p-2">তারিখ</th><th className="border p-2">পরিমাণ</th><th className="border p-2">জরিমানা</th>
                <th className="border p-2">তারিখ</th><th className="border p-2">ঋণ আসল</th><th className="border p-2">মুনাফা</th><th className="border p-2">মোট</th><th className="border p-2">জরিমানা</th>
                <th className="border p-2">আয়</th>
                <th className="border p-2">তারিখ</th><th className="border p-2">পরিমাণ</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="text-center font-bold">
              {data.map(r => (
                <tr key={r.id} className="border-b hover:bg-slate-50 transition-colors">
                  <td className="border p-3">{r.sl}</td>
                  <td className="border p-3 text-left font-black">{r.name}</td>
                  <td className="border p-3 text-[8px] whitespace-nowrap">{r.sDate || '-'}</td>
                  <td className="border p-3">৳{r.sAmt.toLocaleString()}</td>
                  <td className="border p-3 text-rose-500">{r.sFine > 0 ? `৳${r.sFine}` : '-'}</td>
                  <td className="border p-3 text-[8px] whitespace-nowrap">{r.lDate || '-'}</td>
                  <td className="border p-3">৳{r.lPrincipal.toLocaleString()}</td>
                  <td className="border p-3">৳{r.lProfit.toLocaleString()}</td>
                  <td className="border p-3">৳{r.lAmt.toLocaleString()}</td>
                  <td className="border p-3 text-rose-500">{r.lFine > 0 ? `৳${r.lFine}` : '-'}</td>
                  <td className="border p-3 text-emerald-600">{r.totalForm > 0 ? `৳${r.totalForm.toLocaleString()}` : '-'}</td>
                  <td className="border p-3 text-[9px]">{r.ldDate || '-'}</td>
                  <td className="border p-3 text-indigo-600">{r.ldAmt > 0 ? `৳${r.ldAmt.toLocaleString()}` : '-'}</td>
                  <td className="border p-3"></td>
                </tr>
              ))}
              <tr className="bg-white text-black font-black text-[11px]">
                <td className="border p-3" colSpan={2}>সর্বমোট (TOTAL)</td>
                <td className="border p-3"></td>
                <td className="border p-3">৳{totals.sAmt.toLocaleString()}</td>
                <td className="border p-3">৳{totals.sFine.toLocaleString()}</td>
                <td className="border p-3"></td>
                <td className="border p-3">৳{totals.lPrincipal.toLocaleString()}</td>
                <td className="border p-3">৳{totals.lProfit.toLocaleString()}</td>
                <td className="border p-3">৳{totals.lAmt.toLocaleString()}</td>
                <td className="border p-3">৳{totals.lFine.toLocaleString()}</td>
                <td className="border p-3">৳{totals.totalForm.toLocaleString()}</td>
                <td className="border p-3"></td>
                <td className="border p-3">৳{totals.ldAmt.toLocaleString()}</td>
                <td className="border p-3"></td>
              </tr>
            </tbody>
          </table>
          <div className="mt-20 hidden print:flex justify-between px-10">
             <div className="text-center w-32 border-t border-slate-900 pt-1 font-black text-[10px]">ক্যাশিয়ার</div>
             <div className="text-center w-32 border-t border-slate-900 pt-1 font-black text-[10px]">সম্পাদক</div>
             <div className="text-center w-32 border-t border-slate-900 pt-1 font-black text-[10px]">সভাপতি</div>
          </div>
        </div>
      </div>
    );
  };

  const MonthlyReportSheet = () => {
    // --- CALCULATION LOGIC FOR CASH SHEET ---
    const reportData = useMemo(() => {
      const currentM = selectedMonth;
      const [year, month] = currentM.split('-').map(Number);
      const prevDate = new Date(year, month - 2, 1);
      const prevM = prevDate.toISOString().slice(0, 7);

      const getMonthlyInflow = (mStr: string) => {
        const mSub = txs.filter(t => t.date.startsWith(mStr));
        const savings = mSub.filter(t => t.type === 'savings').reduce((s, t) => s + t.amount, 0);
        const loans = mSub.filter(t => t.type === 'loan_collection').reduce((s, t) => s + t.amount, 0);
        const bankW = mSub.filter(t => t.type === 'bank_withdrawal').reduce((s, t) => s + t.amount, 0);
        
        // Income = Fees + Penalties + Interest portion
        const income = mSub.filter(t => t.type === 'admission_fee' || t.type === 'form_fee' || t.type === 'savings_penalty' || t.type === 'loan_penalty').reduce((s, t) => s + t.amount, 0);
        const interest = mSub.filter(t => t.type === 'loan_collection').reduce((s, t) => s + (t.amount * 0.0909), 0);
        
        return { savings, loans, bankW, netIncome: Math.round(income + interest) };
      };

      const getMonthlyOutflow = (mStr: string) => {
        const mSub = txs.filter(t => t.date.startsWith(mStr));
        const invest = mSub.filter(t => t.type === 'loan_distribution').reduce((s, t) => s + t.amount, 0);
        const bankD = mSub.filter(t => t.type === 'bank_deposit').reduce((s, t) => s + t.amount, 0);
        const expense = mSub.filter(t => t.type === 'expense' || t.type === 'savings_withdrawal').reduce((s, t) => s + t.amount, 0);
        return { invest, bankD, expense };
      };

      // Cumulative Cash Balance until PREVIOUS month
      const allTxsBefore = txs.filter(t => t.date < currentM + '-01');
      const cumIn = allTxsBefore.filter(t => ['savings','loan_collection','bank_withdrawal','admission_fee','form_fee','savings_penalty','loan_penalty'].includes(t.type)).reduce((s, t) => s + t.amount, 0);
      const cumOut = allTxsBefore.filter(t => ['loan_distribution','bank_deposit','expense','savings_withdrawal'].includes(t.type)).reduce((s, t) => s + t.amount, 0);
      const openingBalance = cumIn - cumOut;

      const currentIn = getMonthlyInflow(currentM);
      const currentOut = getMonthlyOutflow(currentM);
      const closingBalance = openingBalance + currentIn.savings + currentIn.loans + currentIn.netIncome + currentIn.bankW - currentOut.invest - currentOut.expense - currentOut.bankD;

      // Investment Logic
      const allInvestBefore = allTxsBefore.filter(t => t.type === 'loan_distribution').reduce((s, t) => s + t.amount, 0);
      const allCollectBefore = allTxsBefore.filter(t => t.type === 'loan_collection').reduce((s, t) => s + (t.amount * 0.909), 0);
      const openingInvestment = Math.round(allInvestBefore - allCollectBefore);
      const monthlyInvestCollect = Math.round(currentIn.loans * 0.909);
      const closingInvestment = openingInvestment - monthlyInvestCollect + currentOut.invest;

      return {
        openingBalance,
        currentIn,
        currentOut,
        closingBalance,
        openingInvestment,
        monthlyInvestCollect,
        closingInvestment,
        bankBalance: summaryMetrics.bankBalance // Bank balance is usually current
      };
    }, [selectedMonth, txs, summaryMetrics.bankBalance]);

    return (
      <div className="animate-in slide-in-from-bottom-4 duration-500 pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 print:hidden">
          <button onClick={() => setActiveReport('selection')} className="flex items-center gap-2 p-2 bg-slate-100 rounded-lg font-bold hover:bg-slate-200"><ChevronLeft /> ফিরে যান</button>
          <div className="flex gap-2">
            <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="px-4 py-2 border rounded-xl font-bold outline-none" />
            <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2">
              <Printer size={18} /> প্রিন্ট / PDF
            </button>
          </div>
        </div>
        
        <div className="bg-white p-10 rounded-3xl shadow-xl border border-slate-100 print:shadow-none print:border-none print:p-0 flex flex-col items-center">
          <div className="text-center mb-10 w-full">
            <h1 className="text-3xl font-black">চলো পাল্টায় যুব কল্যাণ সমিতি</h1>
            <p className="font-black text-slate-800 text-xl border-y border-slate-900 inline-block px-10 py-1 mt-2">
              মাসিক ক্যাশ শীট - {formatBengaliTitle(selectedMonth)}
            </p>
          </div>

          <div className="space-y-12 w-full max-w-5xl">
             {/* Section 1: মাসিক হিসাব */}
             <section className="space-y-4">
               <h3 className="font-black text-slate-900 text-lg border-b border-slate-300 pb-1 text-center">মাসিক হিসাব</h3>
               <table className="w-full text-[11px] border-collapse border border-slate-900 text-center font-bold">
                 <thead>
                   <tr>
                     <th className="border border-slate-900 p-2">স্থিতি</th>
                     <th className="border border-slate-900 p-2 text-slate-800">(+) সঞ্চয় আদায়</th>
                     <th className="border border-slate-900 p-2 text-slate-800">(+) ঋণ আদায়</th>
                     <th className="border border-slate-900 p-2 text-slate-800">(+) নীট আয়</th>
                     <th className="border border-slate-900 p-2 text-slate-800">(+) ব্যাংক উত্তোলন</th>
                     <th className="border border-slate-900 p-2 text-slate-800">(-) বিনিয়োগ</th>
                     <th className="border border-slate-900 p-2 text-slate-800">(-) ব্যয়/সঞ্চয় উত্তোলন</th>
                     <th className="border border-slate-900 p-2 text-slate-800">(-) ব্যাংক জমা</th>
                     <th className="border border-slate-900 p-2 font-black">(=) মাসিক স্থিতি</th>
                   </tr>
                 </thead>
                 <tbody>
                   <tr className="text-[13px]">
                     <td className="border border-slate-900 p-4 font-bold">৳ {reportData.openingBalance.toLocaleString()}</td>
                     <td className="border border-slate-900 p-4 font-bold">৳ {reportData.currentIn.savings.toLocaleString()}</td>
                     <td className="border border-slate-900 p-4 font-bold">৳ {reportData.currentIn.loans.toLocaleString()}</td>
                     <td className="border border-slate-900 p-4 font-bold">৳ {reportData.currentIn.netIncome.toLocaleString()}</td>
                     <td className="border border-slate-900 p-4 font-bold">৳ {reportData.currentIn.bankW.toLocaleString()}</td>
                     <td className="border border-slate-900 p-4 font-bold">৳ {reportData.currentOut.invest.toLocaleString()}</td>
                     <td className="border border-slate-900 p-4 font-bold">৳ {reportData.currentOut.expense.toLocaleString()}</td>
                     <td className="border border-slate-900 p-4 font-bold">৳ {reportData.currentOut.bankD.toLocaleString()}</td>
                     <td className="border border-slate-900 p-4 font-black">৳ {reportData.closingBalance.toLocaleString()}</td>
                   </tr>
                 </tbody>
               </table>
             </section>

             {/* Section 2: কিস্তি হিসাব */}
             <section className="space-y-4">
               <h3 className="font-black text-slate-900 text-lg border-b border-slate-300 pb-1 text-center">কিস্তি হিসাব</h3>
               <table className="w-full text-[11px] border-collapse border border-slate-900 text-center font-bold max-w-3xl mx-auto">
                 <thead>
                   <tr>
                     <th className="border border-slate-900 p-2">বর্তমান বিনিয়োগ</th>
                     <th className="border border-slate-900 p-2 text-slate-800">(-) বিনিয়োগ আদায়</th>
                     <th className="border border-slate-900 p-2 text-slate-800">(+) নতুন বিনিয়োগ</th>
                     <th className="border border-slate-900 p-2 font-black">(=) মোট বিনিয়োগ</th>
                   </tr>
                 </thead>
                 <tbody>
                   <tr className="text-[13px]">
                     <td className="border border-slate-900 p-4 font-bold">৳ {reportData.openingInvestment.toLocaleString()}</td>
                     <td className="border border-slate-900 p-4 font-bold">৳ {reportData.monthlyInvestCollect.toLocaleString()}</td>
                     <td className="border border-slate-900 p-4 font-bold">৳ {reportData.currentOut.invest.toLocaleString()}</td>
                     <td className="border border-slate-900 p-4 font-black">৳ {reportData.closingInvestment.toLocaleString()}</td>
                   </tr>
                 </tbody>
               </table>
             </section>

             {/* Section 3: মূলধন হিসাব */}
             <section className="space-y-4">
               <h3 className="font-black text-slate-900 text-lg border-b border-slate-300 pb-1 text-center">মূলধন হিসাব</h3>
               <table className="w-full text-[11px] border-collapse border border-slate-900 text-center font-bold max-w-3xl mx-auto">
                 <thead>
                   <tr>
                     <th className="border border-slate-900 p-2">মাসিক স্থিতি/হাতে নগদ</th>
                     <th className="border border-slate-900 p-2 text-slate-800">(+) ব্যাংক জমা</th>
                     <th className="border border-slate-900 p-2 text-slate-800">(+) বর্তমান বিনিয়োগ</th>
                     <th className="border border-slate-900 p-2 font-black">(=) মোট মূলধন</th>
                   </tr>
                 </thead>
                 <tbody>
                   <tr className="text-[14px]">
                     <td className="border border-slate-900 p-5 font-bold">৳ {reportData.closingBalance.toLocaleString()}</td>
                     <td className="border border-slate-900 p-5 font-bold">৳ {reportData.bankBalance.toLocaleString()}</td>
                     <td className="border border-slate-900 p-5 font-bold">৳ {reportData.closingInvestment.toLocaleString()}</td>
                     <td className="border border-slate-900 p-5 font-black text-lg">৳ {(reportData.closingBalance + reportData.bankBalance + reportData.closingInvestment).toLocaleString()}</td>
                   </tr>
                 </tbody>
               </table>
             </section>
          </div>

          <div className="mt-32 hidden print:flex justify-between px-10 w-full max-w-5xl">
             <div className="text-center w-40 border-t border-slate-900 pt-1 font-black text-[12px]">ক্যাশিয়ার</div>
             <div className="text-center w-40 border-t border-slate-900 pt-1 font-black text-[12px]">সম্পাদক</div>
             <div className="text-center w-40 border-t border-slate-900 pt-1 font-black text-[12px]">সভাপতি</div>
          </div>
        </div>
      </div>
    );
  };

  const YearlyReportSheet = () => {
    return (
      <div className="animate-in slide-in-from-bottom-4 duration-500 pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 print:hidden">
          <button onClick={() => setActiveReport('selection')} className="flex items-center gap-2 p-2 bg-slate-100 rounded-lg font-bold hover:bg-slate-200"><ChevronLeft /> ফিরে যান</button>
          <div className="flex gap-2">
            <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="px-4 py-2 border rounded-xl font-bold outline-none">
              {['2024','2025','2026','2027'].map(y => <option key={y} value={y}>{y} সাল</option>)}
            </select>
            <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2">
              <Printer size={18} /> প্রিন্ট / PDF
            </button>
          </div>
        </div>
        <div className="bg-white p-12 rounded-3xl shadow-xl border border-slate-100 print:shadow-none print:border-none print:p-0 mx-auto max-w-[850px]">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-black mb-1">চলো পাল্টায় যুব কল্যাণ সমিতি</h1>
            <div className="inline-block border-2 border-slate-900 px-12 py-3 rounded-xl font-black text-2xl mt-4">বার্ষিক রিপোর্ট - {selectedYear} সাল</div>
          </div>
          <table className="w-full border-2 border-slate-900 font-bold border-collapse">
            <thead>
              <tr className="bg-slate-50 font-black">
                <th className="border-2 border-slate-900 p-4 text-left text-lg">আর্থিক বিবরণ</th>
                <th className="border-2 border-slate-900 p-4 text-right text-lg">টাকা (৳)</th>
              </tr>
            </thead>
            <tbody className="text-lg">
              <tr><td className="border-2 border-slate-900 p-4">মোট সঞ্চয়</td><td className="border-2 border-slate-900 p-4 text-right">৳ {summaryMetrics.totalSavings.toLocaleString()}</td></tr>
              <tr><td className="border-2 border-slate-900 p-4">মোট বিনিয়োগ</td><td className="border-2 border-slate-900 p-4 text-right">৳ {summaryMetrics.totalInvestmentDist.toLocaleString()}</td></tr>
              <tr><td className="border-2 border-slate-900 p-4">মোট ঋণ আদায়</td><td className="border-2 border-slate-900 p-4 text-right">৳ {summaryMetrics.totalLoanCollection.toLocaleString()}</td></tr>
              <tr><td className="border-2 border-slate-900 p-4 font-black">বর্তমান মোট বিনিয়োগ</td><td className="border-2 border-slate-900 p-4 text-right">৳ {summaryMetrics.currentLoan.toLocaleString()}</td></tr>
              <tr><td className="border-2 border-slate-900 p-4">মোট সঞ্চয় উত্তোলন</td><td className="border-2 border-slate-900 p-4 text-right">৳ {summaryMetrics.totalSavingsWithdrawal.toLocaleString()}</td></tr>
              <tr><td className="border-2 border-slate-900 p-4">ব্যাংক স্থিতি</td><td className="border-2 border-slate-900 p-4 text-right">৳ {summaryMetrics.bankBalance.toLocaleString()}</td></tr>
              <tr><td className="border-2 border-slate-900 p-4">মোট মুনাফা ও আয়</td><td className="border-2 border-slate-900 p-4 text-right">৳ {summaryMetrics.totalProfitIncome.toLocaleString()}</td></tr>
              <tr><td className="border-2 border-slate-900 p-4">মোট ব্যয়</td><td className="border-2 border-slate-900 p-4 text-right">৳ {summaryMetrics.totalExpenses.toLocaleString()}</td></tr>
              <tr><td className="border-2 border-slate-900 p-4 font-black text-emerald-700">নীট মুনাফা</td><td className="border-2 border-slate-900 p-4 text-right font-black">৳ {summaryMetrics.netProfit.toLocaleString()}</td></tr>
              <tr><td className="border-2 border-slate-900 p-4 font-black text-blue-700">হাতে নগদ</td><td className="border-2 border-slate-900 p-4 text-right font-black">৳ {summaryMetrics.cashInHand.toLocaleString()}</td></tr>
              <tr className="bg-slate-900 text-white font-black">
                <td className="border-2 border-slate-900 p-6 text-xl uppercase tracking-widest">সর্বমোট মূলধন</td>
                <td className="border-2 border-slate-900 p-6 text-right text-3xl">৳ {summaryMetrics.netCapital.toLocaleString()}</td>
              </tr>
              <tr><td className="border-2 border-slate-900 p-4">লভ্যাংশের হার</td><td className="border-2 border-slate-900 p-4 text-right"></td></tr>
              <tr><td className="border-2 border-slate-900 p-4">ভবিষ্যৎ ঝুঁকি</td><td className="border-2 border-slate-900 p-4 text-right"></td></tr>
            </tbody>
          </table>
          <div className="mt-32 hidden print:flex justify-between px-10">
             <div className="text-center w-40 border-t border-slate-900 pt-1 font-black">ক্যাশিয়ার</div>
             <div className="text-center w-40 border-t border-slate-900 pt-1 font-black">সম্পাদক</div>
             <div className="text-center w-40 border-t border-slate-900 pt-1 font-black">সভাপতি</div>
          </div>
        </div>
      </div>
    );
  };

  const renderActiveReport = () => {
    switch (activeReport) {
      case 'selection': return <ReportSelection />;
      case 'monthly_sheet': return <MonthlyReportSheet />;
      case 'individual_member': return <MonthlyCollectionSheet />;
      case 'yearly_sheet': return <YearlyReportSheet />;
      default: return <ReportSelection />;
    }
  };

  return <div className="max-w-7xl mx-auto px-4">{renderActiveReport()}</div>;
};

export default Reports;
