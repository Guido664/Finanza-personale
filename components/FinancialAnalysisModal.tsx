
import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI } from '@google/genai';
import type { Transaction, Category } from '../types';
import type { Filter } from '../App';
import { LightBulbIcon } from './Icons';

interface FinancialAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  categories: Category[];
  filter: Filter;
}

const FinancialAnalysisModal: React.FC<FinancialAnalysisModalProps> = ({
  isOpen,
  onClose,
  transactions,
  categories,
  filter,
}) => {
  const [analysis, setAnalysis] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const getPeriodDescription = () => {
    if (filter.mode === 'range') {
        if (filter.startDate && filter.endDate) {
            const start = new Date(filter.startDate).toLocaleDateString('it-IT');
            const end = new Date(filter.endDate).toLocaleDateString('it-IT');
            return `dal ${start} al ${end}`;
        }
        return `del periodo personalizzato`;
    }

    const monthNames = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
    if (filter.month === 'all') {
      return `dell'anno ${filter.year}`;
    }
    return `di ${monthNames[filter.month]} ${filter.year}`;
  }

  const generateAnalysis = async () => {
    setIsLoading(true);
    setError('');
    setAnalysis('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

      const initialStats = {
        periodIncome: 0,
        periodExpenses: 0,
        expenseDataByCategory: {} as Record<string, number>
      };

      const { periodIncome, periodExpenses, expenseDataByCategory } = transactions.reduce((acc, t) => {
        if (t.type === 'income') {
            acc.periodIncome += t.amount;
        } else {
            acc.periodExpenses += t.amount;
            const categoryId = t.categoryId || 'other';
            acc.expenseDataByCategory[categoryId] = (acc.expenseDataByCategory[categoryId] || 0) + t.amount;
        }
        return acc;
      }, initialStats);

      const categoryDetails = Object.entries(expenseDataByCategory)
        .map(([categoryId, amount]) => {
            const category = categories.find(c => c.id === categoryId);
            const categoryName = category ? category.name : 'Altro';
            const percentage = periodExpenses > 0 ? ((amount / periodExpenses) * 100).toFixed(1) : "0.0";
            return `- ${categoryName}: ${amount.toFixed(2)}€ (${percentage}%)`;
        })
        .join('\n');

      const prompt = `
        Dati finanziari per il periodo ${getPeriodDescription()}:
        - Entrate totali: ${periodIncome.toFixed(2)}€
        - Uscite totali: ${periodExpenses.toFixed(2)}€
        - Saldo netto del periodo: ${(periodIncome - periodExpenses).toFixed(2)}€

        Dettaglio delle uscite per categoria:
        ${categoryDetails || 'Nessuna spesa registrata.'}

        Basandoti su questi dati, fornisci un'analisi dettagliata e consigli pratici.
        Struttura la risposta in sezioni usando la sintassi Markdown:
        1.  **Panoramica Generale**: Un breve riassunto della situazione finanziaria del periodo.
        2.  **Punti di Forza**: Cosa sta andando bene (es. entrate superiori alle uscite, risparmio).
        3.  **Aree di Miglioramento**: Identifica le 2-3 categorie di spesa più impattanti e suggerisci modi specifici per ridurle, se possibile. Sii costruttivo.
        4.  **Consiglio Proattivo**: Offri un consiglio generale per una migliore gestione finanziaria futura basato sui dati.
        Sii incoraggiante e professionale.
    `;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            systemInstruction: "Sei un consulente finanziario esperto che analizza i dati di spesa di un utente per fornire consigli chiari, utili e incoraggianti. Il tuo obiettivo è aiutare l'utente a comprendere le proprie abitudini di spesa e a trovare opportunità di risparmio. Rispondi sempre in italiano.",
        }
      });
      
      setAnalysis(response.text || "Nessuna analisi generata.");

    } catch (err) {
      console.error("Errore durante la generazione dell'analisi:", err);
      setError("Si è verificato un errore durante la comunicazione con il servizio di analisi. Riprova più tardi.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      generateAnalysis();
    }
  }, [isOpen]);

  const renderFormattedText = (text: string) => {
    const sections = text.split(/(\*\*.*?\*\*|### .*|#### .*|\* .*|  \* .*)/g).filter(Boolean);
    return sections.map((section, index) => {
      if (section.startsWith('**') && section.endsWith('**')) {
        return <p key={index} className="font-bold my-2">{section.replace(/\*\*/g, '')}</p>;
      }
      if (section.startsWith('### ')) {
        return <h3 key={index} className="text-xl font-semibold mt-4 mb-2">{section.substring(4)}</h3>;
      }
      if (section.startsWith('#### ')) {
          return <h4 key={index} className="text-lg font-semibold mt-3 mb-1">{section.substring(5)}</h4>;
      }
      if (section.startsWith('* ')) {
        return <li key={index} className="ml-5 list-disc">{section.substring(2)}</li>;
      }
      if (section.startsWith('  * ')) {
          return <li key={index} className="ml-10 list-disc">{section.substring(4)}</li>;
      }
      return <p key={index} className="my-2">{section}</p>;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-start z-50 p-4 pt-16 overflow-y-auto">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
            <div className="bg-amber-100 p-3 rounded-full">
                <LightBulbIcon className="w-8 h-8 text-amber-500" />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Analisi Finanziaria</h2>
                <p className="text-slate-500">Consigli personalizzati per le tue finanze {getPeriodDescription()}</p>
            </div>
        </div>

        <div className="prose prose-slate max-w-none max-h-[60vh] overflow-y-auto pr-4">
          {isLoading && (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-slate-600">Sto analizzando le tue transazioni...</p>
            </div>
          )}
          {error && <p className="bg-red-100 text-red-700 p-3 rounded-md text-sm">{error}</p>}
          {!isLoading && !error && analysis && 
            <div dangerouslySetInnerHTML={{ __html: analysis.replace(/\n/g, '<br />').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
          }
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-white text-slate-700 font-semibold py-2 px-6 rounded-lg border border-slate-300 hover:bg-slate-100"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinancialAnalysisModal;
