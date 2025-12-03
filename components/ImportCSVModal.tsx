import React, { useState, useCallback, useMemo } from 'react';
import type { Account, Category, Transaction } from '../types';

interface ImportCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (transactions: (Omit<Transaction, 'id'> & { categoryName?: string })[], newCategories: Omit<Category, 'id'>[]) => void;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
}

interface ParsedRow {
  data: Omit<Transaction, 'id'> & { categoryName?: string };
  status: 'ok' | 'error' | 'duplicate';
  message?: string;
}

const PALETTE_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981', '#14b8a6', '#38bdf8', '#6366f1', '#8b5cf6', '#ec4899', '#6b7280',
];
const getRandomColor = () => PALETTE_COLORS[Math.floor(Math.random() * PALETTE_COLORS.length)];

const ImportCSVModal: React.FC<ImportCSVModalProps> = ({ isOpen, onClose, onImport, accounts, categories, transactions }) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const existingTransactionSignatures = useMemo(() => {
    return new Set(transactions.map(t => `${new Date(t.date).toISOString().split('T')[0]}_${t.accountId}_${t.amount.toFixed(2)}_${t.description.toLowerCase().trim()}`));
  }, [transactions]);

  const parseCSV = useCallback((csvText: string) => {
    try {
      const lines = csvText.split(/\r\n|\n/).filter(line => line.trim() !== '');
      if (lines.length < 2) {
        setError('Il file CSV è vuoto o contiene solo l\'intestazione.');
        return;
      }

      const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
      
      const requiredHeaders = ['data', 'descrizione', 'importo', 'tipo', 'nome_conto'];
      const missingHeaders = requiredHeaders.filter(rh => !headers.includes(rh));
      if (missingHeaders.length > 0) {
        setError(`Intestazioni mancanti nel CSV: ${missingHeaders.join(', ')}.`);
        return;
      }
      
      const headerMap: { [key: string]: number } = {};
      headers.forEach((h, i) => headerMap[h] = i);

      const results: ParsedRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        if (values.length < headers.length) continue;

        const dateStr = values[headerMap['data']];
        const description = values[headerMap['descrizione']];
        const amountStr = values[headerMap['importo']];
        const typeStr = values[headerMap['tipo']]?.toLowerCase();
        const categoryName = values[headerMap['categoria']];
        const accountName = values[headerMap['nome_conto']];
        
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          results.push({ data: {} as any, status: 'error', message: `Riga ${i+1}: Data non valida.` });
          continue;
        }

        const amount = parseFloat(amountStr?.replace(',', '.'));
        if (isNaN(amount) || amount <= 0) {
          results.push({ data: {} as any, status: 'error', message: `Riga ${i+1}: Importo non valido.` });
          continue;
        }

        const type = typeStr === 'entrata' || typeStr === 'income' ? 'income' : 'expense';
        
        const account = accounts.find(a => a.name.toLowerCase() === accountName.toLowerCase());
        if (!account) {
          results.push({ data: {} as any, status: 'error', message: `Riga ${i+1}: Conto "${accountName}" non trovato.` });
          continue;
        }

        let categoryId: string | undefined = undefined;
        if (type === 'expense' && categoryName) {
            const category = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
            if (category) categoryId = category.id;
        }

        const transactionData: Omit<Transaction, 'id'> & { categoryName?: string } = {
            accountId: account.id,
            description,
            amount,
            date: date.toISOString(),
            type,
            categoryId,
            categoryName: (type === 'expense' && categoryName) ? categoryName : undefined
        };

        const signature = `${date.toISOString().split('T')[0]}_${account.id}_${amount.toFixed(2)}_${description.toLowerCase().trim()}`;
        if (existingTransactionSignatures.has(signature)) {
            results.push({ data: transactionData, status: 'duplicate', message: `Riga ${i+1}: Transazione duplicata.` });
            continue;
        }

        results.push({ data: transactionData, status: 'ok' });
      }
      setParsedData(results);
      setError('');
    } catch (err) {
      setError('Errore durante la lettura del file. Assicurati che sia un CSV valido.');
      console.error(err);
    }
  }, [accounts, categories, existingTransactionSignatures]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setIsLoading(true);
      setFile(selectedFile);
      setParsedData([]);
      const text = await selectedFile.text();
      parseCSV(text);
      setIsLoading(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleImportClick = () => {
    const transactionsToImport = parsedData
        .filter(p => p.status === 'ok')
        .map(p => p.data);

    const newCategoryNames = new Set<string>();
    transactionsToImport.forEach(t => {
        if(t.type === 'expense' && t.categoryName && !t.categoryId) {
            newCategoryNames.add(t.categoryName);
        }
    });

    const existingCategoryNames = new Set(categories.map(c => c.name.toLowerCase()));
    const newCategoriesToCreate = Array.from(newCategoryNames)
      .filter(name => !existingCategoryNames.has(name.toLowerCase()))
      .map(name => ({ name, color: getRandomColor() }));
      
    onImport(transactionsToImport, newCategoriesToCreate);
    handleClose();
  };

  const handleClose = () => {
    setFile(null);
    setParsedData([]);
    setError('');
    onClose();
  };

  const summary = useMemo(() => {
      if (parsedData.length === 0) return null;
      const okCount = parsedData.filter(p => p.status === 'ok').length;
      const errorCount = parsedData.filter(p => p.status === 'error').length;
      const duplicateCount = parsedData.filter(p => p.status === 'duplicate').length;
      return { okCount, errorCount, duplicateCount, total: parsedData.length };
  }, [parsedData]);


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-start z-50 p-4 pt-16 overflow-y-auto">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-6 text-slate-900">Importa Transazioni da CSV</h2>

        <div className="p-4 border-dashed border-2 border-slate-300 rounded-lg bg-slate-50 text-center">
            <p className="mb-2 text-slate-600">Seleziona un file CSV da importare.</p>
            <p className="text-xs text-slate-500 mb-4">Colonne richieste: data, descrizione, importo, tipo (entrata/uscita), nome_conto. Opzionale: categoria.</p>
            <input type="file" accept=".csv" onChange={handleFileChange} className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
        </div>
        
        {isLoading && <p className="mt-4 text-center text-slate-600">Analisi del file in corso...</p>}
        {error && <p className="mt-4 bg-red-100 text-red-700 p-3 rounded-md text-sm">{error}</p>}

        {summary && (
            <div className="mt-6">
                <h3 className="font-semibold text-lg mb-2">Risultato Analisi</h3>
                <div className="p-4 bg-slate-100 rounded-lg space-y-1">
                    <p><strong>{summary.total}</strong> righe analizzate.</p>
                    <p className="text-green-600"><strong>{summary.okCount}</strong> transazioni verranno importate.</p>
                    {summary.duplicateCount > 0 && <p className="text-amber-600"><strong>{summary.duplicateCount}</strong> transazioni duplicate ignorate.</p>}
                    {summary.errorCount > 0 && <p className="text-red-600"><strong>{summary.errorCount}</strong> righe con errori.</p>}
                </div>
                {summary.errorCount > 0 && (
                    <div className="mt-2 max-h-32 overflow-y-auto text-sm bg-red-50 p-2 rounded-md">
                        <p className="font-semibold">Dettaglio errori:</p>
                        <ul className="list-disc list-inside">
                        {parsedData.filter(p => p.status === 'error').slice(0, 10).map((p, i) => (
                           <li key={i}>{p.message}</li> 
                        ))}
                        {parsedData.filter(p => p.status === 'error').length > 10 && <li>...e altri.</li>}
                        </ul>
                    </div>
                )}
            </div>
        )}

        <div className="mt-8 flex justify-end gap-4">
          <button type="button" onClick={handleClose} className="bg-white text-slate-700 font-semibold py-2 px-6 rounded-lg border border-slate-300 hover:bg-slate-100">Annulla</button>
          <button type="button" onClick={handleImportClick} disabled={isLoading || !summary || summary.okCount === 0} className="bg-indigo-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed">
            Importa {summary?.okCount || 0} Transazioni
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportCSVModal;
