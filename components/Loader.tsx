// components/Loader.tsx
import React, { useState, useEffect } from 'react';
import { BRAILLE_SPINNER_CHARS } from '@/lib/constants';
import { LoaderProps } from '@/types';

const Loader: React.FC<LoaderProps> = ({ isActive, className = '' }) => {
  const [spinnerIndex, setSpinnerIndex] = useState<number>(0);

  useEffect(() => {
    if (isActive) {
      const intervalId = setInterval(() => {
        setSpinnerIndex((prevIndex) => (prevIndex + 1) % BRAILLE_SPINNER_CHARS.length);
      }, 100);
      return () => clearInterval(intervalId);
    }
  }, [isActive]);

  if (!isActive) return null;

  return (
    <span 
      className={className}
      style={{ color: '#00ff00' }}
    >
      {BRAILLE_SPINNER_CHARS[spinnerIndex]}
    </span>
  );
};

export default Loader;