// ============================================================================
// VIRTUAL LIST
// ============================================================================
// Virtual scrolling component for large lists
// ============================================================================

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = ''
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const totalHeight = items.length * itemHeight;

  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    );

    return {
      start: Math.max(0, start - overscan),
      end: Math.min(items.length - 1, end + overscan)
    };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    const result = [];
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      result.push({
        index: i,
        item: items[i],
        offsetY: i * itemHeight
      });
    }
    return result;
  }, [items, visibleRange, itemHeight]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ index, item, offsetY }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: offsetY,
              left: 0,
              right: 0,
              height: itemHeight
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}

// Hook for dynamic item heights
export function useVirtualList<T>(
  items: T[],
  estimatedItemHeight: number,
  containerHeight: number
) {
  const [itemHeights, setItemHeights] = useState<Map<number, number>>(new Map());
  const [scrollTop, setScrollTop] = useState(0);

  const getItemHeight = useCallback((index: number) => {
    return itemHeights.get(index) || estimatedItemHeight;
  }, [itemHeights, estimatedItemHeight]);

  const setItemHeight = useCallback((index: number, height: number) => {
    setItemHeights(prev => new Map(prev).set(index, height));
  }, []);

  const getItemOffset = useCallback((index: number) => {
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += getItemHeight(i);
    }
    return offset;
  }, [getItemHeight]);

  const getTotalHeight = useCallback(() => {
    let height = 0;
    for (let i = 0; i < items.length; i++) {
      height += getItemHeight(i);
    }
    return height;
  }, [items.length, getItemHeight]);

  const getVisibleRange = useCallback(() => {
    let start = 0;
    let end = 0;
    let offset = 0;

    // Find start index
    for (let i = 0; i < items.length; i++) {
      const itemHeight = getItemHeight(i);
      if (offset + itemHeight > scrollTop) {
        start = i;
        break;
      }
      offset += itemHeight;
    }

    // Find end index
    offset = getItemOffset(start);
    for (let i = start; i < items.length; i++) {
      if (offset > scrollTop + containerHeight) {
        end = i - 1;
        break;
      }
      offset += getItemHeight(i);
      end = i;
    }

    return { start, end };
  }, [items.length, getItemHeight, getItemOffset, scrollTop, containerHeight]);

  return {
    scrollTop,
    setScrollTop,
    getItemHeight,
    setItemHeight,
    getItemOffset,
    getTotalHeight,
    getVisibleRange
  };
}