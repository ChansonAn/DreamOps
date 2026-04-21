with open(r'I:\APP\dreamops\frontend\src\pages\dashboard\NewDashboard.tsx', 'rb') as f:
    raw = f.read()

# The file ends with 'let inactive' - add the missing part
old_tail = b'let activeCount = 0;\n        let inactive'
new_tail = b'''let activeCount = 0;
        let inactiveCount = 0;

        // \u7edf\u8ba1\u8d44\u4ea7\u72b6\u6001
        configItems.forEach((item: any) => {
          if (item.status === 'active' || item.status === '\u6d3b\u8dc3') activeCount++;
          else inactiveCount++;
        });

        setStats({
          totalScripts: scripts.length,
          totalTemplates: templates.length,
          totalConfigItems: configItems.length,
          activeConfigItems: activeCount,
          inactiveConfigItems: inactiveCount,
          successCount,
          failedCount,
          runningCount,
          totalExecutions: logs.length,
        });
      } catch (error) {
        console.error('\u52a0\u8f7d\u6570\u636e\u5931\u8d25:', error);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">\u4eea\u8868\u76d1\u63a7\u5927\u536b</h1>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* \u6570\u636e\u7edf\u8ba1\u5361\u7247 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard title="\u811a\u672c\u6570\u91cf" value={stats.totalScripts} icon="fa-code" color="blue" />
              <StatCard title="\u4f5c\u4e1a\u6a21\u677f" value={stats.totalTemplates} icon="fa-layer-group" color="green" />
              <StatCard title="\u8d44\u4ea7\u603b\u6570" value={stats.totalConfigItems} icon="fa-server" color="purple" />
              <StatCard title="\u6d3b\u8dc3\u8d44\u4ea7" value={stats.activeConfigItems} icon="fa-check-circle" color="emerald" />
            </div>

            {/* \u6267\u884c\u7edf\u8ba1 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-500 mb-1">\u6267\u884c\u72b6\u6001</div>
                <div className="flex gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">{stats.successCount}</div>
                    <div className="text-xs text-gray-400">\u6210\u529f</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-500">{stats.failedCount}</div>
                    <div className="text-xs text-gray-400">\u5931\u8d25</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-500">{stats.runningCount}</div>
                    <div className="text-xs text-gray-400">\u8fd0\u884c\u4e2d</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-500 mb-1">\u8fde\u63a5\u72b6\u6001</div>
                <div className="flex gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">{stats.activeConfigItems}</div>
                    <div className="text-xs text-gray-400">\u6d3b\u8dc3</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-400">{stats.inactiveConfigItems}</div>
                    <div className="text-xs text-gray-400">\u975e\u6d3b\u8dc3</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">{stats.totalExecutions}</div>
                  <div className="text-xs text-gray-400">\u6267\u884c\u8bb0\u5f55\u603b\u6570</div>
                </div>
              </div>
            </div>

            {/* \u6700\u8fd1\u6267\u884c\u8bb0\u5f55 */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 py-3 border-b border-gray-200">
                <h2 className="text-lg font-semibold">\u6700\u8fd1\u6267\u884c\u8bb0\u5f55</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {logs.slice(0, 10).map((log: any) => (
                  <div key={log.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{log.name || '\u65e0\u540d\u79f0'}</div>
                      <div className="text-xs text-gray-400">{log.created_at || log.start_time}</div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      log.status === 'success' ? 'bg-green-100 text-green-800' :
                      log.status === 'failed' ? 'bg-red-100 text-red-800' :
                      log.status === 'running' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {log.status === 'success' ? '\u6210\u529f' : log.status === 'failed' ? '\u5931\u8d25' : log.status === 'running' ? '\u8fd0\u884c\u4e2d' : log.status}
                    </span>
                  </div>
                ))}
                {logs.length === 0 && (
                  <div className="px-4 py-8 text-center text-gray-400">\u6682\u65e0\u6267\u884c\u8bb0\u5f55</div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  function StatCard({ title, value, icon, color }: { title: string; value: number; icon: string; color: string }) {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      emerald: 'bg-emerald-100 text-emerald-600',
    };
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">{title}</div>
            <div className="text-2xl font-bold mt-1">{value}</div>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorMap[color]}`}>
            <i className={`fa ${icon}`}></i>
          </div>
        </div>
      </div>
    );
  }
}'''

if old_tail in raw:
    raw = raw.replace(old_tail, new_tail)
    with open(r'I:\APP\dreamops\frontend\src\pages\dashboard\NewDashboard.tsx', 'wb') as f:
        f.write(raw)
    print('Fixed! New size:', len(raw), 'bytes')
else:
    print('Tail not found')
    print(repr(raw[-100:]))
