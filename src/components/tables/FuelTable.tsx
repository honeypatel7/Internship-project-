import React, { useState, useEffect } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Search,
  Loader2,
} from 'lucide-react';
import { deviceService } from '../../services';
import type { Device } from '../../services/types';

interface DeviceTableProps {
  apiHash: string;
}

const columnHelper = createColumnHelper<Device>();

const columns = [
  columnHelper.accessor('id', {
    id: 'rowNumber',
    header: '#',
    cell: ({ table, row }) => {
      const pageIndex = table.getState().pagination.pageIndex;
      const pageSize = table.getState().pagination.pageSize;
      const rowIndex = table.getRowModel().rows.findIndex(r => r.id === row.id);
      return pageIndex * pageSize + rowIndex + 1;
    },
    size: 60,
    enableSorting: false,
  }),
  columnHelper.accessor('name', {
    header: 'Vehicle Number',
    cell: info => {
      const row = info.row.original;
      const timestamp = row.timestamp;
      let timeDisplay = '-';
      
      if (timestamp) {
        try {
          const utcDate = new Date(timestamp * 1000);
          if (!isNaN(utcDate.getTime())) {
            const istOffset = 5.5 * 60 * 60 * 1000;
            const istDate = new Date(utcDate.getTime());
            timeDisplay = format(istDate, 'dd-MM-yy HH:mm:ss');
          }
        } catch (error) {
          console.error('Date formatting error:', error);
        }
      }
      
      return (
        <div>
          <div className="font-medium">{info.getValue()}</div>
          <div className="text-[11px] text-[#808080]">{timeDisplay}</div>
        </div>
      );
    },
  }),
  columnHelper.accessor('online', {
    header: 'Status',
    cell: info => {
      const status = info.getValue();
      return (
        <span className={`inline-block w-3 h-3 rounded-full ${
          status === 'online' ? 'bg-green-500' : 
          status === 'ack' ? 'bg-red-500' : 
          'bg-gray-700'
        }`}>
        </span>
      );
    },
    size: 80,
  }),

  columnHelper.accessor('timestamp', {
    header: 'Last Data',
    cell: info => {
      const timeValue = info.getValue();
      if (!timeValue) return '-';
try {
  // Convert seconds to milliseconds
  const utcDate = new Date(timeValue * 1000);
  
  if (isNaN(utcDate.getTime())) return 'Invalid Date';
  
  // Convert to IST by adding 5 hours and 30 minutes
  const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours and 30 minutes in milliseconds
  const istDate = new Date(utcDate.getTime() );
  
  return format(istDate, 'dd-MM-yyyy HH:mm:ss');
} catch (error) {
  console.error('Date formatting error:', error);
  return 'Invalid Date';
}
    },
    size: 150,
  }),

  columnHelper.accessor(row => {
    const ignition = row.sensors?.find(s => s.type === 'ignition');
    return ignition?.val === undefined ? '-' : (ignition?.val === true || ignition?.val === 'true' ? 'ON' : 'OFF');
  },{
    id: 'ignition',
    header: 'Ignition',
    cell: info => (
      info.getValue() === '-' ? (
        <span className="text-gray-400">-</span>
      ) : (
        <span className={`text-lg ${
          info.getValue() === 'ON' ? 'text-green-600' : 'text-red-600'
        }`}>
          ⏻
        </span>
      )
    ),
    size: 80,
  }),
  columnHelper.accessor('speed', {
    header: 'Speed',
    cell: info => {
      const speed = Number(info.getValue());
      return isNaN(speed) ? '-' : `${Math.round(speed)} km/h`;
    },
    size: 100,
  }),
  columnHelper.accessor(row => {
    const power = row.sensors?.find(s => s.name === 'Power');
    const value = Number(power?.val);
    return isNaN(value) ? '-' : Math.round(value).toString();
  }, {
    id: 'power',
    header: 'Power',
    cell: info => `${info.getValue()} V`,
    size: 100,
  }),
  columnHelper.accessor(row => {
    const battery = row.sensors?.find(s => s.name === 'Battery');
    const value = Number(battery?.val);
    return isNaN(value) ? '-' : value.toFixed(0);
  }, {
    id: 'battery',
    header: 'Battery',
    cell: info => `${info.getValue()}%`,
    size: 100,
  }),
  columnHelper.accessor(row => {
    const odometer = row.sensors?.find(s => s.type === 'odometer');
    const value = Number(odometer?.val);
    return isNaN(value) ? '-' : Math.round(value).toString();
  }, {
    id: 'odometer',
    header: 'Odometer',
    cell: info => `${info.getValue()} km`,
    size: 120,
  }),
  columnHelper.accessor(row => {
    const satellites = row.sensors?.find(s => s.type === 'satellites');
    return satellites?.value || 'N/A';
  }, {
    id: 'satellites',
    header: 'Satellites',
    cell: info => info.getValue(),
    size: 100,
  }),
  columnHelper.accessor(row => {
    const gsm = row.sensors?.find(s => s.type === 'gsm');
    const value = Number(gsm?.val);
    return isNaN(value) ? '-' : value.toFixed(0);
  }, {
    id: 'gsm',
    header: 'GSM Signal',
    cell: info => `${info.getValue()} %`,
    size: 100,
  }),
  columnHelper.accessor(row => {
    const ac = row.sensors?.find(s => s.name === 'AC');
    return ac?.val === undefined ? '-' : (ac?.val === true || ac?.val === 'true' ? 'ON' : 'OFF');
  }, {
    id: 'ac',
    header: 'AC Status',
    cell: info => (
      info.getValue() === '-' ? (
        <span className="text-gray-400">-</span>
      ) : (
        <span className={`text-lg ${
          info.getValue() === 'ON' ? 'text-green-600' : 'text-red-600'
        }`}>
          ⏻
        </span>
      )
    ),
    size: 80,
  }),
  columnHelper.accessor(row => {
    const temp = row.sensors?.find(s => s.name === 'Temperature');
    return temp?.val || '-';
  }, {
    id: 'temperature',
    header: 'Temperature',
    cell: info => `${info.getValue()} °C`,
    size: 120,
  }),
  columnHelper.accessor('stop_duration_sec', {
    header: 'Stop Duration',
    cell: info => {
      const seconds = info.getValue();
      if (!seconds) return 'N/A';
      
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    },
    size: 120,
  }),
];

