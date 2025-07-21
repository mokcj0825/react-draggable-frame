import React, {
  useState,
  useRef,
  useEffect,
  Children,
  cloneElement,
  isValidElement
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

export interface Props {
  id: string;
  children: ReactNode;
  defaultPosition?: Position;
  className?: string;
  style?: React.CSSProperties;
  eventExhausted?: boolean;
  anchored?: boolean;
}

const STORAGE_PREFIX = 'draggable-frame';
const DRAG_THRESHOLD = 5;

const DraggableFrame: React.FC<Props> = ({
  id,
  children,
  defaultPosition = { x: 20, y: 20 },
  className = '',
  style = {},
  eventExhausted = false,
  anchored = false
}) => {
  const frameRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Position>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}:${id}`);
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

  const savePosition = (x: number, y: number) => {
    const px = x / window.innerWidth;
    const py = y / window.innerHeight;
    localStorage.setItem(`${STORAGE_PREFIX}:${id}`, JSON.stringify({ x: px, y: py, percentage: true }));
  };

  const updatePosition = (x: number, y: number) => {
    const frame = frameRef.current;
    if (!frame) return;
    const maxX = window.innerWidth - frame.offsetWidth;
    const maxY = window.innerHeight - frame.offsetHeight;
    const newX = Math.max(0, Math.min(x, maxX));
    const newY = Math.max(0, Math.min(y, maxY));
    setPosition({ x: newX, y: newY });
    savePosition(newX, newY);
  };

  const handleStart = (x: number, y: number) => {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragStart.current = { x, y };
    pointerOffset.current = { x: x - rect.left, y: y - rect.top };
    setIsDragging(false);
  };

  const handleMove = (x: number, y: number) => {
    if (!dragStart.current) return;
    const dx = x - dragStart.current.x;
    const dy = y - dragStart.current.y;
    
    if (!isDragging && (anchored || Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
      setIsDragging(true);
    }
    if (!isDragging) return;

    updatePosition(x - pointerOffset.current.x, y - pointerOffset.current.y);
  };

  const handleEnd = (x: number, y: number) => {
    if (isDragging) {
      const frame = frameRef.current;
      if (frame && anchored) {
        const side = x < window.innerWidth / 2 ? 'left' : 'right';
        setAnchor(side);
        const finalX = side === 'left' ? 10 : window.innerWidth - frame.offsetWidth - 10;
        updatePosition(finalX, y - pointerOffset.current.y);
      }
    }
    dragStart.current = null;
    setIsDragging(false);
  };

  const bindChild = (child: React.ReactElement) => {
    const props = child.props as {
      onClick?: (e: ReactMouseEvent) => void;
      onTouchEnd?: (e: ReactTouchEvent) => void;
      style?: React.CSSProperties;
    };

    return cloneElement(child, {
      onClick: (e: ReactMouseEvent) => {
        if (isDragging) {
          e.preventDefault();
          return;
        }
        props.onClick?.(e);
      },
      onTouchEnd: (e: ReactTouchEvent) => {
        if (isDragging) {
          e.preventDefault();
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
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onMouseUp = (e: MouseEvent) => handleEnd(e.clientX, e.clientY);

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging && !eventExhausted) return;
      const touch = e.touches[0];
      if (isDragging) {
        e.preventDefault();
      }
      handleMove(touch.clientX, touch.clientY);
    };

    const onTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      if (isDragging) {
        e.preventDefault();
      }
      handleEnd(touch.clientX, touch.clientY);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [isDragging, eventExhausted, anchored]);

  return (
    <div
      ref={frameRef}
      onMouseDown={(e) => {
        if (e.button === 0) handleStart(e.clientX, e.clientY);
      }}
      onTouchStart={(e) => {
        const touch = e.touches[0];
        handleStart(touch.clientX, touch.clientY);
      }}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        transform: `translate(${position.x}px, ${position.y}px)`,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none',
        zIndex: 1000,
        transition: anchored && !isDragging ? 'transform 0.25s ease' : undefined,
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
