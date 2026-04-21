import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';

export interface ConfigItem {
  id: string;
  name: string;
  type: string;
  [key: string]: any;
}

export interface Relationship {
  id?: number;
  source: string;
  target: string;
  type: string;
  description?: string;
}

interface TopologyChartProps {
  configItems: ConfigItem[];
  relationships: Relationship[];
  selectedItemId?: string;
  width?: number;
  height?: number;
}

// 配置项类型到类别的映射
const TYPE_CATEGORY_MAP: Record<string, number> = {
  'room': 0, 'rack': 0,
  'host': 1, 'server': 1, 'physical_server': 1,
  'vm': 2, 'virtual_machine': 2,
  'network': 3, 'switch': 3, 'router': 3, 'firewall': 3, 'load_balancer': 3,
  'application': 4, 'app': 4, 'service': 4,
  'middleware': 4,
  'database': 5, 'db': 5,
  'cache': 5, 'redis': 5,
  'cloud': 5,
};

// 类别定义
const categories = [
  { name: '基础设施', itemStyle: { color: '#dbeafe', borderColor: '#3b82f6', borderWidth: 2 } },
  { name: '服务器', itemStyle: { color: '#ede9fe', borderColor: '#8b5cf6', borderWidth: 2 } },
  { name: '虚拟机', itemStyle: { color: '#fce7f3', borderColor: '#ec4899', borderWidth: 2 } },
  { name: '网络设备', itemStyle: { color: '#ffedd5', borderColor: '#f97316', borderWidth: 2 } },
  { name: '应用服务', itemStyle: { color: '#fef9c3', borderColor: '#eab308', borderWidth: 2 } },
  { name: '数据存储', itemStyle: { color: '#dcfce7', borderColor: '#22c55e', borderWidth: 2 } },
];

// 关系类型样式
const RELATION_STYLES: Record<string, { color: string; width: number; type?: string }> = {
  'hosted_on': { color: '#9ca3af', width: 1.5, type: 'dashed' },
  'depends_on': { color: '#93c5fd', width: 2.5 },
  'connects_to': { color: '#5eead4', width: 2 },
  'uses': { color: '#fde047', width: 1.8 },
  'belongs_to': { color: '#93c5fd', width: 2 },
  'monitored_by': { color: '#c4b5fd', width: 1.8 },
  'deployed_on': { color: '#9ca3af', width: 1.5, type: 'dashed' },
  'default': { color: '#94a3b8', width: 2 },
};

// 获取节点形状
function getNodeSymbol(type: string): string {
  const t = type.toLowerCase();
  if (t.includes('room') || t.includes('rack') || t.includes('机房') || t.includes('机柜')) return 'roundRect';
  if (t.includes('network') || t.includes('switch') || t.includes('router') || t.includes('防火墙') || t.includes('交换机')) return 'diamond';
  if (t.includes('application') || t.includes('service') || t.includes('app')) return 'circle';
  if (t.includes('database') || t.includes('db') || t.includes('redis') || t.includes('cache')) return 'circle';
  return 'rect';
}

// 获取节点大小
function getNodeSize(type: string): number {
  const t = type.toLowerCase();
  if (t.includes('room') || t.includes('机房')) return 80;
  if (t.includes('rack') || t.includes('机柜')) return 64;
  if (t.includes('database') || t.includes('db')) return 64;
  return 50;
}

// 获取类型标签
function getTypeLabel(type: string): string {
  const t = type.toLowerCase();
  if (t === 'host' || t === 'server' || t === 'physical_server') return '物理服务器';
  if (t === 'vm' || t === 'virtual_machine') return '虚拟机';
  if (t === 'network' || t === 'switch') return '网络设备';
  if (t === 'router') return '路由器';
  if (t === 'firewall') return '防火墙';
  if (t === 'load_balancer') return '负载均衡';
  if (t === 'application' || t === 'app' || t === 'service') return '应用服务';
  if (t === 'middleware') return '中间件';
  if (t === 'database' || t === 'db') return '数据库';
  if (t.includes('cache') || t === 'redis') return '缓存';
  if (t === 'cloud' || t.includes('云')) return '云资源';
  if (t.includes('room')) return '机房';
  if (t.includes('rack')) return '机柜';
  return type;
}

// 获取关系类型标签
function getRelLabel(type: string): string {
  const map: Record<string, string> = {
    'hosted_on': '托管',
    'depends_on': '依赖',
    'depends': '依赖',
    'connects_to': '连接',
    'connects': '连接',
    'uses': '使用',
    'belongs_to': '归属',
    'monitored_by': '监控',
    'deployed_on': '部署',
    'contains': '包含',
    'hosts': '宿主',
    'provides': '提供',
  };
  return map[type] || type;
}

