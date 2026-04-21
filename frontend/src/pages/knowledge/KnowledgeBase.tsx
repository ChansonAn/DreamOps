import { useState, useEffect } from 'react';
import { 
  Card, Upload, Button, message, Space, Typography, Table, Tag, 
  Statistic, Row, Col, Descriptions, Divider, Popconfirm, Tooltip,
  Empty, Spin, Alert, Tabs, Badge, Progress
} from 'antd';
import { 
  UploadOutlined, FileTextOutlined, CheckCircleOutlined, 
  CloseCircleOutlined, DatabaseOutlined, DownloadOutlined, 
  DeleteOutlined, SearchOutlined, PlusOutlined, ReloadOutlined,
  FilePdfOutlined, FileWordOutlined, FileMarkdownOutlined,
  FileTextOutlined as FileTextIcon, QuestionCircleOutlined
} from '@ant-design/icons';
import apiClient, { API_BASE_URL } from '@/api/client';

const { Title, Paragraph, Text } = Typography;
const { Dragger } = Upload;

// 类型定义
interface FileRecord {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  chunk_count: number;
  upload_time: string;
  status: 'success' | 'failed';
  content_preview?: string;
}

interface CollectionInfo {
  collection_name: string;
  total_chunks: number;
  total_files: number;
  created_at: string;
}

interface KnowledgeStats {
  total_chunks: number;
  collection_name: string;
  collections?: CollectionInfo[];
}

