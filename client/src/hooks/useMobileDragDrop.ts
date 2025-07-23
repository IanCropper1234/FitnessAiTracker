import { useState, useRef, useCallback } from 'react';

interface UseMobileDragDropOptions<T> {
  items: T[];
  onReorder: (newItems: T[]) => void;
  getItemId: (item: T) => string | number;
  isDisabled?: boolean;
}

interface DragState {
  isDragging: boolean;
  draggedIndex: number | null;
  dropTargetIndex: number | null;
  dragOffset: { x: number; y: number };
  touchStartPos: { x: number; y: number };
}

export function useMobileDragDrop<T>({
  items,
  onReorder,
  getItemId,
  isDisabled = false,
}: UseMobileDragDropOptions<T>) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedIndex: null,
    dropTargetIndex: null,
    dragOffset: { x: 0, y: 0 },
    touchStartPos: { x: 0, y: 0 },
  });

  const draggedElementRef = useRef<HTMLElement | null>(null);
  const touchStartTimeRef = useRef<number>(0);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearDragState = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedIndex: null,
      dropTargetIndex: null,
      dragOffset: { x: 0, y: 0 },
      touchStartPos: { x: 0, y: 0 },
    });
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // Desktop drag handlers
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    if (isDisabled) {
      e.preventDefault();
      return;
    }

    setDragState(prev => ({
      ...prev,
      isDragging: true,
      draggedIndex: index,
    }));

    e.dataTransfer.effectAllowed = 'move';
    // Set the item ID for cross-component drag and drop
    const itemId = getItemId(items[index]);
    e.dataTransfer.setData('text/plain', itemId.toString());
  }, [isDisabled, items, getItemId]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (isDisabled) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, [isDisabled]);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    if (isDisabled) return;
    e.preventDefault();

    if (dragState.draggedIndex === null || dragState.draggedIndex === dropIndex) {
      clearDragState();
      return;
    }

    const newItems = [...items];
    const [draggedItem] = newItems.splice(dragState.draggedIndex, 1);
    newItems.splice(dropIndex, 0, draggedItem);

    onReorder(newItems);
    clearDragState();
  }, [dragState.draggedIndex, items, onReorder, clearDragState, isDisabled]);

  // Mobile touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent, index: number) => {
    if (isDisabled) return;

    const touch = e.touches[0];
    const element = e.currentTarget as HTMLElement;
    draggedElementRef.current = element;
    touchStartTimeRef.current = Date.now();

    setDragState(prev => ({
      ...prev,
      touchStartPos: { x: touch.clientX, y: touch.clientY },
    }));

    // Start long press timer for drag initiation
    longPressTimerRef.current = setTimeout(() => {
      const rect = element.getBoundingClientRect();
      setDragState(prev => ({
        ...prev,
        isDragging: true,
        draggedIndex: index,
        dragOffset: {
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
        },
      }));

      // Add haptic feedback on iOS
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }

      // Prevent default touch behaviors during drag
      e.preventDefault();
    }, 100); // 100ms long press
  }, [isDisabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isDisabled || !dragState.isDragging || dragState.draggedIndex === null) return;

    e.preventDefault();
    e.stopPropagation();

    const touch = e.touches[0];
    
    // Find the element under the touch point
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    if (elementBelow) {
      const dropTarget = elementBelow.closest('[data-drop-target]');
      if (dropTarget) {
        const dropIndex = parseInt(dropTarget.getAttribute('data-drop-index') || '-1');
        if (dropIndex >= 0 && dropIndex !== dragState.draggedIndex) {
          setDragState(prev => ({
            ...prev,
            dropTargetIndex: dropIndex,
          }));
        } else {
          setDragState(prev => ({
            ...prev,
            dropTargetIndex: null,
          }));
        }
      }
    }
  }, [dragState.isDragging, dragState.draggedIndex, isDisabled]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (isDisabled) return;

    // Check if this was a quick tap (not a drag)
    const touchDuration = Date.now() - touchStartTimeRef.current;
    if (touchDuration < 200 || !dragState.isDragging) {
      clearDragState();
      return;
    }

    // Perform the drop if we have a valid target
    if (dragState.draggedIndex !== null && dragState.dropTargetIndex !== null) {
      const newItems = [...items];
      const [draggedItem] = newItems.splice(dragState.draggedIndex, 1);
      newItems.splice(dragState.dropTargetIndex, 0, draggedItem);
      onReorder(newItems);
    }

    clearDragState();
  }, [dragState, items, onReorder, clearDragState, isDisabled]);

  const getDragHandleProps = useCallback((index: number) => ({
    draggable: !isDisabled,
    onDragStart: (e: React.DragEvent) => handleDragStart(e, index),
    onDragOver: handleDragOver,
    onDrop: (e: React.DragEvent) => handleDrop(e, index),
    onTouchStart: (e: React.TouchEvent) => handleTouchStart(e, index),
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    'data-drop-target': true,
    'data-drop-index': index,
    style: {
      touchAction: isDisabled ? 'auto' : 'none',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      msUserSelect: 'none',
      MozUserSelect: 'none',
    } as React.CSSProperties,
  }), [
    isDisabled,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  ]);

  const getItemClassName = useCallback((index: number, baseClassName: string = '') => {
    const classes = [baseClassName];
    
    if (dragState.draggedIndex === index) {
      classes.push('opacity-50 scale-105 z-50');
    }
    
    if (dragState.dropTargetIndex === index && dragState.draggedIndex !== index) {
      classes.push('ring-2 ring-primary ring-opacity-50 bg-primary/10');
    }
    
    if (dragState.isDragging) {
      classes.push('transition-all duration-200');
    }
    
    return classes.filter(Boolean).join(' ');
  }, [dragState]);

  return {
    dragState,
    getDragHandleProps,
    getItemClassName,
    clearDragState,
  };
}