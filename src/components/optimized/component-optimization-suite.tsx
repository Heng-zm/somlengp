'use client';

import React, { 
  memo, 
  useMemo, 
  useCallback, 
  useState, 
  useEffect, 
  useRef,
  lazy,
  Suspense,
  forwardRef,
  useImperativeHandle
} from 'react';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';

// ============================================================================
// PERFORMANCE MONITORING HOOKS
// ============================================================================

export function useRenderCount(componentName: string) {
  const renderCount = useRef(0);
  
  useEffect(() => {
    renderCount.current += 1;
    if (process.env.NODE_ENV === 'development') {
      
    }
  });

  return renderCount.current;
}

export function usePerformanceProfiler(componentName: string) {
  const startTime = useRef<number>();
  
  useEffect(() => {
    startTime.current = performance.now();
    
    return () => {
      if (startTime.current) {
        const renderTime = performance.now() - startTime.current;
        if (renderTime > 16) { // More than one frame (60fps)
          console.warn(`${componentName} took ${renderTime.toFixed(2)}ms to render`);
        }
      }
    };
  });
}

// ============================================================================
// OPTIMIZED COMPONENT PATTERNS
// ============================================================================

// Heavy component that should be memoized
interface ExpensiveComponentProps {
  data: any[];
  onProcess: (data: any) => void;
  className?: string;
  complex?: boolean;
}

export const OptimizedExpensiveComponent = memo<ExpensiveComponentProps>(function ExpensiveComponent({
  data,
  onProcess,
  className,
  complex = false
}) {
  useRenderCount('ExpensiveComponent');
  usePerformanceProfiler('ExpensiveComponent');

  // Expensive calculation - memoized
  const processedData = useMemo(() => {
     // This should only log when data changes
    return data
      .filter(item => item.active)
      .map(item => ({
        ...item,
        processed: true,
        score: item.value * 2,
        metadata: complex ? { computed: item.value ** 2 } : undefined
      }))
      .sort((a, b) => b.score - a.score);
  }, [data, complex]);

  // Memoized event handler
  const handleClick = useCallback((item: any) => {
    onProcess(item);
  }, [onProcess]);

  // Memoized styles object to prevent re-creation
  const containerStyles = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '1rem',
    padding: '1rem'
  }), []);

  return (
    <div 
      className={cn('optimized-expensive-component', className)}
      style={containerStyles}
    >
      {processedData.map((item) => (
        <OptimizedListItem
          key={item.id}
          item={item}
          onClick={handleClick}
        />
      ))}
    </div>
  );
});

// Optimized list item with custom comparison
interface ListItemProps {
  item: any;
  onClick: (item: any) => void;
}

const OptimizedListItem = memo<ListItemProps>(function ListItem({ item, onClick }) {
  const handleClick = useCallback(() => {
    onClick(item);
  }, [item, onClick]);

  const itemStyles = useMemo(() => ({
    borderColor: item.priority === 'high' ? '#ef4444' : '#d1d5db'
  }), [item.priority]);

  return (
    <div 
      className="border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
      style={itemStyles}
       role="button" tabIndex={0}={handleClick}
    >
      <h3 className="font-semibold">{item.title}</h3>
      <p className="text-gray-600">{item.description}</p>
      <div className="text-sm text-gray-500 mt-2">
        Score: {item.score} | Priority: {item.priority}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function - only re-render if specific fields change
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.title === nextProps.item.title &&
    prevProps.item.description === nextProps.item.description &&
    prevProps.item.score === nextProps.item.score &&
    prevProps.item.priority === nextProps.item.priority &&
    prevProps.onClick === nextProps.onClick
  );
});

// ============================================================================
// DYNAMIC IMPORTS AND CODE SPLITTING
// ============================================================================

// Heavy chart component - dynamically imported
const DynamicChart = dynamic(() => import('@/components/ui/chart'), {
  loading: () => (
    <div className="w-full h-64 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
      <div className="text-gray-500">Loading chart...</div>
    </div>
  ),
  ssr: false // Disable SSR if component uses browser APIs
});

