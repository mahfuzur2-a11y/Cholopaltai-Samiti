
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  deleteDoc, 
  updateDoc, 
  getDoc,
  query,
  limit
} from 'firebase/firestore';
import { User, Member, Transaction } from './types';

const firebaseConfig = {
  apiKey: "AIzaSyCWI18604Qi3xcojGktWnZif0ksbpyyURs",
  authDomain: "cholopailtai-samiti.firebaseapp.com",
  projectId: "cholopailtai-samiti",
  storageBucket: "cholopailtai-samiti.firebasestorage.app",
  messagingSenderId: "599461032386",
  appId: "1:599461032386:web:f7f2aac39cd6c057efe65b"
};

let app: any;
let firestore: any;
let firebaseEnabled = false;

const COLLECTIONS = {
  USERS: 'users',
  MEMBERS: 'members',
  TRANSACTIONS: 'transactions'
};

const LOCAL_KEYS = {
  USERS: 'fallback_users',
  MEMBERS: 'fallback_members',
  TRANSACTIONS: 'fallback_transactions',
  CURRENT_USER: 'somity_current_user'
};

const DEFAULT_USERS: User[] = [
  { id: '1', username: 'admin', name: 'অ্যাডমিন', role: 'admin', password: 'admin' },
  { id: '2', username: 'user', name: 'অফিসার', role: 'user', password: 'user' }
];

const getLocal = (key: string) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
};

const setLocal = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const db = {
  isCloudEnabled: () => firebaseEnabled,

  init: async () => {
    try {
      app = initializeApp(firebaseConfig);
      firestore = getFirestore(app);
      
      // Test connection
      const usersQuery = query(collection(firestore, COLLECTIONS.USERS), limit(1));
      await getDocs(usersQuery);
      firebaseEnabled = true;
      console.log("Firebase Connected Successfully");
    } catch (e: any) {
      console.warn("Firebase Error: ", e.message);
      firebaseEnabled = false;
      if (!getLocal(LOCAL_KEYS.USERS)) setLocal(LOCAL_KEYS.USERS, DEFAULT_USERS);
      if (!getLocal(LOCAL_KEYS.MEMBERS)) setLocal(LOCAL_KEYS.MEMBERS, []);
      if (!getLocal(LOCAL_KEYS.TRANSACTIONS)) setLocal(LOCAL_KEYS.TRANSACTIONS, []);
    }
  },

  resetDatabase: () => {
    sessionStorage.clear();
    localStorage.clear();
    window.location.reload();
  },

  getUsers: async (): Promise<User[]> => {
    if (!firebaseEnabled) return getLocal(LOCAL_KEYS.USERS) || DEFAULT_USERS;
    try {
      const snap = await getDocs(collection(firestore, COLLECTIONS.USERS));
      const users = snap.docs.map(doc => doc.data() as User);
      return users.length > 0 ? users : DEFAULT_USERS;
    } catch {
      return getLocal(LOCAL_KEYS.USERS) || DEFAULT_USERS;
    }
  },

  saveUsers: async (users: User[]): Promise<void> => {
    setLocal(LOCAL_KEYS.USERS, users);
    if (!firebaseEnabled) return;
    try {
      for (const user of users) {
        await setDoc(doc(firestore, COLLECTIONS.USERS, user.id), user);
      }
    } catch {}
  },

  getCurrentUser: (): User | null => {
    try {
      const user = sessionStorage.getItem(LOCAL_KEYS.CURRENT_USER);
      return user ? JSON.parse(user) : null;
    } catch { return null; }
  },

  setCurrentUser: (user: User | null) => {
    if (user) sessionStorage.setItem(LOCAL_KEYS.CURRENT_USER, JSON.stringify(user));
    else sessionStorage.removeItem(LOCAL_KEYS.CURRENT_USER);
  },

  getMembers: async (): Promise<Member[]> => {
    if (!firebaseEnabled) return getLocal(LOCAL_KEYS.MEMBERS) || [];
    try {
      const snap = await getDocs(collection(firestore, COLLECTIONS.MEMBERS));
      return snap.docs.map(doc => doc.data() as Member);
    } catch {
      return getLocal(LOCAL_KEYS.MEMBERS) || [];
    }
  },

  addMember: async (member: Member): Promise<void> => {
    const members = await db.getMembers();
    members.push(member);
    setLocal(LOCAL_KEYS.MEMBERS, members);
    
    if (!firebaseEnabled) return;
    try {
      await setDoc(doc(firestore, COLLECTIONS.MEMBERS, member.id), member);
    } catch {}
  },

  deleteMember: async (id: string): Promise<void> => {
    const members = await db.getMembers();
    const filtered = members.filter(m => m.id !== id);
    setLocal(LOCAL_KEYS.MEMBERS, filtered);

    if (!firebaseEnabled) return;
    try {
      await deleteDoc(doc(firestore, COLLECTIONS.MEMBERS, id));
    } catch {}
  },

  getTransactions: async (): Promise<Transaction[]> => {
    if (!firebaseEnabled) return getLocal(LOCAL_KEYS.TRANSACTIONS) || [];
    try {
      const snap = await getDocs(collection(firestore, COLLECTIONS.TRANSACTIONS));
      return snap.docs.map(doc => doc.data() as Transaction);
    } catch {
      return getLocal(LOCAL_KEYS.TRANSACTIONS) || [];
    }
  },

  addTransaction: async (tx: Transaction): Promise<void> => {
    const txs = await db.getTransactions();
    txs.push(tx);
    setLocal(LOCAL_KEYS.TRANSACTIONS, txs);

    if (tx.memberId !== 'SYSTEM') {
      const members = await db.getMembers();
      const mIdx = members.findIndex(m => m.id === tx.memberId);
      if (mIdx !== -1) {
        if (tx.type === 'savings') members[mIdx].totalSavings += tx.amount;
        else if (tx.type === 'savings_withdrawal') members[mIdx].totalSavings -= tx.amount;
        else if (tx.type === 'loan_distribution') members[mIdx].totalLoan += (tx.amount * 1.10);
        else if (tx.type === 'loan_collection') members[mIdx].totalLoan -= tx.amount;
        setLocal(LOCAL_KEYS.MEMBERS, members);
      }
    }

    if (!firebaseEnabled) return;
    try {
      const txRef = doc(collection(firestore, COLLECTIONS.TRANSACTIONS));
      await setDoc(txRef, { ...tx, id: txRef.id });

      if (tx.memberId !== 'SYSTEM') {
        const mRef = doc(firestore, COLLECTIONS.MEMBERS, tx.memberId);
        const mSnap = await getDoc(mRef);
        if (mSnap.exists()) {
          const mData = mSnap.data() as Member;
          let { totalSavings, totalLoan } = mData;
          if (tx.type === 'savings') totalSavings += tx.amount;
          else if (tx.type === 'savings_withdrawal') totalSavings -= tx.amount;
          else if (tx.type === 'loan_distribution') totalLoan += (tx.amount * 1.10);
          else if (tx.type === 'loan_collection') totalLoan -= tx.amount;
          await updateDoc(mRef, { totalSavings, totalLoan });
        }
      }
    } catch {}
  }
};
