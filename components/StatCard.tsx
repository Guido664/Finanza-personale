import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  onIconClick?: () => void;
  valueClassName?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, onIconClick, valueClassName = 'text-slate-900' }) => {
  const IconContainer = onIconClick ? 'button' : 'div';
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-md flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className={`text-2xl font-bold text-slate-900 mt-1 tracking-wider ${valueClassName}`}>{value}</p>
      </div>
      <IconContainer
        onClick={onIconClick}
        className={`bg-slate-100 p-3 rounded-full transition-colors duration-200 ${onIconClick ? 'cursor-pointer hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500' : ''}`}
        aria-label={onIconClick ? 'Mostra/nascondi saldo' : undefined}
      >
        {icon}
      </IconContainer>
    </div>
  );
};

export default StatCard;