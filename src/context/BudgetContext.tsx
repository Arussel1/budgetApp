import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  orderBy,
  getDocs,
  writeBatch,
  increment
} from 'firebase/firestore';
import { firestore, storage } from '../config/firebase';
import { BudgetBook, BudgetEntry } from '../types';
import { useAuth } from './AuthContext';

interface BudgetContextType {
  budgetBooks: BudgetBook[];
  entries: BudgetEntry[];
  loading: boolean;
  error: string | null;
  addBudgetBook: (bookData: Omit<BudgetBook, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'totalIncome' | 'totalExpense' | 'categories'>) => Promise<void>;
  updateBudgetBook: (id: string, bookData: Partial<Omit<BudgetBook, 'id' | 'userId' | 'createdAt'>>) => Promise<void>;
  deleteBudgetBook: (id: string) => Promise<void>;
  addEntry: (entryData: Omit<BudgetEntry, 'id' | 'createdAt'>) => Promise<void>;
  deleteEntry: (id: string, bookId: string, amount: number, type: 'income' | 'expense') => Promise<void>;
  getEntriesForBook: (bookId: string) => () => void;
  clearError: () => void;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export const BudgetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [budgetBooks, setBudgetBooks] = useState<BudgetBook[]>([]);
  const [entries, setEntries] = useState<BudgetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Load Budget Books
  useEffect(() => {
    if (!user) {
      setBudgetBooks([]);
      setLoading(false);
      return;
    }

    console.log('[BudgetContext] Fetching books for user:', user.uid);
    const q = query(
      collection(firestore, 'budget_books'),
      where('userId', '==', user.uid),
      orderBy('year', 'desc'),
      orderBy('month', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const booksData: BudgetBook[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        booksData.push({
          id: doc.id,
          name: data.name,
          month: data.month,
          year: data.year,
          totalIncome: data.totalIncome || 0,
          totalExpense: data.totalExpense || 0,
          currency: data.currency,
          userId: data.userId,
          categories: {
            income: (data.categories?.income || []).map((cat: any, index: number) => 
              typeof cat === 'string' ? { id: `inc-legacy-${index}`, name: cat, icon: 'cash-outline', color: '#ccc' } : cat
            ),
            expense: (data.categories?.expense || []).map((cat: any, index: number) => 
              typeof cat === 'string' ? { id: `exp-legacy-${index}`, name: cat, icon: 'pricetag-outline', color: '#ccc' } : cat
            ),
          },
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        } as BudgetBook);
      });
      setBudgetBooks(booksData);
      setLoading(false);
    }, (err: any) => {
      console.error("Error fetching budget books:", err);
      setError(err.message);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const addBudgetBook = async (bookData: Omit<BudgetBook, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'totalIncome' | 'totalExpense' | 'categories'>) => {
    try {
      setError(null);
      if (!user) throw new Error('User not authenticated');

      const now = new Date().toISOString();
      await addDoc(collection(firestore, 'budget_books'), {
        ...bookData,
        totalIncome: 0,
        totalExpense: 0,
        categories: {
          income: [
            { id: 'inc-1', name: 'Salary', icon: 'cash-outline', color: '#69F0AE' },
            { id: 'inc-2', name: 'Freelance', icon: 'laptop-outline', color: '#40C4FF' },
          ],
          expense: [
            { id: 'exp-1', name: 'Food', icon: 'restaurant-outline', color: '#FF5252' },
            { id: 'exp-2', name: 'Shopping', icon: 'cart-outline', color: '#E040FB' },
            { id: 'exp-3', name: 'Transport', icon: 'car-outline', color: '#FFD740' },
          ]
        },
        userId: user.uid,
        createdAt: now,
        updatedAt: now,
      });
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateBudgetBook = async (id: string, bookData: Partial<Omit<BudgetBook, 'id' | 'userId' | 'createdAt'>>) => {
    try {
      setError(null);
      const now = new Date().toISOString();
      await updateDoc(doc(firestore, 'budget_books', id), {
        ...bookData,
        updatedAt: now,
      });
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteBudgetBook = async (id: string) => {
    try {
      setError(null);
      
      // Delete all entries associated with this book first
      const entriesQuery = query(collection(firestore, 'budget_entries'), where('bookId', '==', id));
      const entriesSnapshot = await getDocs(entriesQuery);
      
      const batch = writeBatch(firestore);
      entriesSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      // Delete the book itself
      batch.delete(doc(firestore, 'budget_books', id));
      
      await batch.commit();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const getEntriesForBook = (bookId: string) => {
    setLoading(true);
    const q = query(
      collection(firestore, 'budget_entries'),
      where('bookId', '==', bookId),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const entriesData: BudgetEntry[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        entriesData.push({
          id: doc.id,
          bookId: data.bookId,
          type: data.type,
          amount: data.amount,
          category: data.category,
          description: data.description,
          date: data.date,
          createdAt: data.createdAt,
        } as BudgetEntry);
      });
      setEntries(entriesData);
      setLoading(false);
    }, (err: any) => {
        console.error("Error fetching entries:", err);
        setError(err.message);
        setLoading(false);
    });
    return unsubscribe;
  };

  const addEntry = async (entryData: Omit<BudgetEntry, 'id' | 'createdAt'>) => {
    try {
      setError(null);
      const now = new Date().toISOString();
      const batch = writeBatch(firestore);

      // Create new entry
      const newEntryRef = doc(collection(firestore, 'budget_entries'));
      batch.set(newEntryRef, {
        ...entryData,
        createdAt: now,
      });

      // Update book totals
      const bookRef = doc(firestore, 'budget_books', entryData.bookId);
      const updateData: any = { updatedAt: now };
      
      if (entryData.type === 'income') {
        updateData.totalIncome = increment(entryData.amount);
      } else {
        updateData.totalExpense = increment(entryData.amount);
      }
      
      batch.update(bookRef, updateData);
      
      await batch.commit();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };
  
  const deleteEntry = async (id: string, bookId: string, amount: number, type: 'income' | 'expense') => {
    try {
      setError(null);
      const now = new Date().toISOString();
      const batch = writeBatch(firestore);
      
      // Delete entry
      const entryRef = doc(firestore, 'budget_entries', id);
      batch.delete(entryRef);
      
      // Update book totals (reverse the amount)
      const bookRef = doc(firestore, 'budget_books', bookId);
      const updateData: any = { updatedAt: now };
      
      if (type === 'income') {
        updateData.totalIncome = increment(-amount);
      } else {
        updateData.totalExpense = increment(-amount);
      }
      
      batch.update(bookRef, updateData);
      
      await batch.commit();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const clearError = () => setError(null);

  return (
    <BudgetContext.Provider
      value={{
        budgetBooks,
        entries,
        loading,
        error,
        addBudgetBook,
        updateBudgetBook,
        deleteBudgetBook,
        addEntry,
        deleteEntry,
        getEntriesForBook,
        clearError,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  return context;
};
