import React, {
  useState,
  useRef,
  useEffect,
  Children,
  cloneElement,
  isValidElement,
  useCallback
} from 'react';
import type {
  ReactNode,
  MouseEvent as ReactMouseEvent,
  TouchEvent as ReactTouchEvent
} from 'react';

interface Position {
  x: number;
  y: number;
}

export interface DraggableConfig {
  storagePrefix: string;
  dragThreshold: number;
  anchorMargin: number;
  transitionDuration: number;
  zIndex: number;
}

export interface Props {
  id: string;
  children: ReactNode;
  defaultPosition?: Position;
  className?: string;
  style?: React.CSSProperties;
  eventExhausted?: boolean;
  anchored?: boolean;
  config?: Partial<DraggableConfig>;
}

const DEFAULT_CONFIG: DraggableConfig = {
  storagePrefix: 'draggable-frame',
  dragThreshold: 5,
  anchorMargin: 10,
  transitionDuration: 250,
  zIndex: 1000
};

const DraggableFrame: React.FC<Props> = ({
  id,
  children,
  defaultPosition = { x: 20, y: 20 },
  className = '',
  style = {},
  eventExhausted = false,
  anchored = false,
  config = {}
}) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  const frameRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Position>(() => {
    const saved = localStorage.getItem(`${finalConfig.storagePrefix}:${id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.percentage) {
          return {
            x: parsed.x * window.innerWidth,
            y: parsed.y * window.innerHeight
          };
        }
        return parsed;
      } catch {}
    }
    return defaultPosition;
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragState, setDragState] = useState<'idle' | 'starting' | 'dragging'>('idle');
  const dragStart = useRef<Position | null>(null);
  const pointerOffset = useRef<Position>({ x: 0, y: 0 });
  const [anchor, setAnchor] = useState<'left' | 'right'>('left');
  const isTouchDevice = useRef(false);
  const touchTimeoutRef = useRef<number | null>(null);

  const savePosition = useCallback((x: number, y: number) => {
    const px = x / window.innerWidth;
    const py = y / window.innerHeight;
    localStorage.setItem(
      `${finalConfig.storagePrefix}:${id}`, 
      JSON.stringify({ x: px, y: py, percentage: true })
    );
  }, [id, finalConfig.storagePrefix]);

  const updatePosition = useCallback((x: number, y: number) => {
    const frame = frameRef.current;
    if (!frame) return;
    
    const maxX = window.innerWidth - frame.offsetWidth;
    const maxY = window.innerHeight - frame.offsetHeight;
    const newX = Math.max(0, Math.min(x, maxX));
    const newY = Math.max(0, Math.min(y, maxY));
    
    setPosition({ x: newX, y: newY });
    savePosition(newX, newY);
  }, [savePosition]);

  const handleStart = useCallback((x: number, y: number, isTouch: boolean) => {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    isTouchDevice.current = isTouch;
    dragStart.current = { x, y };
    pointerOffset.current = { x: x - rect.left, y: y - rect.top };
    setDragState('starting');
    setIsDragging(false);
  }, []);

  const handleMove = useCallback((x: number, y: number) => {
    if (!dragStart.current) return;
    
    const dx = x - dragStart.current.x;
    const dy = y - dragStart.current.y;
    
    switch (dragState) {
      case 'starting':
        if (Math.abs(dx) > finalConfig.dragThreshold || Math.abs(dy) > finalConfig.dragThreshold) {
          setDragState('dragging');
          setIsDragging(true);
        }
        break;
      case 'dragging':
        updatePosition(x - pointerOffset.current.x, y - pointerOffset.current.y);
        break;
      default:
        break;
    }
  }, [dragState, finalConfig.dragThreshold, updatePosition]);

  const handleEnd = useCallback((x: number, y: number) => {
    if (dragState === 'dragging' && anchored) {
      const frame = frameRef.current;
      if (frame) {
        const side = x < window.innerWidth / 2 ? 'left' : 'right';
        setAnchor(side);
        const finalX = side === 'left' 
          ? finalConfig.anchorMargin 
          : window.innerWidth - frame.offsetWidth - finalConfig.anchorMargin;
        updatePosition(finalX, y - pointerOffset.current.y);
      }
    }
    
    dragStart.current = null;
    setDragState('idle');
    setIsDragging(false);
    
    // Reset touch device flag after a short delay to prevent immediate re-triggering
    if (isTouchDevice.current) {
      if (touchTimeoutRef.current) {
        clearTimeout(touchTimeoutRef.current);
      }
      touchTimeoutRef.current = window.setTimeout(() => {
        isTouchDevice.current = false;
        touchTimeoutRef.current = null;
      }, 150);
    }
  }, [dragState, anchored, finalConfig.anchorMargin, updatePosition]);

  const bindChild = useCallback((child: React.ReactElement) => {
    const props = child.props as {
      onClick?: (e: ReactMouseEvent) => void;
      onTouchEnd?: (e: ReactTouchEvent) => void;
      style?: React.CSSProperties;
    };

    return cloneElement(child, {
      onClick: (e: ReactMouseEvent) => {
        if (isDragging) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        props.onClick?.(e);
      },
      onTouchEnd: (e: ReactTouchEvent) => {
        if (isDragging) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        props.onTouchEnd?.(e);
      },
      style: {
        ...props.style,
        pointerEvents: isDragging ? 'none' : 'auto',
        touchAction: 'none'
      }
    });
  }, [isDragging]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isTouchDevice.current) {
        handleMove(e.clientX, e.clientY);
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (!isTouchDevice.current) {
        handleEnd(e.clientX, e.clientY);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (isTouchDevice.current && dragState !== 'idle') {
        e.preventDefault();
        const touch = e.touches[0];
        handleMove(touch.clientX, touch.clientY);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (isTouchDevice.current) {
        e.preventDefault();
        const touch = e.changedTouches[0];
        handleEnd(touch.clientX, touch.clientY);
      }
    };

    const onTouchCancel = (e: TouchEvent) => {
      if (isTouchDevice.current) {
        e.preventDefault();
        const touch = e.changedTouches[0];
        handleEnd(touch.clientX, touch.clientY);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchCancel);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchCancel);
      
      if (touchTimeoutRef.current) {
        clearTimeout(touchTimeoutRef.current);
        touchTimeoutRef.current = null;
      }
    };
  }, [handleMove, handleEnd, dragState]);

  const handleMouseDown = useCallback((e: ReactMouseEvent) => {
    if (e.button === 0) {
      handleStart(e.clientX, e.clientY, false);
    }
  }, [handleStart]);

  const handleTouchStart = useCallback((e: ReactTouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY, true);
  }, [handleStart]);

  return (
    <div
      ref={frameRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        transform: `translate(${position.x}px, ${position.y}px)`,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none',
        zIndex: finalConfig.zIndex,
        transition: anchored && !isDragging 
          ? `transform ${finalConfig.transitionDuration}ms ease` 
          : undefined,
        ...style
      }}
      className={className}
    >
      {Children.map(children, (child) =>
        isValidElement(child) ? bindChild(child) : child
      )}
    </div>
  );
};

export default DraggableFrame;
