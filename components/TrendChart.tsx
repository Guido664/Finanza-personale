import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Transaction } from '../types';
import type { Filter } from '../App';

interface TrendChartProps {
  data: Transaction[];
  filter: Filter;
  currency?: string;
}

const TrendChart: React.FC<TrendChartProps> = ({ data, filter, currency }) => {

  const formatCurrency = (value: number) => {
    if (currency) {
        return new Intl.NumberFormat('it-IT', { style: 'currency', currency }).format(value);
    }
    return new Intl.NumberFormat('it-IT').format(value);
  };
  
  const yAxisFormatter = (value: number) => {
    const options: Intl.NumberFormatOptions = { notation: 'compact', compactDisplay: 'short' };
    if (currency) {
      options.style = 'currency';
      options.currency = currency;
    }
    return new Intl.NumberFormat('it-IT', options).format(value);
  };


  const chartData = useMemo(() => {
    if (filter.mode === 'month') {
        if (filter.month === 'all') { // Vista Annuale
            const monthNames = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];
            const monthlyData = monthNames.map(name => ({ name, Entrate: 0, Uscite: 0 }));

            data.forEach(t => {
                const monthIndex = new Date(t.date).getMonth();
                if (t.type === 'income') {
                monthlyData[monthIndex].Entrate += t.amount;
                } else {
                monthlyData[monthIndex].Uscite += t.amount;
                }
            });
            return monthlyData;
        } else { // Vista Mensile
            const { year, month } = filter;
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const dailyData = Array.from({ length: daysInMonth }, (_, i) => ({
                name: String(i + 1),
                Entrate: 0,
                Uscite: 0,
            }));

            data.forEach(t => {
                const dayIndex = new Date(t.date).getDate() - 1;
                if (t.type === 'income') {
                dailyData[dayIndex].Entrate += t.amount;
                } else {
                dailyData[dayIndex].Uscite += t.amount;
                }
            });
            return dailyData;
        }
    }
    
    if (filter.mode === 'range') {
        if (!data.length || (!filter.startDate && !filter.endDate)) {
            return [];
        }

        const sortedData = data.slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const firstDate = new Date(sortedData[0]?.date);
        const lastDate = new Date(sortedData[sortedData.length - 1]?.date);

        const rangeSpan = (lastDate.getTime() - firstDate.getTime()) / (1000 * 3600 * 24);

        if (rangeSpan <= 35) { // Aggregazione giornaliera
            const dailyData = new Map<string, { Entrate: number, Uscite: number }>();
            sortedData.forEach(t => {
                const dateKey = new Date(t.date).toISOString().split('T')[0];
                if (!dailyData.has(dateKey)) {
                    dailyData.set(dateKey, { Entrate: 0, Uscite: 0 });
                }
                const entry = dailyData.get(dateKey)!;
                if (t.type === 'income') entry.Entrate += t.amount;
                else entry.Uscite += t.amount;
            });
            return Array.from(dailyData.entries())
                .map(([date, values]) => ({
                    name: new Date(date + 'T00:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
                    ...values
                }));
        } else { // Aggregazione mensile
            const monthlyData = new Map<string, { Entrate: number, Uscite: number }>();
            sortedData.forEach(t => {
                const date = new Date(t.date);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
                if (!monthlyData.has(monthKey)) {
                    monthlyData.set(monthKey, { Entrate: 0, Uscite: 0 });
                }
                const entry = monthlyData.get(monthKey)!;
                if (t.type === 'income') entry.Entrate += t.amount;
                else entry.Uscite += t.amount;
            });
            const monthNames = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];
            return Array.from(monthlyData.entries())
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([dateKey, values]) => {
                    const [year, month] = dateKey.split('-').map(Number);
                    return { name: `${monthNames[month]} '${String(year).slice(2)}`, ...values };
                });
        }
    }
    return [];

  }, [data, filter]);

  const getChartTitle = () => {
    const monthNames = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
    if (filter.mode === 'month') {
        if (filter.month === 'all') {
            return `Andamento Annuale ${filter.year}`;
        }
        return `Andamento di ${monthNames[filter.month]} ${filter.year}`;
    }
    if (filter.mode === 'range') {
        if (filter.startDate || filter.endDate) {
            return `Andamento del Periodo Selezionato`;
        }
        return 'Andamento Transazioni';
    }
    return 'Andamento';
  }
  
  if (filter.mode === 'range' && chartData.length === 0 && (filter.startDate || filter.endDate)) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 text-center">{getChartTitle()}</h3>
            <p className="text-slate-500">Nessuna transazione nel periodo selezionato.</p>
        </div>
      );
  }

  return (
    <>
      <h3 className="text-lg font-semibold text-slate-800 mb-4 text-center">{getChartTitle()}</h3>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 20,
            left: 30,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis 
            tickFormatter={yAxisFormatter} 
            tick={{ fontSize: 12 }} 
          />
          <Tooltip formatter={(value: number, name: string) => [formatCurrency(value), name]} />
          <Legend wrapperStyle={{fontSize: '12px'}} />
          <Line type="monotone" dataKey="Entrate" stroke="#10b981" strokeWidth={2} activeDot={{ r: 6 }} />
          <Line type="monotone" dataKey="Uscite" stroke="#ef4444" strokeWidth={2} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </>
  );
};

export default TrendChart;