export function DeviceTable({ apiHash }: DeviceTableProps) {
  const [data, setData] = useState<Device[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await deviceService.getDevices(apiHash);
        const devices = response.data.flatMap(group => group.items || []);
        setData(devices);
        setIsLoading(false);
      } catch (err) {
        setError('Failed to fetch device data');
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [apiHash]);

  const exportToCSV = () => {
    // Get current view's data (filtered and sorted)
    const rows = table.getFilteredRowModel().rows;
    
    // Get visible columns
    const visibleColumns = table.getVisibleLeafColumns();
    
    // Create headers using visible column names
    const headers = visibleColumns
      .map(column => `"${column.columnDef.header?.toString() || ''}"`)
      .join(',');
    
    // Create rows with proper formatting
    const csvRows = rows.map(row => {
      return visibleColumns
        .map(column => {
          let value = row.getValue(column.id);
          
          // Format special columns
          switch (column.id) {
            case 'rowNumber':
              value = table.getFilteredRowModel().flatRows.findIndex(r => r.id === row.id) + 1;
              break;
            case 'timestamp':
              if (value) {
                const date = new Date(Number(value) * 1000);
                value = format(date, 'dd-MM-yyyy HH:mm:ss');
              }
              break;
            case 'ignition':
            case 'ac':
              value = value === 'ON' ? 'ON' : 'OFF';
              break;
            case 'temperature':
              if (value !== '-') value = `${value}°C`;
              break;
            case 'speed':
              if (!isNaN(Number(value))) value = `${Math.round(Number(value))} km/h`;
              break;
            case 'power':
              if (value !== '-') value = `${value} V`;
              break;
            case 'battery':
              if (value !== '-') value = `${value}%`;
              break;
            case 'odometer':
              if (value !== '-') value = `${value} km`;
              break;
            case 'gsm':
              if (value !== '-') value = `${value}%`;
              break;
            case 'stop_duration_sec':
              if (value) {
                const hours = Math.floor(value / 3600);
                const minutes = Math.floor((value % 3600) / 60);
                const secs = value % 60;
                value = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
              }
              break;
            case 'online':
              value = value === 'online' ? 'Online' : value === 'ack' ? 'Acknowledged' : 'Offline';
              break;
          }
          
          // Escape and quote strings containing commas
          return value === null || value === undefined ? '' 
            : typeof value === 'string' && (value.includes(',') || value.includes('"'))
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        })
        .join(',');
    });
    
    const csv = [headers, ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `temperature-summary-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
              placeholder="Search devices..."
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="border-b border-gray-200">
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className={`px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 ${
                      header.id === 'name' || header.id === 'timestamp' || header.id === 'rowNumber' ? 'text-left' : 'text-center'
                    }`}
                  >
                    {header.column.getCanSort() ? (
                      <button
                        className={`flex items-center space-x-1 ${
                          header.id === 'name' || header.id === 'timestamp' || header.id === 'rowNumber' ? '' : 'justify-center w-full'
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                        {header.column.getIsSorted() === 'asc' ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : header.column.getIsSorted() === 'desc' ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : null}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    <span className="text-gray-500">Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                  No devices found
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr
                  key={row.id}
                  className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  {row.getVisibleCells().map(cell => (
                    <td
                      key={cell.id}
                      className={`px-4 py-3 text-sm text-gray-700 ${
                        cell.column.id === 'name' || cell.column.id === 'timestamp' || cell.column.id === 'rowNumber' ? 'text-left' : 'text-center'
                      }`}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">
              Page {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount()}
            </span>
            <select
              value={table.getState().pagination.pageSize}
              onChange={e => table.setPageSize(Number(e.target.value))}
              className="text-sm border border-gray-300 rounded-lg px-2 py-1"
            >
              {[10, 25, 50].map(pageSize => (
                <option key={pageSize} value={pageSize}>
                  Show {pageSize}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              <ChevronsLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              <ChevronsRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}