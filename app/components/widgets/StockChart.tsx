'use client';

import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Widget } from '../../store/store';
import { useWidgetData } from '../../hooks/useWidgetData';

interface StockChartProps {
  widget: Widget;
}

interface ChartDataPoint {
  date: string;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
      <p className="text-slate-200 font-semibold mb-2">{label}</p>
      {payload.map((entry: any, index: number) => (
        <p key={index} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: ₹{entry.value?.toFixed(2)}
        </p>
      ))}
    </div>
  );
};

export default function StockChart({ widget }: StockChartProps) {
  const { data, loading, error } = useWidgetData(
    widget.apiEndpoint,
    widget.refreshInterval,
    widget.apiKey,
    widget.apiKeyLocation,
    widget.apiKeyParamName,
    widget.apiKeyHeaderName
  );

  // Transform and process data
  const chartData = useMemo(() => {
    if (!data) return [];

    let processedData: ChartDataPoint[] = [];

    // Handle Alpha Vantage Time Series format
    const timeSeriesKey = Object.keys(data).find(k => k?.includes('Time Series'));
    
    if (timeSeriesKey && data[timeSeriesKey]) {
      const series = data[timeSeriesKey];
      processedData = Object.entries(series)
        .map(([date, values]: [string, any]) => ({
          date,
          open: parseFloat(values['1. open'] || values.open || 0),
          high: parseFloat(values['2. high'] || values.high || 0),
          low: parseFloat(values['3. low'] || values.low || 0),
          close: parseFloat(values['4. close'] || values['5. adjusted close'] || values.close || 0),
          volume: parseInt(values['5. volume'] || values['6. volume'] || values.volume || 0),
        }))
        .reverse();
    }
    // Handle array format
    else if (Array.isArray(data)) {
      processedData = data.map((item, idx) => ({
        date: item.date || item.time || `Point ${idx + 1}`,
        open: parseFloat(item.open || 0),
        high: parseFloat(item.high || 0),
        low: parseFloat(item.low || 0),
        close: parseFloat(item.close || item.price || item.value || 0),
        volume: parseInt(item.volume || 0),
      }));
    }
    // Handle object with date keys
    else {
      const hasDateKeys = Object.keys(data).some(k => /^\d{4}-\d{2}-\d{2}/.test(k));
      
      if (hasDateKeys) {
        processedData = Object.entries(data)
          .map(([date, values]: [string, any]) => {
            if (typeof values === 'object') {
              return {
                date,
                open: parseFloat(values['1. open'] || values.open || 0),
                high: parseFloat(values['2. high'] || values.high || 0),
                low: parseFloat(values['3. low'] || values.low || 0),
                close: parseFloat(values['4. close'] || values.close || values.price || 0),
                volume: parseInt(values['5. volume'] || values.volume || 0),
              };
            }
            return { date, close: parseFloat(values || 0) };
          })
          .reverse();
      }
    }

    return processedData;
  }, [data]);

  // Determine display settings
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const displayData = useMemo(() => 
    chartData.slice(isMobile ? -30 : -60),
    [chartData, isMobile]
  );

  // Format date for axis
  const formatDate = (value: string) => {
    const date = new Date(value);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    if (isMobile) {
      return `${month}/${day}`;
    }
    return `${month}/${day}/${date.getFullYear().toString().slice(-2)}`;
  };

  // Determine which fields to display
  const fieldsToShow = useMemo(() => {
    if (widget.selectedFields && widget.selectedFields.length > 0) {
      return widget.selectedFields;
    }
    
    // Auto-detect available fields
    const available: string[] = [];
    if (chartData.some(d => d.open)) available.push('open');
    if (chartData.some(d => d.high)) available.push('high');
    if (chartData.some(d => d.low)) available.push('low');
    if (chartData.some(d => d.close)) available.push('close');
    
    return available;
  }, [chartData, widget.selectedFields]);

  // Line configurations
  const lineConfigs = {
    open: { color: '#3b82f6', name: 'Open', width: 1.5 },
    high: { color: '#10b981', name: 'High', width: 1.5 },
    low: { color: '#f59e0b', name: 'Low', width: 1.5 },
    close: { color: '#ef4444', name: 'Close', width: 2 },
    'adjusted close': { color: '#a855f7', name: 'Adjusted Close', width: 2 },
    volume: { color: '#64748b', name: 'Volume', width: 1 },
  };

  // Error and loading states
  if (!widget.apiEndpoint) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500 text-sm">
        Please configure API endpoint
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-red-400 text-sm px-4 text-center">
        {error}
      </div>
    );
  }

  if (data?.Note || data?.Information) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-4">
        <div className="text-yellow-500 mb-2">API Limit Reached</div>
        <div className="text-slate-500 text-xs">{data.Note || data.Information}</div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        No chart data available
      </div>
    );
  }

  return (
    <div className="w-full h-[300px]">
     <ResponsiveContainer width="100%" height={300}>

        <LineChart
          data={displayData}
          margin={{
            top: 10,
            right: isMobile ? 5 : 15,
            left: isMobile ? -20 : 0,
            bottom: 10,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
          
          <XAxis
            dataKey="date"
            stroke="#94a3b8"
            fontSize={isMobile ? 9 : 11}
            tickFormatter={formatDate}
            angle={-45}
            textAnchor="end"
            height={isMobile ? 50 : 60}
          />
          
          <YAxis
            stroke="#94a3b8"
            fontSize={isMobile ? 9 : 11}
            domain={['auto', 'auto']}
            tickFormatter={(value) => `₹${Math.round(value)}`}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Legend
            wrapperStyle={{ fontSize: isMobile ? '10px' : '12px' }}
            iconType="line"
          />

          {fieldsToShow.map((field) => {
            const config = lineConfigs[field as keyof typeof lineConfigs];
            if (!config) return null;

            return (
              <Line
                key={field}
                type="monotone"
                dataKey={field === 'adjusted close' ? 'close' : field}
                name={config.name}
                stroke={config.color}
                strokeWidth={config.width}
                dot={false}
                activeDot={{ r: field === 'close' ? 5 : 4 }}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}