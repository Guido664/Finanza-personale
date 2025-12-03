import React from 'react';
import type { Transaction, Category, Account } from '../types';
import { PencilSquareIcon, TrashIcon } from './Icons';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transactionId: string) => void;
  accounts: Account[];
  showAccountName: boolean;
}

const TransactionItem: React.FC<{ 
  transaction: Transaction; 
  categories: Category[];
  account?: Account;
  showAccountName: boolean;
}> = ({ transaction, categories, account, showAccountName }) => {
  const isExpense = transaction.type === 'expense';
  
  const category = isExpense 
    ? categories.find(c => c.id === transaction.categoryId) || { name: 'Altro', color: '#6b7280' }
    : { name: 'Entrata', color: '#10b981' };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatCurrency = (value: number, currencyCode: string) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: currencyCode }).format(value);
  };
  
  return (
    <li className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors duration-200 rounded-lg group">
        <div className="flex items-center gap-4">
            <span className="w-3 h-10 rounded-full" style={{ backgroundColor: category.color }}></span>
            <div>
                <p className="font-semibold text-slate-800">{transaction.description}</p>
                <p className="text-sm text-slate-500">
                  {category.name} &bull; {formatDate(transaction.date)}
                  {showAccountName && account && <span className="text-xs bg-slate-200 text-slate-600 rounded-full px-2 py-0.5 ml-2">{account.name}</span>}
                </p>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <p className={`font-bold text-right text-lg ${isExpense ? 'text-red-600' : 'text-green-600'}`}>
                {isExpense ? '-' : '+'}
                {formatCurrency(transaction.amount, account?.currency || 'EUR')}
            </p>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button data-edit-id={transaction.id} className="text-slate-500 hover:text-indigo-600 p-2 rounded-full hover:bg-slate-200 transition-colors" aria-label={`Modifica ${transaction.description}`}>
                    <PencilSquareIcon className="w-5 h-5 pointer-events-none" />
                </button>
                <button data-delete-id={transaction.id} className="text-slate-500 hover:text-red-600 p-2 rounded-full hover:bg-slate-200 transition-colors" aria-label={`Elimina ${transaction.description}`}>
                    <TrashIcon className="w-5 h-5 pointer-events-none" />
                </button>
            </div>
        </div>
    </li>
  );
};

const TransactionList: React.FC<TransactionListProps> = ({ transactions, categories, onEdit, onDelete, accounts, showAccountName }) => {
  
  const handleListClick = (event: React.MouseEvent<HTMLUListElement>) => {
    const target = event.target as HTMLElement;
    const button = target.closest('button');
    if (!button) return;

    const { editId, deleteId } = button.dataset;
    const transactionId = editId || deleteId;
    if (!transactionId) return;

    if (editId) {
        const transactionToEdit = transactions.find(t => t.id === editId);
        if (transactionToEdit) onEdit(transactionToEdit);
    } else if (deleteId) {
        onDelete(deleteId);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {transactions.length > 0 ? (
        <ul className="divide-y divide-slate-200" onClick={handleListClick}>
          {transactions.map(transaction => (
            <TransactionItem 
              key={transaction.id} 
              transaction={transaction} 
              categories={categories}
              account={accounts.find(a => a.id === transaction.accountId)}
              showAccountName={showAccountName}
            />
          ))}
        </ul>
      ) : (
        <div className="text-center p-10">
          <p className="text-slate-500">Nessuna transazione trovata.</p>
          <p className="text-slate-400 text-sm mt-1">Prova a modificare i filtri o aggiungi una nuova transazione.</p>
        </div>
      )}
    </div>
  );
};

export default TransactionList;