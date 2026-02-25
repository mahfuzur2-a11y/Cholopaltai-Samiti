
import React, { useState, useMemo, useEffect } from 'react';
import { Search, Edit2, Trash2, Printer, ShieldAlert, X, Save } from 'lucide-react';
import { db } from '../db';
import { Member } from '../types';

interface MemberListProps {
  type?: 'all' | 'savings_due' | 'loan_due';
  onBack: () => void;
  isAdmin: boolean;
}

const MemberList: React.FC<MemberListProps> = ({ type = 'all', onBack, isAdmin }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchMembers = async () => {
      try {
        const data = await db.getMembers();
        if (isMounted) {
          setMembers(data);
        }
      } catch (err) {
        console.error("MemberList fetchMembers failed", err);
      }
    };
    fetchMembers();
    return () => { isMounted = false; };
  }, []);

  // Current Date Info
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const targetSavings = currentMonth * 100;

  const filteredMembers = useMemo(() => {
    let list = members;
    if (type === 'savings_due') list = list.filter(m => m.totalSavings < targetSavings);
    else if (type === 'loan_due') list = list.filter(m => m.totalLoan > 0);
    return list.filter(m => 
      m.name.includes(searchTerm) || 
      m.id.includes(searchTerm) || 
      m.phone.includes(searchTerm)
    );
  }, [members, type, searchTerm, targetSavings]);

  const handleDelete = async (id: string) => {
    if (!isAdmin) {
      alert('সতর্কতা: শুধুমাত্র অ্যাডমিন ডাটা ডিলিট করতে পারবেন!');
      return;
    }
    if (window.confirm(`আপনি কি নিশ্চিতভাবে আইডি #${id} সদস্যের ডাটা ডিলিট করতে চান? এটি অপিরিবর্তনীয়।`)) {
      try {
        await db.deleteMember(id);
        const updatedMembers = await db.getMembers();
        setMembers(updatedMembers);
        alert(`আইডি #${id} সফলভাবে ডিলিট হয়েছে।`);
      } catch (err: any) {
        alert(err.message || 'ডিলিট করতে সমস্যা হয়েছে।');
      }
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    
    setIsUpdating(true);
    try {
      await db.addMember(editingMember); // upsert handles update
      const updatedMembers = await db.getMembers();
      setMembers(updatedMembers);
      setEditingMember(null);
      alert('সদস্যের তথ্য সফলভাবে আপডেট করা হয়েছে।');
    } catch (err) {
      alert('আপডেট করতে সমস্যা হয়েছে।');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-500 print:shadow-none print:border-none">
      <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-black text-slate-800">
            {type === 'savings_due' ? 'বকেয়া সঞ্চয়' : type === 'loan_due' ? 'বকেয়া ঋণ' : 'সদস্য তালিকা'}
          </h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">সমিতির সংরক্ষিত ডাটাবেস</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              placeholder="সার্চ করুন..." 
              className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-sm w-full md:w-64" 
            />
          </div>
          <button onClick={() => window.print()} className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2 px-4 text-sm font-bold">
            <Printer size={18} /> প্রিন্ট
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
            <tr>
              <th className="px-8 py-4">আইডি</th>
              <th className="px-8 py-4">সদস্যের নাম</th>
              <th className="px-8 py-4">মোট সঞ্চয়</th>
              <th className="px-8 py-4">মোট ঋণ</th>
              {type !== 'all' && <th className="px-8 py-4 text-rose-600">বকেয়া (৳)</th>}
              <th className="px-8 py-4 text-center print:hidden">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredMembers.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-8 py-5 font-bold text-slate-500">#{m.id}</td>
                <td className="px-8 py-5">
                  <div className="font-black text-slate-800">{m.name}</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{m.phone}</div>
                </td>
                <td className="px-8 py-5 text-emerald-700 font-black">৳ {m.totalSavings.toLocaleString()}</td>
                <td className="px-8 py-5 text-rose-700 font-black">৳ {m.totalLoan.toLocaleString()}</td>
                {type !== 'all' && (
                  <td className="px-8 py-5 text-rose-600 font-black">
                    ৳ {type === 'savings_due' ? Math.max(0, targetSavings - m.totalSavings).toLocaleString() : (m.totalLoan * 0.1).toLocaleString()}
                  </td>
                )}
                <td className="px-8 py-5 print:hidden">
                  <div className="flex justify-center gap-2">
                    <button 
                      onClick={() => setEditingMember(m)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(m.id)}
                      className={`p-2 rounded-xl transition-all ${isAdmin ? 'text-rose-600 hover:bg-rose-50' : 'text-slate-300 cursor-not-allowed'}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredMembers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-8 py-10 text-center text-slate-400 italic">কোনো সদস্য পাওয়া যায়নি।</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {!isAdmin && (
        <div className="p-4 bg-amber-50 border-t border-amber-100 flex items-center gap-2 text-amber-700 text-xs font-bold">
          <ShieldAlert size={16} /> আপনি শুধুমাত্র ডাটা দেখতে পারবেন, পরিবর্তনের জন্য অ্যাডমিন পারমিশন প্রয়োজন।
        </div>
      )}

      {/* Edit Modal */}
      {editingMember && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-black text-slate-800">সদস্য তথ্য সংশোধন (# {editingMember.id})</h3>
              <button onClick={() => setEditingMember(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X size={24} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleUpdateMember} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">সদস্যের নাম</label>
                  <input 
                    required
                    type="text" 
                    value={editingMember.name}
                    onChange={e => setEditingMember({...editingMember, name: e.target.value})}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">পিতার নাম</label>
                  <input 
                    required
                    type="text" 
                    value={editingMember.fatherName}
                    onChange={e => setEditingMember({...editingMember, fatherName: e.target.value})}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">মোবাইল নম্বর</label>
                  <input 
                    required
                    type="text" 
                    value={editingMember.phone}
                    onChange={e => setEditingMember({...editingMember, phone: e.target.value})}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">এনআইডি নম্বর</label>
                  <input 
                    type="text" 
                    value={editingMember.nid}
                    onChange={setEditingMember ? (e => setEditingMember({...editingMember, nid: e.target.value})) : undefined}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-bold"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">ঠিকানা</label>
                  <textarea 
                    rows={2}
                    value={editingMember.address}
                    onChange={e => setEditingMember({...editingMember, address: e.target.value})}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">নমিনি নাম</label>
                  <input 
                    type="text" 
                    value={editingMember.nomineeName || ''}
                    onChange={e => setEditingMember({...editingMember, nomineeName: e.target.value})}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">নমিনির সাথে সম্পর্ক</label>
                  <input 
                    type="text" 
                    value={editingMember.nomineeRelationship || ''}
                    onChange={e => setEditingMember({...editingMember, nomineeRelationship: e.target.value})}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-bold"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setEditingMember(null)}
                  className="px-6 py-3 rounded-2xl text-slate-500 font-black hover:bg-slate-100 transition-all"
                >
                  বাতিল
                </button>
                <button 
                  type="submit" 
                  disabled={isUpdating}
                  className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isUpdating ? 'আপডেট হচ্ছে...' : <><Save size={20} /> সংরক্ষণ করুন</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberList;
