with open(r'I:\APP\dreamops\frontend\src\router\index.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove NewDashboard import
content = content.replace(
    "const NewDashboard = lazy(() => import('@/pages/dashboard/NewDashboard'));\n",
    ""
)

# Remove NewDashboard route
content = content.replace(
    '          <Route path="/new-dashboard" element={<NewDashboard />} />\n',
    ""
)

with open(r'I:\APP\dreamops\frontend\src\router\index.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done - NewDashboard references removed')
