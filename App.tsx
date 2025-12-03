
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Transaction, Category, RecurringTransaction, Account } from './types';
import { DEFAULT_CATEGORIES } from './constants';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import TransactionForm from './components/AddTransactionForm';
import ManageCategoriesModal from './components/ManageCategoriesModal';
import ManageRecurringTransactionsModal from './components/ManageRecurringTransactionsModal';
import ManageAccountsModal from './components/ManageAccountsModal';
import TransactionFilter from './components/TransactionFilter';
import SearchBar from './components/SearchBar';
import ImportCSVModal from './components/ImportCSVModal';
import FinancialAnalysisModal from './components/FinancialAnalysisModal';
import UpdatePasswordModal from './components/UpdatePasswordModal';
import Auth from './components/Auth';
import { supabase } from './supabaseClient';
import { Session } from '@supabase/supabase-js';
import { PlusIcon, TagIcon, UserCircleIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, ArrowPathIcon, DatabaseIcon, ExclamationTriangleIcon, BuildingLibraryIcon, LightBulbIcon, KeyIcon } from './components/Icons';

export type Filter = {
  mode: 'month' | 'range';
  month: number | 'all';
  year: number;
  startDate: string | null;
  endDate: string | null;
};

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [initialFetchComplete, setInitialFetchComplete] = useState(false);

  // Modal states
  const [isAddTransactionModalOpen, setAddTransactionModalOpen] = useState(false);
  const [isCategoriesModalOpen, setCategoriesModalOpen] = useState(false);
  const [isRecurringModalOpen, setRecurringModalOpen] = useState(false);
  const [isAccountsModalOpen, setAccountsModalOpen] = useState(false);
  const [isFirstAccountModalOpen, setFirstAccountModalOpen] = useState(false);
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isDeleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [isAnalysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [isUpdatePasswordModalOpen, setUpdatePasswordModalOpen] = useState(false);
  
  // Editing/Deleting states
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingRecurringId, setDeletingRecurringId] = useState<string | null>(null);
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);

  const profileMenuRef = useRef<HTMLDivElement>(null);
  
  const [filter, setFilter] = useState<Filter>({
    mode: 'month',
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
    startDate: null,
    endDate: null,
  });

  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Main data states
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | 'all'>('all');
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);

  // Auth Effect
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      // Se l'utente clicca sul link di reset password nell'email, viene loggato e riceve l'evento PASSWORD_RECOVERY
      if (event === 'PASSWORD_RECOVERY') {
        setUpdatePasswordModalOpen(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch Data from Supabase
  const fetchData = useCallback(async () => {
    if (!session?.user) return;
    setLoadingData(true);

    try {
      // Fetch Accounts
      const { data: accountsData, error: accError } = await supabase.from('accounts').select('*');
      if (accError) throw accError;
      
      const mappedAccounts: Account[] = accountsData.map(a => ({
        id: a.id,
        name: a.name,
        initialBalance: a.initial_balance,
        currency: a.currency
      }));
      setAccounts(mappedAccounts);

      // Fetch Categories
      const { data: categoriesData, error: catError } = await supabase.from('categories').select('*');
      if (catError) throw catError;

      const mappedCategories: Category[] = categoriesData.map(c => ({
        id: c.id,
        name: c.name,
        color: c.color
      }));
      
      if (mappedCategories.length === 0) {
         if (categoriesData.length === 0) {
             const { data: insertedDefaults } = await supabase.from('categories').insert(
                 DEFAULT_CATEGORIES.map(c => ({ user_id: session.user.id, name: c.name, color: c.color }))
             ).select();
             if (insertedDefaults) {
                 setCategories(insertedDefaults.map(c => ({ id: c.id, name: c.name, color: c.color })));
             }
         } else {
             setCategories(mappedCategories);
         }
      } else {
          setCategories(mappedCategories);
      }

      // Fetch Transactions
      const { data: transactionsData, error: txError } = await supabase.from('transactions').select('*');
      if (txError) throw txError;

      const mappedTransactions: Transaction[] = transactionsData.map(t => ({
        id: t.id,
        accountId: t.account_id,
        description: t.description,
        amount: t.amount,
        categoryId: t.category_id,
        date: t.date,
        type: t.type
      }));
      setTransactions(mappedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

      // Fetch Recurring
      const { data: recurringData, error: recError } = await supabase.from('recurring_transactions').select('*');
      if (recError) throw recError;

      const mappedRecurring: RecurringTransaction[] = recurringData.map(r => ({
        id: r.id,
        accountId: r.account_id,
        description: r.description,
        amount: r.amount,
        categoryId: r.category_id,
        type: r.type,
        frequency: r.frequency,
        startDate: r.start_date,
        nextDueDate: r.next_due_date
      }));
      setRecurringTransactions(mappedRecurring);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoadingData(false);
      setInitialFetchComplete(true);
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session, fetchData]);

  // Check if first account needs to be created
  useEffect(() => {
      // Only trigger if we have completed the initial fetch and still have no accounts
      if (initialFetchComplete && session && accounts.length === 0) {
          setFirstAccountModalOpen(true);
      }
  }, [accounts, initialFetchComplete, session]);

  // Generate recurring transactions Logic
  useEffect(() => {
    if (!session || recurringTransactions.length === 0) return;
    
    const checkRecurring = async () => {
        const today = new Date();
        const newTransactions: any[] = [];
        const updatesToRecurring: any[] = [];
        let hasChanges = false;

        recurringTransactions.forEach(rt => {
            let nextDueDate = new Date(rt.nextDueDate);
            let currentDatePointer = new Date(nextDueDate);

            if (currentDatePointer <= today) {
                while (currentDatePointer <= today) {
                    hasChanges = true;
                    newTransactions.push({
                        user_id: session.user.id,
                        account_id: rt.accountId,
                        description: rt.description,
                        amount: rt.amount,
                        type: rt.type,
                        category_id: rt.categoryId,
                        date: currentDatePointer.toISOString(),
                    });
                    
                    switch (rt.frequency) {
                        case 'weekly': currentDatePointer.setDate(currentDatePointer.getDate() + 7); break;
                        case 'monthly': currentDatePointer.setMonth(currentDatePointer.getMonth() + 1); break;
                        case 'annually': currentDatePointer.setFullYear(currentDatePointer.getFullYear() + 1); break;
                    }
                }
                updatesToRecurring.push({
                    id: rt.id,
                    next_due_date: currentDatePointer.toISOString()
                });
            }
        });

        if (hasChanges) {
            if (newTransactions.length > 0) {
                await supabase.from('transactions').insert(newTransactions);
            }
            if (updatesToRecurring.length > 0) {
                for (const update of updatesToRecurring) {
                    await supabase.from('recurring_transactions').update({ next_due_date: update.next_due_date }).eq('id', update.id);
                }
            }
            fetchData(); 
        }
    };
    
    checkRecurring();
  }, [recurringTransactions, session, fetchData]); 

  
  const availableYears = useMemo(() => {
    const years = new Set(transactions.map(t => new Date(t.date).getFullYear()));
    years.add(new Date().getFullYear());
    return Array.from(years).sort((a: number, b: number) => b - a);
  }, [transactions]);
  
  const selectedAccountCurrency = useMemo(() => {
      if (selectedAccountId === 'all') return undefined;
      return accounts.find(a => a.id === selectedAccountId)?.currency;
  }, [selectedAccountId, accounts]);

  const filteredTransactions = useMemo(() => {
    const accountFiltered = selectedAccountId === 'all'
      ? transactions
      : transactions.filter(t => t.accountId === selectedAccountId);

    const dateFiltered = accountFiltered.filter(t => {
      const transactionDate = new Date(t.date);
      if (filter.mode === 'month') {
        if (filter.year !== transactionDate.getFullYear()) return false;
        if (filter.month === 'all') return true;
        return transactionDate.getMonth() === filter.month;
      }
      if (filter.mode === 'range') {
        const txTime = transactionDate.getTime();
        if (filter.startDate) {
          if (txTime < new Date(filter.startDate).getTime()) return false;
        }
        if (filter.endDate) {
          const endOfDay = new Date(filter.endDate);
          endOfDay.setHours(23, 59, 59, 999);
          if (txTime > endOfDay.getTime()) return false;
        }
        return true;
      }
      return true;
    });
    
    const typeFiltered = typeFilter === 'all'
      ? dateFiltered
      : dateFiltered.filter(t => t.type === typeFilter);

    if (!searchQuery) return typeFiltered;
    const lowerCaseQuery = searchQuery.toLowerCase();
    return typeFiltered.filter(t => 
      t.description.toLowerCase().includes(lowerCaseQuery) ||
      (t.categoryId && categories.find(c => c.id === t.categoryId)?.name.toLowerCase().includes(lowerCaseQuery))
    );
  }, [transactions, filter, typeFilter, searchQuery, categories, selectedAccountId]);

  const currentBalance = useMemo(() => {
    if (selectedAccountId === 'all') return NaN;
    
    const targetAccount = accounts.find(a => a.id === selectedAccountId);
    if (!targetAccount) return 0;
    
    const initialBalance = targetAccount.initialBalance;
    
    const relevantTransactions = transactions.filter(t => t.accountId === selectedAccountId);

    const netFromTransactions = relevantTransactions.reduce((acc, t) => {
        return t.type === 'income' ? acc + t.amount : acc - t.amount;
    }, 0);
    
    return initialBalance + netFromTransactions;
  }, [accounts, transactions, selectedAccountId]);
  
  const transactionToDelete = useMemo(() => transactions.find(t => t.id === deletingTransactionId), [deletingTransactionId, transactions]);
  const recurringTransactionToDelete = useMemo(() => recurringTransactions.find(rt => rt.id === deletingRecurringId), [deletingRecurringId, recurringTransactions]);
  const accountToDelete = useMemo(() => accounts.find(acc => acc.id === deletingAccountId), [deletingAccountId, accounts]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) setProfileMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // CRUD Handlers
  const handleOpenAddTransactionModal = () => {
    setEditingTransaction(null);
    setAddTransactionModalOpen(true);
  };

  const handleEditTransactionClick = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setAddTransactionModalOpen(true);
  };

  const handleDeleteTransaction = (id: string) => {
    setDeletingTransactionId(id);
  };

  const handleTransactionFormSubmit = async (data: Omit<Transaction, 'id'> | Transaction, recurring?: { frequency: 'weekly' | 'monthly' | 'annually' }) => {
    if (!session) return;
    
    try {
        if ('id' in data) {
            const { error } = await supabase.from('transactions').update({
                account_id: data.accountId,
                category_id: data.categoryId,
                description: data.description,
                amount: data.amount,
                date: data.date,
                type: data.type
            }).eq('id', data.id);
            if (error) throw error;
        } else {
            const { error } = await supabase.from('transactions').insert([{
                user_id: session.user.id,
                account_id: data.accountId,
                category_id: data.categoryId,
                description: data.description,
                amount: data.amount,
                date: data.date,
                type: data.type
            }]);
            if (error) throw error;
        }

        if (recurring) {
            const startDate = new Date(data.date);
            startDate.setUTCHours(12, 0, 0, 0);
            const nextDueDate = new Date(startDate);
            switch (recurring.frequency) {
                case 'weekly': nextDueDate.setDate(nextDueDate.getDate() + 7); break;
                case 'monthly': nextDueDate.setMonth(nextDueDate.getMonth() + 1); break;
                case 'annually': nextDueDate.setFullYear(nextDueDate.getFullYear() + 1); break;
            }
            
            const { error: recError } = await supabase.from('recurring_transactions').insert([{
                user_id: session.user.id,
                account_id: data.accountId,
                category_id: data.categoryId,
                description: data.description,
                amount: data.amount,
                type: data.type,
                frequency: recurring.frequency,
                start_date: startDate.toISOString(),
                next_due_date: nextDueDate.toISOString()
            }]);
            if (recError) throw recError;
        }

        fetchData();
        setAddTransactionModalOpen(false);
        setEditingTransaction(null);
    } catch (e) {
        alert("Errore nel salvataggio della transazione.");
        console.error(e);
    }
  };

  const confirmDeleteTransaction = async () => {
    if (!deletingTransactionId) return;
    try {
        const { error } = await supabase.from('transactions').delete().eq('id', deletingTransactionId);
        if (error) throw error;
        setTransactions(prev => prev.filter(t => t.id !== deletingTransactionId));
        setDeletingTransactionId(null);
    } catch (e) {
        alert("Errore durante l'eliminazione.");
        console.error(e);
    }
  };

  const handleAddAccount = async (account: Omit<Account, 'id'>) => {
    if (!session) return;
    try {
        const { error } = await supabase.from('accounts').insert([{
            user_id: session.user.id,
            name: account.name,
            initial_balance: account.initialBalance,
            currency: account.currency
        }]);
        if (error) throw error;
        fetchData();
        if (isFirstAccountModalOpen) {
            setFirstAccountModalOpen(false);
        }
    } catch (e) {
        alert("Errore creazione conto.");
        console.error(e);
    }
  };

  const handleUpdateAccount = async (updatedAccount: Account) => {
      try {
          const { error } = await supabase.from('accounts').update({
              name: updatedAccount.name,
              initial_balance: updatedAccount.initialBalance,
              currency: updatedAccount.currency
          }).eq('id', updatedAccount.id);
          if (error) throw error;
          fetchData();
      } catch(e) { console.error(e); }
  };
  
  const handleDeleteAccount = (id: string) => setDeletingAccountId(id);

  const confirmDeleteAccount = async () => {
    if (!deletingAccountId) return;
    try {
        const { error } = await supabase.from('accounts').delete().eq('id', deletingAccountId);
        if (error) throw error;
        
        fetchData();
        if (selectedAccountId === deletingAccountId) {
            setSelectedAccountId('all');
        }
        setDeletingAccountId(null);
    } catch(e) {
        alert("Errore eliminazione conto.");
        console.error(e);
    }
  };


  const handleAddCategory = async (category: Omit<Category, 'id'>) => {
      if (!session) return;
      try {
          const { error } = await supabase.from('categories').insert([{
              user_id: session.user.id,
              name: category.name,
              color: category.color
          }]);
          if (error) throw error;
          fetchData();
      } catch(e) { console.error(e); }
  };

  const handleUpdateCategory = async (updated: Category) => {
      try {
          const { error } = await supabase.from('categories').update({
              name: updated.name,
              color: updated.color
          }).eq('id', updated.id);
          if (error) throw error;
          fetchData();
      } catch(e) { console.error(e); }
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questa categoria?')) {
        try {
            const { error } = await supabase.from('categories').delete().eq('id', id);
            if (error) throw error;
            fetchData();
        } catch(e) { console.error(e); }
    }
  };

  const handleUpdateRecurringTransaction = async (updated: RecurringTransaction) => {
      try {
          const { error } = await supabase.from('recurring_transactions').update({
              description: updated.description,
              amount: updated.amount,
              category_id: updated.categoryId
          }).eq('id', updated.id);
          if (error) throw error;
          fetchData();
      } catch(e) { console.error(e); }
  };

  const handleDeleteRecurringTransaction = (id: string) => setDeletingRecurringId(id);
  const confirmDeleteRecurringTransaction = async () => {
    if (!deletingRecurringId) return;
    try {
        const { error } = await supabase.from('recurring_transactions').delete().eq('id', deletingRecurringId);
        if (error) throw error;
        setRecurringTransactions(prev => prev.filter(rt => rt.id !== deletingRecurringId));
        setDeletingRecurringId(null);
    } catch(e) { console.error(e); }
  };

  const handleSignOut = async () => {
      await supabase.auth.signOut();
      setSession(null);
      setAccounts([]);
      setTransactions([]);
      setCategories([]);
      setProfileMenuOpen(false);
      setInitialFetchComplete(false);
  };

  const handleExportCSV = () => {
    const headers = ['ID_Transazione', 'ID_Conto', 'Nome_Conto', 'Descrizione', 'Importo', 'Valuta', 'Tipo', 'Categoria', 'Data'];
    const rows = transactions.map(t => {
        const account = accounts.find(a => a.id === t.accountId);
        const category = t.type === 'expense' ? categories.find(c => c.id === t.categoryId)?.name || 'Altro' : '';
        return [ t.id, t.accountId, `"${account?.name.replace(/"/g, '""')}"`, `"${t.description.replace(/"/g, '""')}"`, t.amount, account?.currency, t.type, category, new Date(t.date).toLocaleString('it-IT') ].join(',');
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `transazioni_${new Date().toISOString().slice(0, 10)}.csv`);
    link.click();
    setProfileMenuOpen(false);
  };
  
  const handleImportCSVClick = () => {
    setImportModalOpen(true);
    setProfileMenuOpen(false);
  };
  
  const handleImportedTransactions = async (
    transactionsToImport: (Omit<Transaction, 'id'> & { categoryName?: string })[],
    newCategories: Omit<Category, 'id'>[]
  ) => {
    if (!session) return;
    
    try {
        setLoadingData(true);
        // 1. Create new categories
        const createdCategoriesMap = new Map<string, string>(); // Name -> ID
        if (newCategories.length > 0) {
            const { data: createdCats, error: catError } = await supabase.from('categories').insert(
                newCategories.map(c => ({ user_id: session.user.id, name: c.name, color: c.color }))
            ).select();
            if (catError) throw catError;
            if (createdCats) {
                createdCats.forEach(c => createdCategoriesMap.set(c.name.toLowerCase(), c.id));
            }
        }
        
        const currentCategories = [...categories]; 

        // 2. Prepare transactions
        const dbTransactions = transactionsToImport.map(t => {
            let categoryId = t.categoryId;
            if (t.type === 'expense' && t.categoryName && !categoryId) {
                const newId = createdCategoriesMap.get(t.categoryName.toLowerCase());
                if (newId) categoryId = newId;
                else {
                    const existing = currentCategories.find(c => c.name.toLowerCase() === t.categoryName?.toLowerCase());
                    if (existing) categoryId = existing.id;
                }
            }
            
            return {
                user_id: session.user.id,
                account_id: t.accountId,
                category_id: categoryId,
                description: t.description,
                amount: t.amount,
                date: t.date,
                type: t.type
            };
        });

        const { error: txError } = await supabase.from('transactions').insert(dbTransactions);
        if (txError) throw txError;

        alert(`Importazione completata con successo!`);
        fetchData();
        setImportModalOpen(false);
    } catch (e) {
        alert("Errore durante l'importazione.");
        console.error(e);
    } finally {
        setLoadingData(false);
    }
  };
  
  const handleDeleteAllData = async () => {
    if (!session) return;
    try {
        await supabase.from('accounts').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
        await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        fetchData();
        setDeleteConfirmationOpen(false);
        setProfileMenuOpen(false);
    } catch(e) {
        console.error(e);
        alert("Impossibile eliminare tutti i dati.");
    }
  };

  // Render Login if no session
  if (!session) {
    return <Auth />;
  }
  
  // Loading screen
  if (loadingData && accounts.length === 0 && categories.length === 0) {
      return (
          <div className="flex items-center justify-center min-h-screen bg-slate-50">
              <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <p className="text-slate-600">Caricamento dati...</p>
              </div>
          </div>
      );
  }

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-800">
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-start sm:items-center">
            <div className="flex-grow">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Gestore Finanziario
              </h1>
              {accounts.length > 0 ? (
                <div className="mt-2">
                    <label htmlFor="account-selector" className="sr-only">Seleziona Conto</label>
                    <select
                        id="account-selector"
                        value={selectedAccountId}
                        onChange={(e) => setSelectedAccountId(e.target.value)}
                        className="bg-slate-100 border-slate-300 rounded-md shadow-sm pl-3 pr-8 py-1 text-sm font-medium text-slate-700 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="all">Tutti i conti</option>
                        {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                    </select>
                </div>
              ) : (
                 <p className="text-slate-500 mt-1">Crea il tuo primo conto per iniziare.</p>
              )}
            </div>
            <div className="relative flex-shrink-0" ref={profileMenuRef}>
              <button
                  onClick={() => setProfileMenuOpen(prev => !prev)}
                  className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  aria-label="Apri menu utente"
              >
                  <UserCircleIcon className="w-8 h-8" />
              </button>
              {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 py-2 z-30">
                       <div className="px-4 py-3 text-sm text-slate-500 border-b border-slate-100 mb-2">
                           Loggato come <br/>
                           <span className="font-medium text-slate-900 truncate block">{session.user.email}</span>
                       </div>
                       <button onClick={() => { setAccountsModalOpen(true); setProfileMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-100">
                          <BuildingLibraryIcon className="w-5 h-5 text-slate-500" />
                          Gestisci Conti
                      </button>
                       <button onClick={() => { setCategoriesModalOpen(true); setProfileMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-100">
                          <TagIcon className="w-5 h-5 text-slate-500" />
                          Gestisci Categorie
                      </button>
                      <button onClick={() => { setRecurringModalOpen(true); setProfileMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-100">
                          <ArrowPathIcon className="w-5 h-5 text-slate-500" />
                          Gestisci Ricorrenti
                      </button>
                      <hr className="my-1 border-slate-100"/>
                      <button onClick={handleImportCSVClick} className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-100">
                          <ArrowUpTrayIcon className="w-5 h-5 text-slate-500" />
                          Importa CSV
                      </button>
                      <button onClick={handleExportCSV} className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-100">
                          <ArrowDownTrayIcon className="w-5 h-5 text-slate-500" />
                          Esporta CSV
                      </button>
                       <hr className="my-1 border-slate-100"/>
                       <button onClick={() => { setUpdatePasswordModalOpen(true); setProfileMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-100">
                          <KeyIcon className="w-5 h-5 text-slate-500" />
                          Cambia Password
                      </button>
                      <hr className="my-1 border-slate-100"/>
                      <button onClick={handleSignOut} className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-100">
                          <span className="w-5 h-5 flex items-center justify-center font-bold text-slate-500">→</span>
                          Esci
                      </button>
                      <hr className="my-1 border-slate-100"/>
                      <button onClick={() => { setDeleteConfirmationOpen(true); setProfileMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50">
                          <ExclamationTriangleIcon className="w-5 h-5" />
                          <span>Reset Account</span>
                      </button>
                  </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <Dashboard 
          currentBalance={currentBalance}
          filteredTransactions={filteredTransactions}
          categories={categories} 
          filter={filter}
          currency={selectedAccountCurrency}
          view={selectedAccountId === 'all' ? 'all_accounts' : 'single_account'}
        />

        <div className="mt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Ultime Transazioni</h2>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => setAnalysisModalOpen(true)}
                        className="flex items-center justify-center gap-2 bg-amber-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-amber-600 transition-colors w-full sm:w-auto"
                        disabled={filteredTransactions.length === 0}
                    >
                        <LightBulbIcon className="w-5 h-5" />
                        <span>Analisi Finanziaria</span>
                    </button>
                    <button
                        onClick={handleOpenAddTransactionModal}
                        className="flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700 transition-colors w-full sm:w-auto"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span>Aggiungi Transazione</span>
                    </button>
                </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
                <div className="w-full md:flex-grow">
                    <SearchBar query={searchQuery} onQueryChange={setSearchQuery} />
                </div>
                <div className="w-full md:w-auto flex-shrink-0">
                  <TransactionFilter 
                      filter={filter}
                      onFilterChange={setFilter}
                      availableYears={availableYears}
                      typeFilter={typeFilter}
                      onTypeFilterChange={setTypeFilter}
                  />
                </div>
            </div>
            <TransactionList 
              transactions={filteredTransactions} 
              categories={categories}
              onEdit={handleEditTransactionClick}
              onDelete={handleDeleteTransaction}
              accounts={accounts}
              showAccountName={selectedAccountId === 'all'}
            />
        </div>
      </main>

      {isAddTransactionModalOpen && (
        <TransactionForm 
          onClose={() => setAddTransactionModalOpen(false)} 
          onSubmit={handleTransactionFormSubmit}
          categories={categories}
          transactionToEdit={editingTransaction}
          accounts={accounts}
          selectedAccountId={selectedAccountId}
        />
      )}

      {isCategoriesModalOpen && (
        <ManageCategoriesModal
          isOpen={isCategoriesModalOpen}
          onClose={() => setCategoriesModalOpen(false)}
          categories={categories}
          onAddCategory={handleAddCategory}
          onUpdateCategory={handleUpdateCategory}
          onDeleteCategory={handleDeleteCategory}
        />
      )}

      {isRecurringModalOpen && (
        <ManageRecurringTransactionsModal
          isOpen={isRecurringModalOpen}
          onClose={() => setRecurringModalOpen(false)}
          recurringTransactions={recurringTransactions}
          categories={categories}
          onUpdate={handleUpdateRecurringTransaction}
          onDelete={handleDeleteRecurringTransaction}
          accounts={accounts}
        />
      )}

      {isAccountsModalOpen && (
        <ManageAccountsModal
          isOpen={isAccountsModalOpen}
          onClose={() => setAccountsModalOpen(false)}
          accounts={accounts}
          onAddAccount={handleAddAccount}
          onUpdateAccount={handleUpdateAccount}
          onDeleteAccount={handleDeleteAccount}
        />
      )}
      
      {isFirstAccountModalOpen && (
        <ManageAccountsModal
          isOpen={isFirstAccountModalOpen}
          onClose={() => { if(accounts.length > 0) setFirstAccountModalOpen(false) }}
          accounts={[]}
          onAddAccount={handleAddAccount}
          onUpdateAccount={() => {}}
          onDeleteAccount={() => {}}
        />
      )}

      {isImportModalOpen && (
        <ImportCSVModal
          isOpen={isImportModalOpen}
          onClose={() => setImportModalOpen(false)}
          onImport={handleImportedTransactions}
          accounts={accounts}
          categories={categories}
          transactions={transactions}
        />
      )}

      {isAnalysisModalOpen && (
        <FinancialAnalysisModal
          isOpen={isAnalysisModalOpen}
          onClose={() => setAnalysisModalOpen(false)}
          transactions={filteredTransactions}
          categories={categories}
          filter={filter}
        />
      )}
      
      {isUpdatePasswordModalOpen && (
        <UpdatePasswordModal
          isOpen={isUpdatePasswordModalOpen}
          onClose={() => setUpdatePasswordModalOpen(false)}
        />
      )}

      {isDeleteConfirmationOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md m-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-4">Eliminare tutti i dati?</h2>
              <p className="mt-2 text-slate-600">Questa azione è permanente e eliminerà tutti i conti e le transazioni dal server per questo account.</p>
            </div>
            <div className="mt-8 flex justify-center gap-4">
               <button onClick={() => setDeleteConfirmationOpen(false)} className="bg-white text-slate-700 font-semibold py-2 px-6 rounded-lg border border-slate-300 hover:bg-slate-100">Annulla</button>
              <button onClick={handleDeleteAllData} className="bg-red-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-red-700">Sì, elimina tutto</button>
            </div>
          </div>
        </div>
      )}

      {transactionToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md m-4">
              <h2 className="text-xl font-bold text-slate-900">Conferma Eliminazione</h2>
              <p className="mt-4 text-slate-600">Sei sicuro di voler eliminare la transazione "<strong>{transactionToDelete.description}</strong>"?</p>
            <div className="mt-8 flex justify-end gap-4">
               <button onClick={() => setDeletingTransactionId(null)} className="bg-white text-slate-700 font-semibold py-2 px-6 rounded-lg border border-slate-300 hover:bg-slate-100">Annulla</button>
              <button onClick={confirmDeleteTransaction} className="bg-red-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-red-700">Sì, elimina</button>
            </div>
          </div>
        </div>
      )}
      
      {recurringTransactionToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md m-4">
            <h2 className="text-xl font-bold text-slate-900">Conferma Eliminazione</h2>
            <p className="mt-4 text-slate-600">Sei sicuro di voler eliminare la transazione ricorrente "<strong>{recurringTransactionToDelete.description}</strong>"?</p>
            <div className="mt-8 flex justify-end gap-4">
               <button onClick={() => setDeletingRecurringId(null)} className="bg-white text-slate-700 font-semibold py-2 px-6 rounded-lg border border-slate-300 hover:bg-slate-100">Annulla</button>
              <button onClick={confirmDeleteRecurringTransaction} className="bg-red-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-red-700">Sì, elimina</button>
            </div>
          </div>
        </div>
      )}

      {accountToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md m-4">
            <h2 className="text-xl font-bold text-slate-900">Conferma Eliminazione Conto</h2>
            <p className="mt-4 text-slate-600">Sei sicuro di voler eliminare il conto "<strong>{accountToDelete.name}</strong>"? Verranno eliminate anche <strong>tutte le transazioni associate</strong>. Questa azione non può essere annullata.</p>
            <div className="mt-8 flex justify-end gap-4">
               <button onClick={() => setDeletingAccountId(null)} className="bg-white text-slate-700 font-semibold py-2 px-6 rounded-lg border border-slate-300 hover:bg-slate-100">Annulla</button>
              <button onClick={confirmDeleteAccount} className="bg-red-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-red-700">Sì, elimina</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
