import React from 'react';

interface CronExpressionBuilderProps {
  initialValue?: string;
}

const CronExpressionBuilder: React.FC<CronExpressionBuilderProps> = ({ initialValue = '' }) => {
  // This is a placeholder component for Cron expression input
  // In a real application, this would have a full cron expression builder UI
  return (
    <div>
      <input
        type="text"
        className="w-full px-3 py-2 border rounded-md"
        placeholder="请输入Cron表达式 (例如: 0 0 * * * ?)"
        defaultValue={initialValue}
      />
      <div className="mt-2 text-sm text-gray-500">
        Cron表达式示例:
        <ul className="mt-1 list-disc list-inside space-y-1">
          <li>0 0 * * * ? - 每小时</li>
          <li>0 */30 * * * ? - 每30分钟</li>
          <li>0 0 8 * * ? - 每天早上8点</li>
          <li>0 0 1 ? * SAT - 每周六凌晨1点</li>
        </ul>
      </div>
    </div>
  );
};

export default CronExpressionBuilder;
