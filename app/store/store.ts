import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WidgetType = 'CARD' | 'TABLE' | 'CHART';

export interface WidgetLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  apiEndpoint: string;
  refreshInterval: number; // in seconds
  selectedFields: string[]; // e.g., ["Global Quote.05. price"]
  symbol?: string; // For stock APIs
  watchlistSymbols?: string[]; // For multi-symbol watchlist
  apiKey?: string; // Optional API key for the endpoint
  apiKeyLocation?: 'query' | 'header'; // Where to send the API key
  apiKeyParamName?: string; // Query param name (e.g., "token", "apikey")
  apiKeyHeaderName?: string; // Header name (e.g., "X-API-Key", "Authorization")
}

export interface Widget extends WidgetConfig {
  layout: WidgetLayout;
}

interface DashboardState {
  widgets: Widget[];
  isEditMode: boolean;
  apiKeys: {
    alphavantage: string;
    finnhub: string;
  };
  addWidget: (widget: Omit<Widget, 'layout'>) => void;
  removeWidget: (id: string) => void;
  updateWidgetConfig: (id: string, config: Partial<WidgetConfig>) => void;
  updateLayout: (layouts: WidgetLayout[]) => void;
  toggleEditMode: () => void;
  setApiKey: (provider: 'alphavantage' | 'finnhub', key: string) => void;
  addDemoWidget: (type: 'gainers' | 'fundamentals' | 'watchlist' | 'chart') => void;
}

// Helper to find next available position
const findNextPosition = (w: number, h: number, existingWidgets: Widget[]) => {
  let x = 0;
  let y = 0;
  let collision = true;
  while (collision) {
    collision = false;
    for (const ew of existingWidgets) {
      if (
        x < ew.layout.x + ew.layout.w &&
        x + w > ew.layout.x &&
        y < ew.layout.y + ew.layout.h &&
        y + h > ew.layout.y
      ) {
        collision = true;
        break;
      }
    }
    if (collision) {
      x++;
      if (x + w > 12) { // 12 is max grid cols
        x = 0;
        y++;
      }
    }
  }
  return { x, y };
};

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      widgets: [],
      isEditMode: false,
      apiKeys: {
        alphavantage: '',
        finnhub: '',
      },
      addWidget: (widget) =>
        set((state) => {
          const width = widget.type === 'TABLE' || widget.type === 'CHART' ? 6 : 3;
          const height = widget.type === 'TABLE' ? 4 : 3;
          const { x, y } = findNextPosition(width, height, state.widgets);

          const newWidget: Widget = {
            ...widget,
            layout: {
              i: widget.id,
              x,
              y,
              w: width,
              h: height,
            },
          };
          return { widgets: [...state.widgets, newWidget] };
        }),
      removeWidget: (id) =>
        set((state) => ({
          widgets: state.widgets.filter((w) => w.id !== id),
        })),
      updateWidgetConfig: (id, config) =>
        set((state) => ({
          widgets: state.widgets.map((w) =>
            w.id === id ? { ...w, ...config } : w
          ),
        })),
      updateLayout: (layouts) =>
        set((state) => ({
          widgets: state.widgets.map((w) => {
            const newLayout = layouts.find((l) => l.i === w.id);
            return newLayout ? { ...w, layout: { ...newLayout } } : w;
          }),
        })),
      toggleEditMode: () => set((state) => ({ isEditMode: !state.isEditMode })),
      setApiKey: (provider, key) =>
        set((state) => ({
          apiKeys: {
            ...state.apiKeys,
            [provider]: key,
          },
        })),
      addDemoWidget: (type: 'gainers' | 'fundamentals' | 'watchlist' | 'chart') => {
        set((state) => {
          const newWidgets: Widget[] = [];

          if (type === 'gainers') {
            const { x, y } = findNextPosition(6, 4, state.widgets);
            newWidgets.push({
              id: `demo-gainers-${Date.now()}`,
              type: 'TABLE',
              title: 'Top Gainers',
              apiEndpoint: 'https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS',
              refreshInterval: 300,
              selectedFields: [],
              apiKey: 'demo',
              apiKeyLocation: 'query',
              apiKeyParamName: 'apikey',
              layout: { i: `demo-gainers-${Date.now()}`, x, y, w: 6, h: 4 }
            });
          }

          if (type === 'fundamentals') {
            const { x, y } = findNextPosition(3, 2, state.widgets);
            newWidgets.push({
              id: `demo-fundamentals-${Date.now()}`,
              type: 'CARD',
              title: 'IBM Fundamentals',
              apiEndpoint: 'https://www.alphavantage.co/query?function=OVERVIEW&symbol=IBM',
              refreshInterval: 86400,
              selectedFields: ['52WeekHigh', '52WeekLow', 'PERatio', 'DividendYield'],
              apiKey: 'demo',
              apiKeyLocation: 'query',
              apiKeyParamName: 'apikey',
              layout: { i: `demo-fundamentals-${Date.now()}`, x, y, w: 3, h: 2 }
            });
          }

          if (type === 'watchlist') {
            // Create a single Watchlist Table widget
            const { x, y } = findNextPosition(6, 4, state.widgets);
            newWidgets.push({
              id: `demo-watchlist-${Date.now()}`,
              type: 'TABLE',
              title: 'My Watchlist',
              apiEndpoint: '',
              refreshInterval: 60,
              selectedFields: [],
              watchlistSymbols: ['IBM', 'AAPL', 'NVDA', 'MSFT'],
              apiKey: 'demo',
              apiKeyLocation: 'query',
              apiKeyParamName: 'apikey',
              layout: { i: `demo-watchlist-${Date.now()}`, x, y, w: 6, h: 4 }
            });
          }

          if (type === 'chart') {
            const { x, y } = findNextPosition(6, 4, state.widgets);
            newWidgets.push({
              id: `demo-chart-${Date.now()}`,
              type: 'CHART',
              title: 'IBM Time Series',
              apiEndpoint: 'https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=IBM',
              refreshInterval: 60,
              selectedFields: ['close', 'open', 'high', 'low'],
              apiKey: 'demo',
              apiKeyLocation: 'query',
              apiKeyParamName: 'apikey',
              layout: { i: `demo-chart-${Date.now()}`, x, y, w: 6, h: 4 }
            });
          }

          // Smart placement for multiple widgets (if existing)
          // Though now we add 1 at a time, so findNextPosition handles it.
          // But if we added multiple, we'd need to re-calc. 
          // Since we changed logic to 1 at a time per call, this is fine.

          return {
            widgets: [...state.widgets, ...newWidgets]
          };
        });
      }
    }),
    {
      name: 'finboard-storage',
    }
  )
);
