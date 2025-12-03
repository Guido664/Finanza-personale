import React, { useState, useEffect, useRef } from 'react';
import type { Account } from '../types';
import { CURRENCIES } from '../constants';
import { PencilSquareIcon, TrashIcon } from './Icons';

interface ManageAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  onAddAccount: (account: Omit<Account, 'id'>) => void;
  onUpdateAccount: (account: Account) => void;
  onDeleteAccount: (accountId: string) => void;
}

const ManageAccountsModal: React.FC<ManageAccountsModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
}) => {
  const [name, setName] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [error, setError] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingAccount) {
      setName(editingAccount.name);
      setInitialBalance(String(editingAccount.initialBalance));
      setCurrency(editingAccount.currency);
      nameInputRef.current?.focus();
    } else {
      setName('');
      setInitialBalance('');
      setCurrency('EUR');
    }
  }, [editingAccount]);
  
  useEffect(() => {
    if (!isOpen) {
        setEditingAccount(null);
        setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedBalance = parseFloat(initialBalance);
    if (!name.trim() || isNaN(parsedBalance)) {
      setError('Nome e saldo iniziale sono obbligatori e il saldo deve essere un numero.');
      return;
    }
    setError('');

    if (editingAccount) {
      onUpdateAccount({ ...editingAccount, name, initialBalance: parsedBalance, currency });
    } else {
      onAddAccount({ name, initialBalance: parsedBalance, currency });
    }
    setEditingAccount(null);
  };

  const handleEditClick = (account: Account) => {
    setEditingAccount(account);
  };

  const handleCancelEdit = () => {
    setEditingAccount(null);
  };

  const formatCurrency = (value: number, currencyCode: string) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: currencyCode }).format(value);
  };

  const selectedCurrencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol || '';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 p-4 pt-16 overflow-y-auto">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-6 text-slate-900">Gestisci Conti</h2>

        <form onSubmit={handleSubmit} className="mb-8 p-4 border rounded-lg bg-slate-50">
          <h3 className="text-lg font-semibold mb-4">{editingAccount ? 'Modifica Conto' : 'Aggiungi Nuovo Conto'}</h3>
          {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">{error}</p>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <label htmlFor="acc-name" className="block text-sm font-medium text-slate-700 mb-1">Nome Conto</label>
              <input
                ref={nameInputRef}
                id="acc-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Es. Conto Corrente"
              />
            </div>
            <div>
              <label htmlFor="acc-currency" className="block text-sm font-medium text-slate-700 mb-1">Valuta</label>
              <select
                id="acc-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="acc-balance" className="block text-sm font-medium text-slate-700 mb-1">Saldo Iniziale ({selectedCurrencySymbol})</label>
              <input
                id="acc-balance"
                type="number"
                step="0.01"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Es. 1500.00"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            {editingAccount && (
              <button type="button" onClick={handleCancelEdit} className="bg-white text-slate-700 font-semibold py-2 px-4 rounded-lg border border-slate-300 hover:bg-slate-100">Annulla</button>
            )}
            <button type="submit" className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 flex-shrink-0">
              {editingAccount ? 'Salva Modifiche' : 'Aggiungi Conto'}
            </button>
          </div>
        </form>

        <h3 className="text-lg font-semibold mb-4">Conti Esistenti</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
          {accounts.map(acc => (
            <div key={acc.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
              <div>
                <p className="font-semibold text-slate-800">{acc.name}</p>
                <p className="text-sm text-slate-500">Saldo iniziale: {formatCurrency(acc.initialBalance, acc.currency)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleEditClick(acc)} className="text-slate-500 hover:text-indigo-600 p-1 rounded-md" aria-label={`Modifica conto ${acc.name}`}>
                  <PencilSquareIcon className="w-5 h-5" />
                </button>
                <button onClick={() => onDeleteAccount(acc.id)} className="text-slate-500 hover:text-red-600 p-1 rounded-md" aria-label={`Elimina conto ${acc.name}`}>
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-white text-slate-700 font-semibold py-2 px-6 rounded-lg border border-slate-300 hover:bg-slate-100 transition-colors duration-200"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageAccountsModal;