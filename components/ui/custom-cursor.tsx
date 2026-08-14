'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function CustomCursor() {
  const [mousePosition, setMousePosition] = useState({ x: -100, y: -100 });
  const [cursorText, setCursorText] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);

      const target = e.target as HTMLElement;
      const interactiveEl = target.closest('[data-cursor]');
      if (interactiveEl) {
        const text = interactiveEl.getAttribute('data-cursor') || '';
        setCursorText(text);
        setIsHovered(true);
      } else {
        setIsHovered(false);
        setCursorText('');
      }
    };

    const handleMouseLeave = () => setIsVisible(false);

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-[9999] hidden lg:flex items-center justify-center"
      animate={{
        x: mousePosition.x - (isHovered ? 45 : 10),
        y: mousePosition.y - (isHovered ? 45 : 10),
        width: isHovered ? 90 : 20,
        height: isHovered ? 90 : 20,
      }}
      transition={{ type: 'spring', stiffness: 450, damping: 28, mass: 0.4 }}
    >
      <div className={`relative w-full h-full rounded-full flex items-center justify-center transition-all ${
        isHovered
          ? 'bg-[#181715]/90 backdrop-blur-sm border border-[#cc785c] shadow-2xl text-white scale-100'
          : 'bg-[#cc785c] opacity-80 scale-75'
      }`}>
        {isHovered && (
          <>
            {/* Circular Progress Ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90 p-0.5" viewBox="0 0 40 40">
              <circle
                cx="20"
                cy="20"
                r="18"
                fill="none"
                stroke="#6c6a64"
                strokeWidth="1.5"
                strokeOpacity="0.3"
              />
              <circle
                cx="20"
                cy="20"
                r="18"
                fill="none"
                stroke="#cc785c"
                strokeWidth="1.5"
                strokeDasharray="113"
                strokeDashoffset="30"
              />
            </svg>

            {/* Context Badge Text */}
            <span className="relative z-10 text-[10px] font-mono font-bold uppercase tracking-wider text-center px-2 text-[#faf9f5]">
              {cursorText}
            </span>
          </>
        )}
      </div>
    </motion.div>
  );
}
