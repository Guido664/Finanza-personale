import React, { useState, useEffect } from 'react';
import type { RecurringTransaction, Category, Account } from '../types';
import { PencilSquareIcon, TrashIcon } from './Icons';
import { CURRENCIES } from '../constants';

interface ManageRecurringTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  recurringTransactions: RecurringTransaction[];
  onUpdate: (transaction: RecurringTransaction) => void;
  onDelete: (transactionId: string) => void;
  categories: Category[];
  accounts: Account[];
}

const FREQUENCY_MAP: { [key in RecurringTransaction['frequency']]: string } = {
  weekly: 'Settimanale',
  monthly: 'Mensile',
  annually: 'Annuale',
};

const ManageRecurringTransactionsModal: React.FC<ManageRecurringTransactionsModalProps> = ({
  isOpen,
  onClose,
  recurringTransactions,
  onUpdate,
  onDelete,
  categories,
  accounts,
}) => {
  const [editingTransaction, setEditingTransaction] = useState<RecurringTransaction | null>(null);
  
  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [error, setError] = useState('');

  const editingAccount = editingTransaction ? accounts.find(a => a.id === editingTransaction.accountId) : null;
  const currencySymbol = CURRENCIES.find(c => c.code === editingAccount?.currency)?.symbol || '€';

  useEffect(() => {
    if (editingTransaction) {
      setDescription(editingTransaction.description);
      setAmount(String(editingTransaction.amount));
      setCategoryId(editingTransaction.categoryId || '');
      setError('');
    } else {
      // Reset form
      setDescription('');
      setAmount('');
      setCategoryId('');
      setError('');
    }
  }, [editingTransaction]);

  if (!isOpen) return null;

  const handleEditClick = (transaction: RecurringTransaction) => {
    setEditingTransaction(transaction);
  };

  const handleCancelEdit = () => {
    setEditingTransaction(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;

    const parsedAmount = parseFloat(amount);
    if (!description.trim() || !amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Descrizione e importo sono obbligatori.');
      return;
    }

    onUpdate({
      ...editingTransaction,
      description,
      amount: parsedAmount,
      categoryId: categoryId || undefined,
    });
    setEditingTransaction(null);
  };
  
  const formatCurrency = (value: number, currencyCode: string) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: currencyCode }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 p-4 pt-16 overflow-y-auto">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-6 text-slate-900">Gestisci Transazioni Ricorrenti</h2>
        
        {editingTransaction && (
          <form onSubmit={handleSubmit} className="mb-8 p-4 border rounded-lg bg-slate-50">
             <h3 className="text-lg font-semibold mb-4">Modifica Transazione Ricorrente</h3>
             {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">{error}</p>}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label htmlFor="rec-description" className="block text-sm font-medium text-slate-700 mb-1">Descrizione</label>
                      <input id="rec-description" type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                      <label htmlFor="rec-amount" className="block text-sm font-medium text-slate-700 mb-1">Importo ({currencySymbol})</label>
                      <input id="rec-amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  {editingTransaction.type === 'expense' && (
                     <div>
                        <label htmlFor="rec-category" className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                        <select id="rec-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                          {categories.map(category => (<option key={category.id} value={category.id}>{category.name}</option>))}
                        </select>
                      </div>
                  )}
             </div>
              <div className="mt-6 flex justify-end gap-2">
                  <button type="button" onClick={handleCancelEdit} className="bg-white text-slate-700 font-semibold py-2 px-4 rounded-lg border border-slate-300 hover:bg-slate-100">Annulla</button>
                  <button type="submit" className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 flex-shrink-0">Salva Modifiche</button>
              </div>
          </form>
        )}

        <h3 className="text-lg font-semibold mb-4">Transazioni Programmate</h3>
        <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
            {recurringTransactions.length > 0 ? recurringTransactions.map(rt => {
                const isExpense = rt.type === 'expense';
                const category = isExpense ? categories.find(c => c.id === rt.categoryId) : null;
                const account = accounts.find(a => a.id === rt.accountId);
                return (
                  <div key={rt.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-8 rounded-full ${isExpense ? '' : 'bg-green-500'}`} style={{ backgroundColor: isExpense ? category?.color : undefined }}></span>
                          <div>
                            <p className="font-semibold text-slate-800">{rt.description} {account && <span className="text-xs bg-slate-200 text-slate-600 rounded-full px-2 py-0.5 ml-1 font-normal">{account.name}</span>}</p>
                            <p className="text-sm text-slate-500">
                              Prossima: {formatDate(rt.nextDueDate)} &bull; {FREQUENCY_MAP[rt.frequency]}
                            </p>
                          </div>
                      </div>
                      <div className="flex items-center gap-3">
                          <p className={`font-bold text-lg ${isExpense ? 'text-red-600' : 'text-green-600'}`}>
                            {isExpense ? '-' : '+'}
                            {formatCurrency(rt.amount, account?.currency || 'EUR')}
                          </p>
                          <div className="flex items-center gap-1">
                              <button onClick={() => handleEditClick(rt)} className="text-slate-500 hover:text-indigo-600 p-1 rounded-md" aria-label="Modifica"><PencilSquareIcon className="w-5 h-5" /></button>
                              <button onClick={() => onDelete(rt.id)} className="text-slate-500 hover:text-red-600 p-1 rounded-md" aria-label="Elimina"><TrashIcon className="w-5 h-5" /></button>
                          </div>
                      </div>
                  </div>
                )
             }) : (
                <p className="text-center text-slate-500 py-8">Nessuna transazione ricorrente impostata.</p>
             )}
        </div>

        <div className="mt-8 flex justify-end">
            <button type="button" onClick={onClose} className="bg-white text-slate-700 font-semibold py-2 px-6 rounded-lg border border-slate-300 hover:bg-slate-100">Chiudi</button>
        </div>
      </div>
    </div>
  );
};

export default ManageRecurringTransactionsModal;