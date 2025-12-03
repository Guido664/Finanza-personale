
import React, { useState } from 'react';
import type { Transaction, Category, Account } from '../types';
import { CURRENCIES } from '../constants';

interface AddTransactionFormProps {
  onClose: () => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  categories: Category[];
  accounts: Account[];
  selectedAccountId: string | 'all';
}

const AddTransactionForm: React.FC<AddTransactionFormProps> = ({ onClose, onAddTransaction, categories, accounts, selectedAccountId }) => {
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState(categories.length > 0 ? categories[0].id : '');
  const [accountId, setAccountId] = useState(() => {
    if (selectedAccountId !== 'all') return selectedAccountId;
    return accounts.length > 0 ? accounts[0].id : '';
  });
  const [error, setError] = useState('');

  const selectedAccount = accounts.find(a => a.id === accountId);
  const currencySymbol = CURRENCIES.find(c => c.code === selectedAccount?.currency)?.symbol || '€';

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
    
    const transactionData: Omit<Transaction, 'id'> = {
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

    onAddTransaction(transactionData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-slate-900">Aggiungi Nuova Transazione</h2>
        {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
              <div className="flex rounded-lg border border-slate-300 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setTransactionType('expense')}
                  className={`w-1/2 py-2 text-sm font-semibold transition-colors duration-200 ${transactionType === 'expense' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                >
                  Uscita
                </button>
                <button
                  type="button"
                  onClick={() => setTransactionType('income')}
                  className={`w-1/2 py-2 text-sm font-semibold transition-colors duration-200 ${transactionType === 'income' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                >
                  Entrata
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="account" className="block text-sm font-medium text-slate-700 mb-1">Conto</label>
              <select
                id="account"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>{account.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">Descrizione</label>
              <input
                type="text"
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder={transactionType === 'expense' ? 'Es. Caffè al bar' : 'Es. Stipendio Mensile'}
              />
            </div>
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-slate-700 mb-1">Importo ({currencySymbol})</label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Es. 1.20"
                step="0.01"
              />
            </div>
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-slate-700 mb-1">Data</label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            {transactionType === 'expense' && (
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                <select
                  id="category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="mt-8 flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-white text-slate-700 font-semibold py-2 px-6 rounded-lg border border-slate-300 hover:bg-slate-100 transition-colors duration-200"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="bg-indigo-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-indigo-700 transition-colors duration-200"
            >
              Aggiungi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionForm;