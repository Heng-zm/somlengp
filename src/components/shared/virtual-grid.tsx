'use client';

import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
// Memory leak prevention: Event listeners need cleanup
// Add cleanup in useEffect return function

// Performance optimization needed: Consider memoizing inline styles, dynamic classNames
// Use useMemo for objects/arrays and useCallback for functions

interface VirtualGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  containerHeight: number;
  columns?: number;
  gap?: number;
  overscan?: number;
  className?: string;
}

export function VirtualGrid<T>({
  items,
  renderItem,
  itemHeight,
  containerHeight,
  columns = 1,
  gap = 0,
  overscan = 3,
  className = '',
}: VirtualGridProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const visibleRange = useMemo(() => {
    const rowHeight = itemHeight + gap;
    const totalRows = Math.ceil(items.length / columns);
    const containerRows = Math.ceil(containerHeight / rowHeight);
    
    const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const endRow = Math.min(totalRows - 1, startRow + containerRows + 2 * overscan);
    
    return {
      start: startRow * columns,
      end: Math.min(items.length - 1, (endRow + 1) * columns - 1),
      startRow,
      endRow,
      totalRows,
    };
  }, [scrollTop, items.length, itemHeight, gap, columns, containerHeight, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end + 1);
  }, [items, visibleRange.start, visibleRange.end]);

  const totalHeight = useMemo(() => {
    return visibleRange.totalRows * (itemHeight + gap) - gap;
  }, [visibleRange.totalRows, itemHeight, gap]);

  const offsetY = visibleRange.startRow * (itemHeight + gap);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: `${gap}px`,
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={visibleRange.start + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, visibleRange.start + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Hook for detecting container size
export function useContainerSize(ref: React.RefObject<HTMLElement>) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!ref.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSize({ width, height });
      }
    });

    resizeObserver.observe(ref.current);

    return () => resizeObserver.disconnect();
  }, [ref]);

  return size;
}

// Hook for calculating responsive grid columns
export function useResponsiveColumns() {
  const [columns, setColumns] = useState(1);

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width >= 1280) setColumns(3); // xl
      else if (width >= 1024) setColumns(3); // lg
      else if (width >= 640) setColumns(2); // sm
      else setColumns(1);
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  return columns;
}
