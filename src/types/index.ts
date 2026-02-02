export interface Category {
  id: string; // Internal ID for stable reference
  name: string;
  icon: string;
  color: string;
}

export interface BudgetBook {
  id: string;
  name: string;      // e.g. "May 2024"
  month: number;     // 1-12
  year: number;
  totalIncome: number;
  totalExpense: number;
  currency?: string;
  userId: string;
  categories: {
    income: Category[];
    expense: Category[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface BudgetEntry {
  id: string;
  bookId: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string;
  date: string;      // ISO string
  createdAt: string;
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  Home: undefined;
  BookDetail: { bookId: string; name: string };
  BookForm: { bookId?: string }; // For creating/editing a Budget Book (Month)
  EntryForm: { bookId: string; entryId?: string }; // For adding/editing an Entry
  Profile: undefined;
};
