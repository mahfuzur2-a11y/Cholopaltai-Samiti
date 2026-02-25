
export interface User {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'user' | 'viewer';
  password: string;
}

export interface Member {
  id: string;
  name: string;
  fatherName: string;
  phone: string;
  nid: string;
  address: string;
  joinDate: string;
  totalSavings: number;
  totalLoan: number;
  nomineeName?: string;
  nomineeRelationship?: string;
}

export interface Transaction {
  id: string;
  memberId: string;
  memberName: string;
  date: string;
  amount: number;
  type: 'savings' | 'loan_collection' | 'loan_distribution' | 'expense' | 'savings_withdrawal' | 'bank_deposit' | 'bank_withdrawal' | 'admission_fee' | 'form_fee' | 'savings_penalty' | 'loan_penalty';
  remarks?: string;
}

export enum ViewType {
  DASHBOARD = 'DASHBOARD',
  NEW_MEMBER = 'NEW_MEMBER',
  MEMBER_LIST = 'MEMBER_LIST',
  SAVINGS_COLLECTION = 'SAVINGS_COLLECTION',
  LOAN_COLLECTION = 'LOAN_COLLECTION',
  LOAN_DISTRIBUTION = 'LOAN_DISTRIBUTION',
  EXPENSE = 'EXPENSE',
  SAVINGS_DUE = 'SAVINGS_DUE',
  LOAN_DUE = 'LOAN_DUE',
  SAVINGS_VIEW = 'SAVINGS_VIEW',
  LOAN_VIEW = 'LOAN_VIEW',
  SAVINGS_WITHDRAWAL = 'SAVINGS_WITHDRAWAL',
  REPORTS = 'REPORTS',
  PROFIT = 'PROFIT',
  BANK_DEPOSIT = 'BANK_DEPOSIT',
  BANK_WITHDRAWAL = 'BANK_WITHDRAWAL',
  MONTHLY_SHEET = 'MONTHLY_SHEET',
  MEMBER_LEDGER = 'MEMBER_LEDGER',
  PROFIT_DISTRIBUTION = 'PROFIT_DISTRIBUTION',
  USER_MANAGEMENT = 'USER_MANAGEMENT',
  CHANGE_PASSWORD = 'CHANGE_PASSWORD',
  MEMBER_PORTAL = 'MEMBER_PORTAL'
}
