import React, { useRef, useState, useEffect } from 'react';

interface Position {
  x: number;
  y: number;
}

interface Props {
  children: React.ReactNode;
  defaultPosition?: Position;
}

const Draggable: React.FC<Props> = ({ children, defaultPosition = { x: 20, y: 20 } }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(defaultPosition);
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const touchId = useRef<number | null>(null);

  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      if (!dragging.current) return;
      const touch = Array.from(e.touches).find(t => t.identifier === touchId.current);
      if (!touch) return;
      setPos({
        x: touch.clientX - offset.current.x,
        y: touch.clientY - offset.current.y
      });
      e.preventDefault();
    };

    const onTouchEnd = () => {
      dragging.current = false;
      touchId.current = null;
    };

    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
    document.addEventListener('touchcancel', onTouchEnd);

    return () => {
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('touchcancel', onTouchEnd);
    };
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch || !ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    offset.current = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };

    dragging.current = true;
    touchId.current = touch.identifier;
    e.preventDefault();
  };

  return (
    <div
      ref={ref}
      onTouchStart={onTouchStart}
      style={{
        position: 'fixed',
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        touchAction: 'none',
        userSelect: 'none',
        zIndex: 9999
      }}
    >
      {children}
    </div>
  );
};

export default Draggable;