const KnowledgeBase: React.FC = () => {
  // 状态管理
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState<KnowledgeStats | null>(null);
  const [fileList, setFileList] = useState<FileRecord[]>([]);
  const [activeTab, setActiveTab] = useState('upload');
  const [searchText, setSearchText] = useState('');

  // 获取统计信息
  const fetchStats = async () => {
    try {
      const response = await apiClient.get(`/api/knowledge/stats`);
      if (response.data.code === 200) {
        setStats(response.data.data);
      }
    } catch (err: any) {
      console.error('获取统计信息失败:', err);
      message.error('获取统计信息失败');
    }
  };

  // 获取文件列表
  const fetchFileList = async () => {
    console.log('[FILE_LIST] 开始获取文件列表...');
    try {
      const response = await apiClient.get(`/api/knowledge/files`);
      console.log('[FILE_LIST] 响应:', response.data);
      if (response.data.code === 200) {
        setFileList(response.data.data);
        console.log('[FILE_LIST] ✓ 文件列表设置成功，数量:', response.data.data.length);
      } else {
        console.error('[FILE_LIST] ✗ 响应 code 不是 200');
      }
    } catch (err: any) {
      console.error('[FILE_LIST] ✗ 获取文件列表失败:', err);
      console.error('[FILE_LIST] 错误响应:', err.response);
      message.error('获取文件列表失败');
    }
  };

  // 组件加载时获取数据
  useEffect(() => {
    fetchStats();
    fetchFileList();
  }, []);

  // 文件上传处理
  const handleUpload = async (file: File) => {
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.post(
        `/api/knowledge/upload-and-build`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 120000,
        }
      );

      if (response.data.code === 200) {
        message.success('知识库搭建成功！');
        fetchStats(); // 更新统计信息
        fetchFileList(); // 刷新文件列表 ⭐ 新增
        setActiveTab('files'); // 切换到文件列表
      } else {
        throw new Error(response.data.msg || '上传失败');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || '上传失败，请检查后端服务';
      message.error(errorMsg);
    } finally {
      setUploading(false);
    }

    return false;
  };

  // 下载文件
  const handleDownload = async (record: FileRecord) => {
    try {
      const response = await apiClient.get(
        `/api/knowledge/files/${record.id}/download`,
        { responseType: 'blob' }
      );
      
      // 创建下载链接
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = record.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      message.success('下载成功');
    } catch (err: any) {
      console.error('下载失败:', err);
      message.error('下载失败');
    }
  };

  // 删除文件
  const handleDelete = async (record: FileRecord) => {
    try {
      await apiClient.delete(`/api/knowledge/files/${record.id}`);
      
      setFileList(fileList.filter(f => f.id !== record.id));
      fetchStats(); // 更新统计
      fetchFileList(); // 刷新列表
      message.success('删除成功');
    } catch (err: any) {
      console.error('删除失败:', err);
      message.error(err.response?.data?.detail || '删除失败');
    }
  };

  // 获取文件图标
  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return <FilePdfOutlined style={{ color: '#ff4d4f', fontSize: 24 }} />;
      case 'docx':
      case 'doc':
        return <FileWordOutlined style={{ color: '#1890ff', fontSize: 24 }} />;
      case 'md':
        return <FileMarkdownOutlined style={{ color: '#52c41a', fontSize: 24 }} />;
      case 'txt':
        return <FileTextIcon style={{ color: '#faad14', fontSize: 24 }} />;
      default:
        return <FileTextOutlined style={{ color: '#8c8c8c', fontSize: 24 }} />;
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // 文件列表表格列
  const columns = [
    {
      title: '文件名',
      dataIndex: 'file_name',
      key: 'file_name',
      render: (text: string, record: FileRecord) => (
        <Space>
          {getFileIcon(record.file_type)}
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: '文件大小',
      dataIndex: 'file_size',
      key: 'file_size',
      render: (size: number) => formatFileSize(size),
    },
    {
      title: '片段数',
      dataIndex: 'chunk_count',
      key: 'chunk_count',
      render: (count: number) => <Badge count={count} showZero />,
    },
    {
      title: '上传时间',
      dataIndex: 'upload_time',
      key: 'upload_time',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'success' ? 'success' : 'error'}>
          {status === 'success' ? '成功' : '失败'}
        </Tag>
      ),
    },
    {
      title: '预览',
      dataIndex: 'content_preview',
      key: 'content_preview',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <Text type="secondary" style={{ maxWidth: 300, display: 'block' }}>
            {text?.substring(0, 50)}...
          </Text>
        </Tooltip>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: FileRecord) => (
        <Space>
          <Tooltip title="下载">
            <Button
              type="link"
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个文件吗？"
            onConfirm={() => handleDelete(record)}
            okText="确定"
            cancelText="取消"
            icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 上传区域
  const uploadContent = (
    <Card 
      title={
        <Space>
          <UploadOutlined />
          <Title level={3} style={{ margin: 0 }}>上传文件搭建知识库</Title>
        </Space>
      }
      bordered={false}
    >
      <Paragraph type="secondary" style={{ marginBottom: 24 }}>
        支持上传 DBA 文档（txt/md/sql/pdf/docx 格式），系统将自动脱敏敏感信息，调用豆包 AI 解析知识点，并存入向量数据库。
      </Paragraph>

      <Dragger
        accept=".txt,.md,.sql,.pdf,.docx"
        multiple={false}
        customRequest={({ file }) => handleUpload(file as File)}
        disabled={uploading}
        showUploadList={false}  // 不显示上传列表（避免误导）
        style={{ marginBottom: 16 }}
      >
        <p className="ant-upload-drag-icon">
          <FileTextOutlined style={{ color: '#1890ff' }} />
        </p>
        <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
        <p className="ant-upload-hint">
          支持的文件格式：txt, md, sql, pdf, docx。上传后将自动进行脱敏处理和 AI 解析。
        </p>
      </Dragger>

      {uploading && (
        <Alert
          message="正在处理中，请稍候..."
          description={
            <Space direction="vertical" style={{ width: '100%', marginTop: 8 }}>
              <Progress percent={50} status="active" />
              <Text type="secondary">
                正在解析文档、脱敏敏感信息、调用 AI 分析、向量入库...
              </Text>
            </Space>
          }
          type="info"
          showIcon
        />
      )}

      <Divider />

      <Title level={5}>使用说明：</Title>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Text>• <Text strong>文件上传：</Text>支持 txt、md、sql、pdf、docx 格式</Text>
        <Text>• <Text strong>自动脱敏：</Text>IP 地址、数据库账号密码、敏感表名、端口号等</Text>
        <Text>• <Text strong>AI 解析：</Text>提取故障现象、原因、排查步骤、解决命令、注意事项</Text>
        <Text>• <Text strong>向量入库：</Text>拆分为语义片段，存入 Chroma 向量数据库</Text>
      </Space>
    </Card>
  );

  // 文件列表区域
  const filesContent = (
    <Card
      title={
        <Space>
          <DatabaseOutlined />
          <Title level={3} style={{ margin: 0 }}>知识库文件列表</Title>
        </Space>
      }
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchStats}>刷新</Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setActiveTab('upload')}
          >
            上传文件
          </Button>
        </Space>
      }
      bordered={false}
    >
      {fileList.length === 0 ? (
        <Empty 
          description="暂无文件"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setActiveTab('upload')}>
            上传第一个文件
          </Button>
        </Empty>
      ) : (
        <Table
          columns={columns}
          dataSource={fileList}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
        />
      )}
    </Card>
  );

  // 统计信息卡片
  const statsCard = (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={12} lg={6}>
        <Card bordered={false}>
          <Statistic
            title="知识库片段总数"
            value={stats?.total_chunks || 0}
            prefix={<DatabaseOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card bordered={false}>
          <Statistic
            title="文件总数"
            value={fileList.length}
            prefix={<FileTextOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card bordered={false}>
          <Statistic
            title="集合名称"
            value={stats?.collection_name || 'dba_knowledge'}
            valueStyle={{ fontSize: '14px' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card bordered={false}>
          <Statistic
            title="支持格式"
            value="5 种"
            valueStyle={{ fontSize: '14px' }}
          />
          <Tag color="blue">txt</Tag>
          <Tag color="green">md</Tag>
          <Tag color="orange">sql</Tag>
          <Tag color="red">pdf</Tag>
          <Tag color="purple">docx</Tag>
        </Card>
      </Col>
    </Row>
  );

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      {/* 页面标题 */}
      <Card style={{ marginBottom: 24 }} bordered={false}>
        <Space>
          <DatabaseOutlined style={{ fontSize: 28, color: '#1890ff' }} />
          <div>
            <Title level={2} style={{ margin: 0 }}>知识库管理</Title>
            <Text type="secondary">DBA 文档智能解析与向量检索</Text>
          </div>
        </Space>
      </Card>

      {/* 统计信息 */}
      {statsCard}

      {/* 标签页 */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'upload',
            label: (
              <Space>
                <UploadOutlined />
                <span>上传文件</span>
              </Space>
            ),
            children: uploadContent,
          },
          {
            key: 'files',
            label: (
              <Space>
                <DatabaseOutlined />
                <span>文件列表</span>
                <Badge count={fileList.length} showZero />
              </Space>
            ),
            children: filesContent,
          },
        ]}
      />
    </div>
  );
};

export default KnowledgeBase;
