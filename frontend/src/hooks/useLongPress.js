import { useState, useRef, useEffect, useCallback } from 'react';

export const useLongPress = (callback, ms = 500) => {
  const [startLongPress, setStartLongPress] = useState(false);
  const timerRef = useRef();
  const isLongPress = useRef(false);

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
    };
  }, []);

  const start = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    
    isLongPress.current = false;
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      setStartLongPress(true);
      callback();
    }, ms);
  }, [callback, ms]);

  const clear = useCallback((event) => {
    event?.preventDefault();
    event?.stopPropagation();
    clearTimeout(timerRef.current);
    
    if (isLongPress.current) {
      event?.stopPropagation();
    }
  }, []);

  return {
    onMouseDown: start,
    onTouchStart: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchEnd: clear,
  };
};