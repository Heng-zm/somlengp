'use client';

import React, {
  memo,
  useMemo,
  useCallback,
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle
} from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface VirtualListItem {
  id: string | number;
  height?: number;
  data?: any;
}

export interface VirtualListProps<T extends VirtualListItem> {
  items: T[];
  itemHeight: number | ((item: T, index: number) => number);
  containerHeight: number;
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  className?: string;
  overscan?: number;
  scrollOffset?: number;
  onScroll?: (scrollTop: number) => void;
  onVisibleRangeChange?: (startIndex: number, endIndex: number) => void;
  getItemKey?: (item: T, index: number) => string | number;
}

export interface InfiniteScrollProps<T extends VirtualListItem> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  loader?: React.ReactNode;
  endMessage?: React.ReactNode;
  threshold?: number;
  className?: string;
}

export interface VirtualGridProps<T extends VirtualListItem> {
  items: T[];
  itemWidth: number;
  itemHeight: number;
  containerWidth: number;
  containerHeight: number;
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  className?: string;
  gap?: number;
  overscan?: number;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getItemHeight<T extends VirtualListItem>(
  item: T,
  index: number,
  itemHeight: number | ((item: T, index: number) => number)
): number {
  return typeof itemHeight === 'function' ? itemHeight(item, index) : itemHeight;
}

function calculateVisibleRange(
  scrollTop: number,
  containerHeight: number,
  items: VirtualListItem[],
  itemHeight: number | ((item: VirtualListItem, index: number) => number),
  overscan = 5
) {
  let startIndex = 0;
  let endIndex = items.length - 1;
  let totalHeight = 0;

  // Find start index
  for (let i = 0; i < items.length; i++) {
    const height = getItemHeight(items[i], i, itemHeight);
    if (totalHeight + height > scrollTop) {
      startIndex = Math.max(0, i - overscan);
      break;
    }
    totalHeight += height;
  }

  // Find end index
  const visibleHeight = scrollTop + containerHeight;
  totalHeight = 0;
  for (let i = 0; i < items.length; i++) {
    const height = getItemHeight(items[i], i, itemHeight);
    totalHeight += height;
    if (totalHeight >= visibleHeight) {
      endIndex = Math.min(items.length - 1, i + overscan);
      break;
    }
  }

  return { startIndex, endIndex };
}

function calculateTotalHeight<T extends VirtualListItem>(
  items: T[],
  itemHeight: number | ((item: T, index: number) => number)
): number {
  return items.reduce((total, item, index) => {
    return total + getItemHeight(item, index, itemHeight);
  }, 0);
}

function calculateOffsetY<T extends VirtualListItem>(
  items: T[],
  startIndex: number,
  itemHeight: number | ((item: T, index: number) => number)
): number {
  let offsetY = 0;
  for (let i = 0; i < startIndex; i++) {
    offsetY += getItemHeight(items[i], i, itemHeight);
  }
  return offsetY;
}

// ============================================================================
// VIRTUAL LIST COMPONENT
// ============================================================================

export const VirtualList = memo(
  forwardRef<
    { scrollTo: (index: number) => void; scrollToTop: () => void },
    VirtualListProps<any>
  >(function VirtualList(
    {
      items,
      itemHeight,
      containerHeight,
      renderItem,
      className,
      overscan = 5,
      scrollOffset = 0,
      onScroll,
      onVisibleRangeChange,
      getItemKey
    },
    ref
  ) {
    const [scrollTop, setScrollTop] = useState(scrollOffset);
    const containerRef = useRef<HTMLDivElement>(null);
    const isScrolling = useRef(false);

    // Calculate visible range
    const { startIndex, endIndex, offsetY, totalHeight } = useMemo(() => {
      const range = calculateVisibleRange(scrollTop, containerHeight, items, itemHeight, overscan);
      const offsetY = calculateOffsetY(items, range.startIndex, itemHeight);
      const totalHeight = calculateTotalHeight(items, itemHeight);

      return {
        ...range,
        offsetY,
        totalHeight
      };
    }, [scrollTop, containerHeight, items, itemHeight, overscan]);

    // Notify parent of visible range changes
    useEffect(() => {
      onVisibleRangeChange?.(startIndex, endIndex);
    }, [startIndex, endIndex, onVisibleRangeChange]);

    // Handle scroll
    const handleScroll = useCallback(
      (e: React.UIEvent<HTMLDivElement>) => {
        const newScrollTop = e.currentTarget.scrollTop;
        setScrollTop(newScrollTop);
        onScroll?.(newScrollTop);
        
        isScrolling.current = true;
        // Debounce scroll end detection
        setTimeout(() => {
          isScrolling.current = false;
        }, 150);
      },
      [onScroll]
    );

    // Expose scroll methods via ref
    useImperativeHandle(
      ref,
      () => ({
        scrollTo: (index: number) => {
          if (containerRef.current) {
            const targetScrollTop = calculateOffsetY(items, index, itemHeight);
            containerRef.current.scrollTop = targetScrollTop;
            setScrollTop(targetScrollTop);
          }
        },
        scrollToTop: () => {
          if (containerRef.current) {
            containerRef.current.scrollTop = 0;
            setScrollTop(0);
          }
        }
      }),
      [items, itemHeight]
    );

    // Render visible items
    const visibleItems = useMemo(() => {
      const itemsToRender = [];
      let currentOffsetY = offsetY;

      for (let i = startIndex; i <= endIndex && i < items.length; i++) {
        const item = items[i];
        const height = getItemHeight(item, i, itemHeight);
        const key = getItemKey ? getItemKey(item, i) : item.id || i;

        const style: React.CSSProperties = {
          position: 'absolute',
          top: currentOffsetY,
          left: 0,
          right: 0,
          height: height,
          willChange: isScrolling.current ? 'transform' : 'auto'
        };

        itemsToRender.push({
          key,
          element: renderItem(item, i, style)
        });

        currentOffsetY += height;
      }

      return itemsToRender;
    }, [startIndex, endIndex, items, itemHeight, offsetY, renderItem, getItemKey]);

    return (
      <div
        ref={containerRef}
        className={cn('overflow-auto', className)}
        style={{ height: containerHeight }}
        onScroll={handleScroll}
      >
        <div
          style={{
            height: totalHeight,
            position: 'relative',
            willChange: 'transform'
          }}
        >
          {visibleItems.map(({ key, element }) => (
            <div key={key}>{element}</div>
          ))}
        </div>
      </div>
    );
  })
);

VirtualList.displayName = 'VirtualList';

// ============================================================================
// INFINITE SCROLL COMPONENT
// ============================================================================

export const InfiniteVirtualList = memo(
  function InfiniteVirtualList<T extends VirtualListItem>({
    items,
    itemHeight,
    containerHeight,
    renderItem,
    hasMore,
    loadMore,
    loader = <div className="p-4 text-center">Loading...</div>,
    endMessage = <div className="p-4 text-center text-gray-500">No more items</div>,
    threshold = 0.8,
    className
  }: InfiniteScrollProps<T>) {
    const [loading, setLoading] = useState(false);
    const virtualListRef = useRef<{ scrollTo: (index: number) => void; scrollToTop: () => void }>(null);

    const handleScroll = useCallback(
      async (scrollTop: number) => {
        const totalHeight = calculateTotalHeight(items, itemHeight);
        const scrollPercentage = (scrollTop + containerHeight) / totalHeight;

        if (scrollPercentage >= threshold && hasMore && !loading) {
          setLoading(true);
          try {
            await loadMore();
          } finally {
            setLoading(false);
          }
        }
      },
      [items, itemHeight, containerHeight, threshold, hasMore, loading, loadMore]
    );

    // Enhanced render function with loading states
    const enhancedRenderItem = useCallback(
      (item: T, index: number, style: React.CSSProperties) => {
        // Show loader after last item if loading
        if (index === items.length - 1 && loading && hasMore) {
          return (
            <div style={style}>
              {renderItem(item, index, { ...style, marginBottom: 8 })}
              {loader}
            </div>
          );
        }

        // Show end message after last item if no more items
        if (index === items.length - 1 && !hasMore) {
          return (
            <div style={style}>
              {renderItem(item, index, { ...style, marginBottom: 8 })}
              {endMessage}
            </div>
          );
        }

        return renderItem(item, index, style);
      },
      [items.length, loading, hasMore, renderItem, loader, endMessage]
    );

    return (
      <VirtualList
        ref={virtualListRef}
        items={items}
        itemHeight={itemHeight}
        containerHeight={containerHeight}
        renderItem={enhancedRenderItem}
        onScroll={handleScroll}
        className={className}
      />
    );
  }
);

InfiniteVirtualList.displayName = 'InfiniteVirtualList';

// ============================================================================
// VIRTUAL GRID COMPONENT
// ============================================================================

export const VirtualGrid = memo(
  function VirtualGrid<T extends VirtualListItem>({
    items,
    itemWidth,
    itemHeight,
    containerWidth,
    containerHeight,
    renderItem,
    className,
    gap = 0,
    overscan = 5
  }: VirtualGridProps<T>) {
    const [scrollTop, setScrollTop] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Calculate grid dimensions
    const { columnsCount, rowsCount, totalHeight } = useMemo(() => {
      const columnsCount = Math.floor((containerWidth + gap) / (itemWidth + gap));
      const rowsCount = Math.ceil(items.length / columnsCount);
      const totalHeight = rowsCount * (itemHeight + gap) - gap;

      return { columnsCount, rowsCount, totalHeight };
    }, [items.length, itemWidth, itemHeight, containerWidth, gap]);

    // Calculate visible range
    const { startRow, endRow, offsetY } = useMemo(() => {
      const rowHeight = itemHeight + gap;
      const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
      const endRow = Math.min(
        rowsCount - 1,
        Math.ceil((scrollTop + containerHeight) / rowHeight) + overscan
      );
      const offsetY = startRow * rowHeight;

      return { startRow, endRow, offsetY };
    }, [scrollTop, containerHeight, itemHeight, gap, rowsCount, overscan]);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    }, []);

