
import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, User, XCircle, Calculator, FileCheck, AlertTriangle, Info } from 'lucide-react';
import { db } from '../db';
import { Transaction, Member } from '../types';

interface TransactionFormProps {
  type: string;
  label: string;
  onBack: () => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ type, label, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [amount, setAmount] = useState<string>('');
  const [penalty, setPenalty] = useState<string>(''); // Used for both savings and loan penalty
  const [remarks, setRemarks] = useState('');
  const [formFee, setFormFee] = useState<string>('50'); // Default 50 for loan form
  
  // Member Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Fix: Correctly store members in state and fetch in useEffect */
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    const fetchMembers = async () => {
      const data = await db.getMembers();
      setMembers(data);
    };
    fetchMembers();
  }, []);

  const filteredMembers = members.filter(m => 
    m.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.name.includes(searchQuery) ||
    m.phone.includes(searchQuery)
  );

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [type]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Bank withdrawal and bank deposit and expense do NOT need member selection
    const needsMember = type !== 'expense' && type !== 'bank_deposit' && type !== 'bank_withdrawal';
    if (needsMember && !selectedMember) {
      alert('অনুগ্রহ করে একজন সদস্য নির্বাচন করুন');
      return;
    }
    
    setLoading(true);
    const date = new Date().toISOString().split('T')[0];
    
    // Primary Transaction
    const tx: Transaction = {
      id: `TX-${Date.now()}`,
      memberId: selectedMember?.id || 'SYSTEM',
      memberName: selectedMember?.name || 'SYSTEM',
      date: date,
      amount: parseFloat(amount),
      type: type as Transaction['type'],
      remarks: remarks
    };

    try {
      await db.addTransaction(tx);

      // Record Savings Penalty if applicable (Only for 'savings' type)
      if (type === 'savings' && parseFloat(penalty) > 0) {
        await db.addTransaction({
          id: `SPEN-${Date.now()}`,
          memberId: selectedMember?.id || 'SYSTEM',
          memberName: selectedMember?.name || 'SYSTEM',
          date: date,
          amount: parseFloat(penalty),
          type: 'savings_penalty',
          remarks: 'সঞ্চয় জরিমানা'
        });
      }

      // Record Loan Penalty if applicable (Only for 'loan_collection' type)
      if (type === 'loan_collection' && parseFloat(penalty) > 0) {
        await db.addTransaction({
          id: `LPEN-${Date.now()}`,
          memberId: selectedMember?.id || 'SYSTEM',
          memberName: selectedMember?.name || 'SYSTEM',
          date: date,
          amount: parseFloat(penalty),
          type: 'loan_penalty',
          remarks: 'ঋণ আদায় জরিমানা'
        });
      }

      // Record Loan Form Fee if applicable
      if (type === 'loan_distribution' && parseFloat(formFee) > 0) {
        await db.addTransaction({
          id: `FEE-${Date.now()}`,
          memberId: selectedMember?.id || 'SYSTEM',
          memberName: selectedMember?.name || 'SYSTEM',
          date: date,
          amount: parseFloat(formFee),
          type: 'form_fee',
          remarks: 'ঋণ ফরম ফি'
        });
      }

      setSuccess(true);
      setSearchQuery('');
      setSelectedMember(null);
      setAmount('');
      setPenalty('');
      setRemarks('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error("Transaction failed:", err);
      alert("লেনদেন সম্পন্ন করতে সমস্যা হয়েছে: " + (err.message || "অজানা ত্রুটি"));
    } finally {
      setLoading(false);
    }
  };

  const handleMemberSelect = (member: any) => {
    setSelectedMember(member);
    setSearchQuery(`${member.id} - ${member.name}`);
    setIsDropdownOpen(false);
  };

  const clearSelection = () => {
    setSelectedMember(null);
    setSearchQuery('');
    setIsDropdownOpen(true);
    if (inputRef.current) inputRef.current.focus();
  };

  // Logic to hide member search for specific types
  const needsMember = type !== 'expense' && type !== 'bank_deposit' && type !== 'bank_withdrawal';
  const isWithdrawalAction = type === 'savings_withdrawal' || type === 'bank_withdrawal';
  
  const numAmount = parseFloat(amount) || 0;
  const loanProfit = numAmount * 0.1;
  const totalRepayable = numAmount + loanProfit;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-2">
        <h2 className="text-xl font-bold text-slate-800">{label} ফরম</h2>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg animate-in fade-in duration-300 flex items-center shadow-sm">
          <span className="font-medium">তথ্য সফলভাবে সংরক্ষিত হয়েছে!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">তারিখ</label>
            <input 
              required
              type="date" 
              defaultValue={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-bold"
            />
          </div>

          {needsMember && (
            <div className="space-y-2 relative" ref={dropdownRef}>
              <label className="text-sm font-semibold text-slate-700 flex justify-between">
                <span>সদস্য আইডি / নাম অনুসন্ধান</span>
              </label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Search size={18} />
                </div>
                <input 
                  ref={inputRef}
                  type="text"
                  placeholder="আইডি বা নাম লিখে সার্চ করুন..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (selectedMember) setSelectedMember(null);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-lg border transition-all outline-none focus:ring-2 focus:ring-emerald-500 bg-white
                    ${selectedMember ? 'border-emerald-200 bg-emerald-50 font-bold text-emerald-800' : 'border-slate-200'}
                  `}
                />
                
                {searchQuery && (
                  <button type="button" onClick={clearSelection} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500">
                    <XCircle size={18} />
                  </button>
                )}
              </div>

              {selectedMember && (
                <div className="mt-2 p-3 bg-slate-50 border border-slate-100 rounded-lg flex items-start space-x-3">
                   <div className="bg-white p-2 rounded-md shadow-sm border border-slate-100 text-emerald-600">
                      <User size={18} />
                   </div>
                   <div className="flex-1 text-sm">
                      <p className="font-bold text-slate-800">{selectedMember.name}</p>
                      <div className="flex space-x-4 mt-1">
                         <span className="text-slate-500">সঞ্চয়: <span className="text-emerald-600 font-semibold">৳{selectedMember.totalSavings}</span></span>
                         <span className="text-slate-500">ঋণ: <span className="text-rose-600 font-semibold">৳{selectedMember.totalLoan}</span></span>
                      </div>
                   </div>
                </div>
              )}

              {isDropdownOpen && filteredMembers.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-2xl max-h-64 overflow-y-auto">
                  {filteredMembers.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => handleMemberSelect(member)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-emerald-50 border-b border-slate-50"
                    >
                      <div className="text-left">
                        <div className="font-bold text-slate-800">#{member.id}</div>
                        <div className="text-sm text-slate-500">{member.name}</div>
                      </div>
                      <div className={`text-xs font-bold ${member.totalLoan > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {member.totalLoan > 0 ? 'ঋণ আছে' : 'পরিশোধিত'}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">পরিমাণ (৳)</label>
            <input 
              required
              type="number" 
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-bold"
            />
          </div>

          {/* Penalty Field - Only for Savings OR Loan Collection, not for withdrawals */}
          {(type === 'savings' || type === 'loan_collection') && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-amber-700 flex items-center gap-1">
                {type === 'savings' ? 'সঞ্চয় জরিমানা (৳)' : 'ঋণ জরিমানা (৳)'} <Info size={14} className="opacity-50" />
              </label>
              <input 
                type="number" 
                placeholder="0.00"
                value={penalty}
                onChange={(e) => setPenalty(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-amber-200 bg-amber-50/30 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-bold text-amber-800"
              />
            </div>
          )}

          {type === 'loan_distribution' && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-emerald-700">ঋণ ফরম ফি (অপরিবর্তনযোগ্য)</label>
              <input 
                readOnly
                type="number" 
                value={formFee}
                className="w-full px-4 py-2.5 rounded-lg border-emerald-200 bg-emerald-50 font-bold text-emerald-800 cursor-not-allowed"
              />
            </div>
          )}

          {type === 'loan_distribution' && numAmount > 0 && (
            <div className="md:col-span-2 p-4 bg-indigo-50 border border-indigo-100 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-indigo-700 font-bold">
                <Calculator size={20} /> ঋণের হিসাব (১০% মুনাফা লজিক)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-center">
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <span className="text-slate-500 block">মূল ঋণ</span>
                  <span className="text-lg font-black text-slate-800">৳ {numAmount.toLocaleString()}</span>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <span className="text-slate-500 block">১০% মুনাফা</span>
                  <span className="text-lg font-black text-amber-600">৳ {loanProfit.toLocaleString()}</span>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <span className="text-slate-500 block">মোট পরিশোধযোগ্য</span>
                  <span className="text-lg font-black text-emerald-700">৳ {totalRepayable.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-semibold text-slate-700">মন্তব্য (ঐচ্ছিক)</label>
            <textarea 
              rows={2} 
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="অতিরিক্ত তথ্য..." 
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            ></textarea>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-50">
          <button type="button" onClick={onBack} className="mr-4 px-6 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold transition-all">বাতিল</button>
          <button disabled={loading} type="submit" className="px-8 py-2.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 shadow-lg disabled:opacity-50 transition-all">
            {loading ? 'প্রসেসিং...' : (isWithdrawalAction ? 'উত্তোলন' : 'জমা দিন')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TransactionForm;