// 获取关系样式
function getRelStyle(type: string) {
  return RELATION_STYLES[type] || RELATION_STYLES['default'];
}

// 获取节点类别
function getCategory(type: string): number {
  const t = type.toLowerCase();
  if (TYPE_CATEGORY_MAP[t] !== undefined) return TYPE_CATEGORY_MAP[t];
  for (const key in TYPE_CATEGORY_MAP) {
    if (t.includes(key)) return TYPE_CATEGORY_MAP[key];
  }
  return 4;
}

const TopologyChart: React.FC<TopologyChartProps> = ({
  configItems,
  relationships,
  selectedItemId,
  width,
  height = 350,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  const initializedRef = useRef(false);

  // 筛选状态
  const [filters, setFilters] = useState<Record<number, boolean>>({
    0: true, 1: true, 2: true, 3: true, 4: true, 5: true
  });

  // 初始化图表
  useEffect(() => {
    if (!chartRef.current) return;

    // 等待容器渲染完成，获取真实尺寸
    const timer = setTimeout(() => {
      if (!chartRef.current) return;
      const rect = chartRef.current.getBoundingClientRect();
      const w = width || rect.width || 700;
      const h = height || rect.height || 350;

      if (w < 10 || h < 10) return; // 容器不可见

      const chart = echarts.init(chartRef.current, 'light');
      chartInstanceRef.current = chart;
      initializedRef.current = true;
    }, 100);

    const handleResize = () => {
      if (chartInstanceRef.current && chartRef.current) {
        const rect = chartRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          chartInstanceRef.current.resize();
        }
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
      initializedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 每次尺寸变化时 resize
  useEffect(() => {
    if (chartInstanceRef.current && chartRef.current) {
      chartRef.current.style.width = width ? `${width}px` : '100%';
      chartRef.current.style.height = height ? `${height}px` : '100%';
      setTimeout(() => chartInstanceRef.current?.resize(), 50);
    }
  }, [width, height]);

  // 数据过滤和渲染
  useEffect(() => {
    const chartEl = chartRef.current;
    if (!chartEl) return;

    // 如果 chart 还没初始化，先初始化
    if (!chartInstanceRef.current || !initializedRef.current) {
      const rect = chartEl.getBoundingClientRect();
      if (rect.width < 10 || rect.height < 10) return;
      const chart = echarts.init(chartEl, 'light');
      chartInstanceRef.current = chart;
      initializedRef.current = true;
    }

    const chart = chartInstanceRef.current;

    // 过滤节点
    const filteredNodes = configItems.filter(item => {
      const cat = getCategory(item.type);
      return filters[cat];
    });

    // 根据过滤的节点过滤关系
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    let displayRels: Relationship[] = relationships.filter(rel => {
      const src: string = typeof rel.source === 'object' ? String((rel.source as any).id || '') : String(rel.source);
      const tgt: string = typeof rel.target === 'object' ? String((rel.target as any).id || '') : String(rel.target);
      return nodeIds.has(src) && nodeIds.has(tgt);
    });

    // 如果有选中的节点，只显示与其直接相连的
    let displayNodes: ConfigItem[] = filteredNodes;

    if (selectedItemId) {
      const relatedNodeIds = new Set<string>([selectedItemId]);
      displayRels.forEach(rel => {
        const src: string = typeof rel.source === 'object' ? String((rel.source as any).id || '') : String(rel.source);
        const tgt: string = typeof rel.target === 'object' ? String((rel.target as any).id || '') : String(rel.target);
        if (src === selectedItemId || tgt === selectedItemId) {
          relatedNodeIds.add(src);
          relatedNodeIds.add(tgt);
        }
      });
      displayNodes = filteredNodes.filter(n => relatedNodeIds.has(n.id));
      displayRels = displayRels.filter(rel => {
        const src: string = typeof rel.source === 'object' ? String((rel.source as any).id || '') : String(rel.source);
        const tgt: string = typeof rel.target === 'object' ? String((rel.target as any).id || '') : String(rel.target);
        return src === selectedItemId || tgt === selectedItemId;
      });
    }

    // 如果没有数据，显示提示
    if (displayNodes.length === 0) {
      chart.setOption({
        backgroundColor: '#ffffff',
        title: {
          text: '暂无数据',
          left: 'center',
          top: 'center',
          textStyle: { color: '#9ca3af', fontSize: 14 },
        },
        series: [],
      }, true);
      return;
    }

    // 构建 ECharts 数据
    const nodes = displayNodes.map(item => {
      const cat = getCategory(item.type);
      const isSel = item.id === selectedItemId;
      return {
        name: item.name,
        id: item.id,
        category: cat,
        symbol: getNodeSymbol(item.type),
        symbolSize: getNodeSize(item.type),
        itemStyle: {
          ...categories[cat].itemStyle,
          borderWidth: isSel ? 4 : 2,
          borderColor: isSel ? '#ef4444' : categories[cat].itemStyle.borderColor,
        },
        label: {
          show: true,
          fontSize: 11,
          color: '#1f2937',
          position: 'bottom',
          distance: 6,
          formatter: item.name,
        },
      };
    });

    const links = displayRels.map(rel => {
      const src = String(typeof rel.source === 'object' ? (rel.source as any).id || rel.source : rel.source);
      const tgt = String(typeof rel.target === 'object' ? (rel.target as any).id || rel.target : rel.target);
      const style = getRelStyle(rel.type);
      const lineType = style.type === 'dashed' ? [6, 4] : 'solid' as const;
      return {
        source: src,
        target: tgt,
        lineStyle: {
          color: style.color,
          width: style.width,
          type: lineType,
          curveness: rel.type === 'hosted_on' || rel.type === 'deployed_on' ? -0.2 : 0.1,
        },
        label: {
          show: true,
          fontSize: 10,
          color: '#64748b',
          formatter: getRelLabel(rel.type),
        },
      };
    });

    const option = {
      backgroundColor: '#ffffff',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        textStyle: { color: '#374151', fontSize: 12 },
        extraCssText: 'box-shadow:0 2px 12px rgba(0,0,0,0.08);',
      },
      legend: {
        data: categories.map(c => c.name),
        top: 8,
        left: 'center',
        textStyle: { color: '#6b7280', fontSize: 11 },
        itemWidth: 14,
        itemHeight: 10,
        itemGap: 12,
      },
      animationDuration: 1200,
      animationEasingUpdate: 'quinticInOut',
      series: [{
        type: 'graph',
        layout: 'force',
        force: {
          repulsion: 800,
          edgeLength: [60, 150],
          gravity: 0.15,
          layoutAnimation: true,
          friction: 0.6,
        },
        roam: true,
        draggable: true,
        categories: categories,
        data: nodes,
        links: links,
        label: {
          show: true,
          fontSize: 11,
          color: '#1f2937',
          position: 'bottom',
          distance: 8,
        },
        edgeLabel: { show: true },
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: [0, 6],
        lineStyle: { curveness: 0.12, opacity: 0.75 },
        emphasis: {
          focus: 'adjacency',
          itemStyle: { shadowBlur: 16, shadowColor: 'rgba(59,130,246,0.35)' },
          lineStyle: { width: 3 },
        },
      }],
    };

    chart.setOption(option as any, true);
    chart.resize();
  }, [configItems, relationships, selectedItemId, filters]);

  // 切换筛选
  const toggleFilter = (catIdx: number) => {
    setFilters(prev => ({ ...prev, [catIdx]: !prev[catIdx] }));
  };

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', width: width ? `${width}px` : '100%', height: height ? `${height}px` : '100%' }}>
      {/* 筛选栏 */}
      <div style={{
        padding: '6px 12px',
        background: '#fafafa',
        borderBottom: '1px solid #e8e8e8',
        display: 'flex',
        gap: 10,
        alignItems: 'center',
        flexWrap: 'wrap',
        flexShrink: 0,
      }}>
        <span style={{ fontWeight: 'bold', color: '#1890ff', marginRight: 4, fontSize: 12 }}>类别</span>
        {categories.map((cat, idx) => (
          <label
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
              fontSize: 12,
              color: '#333',
              padding: '3px 8px',
              borderRadius: 4,
              background: filters[idx] ? '#fff' : '#f0f0f0',
              border: filters[idx] ? `1px solid ${cat.itemStyle.borderColor}` : '1px solid transparent',
            }}
          >
            <input
              type="checkbox"
              checked={filters[idx]}
              onChange={() => toggleFilter(idx)}
              style={{ accentColor: cat.itemStyle.borderColor, margin: 0 }}
            />
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: cat.itemStyle.color,
                border: `1.5px solid ${cat.itemStyle.borderColor}`,
                display: 'inline-block',
              }}
            />
            {cat.name}
          </label>
        ))}
        <button
          onClick={() => setFilters({ 0: true, 1: true, 2: true, 3: true, 4: true, 5: true })}
          style={{
            background: '#fff',
            color: '#333',
            border: '1px solid #d9d9d9',
            padding: '3px 10px',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 11,
          }}
        >
          重置
        </button>
        <span style={{ marginLeft: 'auto', color: '#9ca3af', fontSize: 11 }}>
          {configItems.length} 资产 · {relationships.length} 关系
        </span>
      </div>

      {/* 图表容器 - 自适应剩余空间 */}
      <div
        ref={chartRef}
        style={{
          flex: 1,
          minHeight: 300,
          width: '100%',
        }}
      />
    </div>
  );
};

export default TopologyChart;