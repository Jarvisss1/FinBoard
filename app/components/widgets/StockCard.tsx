import React from 'react';
import { Widget } from '../../store/store';
import { useWidgetData } from '../../hooks/useWidgetData';
import { flattenObject } from '../../lib/api';

interface StockCardProps {
  widget: Widget;
}

export default function StockCard({ widget }: StockCardProps) {
  const { data, loading, error } = useWidgetData(
    widget.apiEndpoint, 
    widget.refreshInterval, 
    widget.apiKey,
    widget.apiKeyLocation,
    widget.apiKeyParamName,
    widget.apiKeyHeaderName
  );

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
    return <div className="h-full flex items-center justify-center text-red-400 text-sm">{error}</div>;
  }

  if (!data) return null;

  const flatData = flattenObject(data);
  // If selectedFields is empty, show first 4 fields
  const fieldsToShow = widget.selectedFields.length > 0 
    ? widget.selectedFields 
    : Object.keys(flatData).slice(0, 4);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 h-full content-start">
      {fieldsToShow.map((field) => (
        <div key={field} className="bg-slate-900/50 p-3 rounded-lg">
          <div className="text-xs text-slate-400 mb-1 truncate" title={field}>
            {field.split('.').pop()} {/* Show last part of key */}
          </div>
          <div className="text-base sm:text-lg font-semibold text-white truncate" title={String(flatData[field])}>
            {String(flatData[field] ?? '-')}
          </div>
        </div>
      ))}
    </div>
  );
}
