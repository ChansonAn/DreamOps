import React from 'react';

// 定义StatCard的属性类型
interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  positive?: boolean;
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'red' | 'orange' | 'purple';
  className?: string;
}

// 颜色映射
const colorClasses = {
  blue: 'bg-blue-50 border-blue-200 text-blue-600',
  green: 'bg-green-50 border-green-200 text-green-600',
  red: 'bg-red-50 border-red-200 text-red-600',
  orange: 'bg-orange-50 border-orange-200 text-orange-600',
  purple: 'bg-purple-50 border-purple-200 text-purple-600',
};

// StatCard组件实现
const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  positive = true,
  icon,
  color = 'blue',
  className = '',
}) => {
  const cardClass = `${colorClasses[color]} ${className}`;

  return (
    <div className={`border rounded-lg p-4 flex items-center justify-between ${cardClass}`}>
      {/* 左侧 - 标题和数值 */}
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <div className="flex items-baseline">
          <h3 className="text-2xl font-semibold">{value}</h3>
          {change !== undefined && (
            <span className={`ml-2 text-xs font-medium flex items-center ${positive ? 'text-green-500' : 'text-red-500'}`}>
              {positive ? '↑' : '↓'} {Math.abs(change)}%
            </span>
          )}
        </div>
      </div>
      
      {/* 右侧 - 图标 */}
      <div className="p-2 rounded-full bg-white shadow-sm">
        {icon}
      </div>
    </div>
  );
};

export default StatCard;
