import React, { useState, useEffect } from 'react';
import { Widget, useDashboardStore } from '../../store/store';
import { fetchWithCache } from '../../lib/api';
import { Search, Plus, Trash2, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

interface WatchlistTableProps {
  widget: Widget;
}

interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: string;
  loading: boolean;
  error?: string;
}

export default function WatchlistTable({ widget }: WatchlistTableProps) {
  const { updateWidgetConfig, apiKeys } = useDashboardStore();
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [loading, setLoading] = useState(false);
  const [newSymbol, setNewSymbol] = useState('');
  const [adding, setAdding] = useState(false);

  const symbols = widget.watchlistSymbols || [];

  const fetchQuote = async (symbol: string): Promise<StockQuote> => {
    try {
      // Prioritize user's key, fallback to widget key (demo)
      const apiKey = apiKeys.alphavantage || widget.apiKey || 'demo';
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
      
      const data = await fetchWithCache(url, { duration: 60000 }); // 60s cache
      
      if (data['Global Quote']) {
        const q = data['Global Quote'];
        return {
          symbol: q['01. symbol'] || symbol,
          price: parseFloat(q['05. price']),
          change: parseFloat(q['09. change']),
          changePercent: q['10. change percent'],
          loading: false
        };
      }
      
      // Handle limits or errors
      if (data.Note || data.Information) {
        throw new Error("Limit Reached");
      }
      
      throw new Error("No Data");
    } catch (err) {
      return {
        symbol,
        price: 0,
        change: 0,
        changePercent: '0%',
        loading: false,
        error: err instanceof Error ? err.message : 'Error'
      };
    }
  };

  const loadAll = async () => {
    setLoading(true);
    const results: StockQuote[] = [];
    
    // Fetch sequentially to be nice to free tier rate limits (5/min usually, but burst is okayish)
    // Actually, let's do parallel but maybe just 2-3 at a time? 
    // For simplicity and "demo" nature, Promise.all is faster but risky. 
    // Let's try Promise.all but warn user.
    
    // Note: If using 'demo' key, it might fail for non-IBM/standard symbols if they don't support it.
    // 'demo' key supports: IBM, TSLA, etc? Actually only specific ones.
    // User should supply their key for best results.
    
    const promises = symbols.map(s => fetchQuote(s));
    const data = await Promise.all(promises);
    setQuotes(data);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, [symbols.join(','), widget.apiKey, apiKeys.alphavantage]);

  const handleAddSymbol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol) return;
    
    const symbol = newSymbol.toUpperCase();
    if (symbols.includes(symbol)) {
      setNewSymbol('');
      return;
    }
    
    setAdding(true);
    // Verify it exists or just add it? Let's just add it and let the fetch fail if invalid.
    updateWidgetConfig(widget.id, {
      watchlistSymbols: [...symbols, symbol]
    });
    setNewSymbol('');
    setAdding(false);
  };

  const handleRemove = (symbol: string) => {
    updateWidgetConfig(widget.id, {
      watchlistSymbols: symbols.filter(s => s !== symbol)
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header / Add */}
      <div className="flex items-center justify-between mb-3 px-1 gap-2">
        <form onSubmit={handleAddSymbol} className="flex-1 relative">
          <input
            type="text"
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value)}
            placeholder="Add symbol (e.g. NFLX)"
            className="w-full bg-slate-800 border border-slate-700 rounded-md py-1 px-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500 uppercase"
          />
          <button 
            type="submit"
            disabled={!newSymbol || adding}
            className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 text-emerald-500 hover:text-emerald-400 disabled:text-slate-600"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>
        <button 
          onClick={loadAll} 
          className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-md text-slate-400 hover:text-white"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto border border-slate-700/50 rounded-md bg-slate-900/30">
        <table className="w-full text-left text-xs text-slate-400">
          <thead className="bg-slate-800 text-slate-300 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2">Symbol</th>
              <th className="px-3 py-2 text-right">Price</th>
              <th className="px-3 py-2 text-right">Change</th>
              <th className="px-3 py-2 w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {quotes.map((q) => (
              <tr key={q.symbol} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-3 py-3 font-medium text-white">{q.symbol}</td>
                <td className="px-3 py-3 text-right">
                  {q.error ? (
                    <span className="text-red-500 text-[10px]">{q.error}</span>
                  ) : (
                    q.loading ? '...' : (q.price ? `$${q.price.toFixed(2)}` : '-')
                  )}
                </td>
                <td className={`px-3 py-3 text-right font-medium ${q.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  <div className="flex items-center justify-end gap-1">
                    {q.change > 0 ? <TrendingUp className="w-3 h-3" /> : (q.change < 0 ? <TrendingDown className="w-3 h-3" /> : null)}
                    {q.changePercent || '0%'}
                  </div>
                </td>
                <td className="px-1 py-1 text-center">
                  <button 
                    onClick={() => handleRemove(q.symbol)}
                    className="p-1 text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
            {quotes.length === 0 && !loading && (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-slate-500">
                  Search to add stocks
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
