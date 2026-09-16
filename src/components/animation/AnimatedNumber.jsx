import React, { useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';

export function AnimatedNumber({ value = 0, duration = 600, formatter = (v) => v, className = '' }) {
  const [displayValue, setDisplayValue] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const target = typeof value === 'number' ? value : Number(value) || 0;
    if (shouldReduceMotion) {
      setDisplayValue(target);
      return;
    }

    let start = 0;
    const startTime = performance.now();

    const update = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out quart
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      const current = Math.round(start + (target - start) * easeProgress);

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };

    requestAnimationFrame(update);
  }, [value, duration, shouldReduceMotion]);

  return <span className={className}>{formatter(displayValue)}</span>;
}
