import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import StatCard from '@/components/common/StatCard';
import ChartComponent from '@/components/charts/ChartComponent';
import DataTable from '@/components/common/DataTable';
import { getScripts, Script } from '@/api/scripts';
import { getJobTemplates, getTaskSchedules, getExecutionLogs } from '@/api/automation';
import { getConfigItems } from '@/api/cmdb';
import { getBlogs } from '@/api/blog';
import { knowledgeApi } from '@/api/knowledge';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);

  // 统计数据
  const [stats, setStats] = useState({
    totalJobs: 0,
    runningJobs: 0,
    successfulJobs: 0,
    failedJobs: 0,
    jobTemplates: 0,
    scripts: 0,
    totalAssets: 0,
    activeAssets: 0,
    inactiveAssets: 0,
    maintenanceAssets: 0,
    totalBlogs: 0,
    publishedBlogs: 0,
    draftBlogs: 0,
    totalKnowledgeFiles: 0,
  });

  // 执行状态分布数据
  const [executionStatusData, setExecutionStatusData] = useState<{
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string[];
    }>;
  }>({
    labels: [],
    datasets: [],
  });

  // 脚本分类统计数据
  const [scriptCategoryData, setScriptCategoryData] = useState<{
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string[];
    }>;
  }>({
    labels: [],
    datasets: [],
  });

  // 资产状态分布数据
  const [assetStatusData, setAssetStatusData] = useState<{
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string[];
    }>;
  }>({
    labels: [],
    datasets: [],
  });

  // 资产类型分布数据
  const [assetTypeData, setAssetTypeData] = useState<{
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string[];
    }>;
  }>({
    labels: [],
    datasets: [],
  });

  // 博客文章状态分布数据
  const [blogStatusData, setBlogStatusData] = useState<{
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string[];
    }>;
  }>({
    labels: [],
    datasets: [],
  });

  // 知识库文件类型分布数据
  const [knowledgeFileTypeData, setKnowledgeFileTypeData] = useState<{
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string[];
    }>;
  }>({
    labels: [],
    datasets: [],
  });

  // 最近执行记录
  const [recentExecutions, setRecentExecutions] = useState<Array<{
    id: string;
    name: string;
    category: string;
    status: string;
    lastExecution: string;
  }>>([]);

  // 最近资产变更
  const [recentAssets, setRecentAssets] = useState<Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    updateTime: string;
  }>>([]);

  // 最近上传的知识库文档
  const [recentKnowledgeFiles, setRecentKnowledgeFiles] = useState<Array<{
    id: string;
    fileName: string;
    fileType: string;
    uploadTime: string;
  }>>([]);

  // 加载真实数据（带错误处理和重试）
  useEffect(() => {
    const loadData = async (retryCount = 0) => {
      setLoading(true);
      try {
        // 并行加载所有数据，但添加超时和错误处理
        const loadWithTimeout = async (promise: Promise<any>, timeout = 10000) => {
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('请求超时')), timeout)
          );
          return Promise.race([promise, timeoutPromise]);
        };

        const [scripts, templates, schedules, logs, assets, blogs, knowledgeFiles, knowledgeStats] = await Promise.all([
          loadWithTimeout(getScripts()).catch(e => {
            console.warn('加载脚本失败:', e.message);
            return [];
          }),
          loadWithTimeout(getJobTemplates()).catch(e => {
            console.warn('加载作业模板失败:', e.message);
            return [];
          }),
          loadWithTimeout(getTaskSchedules()).catch(e => {
            console.warn('加载任务编排失败:', e.message);
            return [];
          }),
          loadWithTimeout(getExecutionLogs()).catch(e => {
            console.warn('加载执行日志失败:', e.message);
            return [];
          }),
          loadWithTimeout(getConfigItems()).catch(e => {
            console.warn('加载资产失败:', e.message);
            return [];
          }),
          loadWithTimeout(getBlogs()).catch(e => {
            console.warn('加载博客失败:', e.message);
            return { blogs: [] };
          }),
          loadWithTimeout(knowledgeApi.getFiles()).catch(e => {
            console.warn('加载知识库文件失败:', e.message);
            return { data: [] };
          }),
          loadWithTimeout(knowledgeApi.getStats()).catch(e => {
            console.warn('加载知识库统计失败:', e.message);
            return { total: 0, by_type: {} };
          }),
        ]);

        // 统计脚本分类
        const categoryCount: Record<string, number> = {};
        scripts.forEach((script: Script) => {
          const category = script.category || '其他';
          categoryCount[category] = (categoryCount[category] || 0) + 1;
        });

        // 统计执行状态
        let successCount = 0;
        let failedCount = 0;
        let runningCount = 0;
        logs.forEach((log: any) => {
          if (log.status === 'success') successCount++;
          else if (log.status === 'failed') failedCount++;
          else if (log.status === 'running') runningCount++;
        });

        // 统计资产状态
        let activeCount = 0;
        let inactiveCount = 0;
        let maintenanceCount = 0;
        assets.forEach((asset: any) => {
          if (asset.status === 'active') activeCount++;
          else if (asset.status === 'inactive') inactiveCount++;
          else if (asset.status === 'maintenance') maintenanceCount++;
        });

        // 统计资产类型
        const assetTypeCount: Record<string, number> = {};
        assets.forEach((asset: any) => {
          const type = asset.type || '其他';
          assetTypeCount[type] = (assetTypeCount[type] || 0) + 1;
        });

        // 统计博客文章
        let publishedCount = 0;
        let draftCount = 0;
        blogs.blogs.forEach((blog: any) => {
          if (blog.status === '已发布') publishedCount++;
          else if (blog.status === '草稿') draftCount++;
        });

        // 统计知识库文件类型
        const knowledgeFileTypeCount: Record<string, number> = {};
        knowledgeFiles.data.forEach((file: any) => {
          const fileType = file.file_type || '其他';
          knowledgeFileTypeCount[fileType] = (knowledgeFileTypeCount[fileType] || 0) + 1;
        });

        // 设置统计数据
        setStats({
          totalJobs: schedules.length,
          runningJobs: runningCount,
          successfulJobs: successCount,
          failedJobs: failedCount,
          jobTemplates: templates.length,
          scripts: scripts.length,
          totalAssets: assets.length,
          activeAssets: activeCount,
          inactiveAssets: inactiveCount,
          maintenanceAssets: maintenanceCount,
          totalBlogs: blogs.blogs.length,
          publishedBlogs: publishedCount,
          draftBlogs: draftCount,
          totalKnowledgeFiles: knowledgeFiles.data.length,
        });

        // 设置执行状态分布
        setExecutionStatusData({
          labels: ['成功', '失败', '运行中'],
          datasets: [
            {
              label: '执行状态',
              data: [successCount, failedCount, runningCount],
              backgroundColor: ['#10b981', '#ef4444', '#3b82f6'],
            },
          ],
        });

        // 设置脚本分类统计
        const categories = Object.keys(categoryCount);
        const categoryData = Object.values(categoryCount);
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280'];
        
        setScriptCategoryData({
          labels: categories.length > 0 ? categories : ['暂无数据'],
          datasets: [
            {
              label: '脚本数量',
              data: categoryData.length > 0 ? categoryData : [0],
              backgroundColor: colors.slice(0, categories.length) || ['#6b7280'],
            },
          ],
        });

        // 设置资产状态分布
        setAssetStatusData({
          labels: ['在线', '离线', '维护中'],
          datasets: [
            {
              label: '资产状态',
              data: [activeCount, inactiveCount, maintenanceCount],
              backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
            },
          ],
        });

        // 设置资产类型分布
        const assetTypes = Object.keys(assetTypeCount);
        const assetTypeValues = Object.values(assetTypeCount);
        setAssetTypeData({
          labels: assetTypes.length > 0 ? assetTypes : ['暂无数据'],
          datasets: [
            {
              label: '资产数量',
              data: assetTypeValues.length > 0 ? assetTypeValues : [0],
              backgroundColor: colors.slice(0, assetTypes.length) || ['#6b7280'],
            },
          ],
        });

        // 设置博客文章状态分布
        setBlogStatusData({
          labels: ['已发布', '草稿'],
          datasets: [
            {
              label: '文章数量',
              data: [publishedCount, draftCount],
              backgroundColor: ['#10b981', '#f59e0b'],
            },
          ],
        });

        // 设置知识库文件类型分布
        const knowledgeFileTypes = Object.keys(knowledgeFileTypeCount);
        const knowledgeFileTypeValues = Object.values(knowledgeFileTypeCount);
        setKnowledgeFileTypeData({
          labels: knowledgeFileTypes.length > 0 ? knowledgeFileTypes : ['暂无数据'],
          datasets: [
            {
              label: '文件数量',
              data: knowledgeFileTypeValues.length > 0 ? knowledgeFileTypeValues : [0],
              backgroundColor: colors.slice(0, knowledgeFileTypes.length) || ['#6b7280'],
            },
          ],
        });

        // 设置最近执行记录（取最新的5条）
        const recentLogs = logs
          .slice(0, 5)
          .map((log: any) => ({
            id: String(log.id),
            name: log.name || '未命名',
            category: log.execution_type === 'schedule' ? '编排' : 
                     log.execution_type === 'job' ? '作业' : '脚本',
            status: log.status === 'success' ? '成功' : 
                   log.status === 'failed' ? '失败' : '运行中',
            lastExecution: log.start_time || '-',
          }));
        setRecentExecutions(recentLogs);

        // 设置最近资产变更（取最新的5条）
        const recentAssetChanges = assets
          .sort((a: any, b: any) => new Date(b.updateTime).getTime() - new Date(a.updateTime).getTime())
          .slice(0, 5)
          .map((asset: any) => ({
            id: String(asset.id),
            name: asset.name || '未命名',
            type: asset.type || '其他',
            status: asset.status === 'active' ? '在线' : 
                   asset.status === 'inactive' ? '离线' : '维护中',
            updateTime: asset.updateTime || '-',
          }));
        setRecentAssets(recentAssetChanges);

        // 设置最近上传的知识库文档（取最新的5条）
        const recentKnowledge = knowledgeFiles.data
          .sort((a: any, b: any) => new Date(b.upload_time).getTime() - new Date(a.upload_time).getTime())
          .slice(0, 5)
          .map((file: any) => ({
            id: String(file.id),
            fileName: file.file_name || '未命名',
            fileType: file.file_type || '其他',
            uploadTime: file.upload_time || '-',
          }));
        setRecentKnowledgeFiles(recentKnowledge);

      } catch (error) {
        console.error('加载Dashboard数据失败:', error);
        
        // 如果还有重试次数，延迟后重试
        if (retryCount < 3) {
          console.log(`第${retryCount + 1}次重试，等待${(retryCount + 1) * 2000}ms后重试...`);
          setTimeout(() => {
            loadData(retryCount + 1);
          }, (retryCount + 1) * 2000); // 2秒、4秒、6秒后重试
        } else {
          // 显示错误信息
          message.error({
            content: '加载数据失败，可能是系统繁忙，请稍后刷新页面',
            duration: 5,
          });
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // 刷新数据
  const handleRefresh = () => {
    window.location.reload();
  };

  // 最近执行的表格列配置
  const recentExecutionColumns = [
    {
      title: '名称',
      dataIndex: 'name' as const,
    },
    {
      title: '类型',
      dataIndex: 'category' as const,
    },
    {
      title: '状态',
      dataIndex: 'status' as const,
      render: (text: string) => {
        let statusClass = '';
        switch (text) {
          case '成功':
            statusClass = 'bg-green-100 text-green-800';
            break;
          case '失败':
            statusClass = 'bg-red-100 text-red-800';
            break;
          case '运行中':
            statusClass = 'bg-blue-100 text-blue-800';
            break;
          default:
            statusClass = 'bg-gray-100 text-gray-800';
        }
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
            {text}
          </span>
        );
      },
    },
    {
      title: '执行时间',
      dataIndex: 'lastExecution' as const,
    },
  ];

  // 最近资产变更的表格列配置
  const recentAssetColumns = [
    {
      title: '名称',
      dataIndex: 'name' as const,
    },
    {
      title: '类型',
      dataIndex: 'type' as const,
    },
    {
      title: '状态',
      dataIndex: 'status' as const,
      render: (text: string) => {
        let statusClass = '';
        switch (text) {
          case '在线':
            statusClass = 'bg-green-100 text-green-800';
            break;
          case '离线':
            statusClass = 'bg-red-100 text-red-800';
            break;
          case '维护中':
            statusClass = 'bg-yellow-100 text-yellow-800';
            break;
          default:
            statusClass = 'bg-gray-100 text-gray-800';
        }
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
            {text}
          </span>
        );
      },
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime' as const,
    },
  ];

  // 最近上传的知识库文档的表格列配置
  const recentKnowledgeColumns = [
    {
      title: '文件名',
      dataIndex: 'fileName' as const,
    },
    {
      title: '文件类型',
      dataIndex: 'fileType' as const,
    },
    {
      title: '上传时间',
      dataIndex: 'uploadTime' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">总览仪表盘</h1>
          <p className="mt-1 text-sm text-gray-500">查看系统运行状态和关键指标</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-2">
          <button 
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <i className="fa fa-refresh mr-1"></i> 刷新数据
          </button>
        </div>
      </div>

      {/* 核心指标区域 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="任务编排"
          value={stats.totalJobs}
          icon={<i className="fa fa-tasks text-blue-500 text-xl"></i>}
          color="blue"
        />
        <StatCard
          title="执行中"
          value={stats.runningJobs}
          icon={<i className="fa fa-spinner fa-spin text-orange-500 text-xl"></i>}
          color="orange"
        />
        <StatCard
          title="资产总数"
          value={stats.totalAssets}
          icon={<i className="fa fa-server text-green-500 text-xl"></i>}
          color="green"
        />
        <StatCard
          title="知识库文档"
          value={stats.totalKnowledgeFiles}
          icon={<i className="fa fa-book text-purple-500 text-xl"></i>}
          color="purple"
        />
      </div>

      {/* 主要内容区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧区域 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 自动化管理卡片 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">自动化管理</h2>
              <a href="#/task-schedules" className="text-sm text-blue-600 hover:text-blue-800">查看详情</a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-md font-medium text-gray-700 mb-3">执行状态分布</h3>
                {loading ? (
                  <div className="flex items-center justify-center h-48 text-gray-500">
                    加载中...
                  </div>
                ) : (
                  <ChartComponent
                    type="doughnut"
                    data={executionStatusData}
                    options={{
                      plugins: {
                        legend: {
                          position: 'bottom'
                        }
                      },
                      cutout: '70%'
                    }}
                    height={200}
                  />
                )}
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-md font-medium text-gray-700 mb-3">脚本分类统计</h3>
                {loading ? (
                  <div className="flex items-center justify-center h-48 text-gray-500">
                    加载中...
                  </div>
                ) : (
                  <ChartComponent
                    type="bar"
                    data={scriptCategoryData}
                    options={{
                      plugins: {
                        legend: {
                          display: false
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            stepSize: 1
                          }
                        }
                      }
                    }}
                    height={200}
                  />
                )}
              </div>
            </div>
          </div>

          {/* 资产管理卡片 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">资产管理</h2>
              <a href="#/asset-management" className="text-sm text-blue-600 hover:text-blue-800">查看详情</a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-md font-medium text-gray-700 mb-3">资产状态分布</h3>
                {loading ? (
                  <div className="flex items-center justify-center h-48 text-gray-500">
                    加载中...
                  </div>
                ) : (
                  <ChartComponent
                    type="pie"
                    data={assetStatusData}
                    options={{
                      plugins: {
                        legend: {
                          position: 'bottom'
                        }
                      }
                    }}
                    height={200}
                  />
                )}
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-md font-medium text-gray-700 mb-3">资产类型分布</h3>
                {loading ? (
                  <div className="flex items-center justify-center h-48 text-gray-500">
                    加载中...
                  </div>
                ) : (
                  <ChartComponent
                    type="bar"
                    data={assetTypeData}
                    options={{
                      plugins: {
                        legend: {
                          display: false
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            stepSize: 1
                          }
                        }
                      }
                    }}
                    height={200}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 右侧区域 */}
        <div className="space-y-6">
          {/* 内容管理卡片 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">内容管理</h2>
              <a href="#/personal-blog" className="text-sm text-blue-600 hover:text-blue-800">查看详情</a>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-md font-medium text-gray-700 mb-3">博客文章状态</h3>
                {loading ? (
                  <div className="flex items-center justify-center h-36 text-gray-500">
                    加载中...
                  </div>
                ) : (
                  <ChartComponent
                    type="doughnut"
                    data={blogStatusData}
                    options={{
                      plugins: {
                        legend: {
                          position: 'bottom'
                        }
                      },
                      cutout: '70%'
                    }}
                    height={150}
                  />
                )}
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-md font-medium text-gray-700 mb-3">知识库文件类型</h3>
                {loading ? (
                  <div className="flex items-center justify-center h-36 text-gray-500">
                    加载中...
                  </div>
                ) : (
                  <ChartComponent
                    type="bar"
                    data={knowledgeFileTypeData}
                    options={{
                      plugins: {
                        legend: {
                          display: false
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            stepSize: 1
                          }
                        }
                      }
                    }}
                    height={150}
                  />
                )}
              </div>
            </div>
          </div>

          {/* 系统概览卡片 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">系统概览</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">作业模板</span>
                <span className="text-sm font-medium">{stats.jobTemplates}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">脚本数量</span>
                <span className="text-sm font-medium">{stats.scripts}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">成功任务</span>
                <span className="text-sm font-medium text-green-600">{stats.successfulJobs}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">失败任务</span>
                <span className="text-sm font-medium text-red-600">{stats.failedJobs}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">博客文章</span>
                <span className="text-sm font-medium">{stats.totalBlogs}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 最近活动区域 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">最近活动</h2>
        <div className="space-y-6">
          {/* 最近执行记录 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md font-medium text-gray-700">最近执行记录</h3>
              <a href="#/execution-logs" className="text-sm text-blue-600 hover:text-blue-800">查看全部</a>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <DataTable
                columns={recentExecutionColumns}
                dataSource={recentExecutions}
                loading={loading}
                pagination={false}
              />
            </div>
          </div>

          {/* 最近资产变更 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md font-medium text-gray-700">最近资产变更</h3>
              <a href="#/asset-management" className="text-sm text-blue-600 hover:text-blue-800">查看全部</a>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <DataTable
                columns={recentAssetColumns}
                dataSource={recentAssets}
                loading={loading}
                pagination={false}
              />
            </div>
          </div>

          {/* 最近上传的知识库文档 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md font-medium text-gray-700">最近上传的知识库文档</h3>
              <a href="#/knowledge-base" className="text-sm text-blue-600 hover:text-blue-800">查看全部</a>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <DataTable
                columns={recentKnowledgeColumns}
                dataSource={recentKnowledgeFiles}
                loading={loading}
                pagination={false}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
