import { useCallback, useRef } from 'react';

export function useLongPress(callback = () => {}, ms = 300) {
  const timeoutRef = useRef(null);
  const targetRef = useRef(null);

  const start = useCallback((event) => {
    // Skip if target is an interactive element
    if (event.target.closest('button, a, input, select, .action-button')) {
      return;
    }

    event.stopPropagation();
    
    // For touch events, prevent default only if not on interactive elements
    if (event.type === 'touchstart') {
      try {
        event.preventDefault();
      } catch {
        // Ignore preventDefault errors
      }
    }

    targetRef.current = event.target;
    timeoutRef.current = setTimeout(() => {
      callback(event);
    }, ms);
  }, [callback, ms]);

  const stop = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    targetRef.current = null;
  }, []);

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd: stop,
    options: { passive: false }
  };
}