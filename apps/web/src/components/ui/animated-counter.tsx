'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView, useMotionValue, useSpring } from 'framer-motion';

interface AnimatedCounterProps {
  value: string;
  duration?: number;
  className?: string;
}

function parseValue(value: string): { number: number; suffix: string; prefix: string; isSpecial: boolean } {
  // Handle different formats: "50K+", "2,500+", "98%", "24/7"
  if (value.includes('/')) {
    // For "24/7", return as is
    return { number: 0, suffix: value, prefix: '', isSpecial: true };
  }
  
  if (value.includes('%')) {
    // For "98%"
    const num = parseFloat(value.replace('%', ''));
    return { number: num, suffix: '%', prefix: '', isSpecial: false };
  }
  
  if (value.includes('K+') || value.includes('k+')) {
    // For "50K+"
    const num = parseFloat(value.replace(/[Kk+]/, ''));
    return { number: num * 1000, suffix: 'K+', prefix: '', isSpecial: false };
  }
  
  if (value.includes('+')) {
    // For "2,500+"
    const num = parseFloat(value.replace(/,/g, '').replace('+', ''));
    return { number: num, suffix: '+', prefix: '', isSpecial: false };
  }
  
  // Default: try to parse as number
  const num = parseFloat(value.replace(/,/g, ''));
  return { number: isNaN(num) ? 0 : num, suffix: '', prefix: '', isSpecial: false };
}

function formatNumber(num: number, suffix: string): string {
  if (suffix === 'K+') {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}K+`;
    }
    return `${Math.floor(num)}+`;
  }
  
  if (suffix === '%') {
    return `${Math.round(num)}%`;
  }
  
  if (suffix === '+') {
    return `${Math.floor(num).toLocaleString()}+`;
  }
  
  return Math.floor(num).toLocaleString();
}

export function AnimatedCounter({ value, duration = 2, className = '' }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [displayValue, setDisplayValue] = useState('0');
  const [hasAnimated, setHasAnimated] = useState(false);
  
  const { number, suffix, prefix, isSpecial } = parseValue(value);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    damping: 60,
    stiffness: 120,
    mass: 0.8,
  });

  useEffect(() => {
    if (isSpecial) {
      // For "24/7", show immediately when in view with fade animation
      if (isInView) {
        setDisplayValue(value);
      }
      return;
    }
    
    if (isInView && !hasAnimated && number > 0) {
      setHasAnimated(true);
      motionValue.set(number);
    }
  }, [isInView, hasAnimated, number, motionValue, suffix, isSpecial, value]);

  useEffect(() => {
    if (isSpecial) {
      return;
    }
    
    const unsubscribe = springValue.on('change', (latest) => {
      setDisplayValue(formatNumber(latest, suffix));
    });

    return () => unsubscribe();
  }, [springValue, suffix, isSpecial]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {displayValue}
    </span>
  );
}

