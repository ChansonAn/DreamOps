import { useState, useEffect } from 'react';
import { 
  Card, Input, Button, message, Space, Typography, List, Tag, 
  Spin, Alert, Divider, Row, Col, Statistic, Badge, Rate,
  Empty, Avatar, Collapse
} from 'antd';
import { 
  QuestionCircleOutlined, SearchOutlined, RobotOutlined, 
  FileTextOutlined, ThunderboltOutlined, HistoryOutlined,
  ClearOutlined, SendOutlined
} from '@ant-design/icons';
import apiClient, { API_BASE_URL } from '@/api/client';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;
const { Panel } = Collapse;

// 类型定义
interface KnowledgeResult {
  content: string;
  metadata: any;
  distance: number;
  keyword_score?: number;
  final_score?: number;
}

interface QueryHistory {
  query: string;
  results: KnowledgeResult[];
  timestamp: string;
}

const KnowledgeQA: React.FC = () => {
  // 状态管理
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<KnowledgeResult[]>([]);
  const [history, setHistory] = useState<QueryHistory[]>([]);
  const [stats, setStats] = useState<any>(null);

  // 获取统计信息
  const fetchStats = async () => {
    try {
      const response = await apiClient.get(`/api/knowledge/stats`);
      if (response.data.code === 200) {
        setStats(response.data.data);
      }
    } catch (err: any) {
      console.error('获取统计信息失败:', err);
    }
  };

  useEffect(() => {
    fetchStats();
    // 加载历史记录
    const savedHistory = localStorage.getItem('qa_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // 查询知识库
  const handleQuery = async () => {
    if (!query.trim()) {
      message.warning('请输入问题');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.get(`/api/knowledge/query`, {
        params: {
          query: query,
          top_k: 5
        }
      });

      if (response.data.code === 200) {
        setResults(response.data.data.results);
        message.success(`找到 ${response.data.data.results.length} 个相关知识点`);
        
        // 保存到历史记录
        const newHistory: QueryHistory = {
          query: query,
          results: response.data.data.results,
          timestamp: new Date().toLocaleString('zh-CN')
        };
        const updatedHistory = [newHistory, ...history].slice(0, 10); // 只保留最近 10 条
        setHistory(updatedHistory);
        localStorage.setItem('qa_history', JSON.stringify(updatedHistory));
      } else {
        throw new Error(response.data.msg || '查询失败');
      }
    } catch (err: any) {
      console.error('查询失败:', err);
      message.error(err.response?.data?.detail || '查询失败，请检查后端服务');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // 清除历史
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('qa_history');
    message.success('历史记录已清除');
  };

  // 计算相关度评分（距离越小越相关）
  const calculateRelevance = (distance: number) => {
    // 假设距离范围 0-2，转换为 5 星评分
    const score = Math.max(0, 5 - distance * 2.5);
    return Math.round(score * 2) / 2; // 保留 0.5 的倍数
  };

  // 查询示例问题
  const exampleQueries = [
    '如何进行 MySQL 数据库巡检？',
    'Oracle 性能优化的关键步骤有哪些？',
    'Linux 系统健康检查包括哪些内容？',
    '数据库慢查询如何分析和优化？',
    '如何监控数据库连接数？'
  ];

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      {/* 页面标题 */}
      <Card style={{ marginBottom: 24 }} bordered={false}>
        <Space>
          <RobotOutlined style={{ fontSize: 32, color: '#1890ff' }} />
          <div>
            <Title level={2} style={{ margin: 0 }}>知识库智能问答</Title>
            <Text type="secondary">基于向量检索的 DBA 知识问答系统</Text>
          </div>
        </Space>
      </Card>

      {/* 统计信息 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="知识库片段总数"
              value={stats?.total_chunks || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="查询次数"
              value={history.length}
              prefix={<HistoryOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={12}>
          <Card bordered={false}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>💡 提示：</Text>
              <Text>• 输入自然语言问题，系统自动匹配相关知识</Text>
              <Text>• 相关度用星级表示，⭐ 越多越相关</Text>
              <Text>• 支持中文语义理解，无需精确匹配关键词</Text>
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* 左侧：查询区域 */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <QuestionCircleOutlined />
                <Title level={4} style={{ margin: 0 }}>提问</Title>
              </Space>
            }
            bordered={false}
            style={{ marginBottom: 16 }}
          >
            <TextArea
              rows={4}
              placeholder="请输入您的问题，例如：如何进行 MySQL 数据库巡检？"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onPressEnter={() => handleQuery()}
              disabled={loading}
              style={{ marginBottom: 16, fontSize: '16px' }}
            />
            
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Button 
                type="primary" 
                size="large"
                icon={<SendOutlined />}
                onClick={handleQuery}
                loading={loading}
                disabled={!query.trim()}
              >
                提交问题
              </Button>
              <Button 
                size="large"
                icon={<ClearOutlined />}
                onClick={() => {
                  setQuery('');
                  setResults([]);
                }}
              >
                清空
              </Button>
            </Space>

            <Divider />

            <Title level={5}>💡 示例问题：</Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              {exampleQueries.map((q, index) => (
                <Tag
                  key={index}
                  color="blue"
                  style={{ cursor: 'pointer', margin: '4px', fontSize: '14px' }}
                  onClick={() => setQuery(q)}
                >
                  {q}
                </Tag>
              ))}
            </Space>
          </Card>

          {/* 查询历史 */}
          <Card
            title={
              <Space>
                <HistoryOutlined />
                <Title level={4} style={{ margin: 0 }}>查询历史</Title>
              </Space>
            }
            extra={
              <Button 
                type="link" 
                size="small" 
                icon={<ClearOutlined />}
                onClick={clearHistory}
                disabled={history.length === 0}
              >
                清除历史
              </Button>
            }
            bordered={false}
          >
            {history.length === 0 ? (
              <Empty description="暂无查询记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <List
                dataSource={history}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<QuestionCircleOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                      title={<Text strong>{item.query}</Text>}
                      description={<Text type="secondary">{item.timestamp}</Text>}
                    />
                    <Button 
                      type="link" 
                      size="small"
                      onClick={() => {
                        setQuery(item.query);
                        setResults(item.results);
                      }}
                    >
                      查看
                    </Button>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        {/* 右侧：结果区域 */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <ThunderboltOutlined />
                <Title level={4} style={{ margin: 0 }}>
                  {loading ? '正在查询...' : results.length > 0 ? `找到 ${results.length} 个相关知识点` : '查询结果'}
                </Title>
              </Space>
            }
            bordered={false}
          >
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <Spin size="large" tip="正在检索知识库..." />
              </div>
            ) : results.length === 0 ? (
              <Empty 
                description="暂无结果，请输入问题开始查询"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <List
                dataSource={results}
                renderItem={(item, index) => (
                  <List.Item style={{ padding: '16px 0' }}>
                    <Card 
                      size="small"
                      style={{ width: '100%', borderLeft: item.distance < 0.5 ? '4px solid #52c41a' : '4px solid #1890ff' }}
                      title={
                        <Space>
                          <Badge count={index + 1} style={{ backgroundColor: item.distance < 0.5 ? '#52c41a' : '#1890ff' }} />
                          <Text strong>相关知识点 {index + 1}</Text>
                          <Rate 
                            disabled 
                            value={calculateRelevance(item.distance)} 
                            style={{ fontSize: '12px' }}
                            allowHalf
                          />
                          <Tag color={item.distance < 0.5 ? 'success' : 'processing'}>
                            相似度：{((1 - item.distance / 2) * 100).toFixed(1)}%
                          </Tag>
                        </Space>
                      }
                      extra={
                        <Space size="small">
                          {item.metadata?.has_sql && (
                            <Tag icon={<ThunderboltOutlined />} color="red">SQL</Tag>
                          )}
                          {item.metadata?.file_name && (
                            <Tag icon={<FileTextOutlined />} color="orange">
                              {item.metadata.file_name}
                            </Tag>
                          )}
                        </Space>
                      }
                    >
                      <Paragraph 
                        style={{ 
                          whiteSpace: 'pre-wrap', 
                          lineHeight: '1.8',
                          fontSize: '14px',
                          marginBottom: 0,
                          backgroundColor: '#f6f8fa',
                          padding: '12px',
                          borderRadius: '4px'
                        }}
                      >
                        {item.content}
                      </Paragraph>
                      
                      {item.metadata && Object.keys(item.metadata).length > 0 && (
                        <>
                          <Divider style={{ margin: '12px 0' }} />
                          <Space direction="vertical" size="small" style={{ width: '100%' }}>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              <strong>来源文档：</strong>{item.metadata.file_name || '未知'}
                            </Text>
                            {item.metadata.type && (
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                <strong>类型：</strong>{item.metadata.type}
                              </Text>
                            )}
                          </Space>
                        </>
                      )}
                    </Card>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default KnowledgeQA;
