import React from 'react';
import type { Filter } from '../App';

interface TransactionFilterProps {
  filter: Filter;
  onFilterChange: (newFilter: Filter) => void;
  availableYears: number[];
  typeFilter: 'all' | 'income' | 'expense';
  onTypeFilterChange: (type: 'all' | 'income' | 'expense') => void;
}

const TransactionFilter: React.FC<TransactionFilterProps> = ({ filter, onFilterChange, availableYears, typeFilter, onTypeFilterChange }) => {
  const monthNames = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

  const handleModeChange = (mode: 'month' | 'range') => {
    onFilterChange({ ...filter, mode });
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10);
    onFilterChange({ ...filter, month: newMonth });
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filter, year: parseInt(e.target.value, 10) });
  };
  
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filter, startDate: e.target.value || null });
  };
  
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filter, endDate: e.target.value || null });
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-wrap">
        <div className="flex bg-slate-200 p-1 rounded-lg">
            <button 
                onClick={() => onTypeFilterChange('all')}
                className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${typeFilter === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'bg-transparent text-slate-600 hover:bg-slate-300'}`}
            >
                Tutte
            </button>
            <button 
                onClick={() => onTypeFilterChange('income')}
                className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${typeFilter === 'income' ? 'bg-white text-green-600 shadow-sm' : 'bg-transparent text-slate-600 hover:bg-slate-300'}`}
            >
                Entrate
            </button>
             <button 
                onClick={() => onTypeFilterChange('expense')}
                className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${typeFilter === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'bg-transparent text-slate-600 hover:bg-slate-300'}`}
            >
                Uscite
            </button>
        </div>

        <div className="h-6 w-px bg-slate-300 hidden sm:block"></div>

        <div className="flex items-center gap-2">
            <div className="flex bg-slate-200 p-1 rounded-lg">
                <button 
                    onClick={() => handleModeChange('month')}
                    className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${filter.mode === 'month' ? 'bg-white text-indigo-600 shadow-sm' : 'bg-transparent text-slate-600 hover:bg-slate-300'}`}
                >
                    Mese
                </button>
                <button 
                    onClick={() => handleModeChange('range')}
                    className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${filter.mode === 'range' ? 'bg-white text-indigo-600 shadow-sm' : 'bg-transparent text-slate-600 hover:bg-slate-300'}`}
                >
                    Periodo
                </button>
            </div>
            
            {filter.mode === 'month' ? (
                <div className="flex items-center gap-2">
                    <select
                        value={filter.month}
                        onChange={handleMonthChange}
                        className="bg-white border border-slate-300 rounded-md shadow-sm px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="all">Tutti i mesi</option>
                        {monthNames.map((name, index) => (
                        <option key={index} value={index}>{name}</option>
                        ))}
                    </select>
                    <select
                        value={filter.year}
                        onChange={handleYearChange}
                        className="bg-white border border-slate-300 rounded-md shadow-sm px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        {availableYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
            ) : (
                <div className="flex items-center gap-2">
                     <input
                        type="date"
                        value={filter.startDate || ''}
                        onChange={handleStartDateChange}
                        className="bg-white border border-slate-300 rounded-md shadow-sm px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                     <span className="text-slate-500">-</span>
                     <input
                        type="date"
                        value={filter.endDate || ''}
                        onChange={handleEndDateChange}
                        min={filter.startDate || ''}
                        className="bg-white border border-slate-300 rounded-md shadow-sm px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            )}
        </div>
    </div>
  );
};

export default TransactionFilter;