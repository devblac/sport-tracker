import React, { memo, useMemo } from 'react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';

interface VirtualizedListProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscanCount?: number;
}

// Memoized row component to prevent unnecessary re-renders
const Row = memo<ListChildComponentProps>(({ index, style, data }) => {
  const { items, renderItem } = data;
  const item = items[index];
  
  return (
    <div style={style}>
      {renderItem(item, index)}
    </div>
  );
});

Row.displayName = 'VirtualizedListRow';

export const VirtualizedList = memo(<T,>({
  items,
  height,
  itemHeight,
  renderItem,
  className = '',
  overscanCount = 5,
}: VirtualizedListProps<T>) => {
  // Memoize the data object to prevent unnecessary re-renders
  const itemData = useMemo(() => ({
    items,
    renderItem,
  }), [items, renderItem]);

  if (items.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <p className="text-muted-foreground">No items to display</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <List
        height={height}
        itemCount={items.length}
        itemSize={itemHeight}
        itemData={itemData}
        overscanCount={overscanCount}
      >
        {Row}
      </List>
    </div>
  );
}) as <T>(props: VirtualizedListProps<T>) => JSX.Element;

VirtualizedList.displayName = 'VirtualizedList';