    // Render visible items
    const visibleItems = useMemo(() => {
      const itemsToRender = [];

      for (let row = startRow; row <= endRow; row++) {
        for (let col = 0; col < columnsCount; col++) {
          const index = row * columnsCount + col;
          if (index >= items.length) break;

          const item = items[index];
          const x = col * (itemWidth + gap);
          const y = (row - startRow) * (itemHeight + gap);

          const style: React.CSSProperties = {
            position: 'absolute',
            left: x,
            top: y,
            width: itemWidth,
            height: itemHeight
          };

          itemsToRender.push({
            key: item.id || index,
            element: renderItem(item, index, style)
          });
        }
      }

      return itemsToRender;
    }, [
      startRow,
      endRow,
      columnsCount,
      items,
      itemWidth,
      itemHeight,
      gap,
      renderItem
    ]);

    return (
      <div
        ref={containerRef}
        className={cn('overflow-auto', className)}
        style={{ height: containerHeight, width: containerWidth }}
        onScroll={handleScroll}
      >
        <div
          style={{
            height: totalHeight,
            width: '100%',
            position: 'relative',
            transform: `translateY(${offsetY}px)`
          }}
        >
          {visibleItems.map(({ key, element }) => (
            <div key={key}>{element}</div>
          ))}
        </div>
      </div>
    );
  }
);

