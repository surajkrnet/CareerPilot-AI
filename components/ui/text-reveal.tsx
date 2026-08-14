'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export function TextReveal({ className = '' }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 85%', 'end 35%'],
  });

  const lines = [
    'HELPING',
    'EARLY-CAREER',
    'CANDIDATES &',
    'SWITCHERS',
    'LAND DREAM',
    'OFFERS AT',
    'SCALE',
  ];

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      <div className="space-y-1 sm:space-y-2">
        {lines.map((line, idx) => {
          const start = idx / lines.length;
          const end = (idx + 1) / lines.length;
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const opacity = useTransform(scrollYProgress, [start, end], [0.15, 1]);
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const color = useTransform(
            scrollYProgress,
            [start, end],
            ['#3d3d3a', idx % 2 === 1 ? '#cc785c' : '#faf9f5']
          );

          return (
            <motion.h3
              key={idx}
              style={{ opacity, color }}
              className="font-display font-bold text-display-260 uppercase tracking-tighter transition-colors leading-[0.88]"
            >
              {line}
            </motion.h3>
          );
        })}
      </div>
    </div>
  );
}
