import React from 'react';
import { X, Settings, GripHorizontal } from 'lucide-react';
import { useDashboardStore, Widget } from '../store/store';
import clsx from 'clsx';

interface WidgetWrapperProps {
  widget: Widget;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onMouseDown?: React.MouseEventHandler;
  onMouseUp?: React.MouseEventHandler;
  onTouchEnd?: React.TouchEventHandler;
  onEdit?: (widget: Widget) => void;
}

// Forward ref is required for react-grid-layout
const WidgetWrapper = React.forwardRef<HTMLDivElement, WidgetWrapperProps>(
  ({ widget, children, className, style, onMouseDown, onMouseUp, onTouchEnd, onEdit, ...props }, ref) => {
    const { removeWidget } = useDashboardStore();

    return (
      <div
        ref={ref}
        className={clsx(
          'bg-slate-800 dark:bg-slate-800 light:bg-white rounded-xl border border-slate-700 dark:border-slate-700 light:border-slate-200 shadow-lg flex flex-col overflow-hidden',
          className
        )}
        style={style}
        {...props}
      >
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-slate-900/50 dark:bg-slate-900/50 light:bg-slate-50 border-b border-slate-700 dark:border-slate-700 light:border-slate-200 drag-handle cursor-move group">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <GripHorizontal className="w-4 h-4 text-slate-500 dark:text-slate-500 light:text-slate-400 group-hover:text-slate-300 dark:group-hover:text-slate-300 light:group-hover:text-slate-600 flex-shrink-0" />
            <span className="font-medium text-slate-200 dark:text-slate-200 light:text-slate-900 text-sm truncate">{widget.title}</span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button 
              className="p-1.5 sm:p-1 hover:bg-slate-700 dark:hover:bg-slate-700 light:hover:bg-slate-200 rounded text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-white dark:hover:text-white light:hover:text-slate-900 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                if (onEdit) {
                  onEdit(widget);
                }
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              className="p-1.5 sm:p-1 hover:bg-red-900/50 rounded text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-red-400 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                removeWidget(widget.id);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 flex flex-col p-3 sm:p-4 overflow-auto relative min-h-0">
          {children}
        </div>
      </div>
    );
  }
);

WidgetWrapper.displayName = 'WidgetWrapper';

export default WidgetWrapper;
