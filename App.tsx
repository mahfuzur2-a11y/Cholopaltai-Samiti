
import React, { useState, useEffect } from 'react';
import { 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { ViewType, User } from './types';
import { db } from './db';
import Login from './components/Login';
import DashboardGrid from './components/DashboardGrid';
import MemberForm from './components/MemberForm';
import MemberList from './components/MemberList';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import Reports from './components/Reports';
import ProfitView from './components/ProfitView';
import MemberLedger from './components/MemberLedger';
import ProfitDistribution from './components/ProfitDistribution';
import UserManagement from './components/UserManagement';
import ChangePassword from './components/ChangePassword';
import MemberPortal from './components/MemberPortal';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>(ViewType.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMemberPortalActive, setIsMemberPortalActive] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      await db.init();
      setIsOffline(!db.isCloudEnabled());
      const savedUser = db.getCurrentUser();
      if (savedUser) {
        setCurrentUser(savedUser);
      }
    };
    initApp();
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    db.setCurrentUser(user);
    setIsMemberPortalActive(false);
  };

  const handleLogout = () => {
    if (window.confirm('আপনি কি নিশ্চিতভাবে লগআউট করতে চান?')) {
      db.setCurrentUser(null);
      setCurrentUser(null);
      setCurrentView(ViewType.DASHBOARD);
    }
  };

  const handleUpdateUser = async (updated: User) => {
    setCurrentUser(updated);
    db.setCurrentUser(updated);
    const users = await db.getUsers();
    const updatedUsers = users.map(u => u.id === updated.id ? updated : u);
    await db.saveUsers(updatedUsers);
  };

  if (isMemberPortalActive) {
    return (
      <div className="min-h-screen bg-slate-50 font-['Hind_Siliguri'] p-4 md:p-10">
        <MemberPortal onBack={() => setIsMemberPortalActive(false)} />
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} onEnterPortal={() => setIsMemberPortalActive(true)} />;
  }

  const isAdmin = currentUser.role === 'admin';

  const renderContent = () => {
    switch (currentView) {
      case ViewType.DASHBOARD:
        return <DashboardGrid onNavigate={setCurrentView} userRole={currentUser.role} onLogout={handleLogout} />;
      case ViewType.NEW_MEMBER:
        return <MemberForm onBack={() => setCurrentView(ViewType.DASHBOARD)} />;
      case ViewType.MEMBER_LIST:
        return <MemberList onBack={() => setCurrentView(ViewType.DASHBOARD)} isAdmin={isAdmin} />;
      case ViewType.SAVINGS_COLLECTION:
        return <TransactionForm type="savings" label="সঞ্চয় আদায়" onBack={() => setCurrentView(ViewType.DASHBOARD)} />;
      case ViewType.LOAN_COLLECTION:
        return <TransactionForm type="loan_collection" label="ঋণ আদায়" onBack={() => setCurrentView(ViewType.DASHBOARD)} />;
      case ViewType.LOAN_DISTRIBUTION:
        return <TransactionForm type="loan_distribution" label="ঋণ বিতরণ" onBack={() => setCurrentView(ViewType.DASHBOARD)} />;
      case ViewType.EXPENSE:
        return <TransactionForm type="expense" label="ব্যয় এন্ট্রি" onBack={() => setCurrentView(ViewType.DASHBOARD)} />;
      case ViewType.SAVINGS_DUE:
        return <MemberList type="savings_due" onBack={() => setCurrentView(ViewType.DASHBOARD)} isAdmin={isAdmin} />;
      case ViewType.LOAN_DUE:
        return <MemberList type="loan_due" onBack={() => setCurrentView(ViewType.DASHBOARD)} isAdmin={isAdmin} />;
      case ViewType.SAVINGS_VIEW:
        return <TransactionList type="savings" onBack={() => setCurrentView(ViewType.DASHBOARD)} />;
      case ViewType.LOAN_VIEW:
        return <TransactionList type="loan" onBack={() => setCurrentView(ViewType.DASHBOARD)} />;
      case ViewType.SAVINGS_WITHDRAWAL:
        return <TransactionForm type="savings_withdrawal" label="সঞ্চয় উত্তোলন" onBack={() => setCurrentView(ViewType.DASHBOARD)} />;
      case ViewType.BANK_DEPOSIT:
        return <TransactionForm type="bank_deposit" label="ব্যাংক জমা" onBack={() => setCurrentView(ViewType.DASHBOARD)} />;
      case ViewType.BANK_WITHDRAWAL:
        return <TransactionForm type="bank_withdrawal" label="ব্যাংক উত্তোলন" onBack={() => setCurrentView(ViewType.DASHBOARD)} />;
      case ViewType.REPORTS:
        return <Reports onBack={() => setCurrentView(ViewType.DASHBOARD)} />;
      case ViewType.PROFIT:
        return <ProfitView onBack={() => setCurrentView(ViewType.DASHBOARD)} onDistribute={() => isAdmin ? setCurrentView(ViewType.PROFIT_DISTRIBUTION) : alert('শুধুমাত্র অ্যাডমিন মুনাফা বন্টন করতে পারবেন।')} />;
      case ViewType.PROFIT_DISTRIBUTION:
        return isAdmin ? <ProfitDistribution onBack={() => setCurrentView(ViewType.PROFIT)} /> : <DashboardGrid onNavigate={setCurrentView} userRole={currentUser.role} onLogout={handleLogout} />;
      case ViewType.MEMBER_LEDGER:
        return <MemberLedger onBack={() => setCurrentView(ViewType.DASHBOARD)} />;
      case ViewType.USER_MANAGEMENT:
        return isAdmin ? <UserManagement onBack={() => setCurrentView(ViewType.DASHBOARD)} /> : <DashboardGrid onNavigate={setCurrentView} userRole={currentUser.role} onLogout={handleLogout} />;
      case ViewType.CHANGE_PASSWORD:
        return <ChangePassword onBack={() => setCurrentView(ViewType.DASHBOARD)} user={currentUser} onUpdate={handleUpdateUser} />;
      default:
        return <DashboardGrid onNavigate={setCurrentView} userRole={currentUser.role} onLogout={handleLogout} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Hind_Siliguri']">
      <header className="bg-emerald-700 text-white p-4 shadow-lg sticky top-0 z-50 flex justify-between items-center print:hidden">
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrentView(ViewType.DASHBOARD)} className="text-xl font-black tracking-tight">চলো পাল্টায় যুব কল্যাণ সমিতি</button>
          {isOffline && <span className="text-[10px] bg-amber-500/20 text-amber-100 px-2 py-0.5 rounded-full border border-amber-500/30">অফলাইন মোড</span>}
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden md:block text-sm font-bold opacity-80">{currentUser.name} ({currentUser.role === 'admin' ? 'অ্যাডমিন' : 'অফিসার'})</span>
          <button onClick={handleLogout} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><LogOut size={20}/></button>
        </div>
      </header>
      
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        {currentView !== ViewType.DASHBOARD && (
          <button 
            onClick={() => setCurrentView(ViewType.DASHBOARD)}
            className="mb-6 flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors font-bold text-sm print:hidden"
          >
            ← ড্যাশবোর্ডে ফিরে যান
          </button>
        )}
        {renderContent()}
      </main>

      <footer className="bg-white border-t border-slate-200 p-4 text-center text-slate-400 text-xs font-bold print:hidden">
        © ২০২৪ চলো পাল্টায় যুব কল্যাণ সমিতি | সকল স্বত্ব সংরক্ষিত
      </footer>
    </div>
  );
};

export default App;
