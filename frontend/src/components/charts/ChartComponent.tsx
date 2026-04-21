import React, { useRef, useEffect } from 'react';
import Chart from 'chart.js/auto';

// 定义ChartComponent的属性类型
interface ChartComponentProps {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'polarArea' | 'radar';
  data: {
    labels: string[];
    datasets: Array<{
      label?: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
      borderWidth?: number;
      tension?: number;
      fill?: boolean;
      pointBackgroundColor?: string | string[];
      pointBorderColor?: string | string[];
      pointHoverBackgroundColor?: string | string[];
      pointHoverBorderColor?: string | string[];
    }>;
  };
  options?: any;
  height?: number;
  className?: string;
}

// ChartComponent组件实现
const ChartComponent: React.FC<ChartComponentProps> = ({
  type,
  data,
  options,
  height = 300,
  className = '',
}) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    // 如果没有canvas元素，不进行渲染
    if (!chartRef.current) return;

    // 如果已经存在chart实例，销毁它
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // 创建新的chart实例
    chartInstance.current = new Chart(chartRef.current, {
      type,
      data,
      options,
    });

    // 清理函数
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [type, data, options]);

  return (
    <div className={`relative ${className}`} style={{ height: `${height}px` }}>
      <canvas ref={chartRef}></canvas>
    </div>
  );
};

export default ChartComponent;
