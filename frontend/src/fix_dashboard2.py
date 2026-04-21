with open(r'I:\APP\dreamops\frontend\src\pages\dashboard\NewDashboard.tsx', 'rb') as f:
    raw = f.read()

# Remove the inline StatCard function (already imported from '@/components/common/StatCard')
# Remove lines from '  function StatCard' to '  }\n}'
old_end = b'''  function StatCard({ title, value, icon, color }: { title: string; value: number; icon: string; color: string }) {
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

if old_end in raw:
    raw = raw.replace(old_end, b'}')
    with open(r'I:\APP\dreamops\frontend\src\pages\dashboard\NewDashboard.tsx', 'wb') as f:
        f.write(raw)
    print('Fixed! Removed inline StatCard')
else:
    print('Not found - trying alternate pattern')
    # Find StatCard
    pos = raw.find(b'function StatCard')
    if pos >= 0:
        print('Found StatCard at', pos, ':', repr(raw[pos:pos+100]))
