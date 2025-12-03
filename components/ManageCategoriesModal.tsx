import React, { useState, useEffect } from 'react';
import type { Category } from '../types';
import { PencilSquareIcon, TrashIcon } from './Icons';

interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onAddCategory: (category: Omit<Category, 'id'>) => void;
  onUpdateCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
}

const PALETTE_COLORS = [
  '#ef4444', // red-500
  '#f97316', // orange-500
  '#f59e0b', // amber-500
  '#10b981', // emerald-500
  '#14b8a6', // teal-500
  '#38bdf8', // sky-500
  '#6366f1', // indigo-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#6b7280', // gray-500
];

const ManageCategoriesModal: React.FC<ManageCategoriesModalProps> = ({ isOpen, onClose, categories, onAddCategory, onUpdateCategory, onDeleteCategory }) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState(PALETTE_COLORS[0]);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name);
      setColor(editingCategory.color);
    } else {
      setName('');
      setColor(PALETTE_COLORS[0]);
    }
  }, [editingCategory]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Il nome della categoria non può essere vuoto.');
      return;
    }
    setError('');

    if (editingCategory) {
      onUpdateCategory({ ...editingCategory, name, color });
    } else {
      onAddCategory({ name, color });
    }
    setEditingCategory(null);
  };

  const handleEditClick = (category: Category) => {
    setEditingCategory(category);
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 p-4 pt-16 overflow-y-auto">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6 text-slate-900">Gestisci Categorie</h2>
        
        <form onSubmit={handleSubmit} className="mb-8 p-4 border rounded-lg bg-slate-50">
           <h3 className="text-lg font-semibold mb-4">{editingCategory ? 'Modifica Categoria' : 'Aggiungi Nuova Categoria'}</h3>
           {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">{error}</p>}
           <div className="space-y-4">
                <div>
                    <label htmlFor="cat-name" className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                    <input
                        id="cat-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Es. Svago"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Colore</label>
                    <div className="flex flex-wrap gap-3 mt-2">
                      {PALETTE_COLORS.map((paletteColor) => (
                        <button
                          type="button"
                          key={paletteColor}
                          onClick={() => setColor(paletteColor)}
                          className={`w-8 h-8 rounded-full transition-transform duration-150 border-2 ${
                            color === paletteColor
                              ? 'ring-2 ring-offset-2 ring-indigo-500 border-white'
                              : 'border-transparent hover:scale-110'
                          }`}
                          style={{ backgroundColor: paletteColor }}
                          aria-label={`Select color ${paletteColor}`}
                        />
                      ))}
                    </div>
                </div>
           </div>
            <div className="mt-6 flex justify-end gap-2">
                {editingCategory && (
                    <button type="button" onClick={handleCancelEdit} className="bg-white text-slate-700 font-semibold py-2 px-4 rounded-lg border border-slate-300 hover:bg-slate-100">Annulla</button>
                )}
                <button type="submit" className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 flex-shrink-0">
                    {editingCategory ? 'Salva Modifiche' : 'Aggiungi'}
                </button>
            </div>
        </form>

        <h3 className="text-lg font-semibold mb-4">Categorie Esistenti</h3>
        <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {categories.map(cat => (
                <li key={cat.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                    <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full" style={{backgroundColor: cat.color}}></span>
                        <span className="font-medium text-slate-800">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => handleEditClick(cat)} className="text-slate-500 hover:text-indigo-600 p-1 rounded-md">
                            <PencilSquareIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => onDeleteCategory(cat.id)} className="text-slate-500 hover:text-red-600 p-1 rounded-md">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>
                </li>
            ))}
        </ul>

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

export default ManageCategoriesModal;
