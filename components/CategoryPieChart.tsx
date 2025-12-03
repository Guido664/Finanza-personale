import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { Category } from '../types';

interface ChartData {
  categoryId: string;
  amount: number;
}

interface CategoryPieChartProps {
  data: ChartData[];
  categories: Category[];
  currency?: string;
}

const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ data, categories, currency }) => {
  const chartData = data.map(item => {
    const category = categories.find(c => c.id === item.categoryId);
    return {
      name: category ? category.name : 'Altro',
      value: item.amount,
      color: category ? category.color : '#6b7280',
    };
  });

  if (chartData.length === 0) {
    return <div className="flex items-center justify-center h-full text-slate-500">Nessun dato da mostrare</div>;
  }
  
  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null;

    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const tooltipFormatter = (value: number) => {
    const formattedValue = currency 
      ? new Intl.NumberFormat('it-IT', { style: 'currency', currency }).format(value)
      : new Intl.NumberFormat('it-IT').format(value);
    return [formattedValue, "Importo"];
  }
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius="80%"
          innerRadius="45%"
          fill="#8884d8"
          dataKey="value"
          paddingAngle={5}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={tooltipFormatter} />
        <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{fontSize: '12px'}} />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default CategoryPieChart;