VirtualGrid.displayName = 'VirtualGrid';

// ============================================================================
// PERFORMANCE OPTIMIZED TABLE
// ============================================================================

interface TableColumn<T> {
  key: keyof T;
  header: string;
  width?: number;
  render?: (value: any, item: T, index: number) => React.ReactNode;
}

interface VirtualTableProps<T extends VirtualListItem> {
  items: T[];
  columns: TableColumn<T>[];
  rowHeight: number;
  containerHeight: number;
  containerWidth: number;
  className?: string;
  headerClassName?: string;
  rowClassName?: string | ((item: T, index: number) => string);
  onRowClick?: (item: T, index: number) => void;
}

export const VirtualTable = memo(
  function VirtualTable<T extends VirtualListItem>({
    items,
    columns,
    rowHeight,
    containerHeight,
    containerWidth,
    className,
    headerClassName,
    rowClassName,
    onRowClick
  }: VirtualTableProps<T>) {
    const defaultColumnWidth = containerWidth / columns.length;

    const renderTableRow = useCallback(
      (item: T, index: number, style: React.CSSProperties) => {
        const rowClass = typeof rowClassName === 'function' 
          ? rowClassName(item, index) 
          : rowClassName;

        return (
          <div
            style={style}
            className={cn(
              'flex items-center border-b hover:bg-gray-50 cursor-pointer',
              rowClass
            )}
             role="button" tabIndex={0}={() => onRowClick?.(item, index)}
          >
            {columns.map((column, colIndex) => (
              <div
                key={String(column.key)}
                style={{ 
                  width: column.width || defaultColumnWidth,
                  minWidth: column.width || defaultColumnWidth
                }}
                className="px-4 py-2 truncate"
              >
                {column.render 
                  ? column.render(item[column.key], item, index)
                  : String(item[column.key] || '')
                }
              </div>
            ))}
          </div>
        );
      },
      [columns, defaultColumnWidth, rowClassName, onRowClick]
    );

    return (
      <div className={cn('border rounded-lg overflow-hidden', className)}>
        {/* Header */}
        <div 
          className={cn('flex bg-gray-50 border-b font-medium', headerClassName)}
          style={{ width: containerWidth }}
        >
          {columns.map((column) => (
            <div
              key={String(column.key)}
              style={{ 
                width: column.width || defaultColumnWidth,
                minWidth: column.width || defaultColumnWidth
              }}
              className="px-4 py-3 text-left truncate"
            >
              {column.header}
            </div>
          ))}
        </div>

        {/* Virtual Rows */}
        <VirtualList
          items={items}
          itemHeight={rowHeight}
          containerHeight={containerHeight - 48} // Subtract header height
          renderItem={renderTableRow}
        />
      </div>
    );
  }
);

