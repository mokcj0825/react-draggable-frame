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
  const dragStart = useRef<Position | null>(null);
  const pointerOffset = useRef<Position>({ x: 0, y: 0 });
  const [anchor, setAnchor] = useState<'left' | 'right'>('left');

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
    
    let newX = Math.max(0, Math.min(x, maxX));
    let newY = Math.max(0, Math.min(y, maxY));
    
    if (anchored && !isDragging) {
      const frameCenter = newX + frame.offsetWidth / 2;
      const side = frameCenter < window.innerWidth / 2 ? 'left' : 'right';
      setAnchor(side);
      newX = side === 'left' 
        ? finalConfig.anchorMargin 
        : maxX - finalConfig.anchorMargin;
    }
    
    setPosition({ x: newX, y: newY });
    savePosition(newX, newY);
  }, [savePosition, anchored, finalConfig.anchorMargin, isDragging]);

  const handleStart = useCallback((x: number, y: number) => {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    dragStart.current = { x, y };
    pointerOffset.current = { x: x - rect.left, y: y - rect.top };
    setIsDragging(false);
  }, []);

  const handleMove = useCallback((x: number, y: number) => {
    if (!dragStart.current) return;
    
    const dx = x - dragStart.current.x;
    const dy = y - dragStart.current.y;
    
    if (!isDragging && (Math.abs(dx) > finalConfig.dragThreshold || Math.abs(dy) > finalConfig.dragThreshold)) {
      setIsDragging(true);
    }
    
    if (isDragging) {
      updatePosition(x - pointerOffset.current.x, y - pointerOffset.current.y);
    }
  }, [isDragging, finalConfig.dragThreshold, updatePosition]);

  const handleEnd = useCallback(() => {
    if (anchored && isDragging) {
      const frame = frameRef.current;
      if (frame) {
        const frameCenter = position.x + frame.offsetWidth / 2;
        const side = frameCenter < window.innerWidth / 2 ? 'left' : 'right';
        setAnchor(side);
        const maxX = window.innerWidth - frame.offsetWidth;
        const finalX = side === 'left' 
          ? finalConfig.anchorMargin 
          : maxX - finalConfig.anchorMargin;
        setPosition(prev => ({ ...prev, x: finalX }));
        savePosition(finalX, position.y);
      }
    }
    dragStart.current = null;
    setIsDragging(false);
  }, [anchored, isDragging, position.x, position.y, finalConfig.anchorMargin, savePosition]);

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
      handleMove(e.clientX, e.clientY);
    };

    const onMouseUp = () => {
      handleEnd();
    };

    const onTouchMove = (e: TouchEvent) => {
      if (dragStart.current) {
        e.preventDefault();
        const touch = e.touches[0];
        handleMove(touch.clientX, touch.clientY);
      }
    };

    const onTouchEnd = () => {
      handleEnd();
    };

    const onTouchCancel = () => {
      handleEnd();
    };

    const onResize = () => {
      const frame = frameRef.current;
      if (frame && anchored) {
        const maxX = window.innerWidth - frame.offsetWidth;
        const frameCenter = position.x + frame.offsetWidth / 2;
        const side = frameCenter < window.innerWidth / 2 ? 'left' : 'right';
        const newX = side === 'left' 
          ? finalConfig.anchorMargin 
          : maxX - finalConfig.anchorMargin;
        setPosition(prev => ({ ...prev, x: newX }));
        savePosition(newX, position.y);
      }
    };

    window.addEventListener('mouseup', onMouseUp, true);
    document.addEventListener('mouseup', onMouseUp, true);
    window.addEventListener('touchend', onTouchEnd, true);
    document.addEventListener('touchend', onTouchEnd, true);
    window.addEventListener('touchcancel', onTouchCancel, true);
    document.addEventListener('touchcancel', onTouchCancel, true);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp, true);
      document.removeEventListener('mouseup', onMouseUp, true);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd, true);
      document.removeEventListener('touchend', onTouchEnd, true);
      window.removeEventListener('touchcancel', onTouchCancel, true);
      document.removeEventListener('touchcancel', onTouchCancel, true);
      window.removeEventListener('resize', onResize);
    };
  }, [handleMove, handleEnd, anchored, position.x, position.y, finalConfig.anchorMargin, savePosition]);

  const handleMouseDown = useCallback((e: ReactMouseEvent) => {
    if (e.button === 0) {
      handleStart(e.clientX, e.clientY);
    }
  }, [handleStart]);

  const handleTouchStart = useCallback((e: ReactTouchEvent) => {
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  }, [handleStart]);

  return (
    <div
      ref={frameRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none',
        zIndex: finalConfig.zIndex,
        transition: anchored && !isDragging 
          ? `left ${finalConfig.transitionDuration}ms ease, top ${finalConfig.transitionDuration}ms ease` 
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