// Heavy data grid - lazy loaded
const LazyDataGrid = lazy(() => import('@/components/ui/data-grid'));

// Calendar component - conditionally loaded
const ConditionalCalendar = dynamic(() => import('@/components/ui/calendar'), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg" />,
});

// ============================================================================
// VIRTUALIZED COMPONENTS FOR LARGE DATASETS
// ============================================================================

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
}

export function OptimizedVirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className,
  overscan = 5
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const { visibleItems, offsetY, totalHeight } = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return {
      visibleItems: items.slice(startIndex, endIndex + 1),
      offsetY: startIndex * itemHeight,
      totalHeight: items.length * itemHeight,
      startIndex
    };
  }, [items, scrollTop, itemHeight, containerHeight, overscan]);

  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto', className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={index} style={{ height: itemHeight }}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STATE MANAGEMENT OPTIMIZATION
// ============================================================================

// Context to avoid prop drilling
const OptimizationContext = React.createContext<{
  theme: 'light' | 'dark';
  settings: Record<string, any>;
  updateSetting: (key: string, value: any) => void;
}>({
  theme: 'light',
  settings: {},
  updateSetting: () => {}
});

export const OptimizationProvider = memo(function OptimizationProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [settings, setSettings] = useState<Record<string, any>>({});

  const updateSetting = useCallback((key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const contextValue = useMemo(() => ({
    theme,
    settings,
    updateSetting
  }), [theme, settings, updateSetting]);

  return (
    <OptimizationContext.Provider value={contextValue}>
      {children}
    </OptimizationContext.Provider>
  );
});

// ============================================================================
// ADVANCED OPTIMIZATION PATTERNS
// ============================================================================

// Component that only re-renders when specific props change
interface OptimizedTableRowProps {
  id: string;
  data: Record<string, any>;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export const OptimizedTableRow = memo<OptimizedTableRowProps>(function TableRow({
  id,
  data,
  isSelected,
  onSelect
}) {
  const handleSelect = useCallback(() => {
    onSelect(id);
  }, [id, onSelect]);

  // Memoize row styling based on selection state
  const rowClassName = useMemo(() => cn(
    'table-row border-b transition-colors',
    isSelected && 'bg-blue-50 border-blue-200',
    !isSelected && 'hover:bg-gray-50'
  ), [isSelected]);

  return (
    <tr className={rowClassName} onClick={handleSelect}>
      {Object.entries(data).map(([key, value]) => (
        <td key={key} className="px-4 py-2">
          {String(value)}
        </td>
      ))}
    </tr>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if selection state or data changes
  return (
    prevProps.id === nextProps.id &&
    prevProps.isSelected === nextProps.isSelected &&
    JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data)
  );
});

// High-performance form component
interface OptimizedFormProps {
  initialValues: Record<string, any>;
  onSubmit: (values: Record<string, any>) => void;
  fields: Array<{
    name: string;
    type: string;
    label: string;
    validation?: (value: any) => string | undefined;
  }>;
}

export const OptimizedForm = memo<OptimizedFormProps>(function OptimizedForm({
  initialValues,
  onSubmit,
  fields
}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Memoize field validation
  const validateField = useCallback((name: string, value: any) => {
    const field = fields.find(f => f.name === name);
    if (field?.validation) {
      return field.validation(value);
    }
    return undefined;
  }, [fields]);

  const handleFieldChange = useCallback((name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors: Record<string, string> = {};
    fields.forEach(field => {
      const error = validateField(field.name, values[field.name]);
      if (error) {
        newErrors[field.name] = error;
      }
    });

    if (Object.keys(newErrors).length === 0) {
      onSubmit(values);
    } else {
      setErrors(newErrors);
    }
  }, [values, fields, validateField, onSubmit]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map(field => (
        <OptimizedFormField
          key={field.name}
          field={field}
          value={values[field.name]}
          error={errors[field.name]}
          onChange={handleFieldChange}
        />
      ))}
      <button
        type="submit"
        className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
      >
        Submit
      </button>
    </form>
  );
});

// Optimized form field component
interface FormFieldProps {
  field: {
    name: string;
    type: string;
    label: string;
  };
  value: any;
  error?: string;
  onChange: (name: string, value: any) => void;
}

const OptimizedFormField = memo<FormFieldProps>(function FormField({
  field,
  value,
  error,
  onChange
}) {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(field.name, e.target.value);
  }, [field.name, onChange]);

  return (
    <div className="form-field">
      <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
        {field.label}
      </label>
      {field.type === 'textarea' ? (
        <textarea
          id={field.name}
          name={field.name}
          value={value || ''}
          onChange={handleChange}
          className={cn(
            'mt-1 block w-full rounded-md border-gray-300 shadow-sm',
            error && 'border-red-500'
          )}
          rows={3}
        />
      ) : (
        <input
          type={field.type}
          id={field.name}
          name={field.name}
          value={value || ''}
          onChange={handleChange}
          className={cn(
            'mt-1 block w-full rounded-md border-gray-300 shadow-sm',
            error && 'border-red-500'
          )}
        />
      )}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
});

