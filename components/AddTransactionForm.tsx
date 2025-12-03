
import React, { useState, useEffect } from 'react';
import type { Transaction, Category, Account } from '../types';
import { CURRENCIES } from '../constants';

interface TransactionFormProps {
  onClose: () => void;
  onSubmit: (
    transaction: Omit<Transaction, 'id'> | Transaction,
    recurring?: { frequency: 'weekly' | 'monthly' | 'annually' }
  ) => void;
  categories: Category[];
  transactionToEdit?: Transaction | null;
  accounts: Account[];
  selectedAccountId: string | 'all';
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onClose, onSubmit, categories, transactionToEdit, accounts, selectedAccountId }) => {
  const isEditing = !!transactionToEdit;

  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState(categories.length > 0 ? categories[0].id : '');
  const [accountId, setAccountId] = useState(() => {
    if (isEditing) return transactionToEdit.accountId;
    if (selectedAccountId !== 'all') return selectedAccountId;
    return accounts.length > 0 ? accounts[0].id : '';
  });
  const [error, setError] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<'weekly' | 'monthly' | 'annually'>('monthly');
  
  const selectedAccount = accounts.find(a => a.id === accountId);
  const currencySymbol = CURRENCIES.find(c => c.code === selectedAccount?.currency)?.symbol || '€';


  useEffect(() => {
    if (transactionToEdit) {
      setTransactionType(transactionToEdit.type);
      setDescription(transactionToEdit.description);
      setAmount(String(transactionToEdit.amount));
      setDate(new Date(transactionToEdit.date).toISOString().split('T')[0]);
      setCategoryId(transactionToEdit.categoryId || (categories.length > 0 ? categories[0].id : ''));
      setAccountId(transactionToEdit.accountId);
      setIsRecurring(false);
    } else {
        const defaultAccountId = selectedAccountId !== 'all' ? selectedAccountId : (accounts.length > 0 ? accounts[0].id : '');
        setAccountId(defaultAccountId);
    }
  }, [transactionToEdit, categories, accounts, selectedAccountId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!description.trim() || !amount || isNaN(parsedAmount) || parsedAmount <= 0 || !date) {
      setError('Per favore, compila tutti i campi con valori validi.');
      return;
    }
    if (!accountId) {
        setError('Per favore, seleziona un conto.');
        return;
    }
    
    let transactionData: Omit<Transaction, 'id' | 'id'> & { accountId: string } | Transaction = {
      accountId,
      description,
      amount: parsedAmount,
      date: new Date(date).toISOString(),
      type: transactionType,
    };
    
    if (transactionType === 'expense') {
      if (!categoryId) {
        setError('Per favore, seleziona una categoria per la spesa.');
        return;
      }
      transactionData.categoryId = categoryId;
    }

    if (isEditing) {
      (transactionData as Transaction).id = transactionToEdit.id;
    }

    const recurringData = isRecurring ? { frequency } : undefined;
    onSubmit(transactionData, recurringData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-slate-900">{isEditing ? 'Modifica Transazione' : 'Aggiungi Nuova Transazione'}</h2>
        {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
              <div className="flex rounded-lg border border-slate-300 overflow-hidden">
                <button type="button" onClick={() => setTransactionType('expense')} className={`w-1/2 py-2 text-sm font-semibold transition-colors ${transactionType === 'expense' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50'}`}>Uscita</button>
                <button type="button" onClick={() => setTransactionType('income')} className={`w-1/2 py-2 text-sm font-semibold transition-colors ${transactionType === 'income' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-50'}`}>Entrata</button>
              </div>
            </div>
            
            <div>
              <label htmlFor="account" className="block text-sm font-medium text-slate-700 mb-1">Conto</label>
              <select
                id="account"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                disabled={isEditing}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
              >
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>{account.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">Descrizione</label>
                    <input type="text" id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder={transactionType === 'expense' ? 'Es. Caffè al bar' : 'Es. Stipendio'}/>
                </div>
                <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-slate-700 mb-1">Importo ({currencySymbol})</label>
                    <input type="number" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Es. 1.20" step="0.01" />
                </div>
                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                    <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
            </div>
            
            {transactionType === 'expense' && (
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                <select id="category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                  {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </div>
            )}
            
            <div className="pt-2">
              <div className="relative flex items-start">
                <div className="flex h-6 items-center"><input id="recurring" name="recurring" type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} disabled={isEditing} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 disabled:opacity-50" /></div>
                <div className="ml-3 text-sm leading-6">
                  <label htmlFor="recurring" className={`font-medium ${isEditing ? 'text-slate-500' : 'text-slate-900'}`}>Transazione Ricorrente</label>
                   {isEditing && <p className="text-slate-500 text-xs mt-1">La ricorrenza non è modificabile qui.</p>}
                </div>
              </div>
              {isRecurring && (
                <div className="mt-2 pl-7"><select id="frequency" value={frequency} onChange={(e) => setFrequency(e.target.value as 'weekly' | 'monthly' | 'annually')} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm">
                    <option value="weekly">Ogni settimana</option>
                    <option value="monthly">Ogni mese</option>
                    <option value="annually">Ogni anno</option>
                  </select></div>
              )}
            </div>
          </div>
          <div className="mt-8 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="bg-white text-slate-700 font-semibold py-2 px-6 rounded-lg border border-slate-300 hover:bg-slate-100">Annulla</button>
            <button type="submit" className="bg-indigo-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-indigo-700">{isEditing ? 'Salva Modifiche' : 'Aggiungi'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;