VirtualTable.displayName = 'VirtualTable';

// ============================================================================
// MASONRY LAYOUT (PINTEREST-STYLE)
// ============================================================================

interface MasonryProps<T extends VirtualListItem> {
  items: T[];
  containerWidth: number;
  containerHeight: number;
  columnWidth: number;
  gap?: number;
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  getItemHeight: (item: T, width: number) => number;
  className?: string;
}

export const VirtualMasonry = memo(
  function VirtualMasonry<T extends VirtualListItem>({
    items,
    containerWidth,
    containerHeight,
    columnWidth,
    gap = 16,
    renderItem,
    getItemHeight,
    className
  }: MasonryProps<T>) {
    const [scrollTop, setScrollTop] = useState(0);

    // Calculate columns
    const columnsCount = Math.floor((containerWidth + gap) / (columnWidth + gap));
    
    // Calculate item positions
    const itemPositions = useMemo(() => {
      const positions: Array<{ x: number; y: number; height: number }> = [];
      const columnHeights = new Array(columnsCount).fill(0);

      items.forEach((item, index) => {
        const height = getItemHeight(item, columnWidth);
        const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
        
        const x = shortestColumnIndex * (columnWidth + gap);
        const y = columnHeights[shortestColumnIndex];

        positions.push({ x, y, height });
        columnHeights[shortestColumnIndex] += height + gap;
      });

      return { positions, totalHeight: Math.max(...columnHeights) };
    }, [items, columnsCount, columnWidth, gap, getItemHeight]);

    // Calculate visible items
    const visibleItems = useMemo(() => {
      const viewportTop = scrollTop;
      const viewportBottom = scrollTop + containerHeight;
      
      return items
        .map((item, index) => ({ item, index, position: itemPositions.positions[index] }))
        .filter(({ position }) => {
          return position.y < viewportBottom && position.y + position.height > viewportTop;
        });
    }, [items, itemPositions.positions, scrollTop, containerHeight]);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    }, []);

    return (
      <div
        className={cn('overflow-auto', className)}
        style={{ height: containerHeight }}
        onScroll={handleScroll}
      >
        <div
          style={{
            height: itemPositions.totalHeight,
            position: 'relative'
          }}
        >
          {visibleItems.map(({ item, index, position }) => {
            const style: React.CSSProperties = {
              position: 'absolute',
              left: position.x,
              top: position.y,
              width: columnWidth,
              height: position.height
            };

            return (
              <div key={item.id || index}>
                {renderItem(item, index, style)}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

VirtualMasonry.displayName = 'VirtualMasonry';

// ============================================================================
// EXPORTS
// ============================================================================

export const VirtualizationComponents = {
  VirtualList,
  InfiniteVirtualList,
  VirtualGrid,
  VirtualTable,
  VirtualMasonry
};

export default VirtualizationComponents;