import React, {
  useState,
  useRef,
  useEffect,
  Children,
  cloneElement,
  isValidElement
} from 'react';
import type { ReactNode, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';

interface Position {
  x: number;
  y: number;
}

interface Props {
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
let activeDragId: string | null = null;

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
    if (saved && typeof window !== 'undefined') {
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

  const dragging = useRef(false);
  const dragStartPosition = useRef<Position | null>(null);
  const dragOrigin = useRef<Position>({ x: 0, y: 0 });
  const pointerOffset = useRef<Position>({ x: 0, y: 0 });
  const [anchor, setAnchor] = useState<'left' | 'right'>('left');

  useEffect(() => {
    if (!dragging.current) {
      const px = position.x / window.innerWidth;
      const py = position.y / window.innerHeight;
      localStorage.setItem(`${STORAGE_PREFIX}:${id}`, JSON.stringify({ x: px, y: py, percentage: true }));
    }
  }, [position, id]);

  useEffect(() => {
    if (anchored && frameRef.current) {
      const frame = frameRef.current;
      const handleResize = () => {
        const maxX = window.innerWidth - frame.offsetWidth;
        setPosition(prev => ({
          ...prev,
          x: anchor === 'left' ? 10 : maxX - 10
        }));
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [anchored, anchor]);

  const onStart = (x: number, y: number) => {
    if (activeDragId && activeDragId !== id) return;
    activeDragId = id;
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragStartPosition.current = { x, y };
    dragOrigin.current = { x, y };
    pointerOffset.current = { x: x - rect.left, y: y - rect.top };
  };

  const onMove = (x: number, y: number) => {
    if (activeDragId !== id || !dragStartPosition.current) return;
    
    const dx = x - dragStartPosition.current.x;
    const dy = y - dragStartPosition.current.y;

    if (!dragging.current && (anchored || Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
      dragging.current = true;
    }
    
    if (!dragging.current) return;

    const newX = x - pointerOffset.current.x;
    const newY = y - pointerOffset.current.y;
    const frame = frameRef.current;
    if (!frame) return;
    const maxX = window.innerWidth - frame.offsetWidth;
    const maxY = window.innerHeight - frame.offsetHeight;
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const onEnd = (x: number, y: number) => {
    if (activeDragId !== id) return;
    const wasDragging = dragging.current;

    if (wasDragging) {
      const frame = frameRef.current;
      if (!frame) return;
      const anchorSide = x < window.innerWidth / 2 ? 'left' : 'right';
      setAnchor(anchorSide);
      const maxX = window.innerWidth - frame.offsetWidth;
      const newX = anchored
        ? (anchorSide === 'left' ? 10 : maxX - 10)
        : x - pointerOffset.current.x;
      const newY = y - pointerOffset.current.y;
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, window.innerHeight - frame.offsetHeight))
      });
    }

    dragging.current = false;
    dragStartPosition.current = null;
    activeDragId = null;
  };

  const wrapChild = (child: React.ReactElement) => {
    const childProps = child.props as { 
      onClick?: (e: ReactMouseEvent) => void;
      onTouchEnd?: (e: ReactTouchEvent) => void;
      style?: React.CSSProperties;
    };

    return cloneElement(child, {
      onClick: (e: ReactMouseEvent) => {
        if (dragging.current) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        childProps.onClick?.(e);
      },
      onTouchEnd: (e: ReactTouchEvent) => {
        if (dragging.current) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        childProps.onTouchEnd?.(e);
      },
      style: {
        ...childProps.style,
        pointerEvents: dragging.current ? 'none' : 'auto'
      }
    });
  };

  useEffect(() => {
    const mouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const mouseUp = (e: MouseEvent) => onEnd(e.clientX, e.clientY);
    const touchMove = (e: TouchEvent) => {
      if (!eventExhausted && !dragging.current) return;
      const t = e.touches[0];
      if (dragging.current) {
        e.preventDefault();
      }
      onMove(t.clientX, t.clientY);
    };
    const touchEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      onEnd(t.clientX, t.clientY);
    };

    window.addEventListener('mousemove', mouseMove);
    window.addEventListener('mouseup', mouseUp);
    window.addEventListener('touchmove', touchMove, { passive: false });
    window.addEventListener('touchend', touchEnd);

    return () => {
      window.removeEventListener('mousemove', mouseMove);
      window.removeEventListener('mouseup', mouseUp);
      window.removeEventListener('touchmove', touchMove);
      window.removeEventListener('touchend', touchEnd);
    };
  }, [eventExhausted, id]);

  return (
    <div
      ref={frameRef}
      role="button"
      tabIndex={0}
      onMouseDown={(e) => { if (e.button === 0) onStart(e.clientX, e.clientY); }}
      onTouchStart={(e) => { const t = e.touches[0]; onStart(t.clientX, t.clientY); }}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        transform: `translate(${position.x}px, ${position.y}px)`,
        cursor: dragging.current ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none',
        zIndex: 1000,
        transition: anchored ? 'transform 0.25s ease-out' : undefined,
        ...style
      }}
      className={className}
    >
      {Children.map(children, (child) =>
        isValidElement(child) ? wrapChild(child) : child
      )}
    </div>
  );
};

export default DraggableFrame;