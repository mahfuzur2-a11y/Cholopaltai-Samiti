
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
  limit,
  addDoc
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

const COLLECTIONS = {
  USERS: 'users',
  MEMBERS: 'members',
  TRANSACTIONS: 'transactions'
};

const SESSION_KEYS = {
  CURRENT_USER: 'somity_current_user'
};

const DEFAULT_USERS: User[] = [
  { id: '1', username: 'admin', name: 'অ্যাডমিন', role: 'admin', password: 'admin' },
  { id: '2', username: 'user', name: 'অফিসার', role: 'user', password: 'user' }
];

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

export const db = {
  isCloudEnabled: () => true,

  init: async () => {
    try {
      const usersSnap = await getDocs(query(collection(firestore, COLLECTIONS.USERS), limit(1)));
      if (usersSnap.empty) {
        for (const user of DEFAULT_USERS) {
          await setDoc(doc(firestore, COLLECTIONS.USERS, user.id), user);
        }
        console.log("Firebase initialized with default users.");
      }
    } catch (e: any) {
      console.error("Firebase Error: ", e.message);
      alert("ডাটাবেজ কানেক্ট হতে পারছে না। দয়া করে Firebase Firestore-এ 'Security Rules' চেক করুন।");
    }
  },

  resetDatabase: async () => {
    if (confirm("এটি করলে আপনার ক্লাউডের ডাটা ডিলিট হবে না (সিকিউরিটির জন্য)। শুধুমাত্র ব্রাউজারের লগইন সেশন রিসেট হবে।")) {
      sessionStorage.clear();
      window.location.reload();
    }
  },

  getUsers: async (): Promise<User[]> => {
    try {
      const snap = await getDocs(collection(firestore, COLLECTIONS.USERS));
      const users = snap.docs.map(doc => doc.data() as User);
      return users.length > 0 ? users : DEFAULT_USERS;
    } catch {
      return DEFAULT_USERS;
    }
  },

  saveUsers: async (users: User[]): Promise<void> => {
    try {
      for (const user of users) {
        await setDoc(doc(firestore, COLLECTIONS.USERS, user.id), user);
      }
    } catch (e) {
      console.error("Save users failed", e);
    }
  },

  getCurrentUser: (): User | null => {
    try {
      const user = sessionStorage.getItem(SESSION_KEYS.CURRENT_USER);
      return user ? JSON.parse(user) : null;
    } catch { return null; }
  },

  setCurrentUser: (user: User | null) => {
    if (user) sessionStorage.setItem(SESSION_KEYS.CURRENT_USER, JSON.stringify(user));
    else sessionStorage.removeItem(SESSION_KEYS.CURRENT_USER);
  },

  getMembers: async (): Promise<Member[]> => {
    try {
      const snap = await getDocs(collection(firestore, COLLECTIONS.MEMBERS));
      return snap.docs.map(doc => doc.data() as Member);
    } catch (e) {
      console.error("Get members failed", e);
      return [];
    }
  },

  addMember: async (member: Member): Promise<void> => {
    try {
      await setDoc(doc(firestore, COLLECTIONS.MEMBERS, member.id), member);
    } catch (e) {
      console.error("Add member failed", e);
      throw e;
    }
  },

  deleteMember: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(firestore, COLLECTIONS.MEMBERS, id));
    } catch (e) {
      console.error("Delete member failed", e);
    }
  },

  getTransactions: async (): Promise<Transaction[]> => {
    try {
      const snap = await getDocs(collection(firestore, COLLECTIONS.TRANSACTIONS));
      return snap.docs.map(doc => doc.data() as Transaction);
    } catch (e) {
      console.error("Get transactions failed", e);
      return [];
    }
  },

  addTransaction: async (tx: Transaction): Promise<void> => {
    try {
      const txRef = doc(collection(firestore, COLLECTIONS.TRANSACTIONS));
      await setDoc(txRef, { ...tx, id: txRef.id });

      if (tx.memberId !== 'SYSTEM') {
        const mRef = doc(firestore, COLLECTIONS.MEMBERS, tx.memberId);
        const mSnap = await getDoc(mRef);
        if (mSnap.exists()) {
          const mData = mSnap.data() as Member;
          let { totalSavings, totalLoan } = mData;
          
          if (tx.type === 'savings' || tx.type === 'admission_fee') totalSavings += tx.amount;
          else if (tx.type === 'savings_withdrawal') totalSavings -= tx.amount;
          else if (tx.type === 'loan_distribution') totalLoan += (tx.amount * 1.10);
          else if (tx.type === 'loan_collection') totalLoan -= tx.amount;

          await updateDoc(mRef, { 
            totalSavings: Math.max(0, totalSavings), 
            totalLoan: Math.max(0, totalLoan) 
          });
        }
      }
    } catch (e) {
      console.error("Add transaction failed", e);
      throw e;
    }
  }
};
