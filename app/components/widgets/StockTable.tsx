import React, { useState, useMemo } from 'react';
import { Widget } from '../../store/store';
import { useWidgetData } from '../../hooks/useWidgetData';
import { flattenObject } from '../../lib/api';
import { Search, RotateCw, ChevronLeft, ChevronRight } from 'lucide-react';

interface StockTableProps {
  widget: Widget;
}

export default function StockTable({ widget }: StockTableProps) {
  const { data, loading, error, refetch } = useWidgetData(
    widget.apiEndpoint, 
    widget.refreshInterval, 
    widget.apiKey,
    widget.apiKeyLocation,
    widget.apiKeyParamName,
    widget.apiKeyHeaderName
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Process data into flat array
  const tableData = useMemo(() => {
    if (!data) return [];
    
    let rawData: any[] = [];
    
    // Check for Alpha Vantage style "Time Series"
    const timeSeriesKey = Object.keys(data).find(k => k && (k.includes('Time Series') || k.includes('Time Series')));
    
    // Handle "Top Gainers, Losers, and Most Actively Traded"
    if (data.top_gainers && Array.isArray(data.top_gainers)) {
      rawData = data.top_gainers;
    } else if (data.top_losers && Array.isArray(data.top_losers)) {
      rawData = data.top_losers;
    } else if (timeSeriesKey && typeof data[timeSeriesKey] === 'object') {
      // Convert time series object to array of rows
      const series = data[timeSeriesKey];
      rawData = Object.entries(series).map(([date, values]: [string, any]) => ({
        date,
        ...values
      }));
    } else if (Array.isArray(data)) {
      rawData = data;
    } else {
      // Search for first array property
      const arrayProp = Object.values(data).find(val => Array.isArray(val));
      if (arrayProp) {
        rawData = arrayProp as any[];
      } else {
        // Check if data is an object with date-like keys (time series pattern)
        const keys = Object.keys(data);
        const hasDateKeys = keys.some(k => /^\d{4}-\d{2}-\d{2}/.test(k));
        
        if (hasDateKeys) {
          // Convert object with date keys to array
          rawData = Object.entries(data).map(([date, values]: [string, any]) => ({
            date,
            ...(typeof values === 'object' ? values : { value: values })
          }));
        } else {
          rawData = [data]; // Treat single object as one row
        }
      }
    }

    return rawData.map(item => flattenObject(item));
  }, [data]);

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchTerm) return tableData;
    const lowerTerm = searchTerm.toLowerCase();
    return tableData.filter(row => 
      Object.values(row).some(val => 
        String(val).toLowerCase().includes(lowerTerm)
      )
    );
  }, [tableData, searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  // Determine columns
  const columns = useMemo(() => {
    if (!tableData.length) return [];
    const firstItem = tableData[0];
    return widget.selectedFields.length > 0 
      ? widget.selectedFields 
      : Object.keys(firstItem).slice(0, 6); // Default to first 6 columns
  }, [tableData, widget.selectedFields]);


  // Handlers
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    refetch?.();
  };

  if (!widget.apiEndpoint) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500 text-sm">
        Please configure API endpoint
      </div>
    );
  }

  if (loading && !data) {
    return <div className="h-full flex items-center justify-center text-slate-400">Loading...</div>;
  }

  if (error) {
    return <div className="h-full flex items-center justify-center text-red-400 text-sm p-4 text-center">{error}</div>;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Controls Header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset page on search
            }}
            className="w-full bg-slate-800 border border-slate-700 rounded-md py-1 pl-7 pr-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 placeholder:text-slate-600"
          />
        </div>
        <button 
          onClick={handleRefresh}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md text-slate-400 hover:text-white transition-colors"
          title="Refresh Data"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
        </button>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto border border-slate-700/50 rounded-md bg-slate-900/30">
        <table className="w-full text-left text-xs text-slate-400">
          <thead className="bg-slate-800 text-slate-300 sticky top-0 z-10">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-3 py-2 font-medium whitespace-nowrap">
                  {col.split('.').pop()?.replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  {columns.map((col) => (
                    <td key={col} className="px-3 py-2 whitespace-nowrap text-slate-300">
                       {String(row[col] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-slate-500">
                  {searchTerm ? 'No matching records found' : 'No data available'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-2 px-1 text-xs text-slate-400">
          <span>
            {itemsPerPage * (currentPage - 1) + 1}-{Math.min(itemsPerPage * currentPage, filteredData.length)} of {filteredData.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1 hover:bg-slate-800 rounded disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <span className="min-w-[40px] text-center">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-1 hover:bg-slate-800 rounded disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
