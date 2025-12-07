'use client';

import React, { useEffect, useState } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useDashboardStore, Widget } from '../store/store';
import WidgetWrapper from './WidgetWrapper';
import { Plus, LayoutTemplate, ChevronDown } from 'lucide-react';
import StockCard from './widgets/StockCard';
import StockTable from './widgets/StockTable';
import StockChart from './widgets/StockChart';
import WatchlistTable from './widgets/WatchlistTable';
import AddWidgetModal from './AddWidgetModal';
import ThemeToggle from './ThemeToggle';
import ApiKeyInitializer from './ApiKeyInitializer';

const ResponsiveGridLayout = WidthProvider(Responsive);

export default function Dashboard() {
  const { widgets, updateLayout, addWidget, addDemoWidget } = useDashboardStore();
  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDemoMenuOpen, setIsDemoMenuOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLayoutChange = (layout: any, layouts: any) => {
    updateLayout(layout);
  };

  const renderWidgetContent = (widget: Widget) => {
    // If it has watchlist symbols, render the specific watchlist table
    if (widget.watchlistSymbols) {
      return <WatchlistTable widget={widget} />;
    }

    switch (widget.type) {
      case 'CARD':
        return <StockCard widget={widget} />;
      case 'TABLE':
        return <StockTable widget={widget} />;
      case 'CHART':
        return <StockChart widget={widget} />;
      default:
        return <div>Unknown Widget Type</div>;
    }
  };

  const handleEditWidget = (widget: Widget) => {
    setEditingWidget(widget);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingWidget(null);
  };

  if (!mounted) return <div className="p-8 text-slate-400 dark:text-slate-400 light:text-slate-600">Loading dashboard...</div>;

  return (
    <>
      <ApiKeyInitializer />
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white dark:text-white light:text-slate-900 mb-2">Finance Dashboard</h1>
          <p className="text-slate-400 dark:text-slate-400 light:text-slate-600 text-sm sm:text-base">Real-time monitoring of your financial assets</p>
        </div>
        <div className="flex gap-2 sm:gap-3 ml-auto">
          {/* <ThemeToggle /> */}
          <div className="relative">
            <button
              onClick={() => setIsDemoMenuOpen(!isDemoMenuOpen)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 light:bg-slate-200 light:hover:bg-slate-300 text-white dark:text-white light:text-slate-900 rounded-lg transition-colors font-medium border border-slate-700 dark:border-slate-700 light:border-slate-300 text-sm sm:text-base"
            >
              <LayoutTemplate className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Load Demo</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {isDemoMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 sm:w-56 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
                <div className="py-1">
                  <button
                    onClick={() => { addDemoWidget('gainers'); setIsDemoMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    Top Gainers & Losers
                  </button>
                  <button
                    onClick={() => { addDemoWidget('fundamentals'); setIsDemoMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    52-Week High (IBM)
                  </button>
                  <button
                    onClick={() => { addDemoWidget('watchlist'); setIsDemoMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    Stock Watchlist (Favs)
                  </button>
                  <button
                    onClick={() => { addDemoWidget('chart'); setIsDemoMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    IBM Time Series
                  </button>
                </div>
              </div>
            )}
            
            {/* Click outside listener could act here, but simple toggle sufficient for now */}
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors font-medium text-sm sm:text-base"
             >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Add Widget</span>
          </button>
        </div>
      </div>

      <ResponsiveGridLayout
        className="layout"
        layouts={{
          lg: widgets.map(w => w.layout),
          md: widgets.map(w => ({ ...w.layout, w: Math.min(w.layout.w, 8) })),
          sm: widgets.map(w => ({ ...w.layout, w: Math.min(w.layout.w, 4) })),
          xs: widgets.map((w, i) => {
             let yPos = 0;
             for(let k = 0; k < i; k++) {
               yPos += widgets[k].layout.h;
             }
             return { ...w.layout, x: 0, w: 2, y: yPos };
          }),
          xxs: widgets.map((w, i) => {
             let yPos = 0;
             for(let k = 0; k < i; k++) {
               yPos += widgets[k].layout.h;
             }
             return { ...w.layout, x: 0, w: 1, y: yPos };
          })
        }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 8, sm: 4, xs: 2, xxs: 1 }}
        rowHeight={100}
        draggableHandle=".drag-handle"
        onLayoutChange={handleLayoutChange}
        isDraggable={true}
        isResizable={true}
        margin={[12, 96]}
        containerPadding={[0, 0]}
      >
        {widgets.map((widget) => (
          <div key={widget.id}>
            <WidgetWrapper widget={widget} onEdit={handleEditWidget}>
              {renderWidgetContent(widget)}
            </WidgetWrapper>
          </div>
        ))}
      </ResponsiveGridLayout>
      
      {widgets.length === 0 && (
        <div className="text-center py-12 sm:py-20 border-2 border-dashed border-slate-700 dark:border-slate-700 light:border-slate-300 rounded-xl bg-slate-900/30 dark:bg-slate-900/30 light:bg-slate-100/50">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-800 dark:bg-slate-800 light:bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400 dark:text-slate-400 light:text-slate-600" />
          </div>
          <h3 className="text-lg sm:text-xl font-medium text-white dark:text-white light:text-slate-900 mb-2">No widgets yet</h3>
          <p className="text-slate-400 dark:text-slate-400 light:text-slate-600 mb-4 sm:mb-6 text-sm sm:text-base">Add your first widget to start monitoring</p>
          <button
             onClick={() => setIsModalOpen(true)}
            className="px-4 sm:px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors text-sm sm:text-base"
          >
            Add Widget
          </button>
        </div>
      )}

      <AddWidgetModal isOpen={isModalOpen} onClose={handleCloseModal} editWidget={editingWidget} />
    </div>
    </>
  );
}
