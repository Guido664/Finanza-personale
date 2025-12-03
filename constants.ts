import type { Category } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'food', name: 'Cibo', color: '#3b82f6' }, // blue-500
  { id: 'transport', name: 'Trasporti', color: '#10b981' }, // emerald-500
  { id: 'entertainment', name: 'Intrattenimento', color: '#ef4444' }, // red-500
  { id: 'bills', name: 'Bollette e Utenze', color: '#f97316' }, // orange-500
  { id: 'shopping', name: 'Shopping', color: '#8b5cf6' }, // violet-500
  { id: 'health', name: 'Salute', color: '#ec4899' }, // pink-500
  { id: 'other', name: 'Altro', color: '#6b7280' }, // gray-500
];

export const CURRENCIES = [
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
];
