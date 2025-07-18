import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

interface Position {
    x: number;
    y: number;
}

interface State {
    position: Position;
    isDragging: boolean;
    anchor: 'left' | 'right';
    isVisible: boolean;
}

export interface Props {
    children: ReactNode;
    defaultPosition?: Position;
    className?: string;
    style?: React.CSSProperties;
    consumeEvents?: boolean;
}


const STORAGE_KEY = 'frameState';

    const DraggableFrame: React.FC<Props> = ({
    children,
    defaultPosition = { x: 20, y: 20 },
    className = '',
    style = {},
    consumeEvents = false
}) => {
    const [state, setState] = useState<State>(() => {
        const savedState = localStorage.getItem(STORAGE_KEY);
        if (savedState) {
            return JSON.parse(savedState);
        }
        return {
            position: defaultPosition,
            isDragging: false,
            anchor: 'left' as const,
            isVisible: true
        };
    });

    const frameRef = useRef<HTMLDivElement>(null);
    const dragStartRef = useRef<Position>({ x: 0, y: 0 });

    useEffect(() => {
        if (!state.isDragging) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        }
    }, [state]);

    useEffect(() => {
        const handleResize = () => {
            if (!frameRef.current) return;
            
            setState(prev => {
                const newPosition = {
                    ...prev.position,
                    x: prev.anchor === 'right' 
                        ? window.innerWidth - frameRef.current!.offsetWidth - 10
                        : 10
                };
                
                return {
                    ...prev,
                    position: newPosition
                };
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [state.anchor]);

    const handleMouseDown = (event: React.MouseEvent) => {
        if (event.button !== 0) return;
        
        event.preventDefault();
        if (!frameRef.current) return;

        const rect = frameRef.current.getBoundingClientRect();
        dragStartRef.current = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };

        setState(prev => ({ ...prev, isDragging: true }));
    };

    const handleTouchStart = (event: React.TouchEvent) => {
        event.preventDefault();
        if (!frameRef.current) return;

        const touch = event.touches[0];
        const rect = frameRef.current.getBoundingClientRect();
        dragStartRef.current = {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        };

        setState(prev => ({ ...prev, isDragging: true }));
    };

    const handleClick = (event: React.MouseEvent) => {
        if (consumeEvents) {
            event.preventDefault();
            event.stopPropagation();
        }
    };



    const handleMouseMove = useCallback((event: MouseEvent | TouchEvent) => {
        const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
        const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

        if (state.isDragging && frameRef.current) {
            const newX = clientX - dragStartRef.current.x;
            const newY = clientY - dragStartRef.current.y;

            // Constrain to viewport bounds
            const maxX = window.innerWidth - frameRef.current.offsetWidth;
            const maxY = window.innerHeight - frameRef.current.offsetHeight;

            const constrainedX = Math.max(0, Math.min(newX, maxX));
            const constrainedY = Math.max(0, Math.min(newY, maxY));

            setState(prev => ({
                ...prev,
                position: { x: constrainedX, y: constrainedY }
            }));
        }
    }, [state.isDragging]);

    const handleMouseUp = useCallback((event?: MouseEvent | TouchEvent) => {
        if (!state.isDragging) return;

        if (event && 'button' in event && event.button !== 0) return;

        if (state.isDragging && event) {
            const clientX = 'touches' in event ? event.changedTouches[0].clientX : event.clientX;
            const clientY = 'touches' in event ? event.changedTouches[0].clientY : event.clientY;

            const finalY = clientY - dragStartRef.current.y;

            const maxY = window.innerHeight - (frameRef.current?.offsetHeight ?? 0);
            const constrainedY = Math.max(0, Math.min(finalY, maxY));

            const viewportCenter = window.innerWidth / 2;
            const newAnchor = clientX < viewportCenter ? 'left' : 'right';

            const anchoredPosition = { 
                x: newAnchor === 'left' 
                    ? 10 
                    : window.innerWidth - (frameRef.current?.offsetWidth ?? 0) - 10,
                y: constrainedY
            };

            setState(prev => ({
                ...prev,
                isDragging: false,
                anchor: newAnchor,
                position: anchoredPosition
            }));
        }
    }, [state.isDragging]);

    useEffect(() => {
        if (state.isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.addEventListener('touchmove', handleMouseMove, { passive: false });
            document.addEventListener('touchend', handleMouseUp);
            
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                document.removeEventListener('touchmove', handleMouseMove);
                document.removeEventListener('touchend', handleMouseUp);
            };
        }
    }, [handleMouseMove, handleMouseUp, state.isDragging]);



    if (!state.isVisible) {
        return null;
    }



    return (
        <div
            ref={frameRef}
            role="button"
            tabIndex={0}
            style={{
                position: 'fixed',
                left: state.position.x,
                top: state.position.y,
                width: 'fit-content',
                height: 'fit-content',
                zIndex: 1000,
                cursor: state.isDragging ? 'grabbing' : 'grab',
                userSelect: 'none',
                touchAction: 'none',
                ...style
            }}
            className={className}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onClick={handleClick}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                }
            }}
        >
            {children}
        </div>
    );
};

export default DraggableFrame;