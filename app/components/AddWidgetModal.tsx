import React, { useState, useEffect } from 'react';
import { X, Plus, Search, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useDashboardStore, WidgetType } from '../store/store';
import { fetchWithCache, flattenObject, detectApiProvider, getApiKeyParamName, parseFinnhubQuote, parseFinnhubProfile } from '../lib/api';

interface AddWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  editWidget?: any; // Widget to edit, if provided
}

export default function AddWidgetModal({ isOpen, onClose, editWidget }: AddWidgetModalProps) {
  const { addWidget, updateWidgetConfig, apiKeys } = useDashboardStore();
  
  // Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState<WidgetType>('CARD');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiKeyLocation, setApiKeyLocation] = useState<'query' | 'header'>('query');
  const [apiKeyParamName, setApiKeyParamName] = useState('apikey');
  const [apiKeyHeaderName, setApiKeyHeaderName] = useState('X-API-Key');
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [detectedProvider, setDetectedProvider] = useState<'alphavantage' | 'finnhub' | 'unknown'>('unknown');
  
  // Field Selection State
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [availableFields, setAvailableFields] = useState<Record<string, any>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showArraysOnly, setShowArraysOnly] = useState(false);
  
  // Connection State
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  // Populate form when editing
  useEffect(() => {
    if (editWidget) {
      setTitle(editWidget.title || '');
      setType(editWidget.type || 'CARD');
      setApiEndpoint(editWidget.apiEndpoint || '');
      setApiKey(editWidget.apiKey || '');
      setApiKeyLocation(editWidget.apiKeyLocation || 'query');
      setApiKeyParamName(editWidget.apiKeyParamName || 'apikey');
      setApiKeyHeaderName(editWidget.apiKeyHeaderName || 'X-API-Key');
      setRefreshInterval(editWidget.refreshInterval || 30);
      setSelectedFields(editWidget.selectedFields || []);
    }
  }, [editWidget]);

  // Auto-detect provider and populate API key when URL changes
  useEffect(() => {
    if (apiEndpoint) {
      const provider = detectApiProvider(apiEndpoint);
      setDetectedProvider(provider);
      
      // Auto-populate API key from store if available and not already manually set
      if (provider === 'alphavantage' && apiKeys.alphavantage) {
        setApiKey(apiKeys.alphavantage);
        setApiKeyParamName('apikey');
      } else if (provider === 'finnhub' && apiKeys.finnhub) {
        setApiKey(apiKeys.finnhub);
        setApiKeyParamName('token');
      } else if (provider !== 'unknown') {
        // Set default param name even if no key is stored
        setApiKeyParamName(getApiKeyParamName(provider));
      }

      // If editing and endpoint is set, trigger a quiet test to populate fields
      if (editWidget && editWidget.apiEndpoint && !availableFields.length) {
         // We'll trust the existing fields for now to avoid rapid firing, 
         // but if the user wants to add more, they can click test.
         // Actually, let's just make the "Test" button optional if fields are selected.
      }
    }
  }, [apiEndpoint, apiKeys, editWidget]); // added editWidget

  // Effect to auto-test connection when opening in edit mode to populate available fields
  useEffect(() => {
    if (editWidget && editWidget.apiEndpoint && !isTesting && Object.keys(availableFields).length === 0) {
      // Small timeout to ensure state is settled
      const timer = setTimeout(() => {
        handleTestConnection();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [editWidget]); // Only run when editWidget changes (modal opens)

  if (!isOpen) return null;

  // Helper function to extract Time Series fields
  const extractTimeSeriesFields = (data: any): Record<string, any> | null => {
    // Find Time Series key (matches "Time Series (Daily)", "Monthly Adjusted Time Series", etc.)
    const timeSeriesKey = Object.keys(data).find(k => k.includes('Time Series'));
    if (!timeSeriesKey) return null;
    
    // Get first date entry to extract field structure
    const series = data[timeSeriesKey];
    const firstDate = Object.keys(series)[0];
    if (!firstDate) return null;
    
    const firstEntry = series[firstDate];
    
    // Map Alpha Vantage field names to simple, user-friendly names
    const fieldMapping: Record<string, any> = {};
    
    if (firstEntry['1. open']) fieldMapping['open'] = 'number';
    if (firstEntry['2. high']) fieldMapping['high'] = 'number';
    if (firstEntry['3. low']) fieldMapping['low'] = 'number';
    if (firstEntry['4. close']) fieldMapping['close'] = 'number';
    if (firstEntry['5. adjusted close']) fieldMapping['adjusted close'] = 'number';
    if (firstEntry['5. volume'] || firstEntry['6. volume']) fieldMapping['volume'] = 'number';
    if (firstEntry['7. dividend amount']) fieldMapping['dividend amount'] = 'number';
    
    return Object.keys(fieldMapping).length > 0 ? fieldMapping : null;
  };

  const handleTestConnection = async () => {
    if (!apiEndpoint) return;
    
    setIsTesting(true);
    setConnectionStatus('idle');
    setStatusMessage('');
    
    try {
      // Force refresh to ensure we get fresh data for testing
      const url = apiKey 
        ? `${apiEndpoint}${apiEndpoint.includes('?') ? '&' : '?'}${apiKeyParamName}=${apiKey}`
        : apiEndpoint;
      const data = await fetchWithCache(url, { forceRefresh: true });
      
      let fieldsToShow: Record<string, any> = {};
      
      // Check if this is a Finnhub response
      if (detectedProvider === 'finnhub') {
        // Check if it's a quote response (has 'c', 'd', 'dp' fields)
        if (data.c !== undefined && data.d !== undefined) {
          fieldsToShow = parseFinnhubQuote(data);
          setAvailableFields(fieldsToShow);
          setConnectionStatus('success');
          setStatusMessage(`Finnhub Quote API detected! ${Object.keys(fieldsToShow).length} fields available.`);
        }
        // Check if it's a profile response
        else if (data.name || data.ticker) {
          fieldsToShow = parseFinnhubProfile(data);
          setAvailableFields(fieldsToShow);
          setConnectionStatus('success');
          setStatusMessage(`Finnhub Profile API detected! ${Object.keys(fieldsToShow).length} fields available.`);
        }
        // Check if it's a candle response (array of data)
        else if (data.c && Array.isArray(data.c)) {
          fieldsToShow = {
            'close': 'array',
            'high': 'array',
            'low': 'array',
            'open': 'array',
            'status': data.s,
            'timestamp': 'array',
            'volume': 'array',
          };
          setAvailableFields(fieldsToShow);
          setConnectionStatus('success');
          setStatusMessage(`Finnhub Candle API detected! ${Object.keys(fieldsToShow).length} fields available.`);
        }
        // Fallback to flattening
        else {
          const flat = flattenObject(data);
          setAvailableFields(flat);
          setConnectionStatus('success');
          setStatusMessage(`Finnhub API connected! ${Object.keys(flat).length} fields found.`);
        }
      }
      // Check if this is a Time Series API response (AlphaVantage)
      else {
        // Check for Alpha Vantage error responses
        if (data['Error Message']) {
          setConnectionStatus('error');
          setStatusMessage(`Alpha Vantage Error: ${data['Error Message']}`);
          setAvailableFields({});
          return;
        }
        
        if (data['Information'] || data['Note']) {
          setConnectionStatus('error');
          setStatusMessage(`Alpha Vantage: ${data['Information'] || data['Note']}. Try using 'outputsize=compact' or get a free API key at alphavantage.co`);
          setAvailableFields({});
          return;
        }
        
        const timeSeriesFields = extractTimeSeriesFields(data);
        
        if (timeSeriesFields) {
          // Time Series detected - show only OHLC fields
          setAvailableFields(timeSeriesFields);
          setConnectionStatus('success');
          setStatusMessage(`Time Series API detected! ${Object.keys(timeSeriesFields).length} fields available (open, close, high, low, etc.).`);
        } else {
          // Regular API - flatten all fields
          const flat = flattenObject(data);
          setAvailableFields(flat);
          setConnectionStatus('success');
          setStatusMessage(`API connection successful! ${Object.keys(flat).length} fields found.`);
        }
      }
    } catch (err) {
      setConnectionStatus('error');
      setStatusMessage(err instanceof Error ? err.message : 'Failed to connect');
      setAvailableFields({});
    } finally {
      setIsTesting(false);
    }
  };

  const handleAddField = (field: string) => {
    if (!selectedFields.includes(field)) {
      setSelectedFields([...selectedFields, field]);
    }
  };

  const handleRemoveField = (field: string) => {
    setSelectedFields(selectedFields.filter(f => f !== field));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editWidget) {
      // Update existing widget
      updateWidgetConfig(editWidget.id, {
        title,
        type,
        apiEndpoint,
        apiKey: apiKey || undefined,
        apiKeyLocation,
        apiKeyParamName,
        apiKeyHeaderName,
        refreshInterval,
        selectedFields,
      });
    } else {
      // Add new widget
      addWidget({
        id: `widget-${Date.now()}`,
        title,
        type,
        apiEndpoint,
        apiKey: apiKey || undefined,
        apiKeyLocation,
        apiKeyParamName,
        apiKeyHeaderName,
        refreshInterval,
        selectedFields,
      });
    }
    handleClose();
  };

  const handleClose = () => {
    onClose();
    // Reset form
    setTitle('');
    setType('CARD');
    setApiEndpoint('');
    setApiKey('');
    setApiKeyLocation('query');
    setApiKeyParamName('apikey');
    setApiKeyHeaderName('X-API-Key');
    setRefreshInterval(30);
    setSelectedFields([]);
    setAvailableFields({});
    setConnectionStatus('idle');
    setStatusMessage('');
  };

  // Filter available fields based on search and array filter
  const filteredFields = Object.entries(availableFields).filter(([key, value]) => {
    const matchesSearch = key.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = showArraysOnly ? Array.isArray(value) : true;
    return matchesSearch && matchesType;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-slate-900 border-0 sm:border border-slate-700 rounded-none sm:rounded-xl w-full h-full sm:h-auto sm:max-w-2xl sm:max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-slate-800">
          <h2 className="text-lg sm:text-xl font-bold text-white">{editWidget ? 'Edit Widget' : 'Add New Widget'}</h2>
          <button onClick={handleClose} className="text-slate-400 hover:text-white p-2 -mr-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Widget Name</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g., Bitcoin Price"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">API URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={apiEndpoint}
                  onChange={(e) => setApiEndpoint(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="https://api.example.com/data"
                />
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting || !apiEndpoint}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  {isTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Test'}
                </button>
              </div>
              
              {/* Connection Status */}
              {connectionStatus !== 'idle' && (
                <div className={`mt-2 p-3 rounded-lg flex items-center gap-2 text-sm ${
                  connectionStatus === 'success' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-900' : 'bg-red-900/30 text-red-400 border border-red-900'
                }`}>
                  {connectionStatus === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {statusMessage}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">API Key (Optional)</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Enter API key if required"
              />
            </div>

            {/* Authentication Configuration */}
            {apiKey && (
              <div className="space-y-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <label className="block text-sm font-medium text-slate-400">Authentication Method</label>
                
                {/* Location Selector */}
                <div className="flex bg-slate-800 rounded-lg p-1 w-fit">
                  <button
                    type="button"
                    onClick={() => setApiKeyLocation('query')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                      apiKeyLocation === 'query'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Query Parameter
                  </button>
                  <button
                    type="button"
                    onClick={() => setApiKeyLocation('header')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                      apiKeyLocation === 'header'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Header
                  </button>
                </div>

                {/* Conditional Input */}
                {apiKeyLocation === 'query' ? (
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Parameter Name</label>
                    <select
                      value={apiKeyParamName}
                      onChange={(e) => setApiKeyParamName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="apikey">apikey (Alpha Vantage)</option>
                      <option value="token">token (Finnhub)</option>
                      <option value="api_key">api_key</option>
                      <option value="key">key</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Header Name</label>
                    <select
                      value={apiKeyHeaderName}
                      onChange={(e) => setApiKeyHeaderName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="X-API-Key">X-API-Key (IndianAPI)</option>
                      <option value="Authorization">Authorization (Bearer)</option>
                      <option value="X-Finnhub-Token">X-Finnhub-Token</option>
                      <option value="api-key">api-key</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Refresh Interval (seconds)</label>
              <input
                type="number"
                min="10"
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <hr className="border-slate-800" />

          {/* Field Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-400">Select Fields to Display</h3>
            
            {/* Display Mode */}
            <div>
              <label className="block text-xs text-slate-500 mb-2">Display Mode</label>
              <div className="flex bg-slate-800 rounded-lg p-1 w-fit">
                {(['CARD', 'TABLE', 'CHART'] as WidgetType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                      type === t
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t.charAt(0) + t.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Search & Filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-600"
                  placeholder="Search for fields..."
                />
              </div>
              
              {type === 'TABLE' && (
                <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showArraysOnly}
                    onChange={(e) => setShowArraysOnly(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-emerald-600 focus:ring-emerald-500"
                  />
                  Show arrays only (for table view)
                </label>
              )}
            </div>

            {/* Available Fields List */}
            <div className="space-y-1">
              <label className="block text-xs text-slate-500">Available Fields</label>
              <div className="bg-slate-800/50 border border-slate-800 rounded-lg max-h-32 sm:max-h-48 overflow-y-auto">
                {Object.keys(availableFields).length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-500">
                    {connectionStatus === 'success' 
                      ? 'No fields match your search' 
                      : 'Connect to API to see available fields'}
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800">
                    {filteredFields.map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-3 hover:bg-slate-800 transition-colors group">
                        <div className="overflow-hidden">
                          <div className="text-sm text-slate-300 font-mono truncate" title={key}>{key}</div>
                          <div className="text-xs text-slate-500 truncate">
                            {typeof value} | {String(value).slice(0, 50)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddField(key)}
                          className="p-1 text-slate-500 hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Selected Fields List */}
            <div className="space-y-1">
              <label className="block text-xs text-slate-500">Selected Fields</label>
              <div className="bg-slate-800/50 border border-slate-800 rounded-lg min-h-[60px] p-2 space-y-2">
                {selectedFields.length === 0 ? (
                  <div className="text-sm text-slate-500 italic p-2">No fields selected</div>
                ) : (
                  selectedFields.map((field) => (
                    <div key={field} className="flex items-center justify-between bg-slate-700/50 px-3 py-2 rounded-md border border-slate-700">
                      <span className="text-sm text-slate-200 font-mono truncate flex-1 mr-2" title={field}>
                        {field}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveField(field)}
                        className="text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-900 rounded-b-xl">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!title || !apiEndpoint}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg font-medium transition-colors"
          >
            {editWidget ? 'Save Changes' : 'Add Widget'}
          </button>
        </div>
      </div>
    </div>
  );
}
