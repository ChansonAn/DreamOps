import React from 'react';

export interface Column<T> {
  title: string | React.ReactNode;
  dataIndex: keyof T;
  key?: string;
  width?: string | number;
  render?: (text: any, record: T, index: number) => React.ReactNode;
  fixed?: 'left' | 'right';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  dataSource: T[];
  loading?: boolean;
  pagination?: boolean | {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize?: number) => void;
  };
  onRow?: (record: T, index: number) => {
    onClick?: (event: React.MouseEvent) => void;
    onDoubleClick?: (event: React.MouseEvent) => void;
    onContextMenu?: (event: React.MouseEvent) => void;
    onMouseEnter?: (event: React.MouseEvent) => void;
    onMouseLeave?: (event: React.MouseEvent) => void;
  };
  rowKey?: string;
}

const DataTable = <T extends object>({
  columns,
  dataSource,
  loading = false,
  pagination = true,
  onRow,
  rowKey = 'id',
}: DataTableProps<T>) => {
  const handleRowClick = (record: T, index: number, event: React.MouseEvent) => {
    if (onRow) {
      const rowHandlers = onRow(record, index);
      if (rowHandlers?.onClick) {
        rowHandlers.onClick(event);
      }
    }
  };

  const renderPagination = () => {
    if (!pagination) return null;

    if (typeof pagination === 'object') {
      const { current, pageSize, total, onChange } = pagination;
      const jumpId = 'dt-jump-' + Math.random().toString(36).slice(2, 8);
      const totalPages = Math.ceil(total / pageSize);
      const pageSizeOptions = [10, 25, 50, 100];

      const generatePageButtons = () => {
        const buttons = [];
        
        if (current > 1) {
          buttons.push(
            <button key="first" className="px-3 py-1 border rounded-md text-sm bg-white text-gray-700 hover:bg-gray-50" onClick={() => onChange(1, pageSize)}>First</button>
          );
        }

        buttons.push(
          <button key="prev" className={`px-3 py-1 border rounded-md text-sm ${current <= 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`} onClick={() => onChange(current - 1, pageSize)} disabled={current <= 1}>Prev</button>
        );

        if (totalPages <= 7) {
          for (let i = 1; i <= totalPages; i++) {
            buttons.push(
              <button key={i} className={`px-3 py-1 border rounded-md text-sm ${current === i ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-gray-700 hover:bg-gray-50'}`} onClick={() => onChange(i, pageSize)}>{i}</button>
            );
          }
        } else {
          if (current <= 4) {
            for (let i = 1; i <= 5; i++) {
              buttons.push(
                <button key={i} className={`px-3 py-1 border rounded-md text-sm ${current === i ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-gray-700 hover:bg-gray-50'}`} onClick={() => onChange(i, pageSize)}>{i}</button>
              );
            }
            buttons.push(<span key="ellipsis1" className="px-2 text-gray-500">...</span>);
            buttons.push(<button key={totalPages} className="px-3 py-1 border rounded-md text-sm bg-white text-gray-700 hover:bg-gray-50" onClick={() => onChange(totalPages, pageSize)}>{totalPages}</button>);
          } else if (current >= totalPages - 3) {
            buttons.push(<button key={1} className="px-3 py-1 border rounded-md text-sm bg-white text-gray-700 hover:bg-gray-50" onClick={() => onChange(1, pageSize)}>1</button>);
            buttons.push(<span key="ellipsis1" className="px-2 text-gray-500">...</span>);
            for (let i = totalPages - 4; i <= totalPages; i++) {
              buttons.push(
                <button key={i} className={`px-3 py-1 border rounded-md text-sm ${current === i ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-gray-700 hover:bg-gray-50'}`} onClick={() => onChange(i, pageSize)}>{i}</button>
              );
            }
          } else {
            buttons.push(<button key={1} className="px-3 py-1 border rounded-md text-sm bg-white text-gray-700 hover:bg-gray-50" onClick={() => onChange(1, pageSize)}>1</button>);
            buttons.push(<span key="ellipsis1" className="px-2 text-gray-500">...</span>);
            for (let i = current - 1; i <= current + 1; i++) {
              buttons.push(
                <button key={i} className={`px-3 py-1 border rounded-md text-sm ${current === i ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-gray-700 hover:bg-gray-50'}`} onClick={() => onChange(i, pageSize)}>{i}</button>
              );
            }
            buttons.push(<span key="ellipsis2" className="px-2 text-gray-500">...</span>);
            buttons.push(<button key={totalPages} className="px-3 py-1 border rounded-md text-sm bg-white text-gray-700 hover:bg-gray-50" onClick={() => onChange(totalPages, pageSize)}>{totalPages}</button>);
          }
        }

        buttons.push(
          <button key="next" className={`px-3 py-1 border rounded-md text-sm ${current >= totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`} onClick={() => onChange(current + 1, pageSize)} disabled={current >= totalPages}>Next</button>
        );

        if (current < totalPages) {
          buttons.push(<button key="last" className="px-3 py-1 border rounded-md text-sm bg-white text-gray-700 hover:bg-gray-50" onClick={() => onChange(totalPages, pageSize)}>Last</button>);
        }

        return buttons;
      };

      return (
        <div className="flex justify-between items-center mt-4 px-4">
          <div className="text-sm text-gray-600">
            Show {(current - 1) * pageSize + 1} - {Math.min(current * pageSize, total)} of {total} items
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Per page:</span>
              <select className="px-2 py-1 border rounded-md text-sm bg-white text-gray-700" value={pageSize} onChange={(e) => { const newPageSize = parseInt(e.target.value); const newCurrent = Math.min(current, Math.ceil(total / newPageSize)); onChange(newCurrent, newPageSize); }}>
                {pageSizeOptions.map(option => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
            <div className="flex items-center space-x-1">{generatePageButtons()}</div>
            <div className="flex items-center space-x-1 ml-2">
              <span className="text-sm text-gray-600">跳至</span>
              <input
                id={jumpId}
                type="number"
                min={1}
                max={totalPages}
                className="w-14 px-2 py-1 border rounded-md text-sm text-center"
                defaultValue={current}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = parseInt((e.target as HTMLInputElement).value);
                    if (val >= 1 && val <= totalPages) onChange(val, pageSize);
                  }
                }}
              />
              <span className="text-sm text-gray-600">页</span>
              <button className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600" onClick={() => {
                const input = document.getElementById(jumpId) as HTMLInputElement;
                if (input) {
                  const val = parseInt(input.value);
                  if (val >= 1 && val <= totalPages) onChange(val, pageSize);
                }
              }}>GO</button>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const leftFixedColumns = columns.filter(col => col.fixed === 'left');
  const scrollableColumns = columns.filter(col => !col.fixed);
  const rightFixedColumns = columns.filter(col => col.fixed === 'right');

  const calculateTotalWidth = (cols: Column<T>[]) => {
    return cols.reduce((total, col) => {
      if (typeof col.width === 'string' && col.width.endsWith('px')) {
        return total + parseInt(col.width, 10);
      } else if (typeof col.width === 'number') {
        return total + col.width;
      }
      return total + 150;
    }, 0);
  };

  const leftFixedWidth = calculateTotalWidth(leftFixedColumns);
  const rightFixedWidth = calculateTotalWidth(rightFixedColumns);

  return (
    <div className="mb-4">
      <div className="overflow-x-auto" style={{ paddingRight: rightFixedWidth > 0 ? `${rightFixedWidth}px` : 0 }}>
        <table className="min-w-full divide-y divide-gray-200" style={{ marginLeft: leftFixedWidth > 0 ? `-${leftFixedWidth}px` : 0 }}>
          <thead className="bg-gray-50">
            <tr>
              {leftFixedColumns.map((column, index) => (
                <th key={index} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 z-10" style={{ width: column.width, position: 'sticky', left: calculateTotalWidth(leftFixedColumns.slice(0, index)), zIndex: 10 }}>{column.title}</th>
              ))}
              {scrollableColumns.map((column, index) => (
                <th key={index} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: column.width }}>{column.title}</th>
              ))}
              {rightFixedColumns.map((column, index) => (
                <th key={`right-${index}`} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: column.width }}>{column.title}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
            ) : dataSource.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500">No data</td></tr>
            ) : (
              dataSource.map((record, index) => (
                <tr key={(record as any)[rowKey] || index} onClick={(e) => handleRowClick(record, index, e)} className="hover:bg-gray-50 cursor-pointer transition-colors duration-150">
                  {leftFixedColumns.map((column, colIndex) => (
                    <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 bg-white z-10" style={{ position: 'sticky', left: calculateTotalWidth(leftFixedColumns.slice(0, colIndex)), zIndex: 5 }}>
                      {column.render ? column.render((record as any)[column.dataIndex] as any, record, index) : ((record as any)[column.dataIndex] as React.ReactNode)}
                    </td>
                  ))}
                  {scrollableColumns.map((column, colIndex) => (
                    <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {column.render ? column.render((record as any)[column.dataIndex] as any, record, index) : ((record as any)[column.dataIndex] as React.ReactNode)}
                    </td>
                  ))}
                  {rightFixedColumns.map((column, colIndex) => {
                    const rightOffset = calculateTotalWidth(rightFixedColumns.slice(colIndex + 1));
                    return (
                      <td key={`right-${colIndex}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 bg-white z-10" style={{ position: 'sticky', right: rightOffset, zIndex: 5 }}>
                        {column.render ? column.render((record as any)[column.dataIndex] as any, record, index) : ((record as any)[column.dataIndex] as React.ReactNode)}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {renderPagination()}
    </div>
  );
};

export default DataTable;