// ============================================================================
// COMPOSITE OPTIMIZED COMPONENT
// ============================================================================

interface OptimizedDashboardProps {
  data: any[];
  chartData: any[];
  showChart: boolean;
  showCalendar: boolean;
  showDataGrid: boolean;
  settings: Record<string, any>;
  onDataProcess: (data: any) => void;
  onSettingChange: (key: string, value: any) => void;
}

export const OptimizedDashboard = memo<OptimizedDashboardProps>(function OptimizedDashboard({
  data,
  chartData,
  showChart,
  showCalendar,
  showDataGrid,
  settings,
  onDataProcess,
  onSettingChange
}) {
  useRenderCount('OptimizedDashboard');

  // Memoized components that only render when needed
  const chartComponent = useMemo(() => {
    if (!showChart) return null;
    
    return (
      <Suspense fallback={<div className="h-64 bg-gray-100 animate-pulse rounded-lg" />}>
        <DynamicChart config={{ data: { label: 'Data' } }}>
          <div className="text-center p-4">Chart component loaded</div>
        </DynamicChart>
      </Suspense>
    );
  }, [showChart, chartData]);

  const calendarComponent = useMemo(() => {
    if (!showCalendar) return null;
    
    return (
      <Suspense fallback={<div className="h-96 bg-gray-100 animate-pulse rounded-lg" />}>
        <ConditionalCalendar />
      </Suspense>
    );
  }, [showCalendar]);

  const dataGridComponent = useMemo(() => {
    if (!showDataGrid) return null;
    
    return (
      <Suspense fallback={<div className="h-96 bg-gray-100 animate-pulse rounded-lg" />}>
        <LazyDataGrid data={data} columns={[{ key: 'id', title: 'ID' }, { key: 'name', title: 'Name' }]} />
      </Suspense>
    );
  }, [showDataGrid, data]);

  return (
    <div className="optimized-dashboard space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OptimizedExpensiveComponent
          data={data}
          onProcess={onDataProcess}
          className="col-span-1"
        />
        
        {chartComponent}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {calendarComponent}
        {dataGridComponent}
      </div>
    </div>
  );
});

// ============================================================================
// EXPORT OPTIMIZED COMPONENTS BUNDLE
// ============================================================================

export const OptimizedComponents = {
  ExpensiveComponent: OptimizedExpensiveComponent,
  VirtualList: OptimizedVirtualList,
  TableRow: OptimizedTableRow,
  Form: OptimizedForm,
  Dashboard: OptimizedDashboard,
  Provider: OptimizationProvider
};

export default OptimizedComponents;