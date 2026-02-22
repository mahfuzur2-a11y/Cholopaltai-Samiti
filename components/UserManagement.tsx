
import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserPlus, Trash2, KeyRound, Eye, EyeOff } from 'lucide-react';
import { User } from '../types';
import { db } from '../db';

interface UserManagementProps {
  onBack: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ onBack }) => {
  /* Fix: Correctly store users in state and fetch in useEffect */
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchUsers = async () => {
      try {
        const data = await db.getUsers();
        if (isMounted) {
          setUsers(data);
        }
      } catch (err) {
        console.error("UserManagement fetchUsers failed", err);
      }
    };
    fetchUsers();
    return () => { isMounted = false; };
  }, []);

  const [newUser, setNewUser] = useState<{ name: string; username: string; role: 'user' | 'admin'; password: string }>({ 
    name: '', 
    username: '', 
    role: 'user', 
    password: 'Samiti9999' 
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = Date.now().toString();
    const updatedUsers = [...users, { ...newUser, id }];
    /* Fix: Await the async saveUsers call */
    await db.saveUsers(updatedUsers);
    setUsers(updatedUsers);
    setNewUser({ name: '', username: '', role: 'user', password: 'Samiti9999' });
    alert('নতুন ইউজার সফলভাবে যোগ করা হয়েছে!');
  };

  const handleDeleteUser = async (id: string) => {
    if (users.length <= 1) return alert('কমপক্ষে একজন ইউজার থাকতে হবে!');
    if (window.confirm('এই ইউজারকে ডিলিট করতে চান?')) {
      const updated = users.filter(u => u.id !== id);
      /* Fix: Await the async saveUsers call */
      await db.saveUsers(updated);
      setUsers(updated);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 font-['Hind_Siliguri']">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
          <ShieldCheck size={24} />
        </div>
        <h2 className="text-2xl font-black text-slate-800">ইউজার ম্যানেজমেন্ট</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
            <UserPlus size={20} className="text-emerald-600" /> নতুন ইউজার
          </h3>
          <form onSubmit={handleAddUser} className="space-y-4">
            <input required type="text" placeholder="ইউজারের নাম" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none font-bold" />
            <input required type="text" placeholder="ইউজারনেম" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none font-bold" />
            <div className="relative">
              <input required type={showPassword ? "text" : "password"} value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full px-4 pr-12 py-2.5 rounded-xl border border-slate-200 outline-none font-bold" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as 'user' | 'admin'})} className="w-full px-4 py-2.5 rounded-xl border bg-white outline-none font-bold">
              <option value="user">জেনারেল ইউজার</option>
              <option value="admin">সুপার অ্যাডমিন</option>
            </select>
            <button type="submit" className="w-full py-3 bg-emerald-600 text-white rounded-xl font-black">তৈরি করুন</button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">ইউজার</th>
                <th className="px-6 py-4">ইউজারনেম</th>
                <th className="px-6 py-4 text-center">রোল</th>
                <th className="px-6 py-4 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-black text-slate-700">{u.name}</td>
                  <td className="px-6 py-4 font-bold text-slate-400">@{u.username}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${u.role === 'admin' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-rose-600"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
