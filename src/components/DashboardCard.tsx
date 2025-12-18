import React from 'react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  icon,
  color = 'blue'
}) => {
  const colorClasses = {
    blue: 'border-blue-700 text-blue-800',
    green: 'border-green-700 text-green-800',
    purple: 'border-purple-700 text-purple-800',
    red: 'border-red-700 text-red-800'
  };

  return (
    <div className={`bg-white rounded-xl shadow-md p-6 border-l-4 ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue} transition-transform hover:scale-105`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <h2 className="text-3xl font-bold mt-2">{value}</h2>
        </div>
        {icon && (
          <div className="text-2xl opacity-80">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardCard;