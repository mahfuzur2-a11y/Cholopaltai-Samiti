
import React, { useState } from 'react';
import { KeyRound, ShieldCheck, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { User } from '../types';

interface ChangePasswordProps {
  onBack: () => void;
  user: User;
  onUpdate: (user: User) => void;
}

const ChangePassword: React.FC<ChangePasswordProps> = ({ onBack, user, onUpdate }) => {
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPass !== user.password) {
      alert('বর্তমান পাসওয়ার্ড সঠিক নয়!');
      return;
    }
    if (newPass !== confirmPass) {
      alert('নতুন পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না!');
      return;
    }
    if (newPass.length < 6) {
      alert('পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে!');
      return;
    }

    onUpdate({ ...user, password: newPass });
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onBack();
    }, 2000);
  };

  return (
    <div className="max-w-md mx-auto animate-in slide-in-from-bottom-4 duration-500 font-['Hind_Siliguri']">
      <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
            <KeyRound size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-800">পাসওয়ার্ড পরিবর্তন</h2>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-1">{user.name}</p>
        </div>

        {success ? (
          <div className="py-10 text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle2 size={24} />
            </div>
            <p className="text-emerald-700 font-black">পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">বর্তমান পাসওয়ার্ড</label>
              <div className="relative">
                <input 
                  required 
                  type={showCurrent ? "text" : "password"} 
                  value={currentPass} 
                  onChange={e => setCurrentPass(e.target.value)} 
                  className="w-full px-4 pr-12 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none font-bold" 
                />
                <button 
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 p-1"
                >
                  {showCurrent ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">নতুন পাসওয়ার্ড</label>
              <div className="relative">
                <input 
                  required 
                  type={showNew ? "text" : "password"} 
                  value={newPass} 
                  onChange={e => setNewPass(e.target.value)} 
                  className="w-full px-4 pr-12 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none font-bold" 
                />
                <button 
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 p-1"
                >
                  {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">পাসওয়ার্ড কনফার্ম করুন</label>
              <div className="relative">
                <input 
                  required 
                  type={showConfirm ? "text" : "password"} 
                  value={confirmPass} 
                  onChange={e => setConfirmPass(e.target.value)} 
                  className="w-full px-4 pr-12 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none font-bold" 
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 p-1"
                >
                  {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-xl shadow-slate-100 hover:bg-slate-800 transition-all active:scale-95">আপডেট করুন</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChangePassword;
