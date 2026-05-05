// src/hooks/useBreakpoint.js
import { useState, useEffect } from 'react';

export const useBreakpoint = (breakpoint = 'md') => {
  const [isBelow, setIsBelow] = useState(false);

  useEffect(() => {
    const checkSize = () => {
      const widths = { sm: 640, md: 768, lg: 1024, xl: 1280 };
      setIsBelow(window.innerWidth < (widths[breakpoint] || 768));
    };

    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, [breakpoint]);

  return isBelow;
};
