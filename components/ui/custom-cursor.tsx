'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function CustomCursor() {
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const [cursorText, setCursorText] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const isHoveredRef = useRef(false);
  const cursorTextRef = useRef('');

  useEffect(() => {
    let animationFrameId: number;
    let targetX = -100;
    let targetY = -100;
    let currentX = -100;
    let currentY = -100;

    const onMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;

      if (cursorDotRef.current) {
        cursorDotRef.current.style.opacity = '1';
      }

      const target = e.target as HTMLElement | null;
      const interactiveEl = target?.closest ? target.closest('[data-cursor]') : null;
      if (interactiveEl) {
        const text = interactiveEl.getAttribute('data-cursor') || '';
        if (!isHoveredRef.current || cursorTextRef.current !== text) {
          isHoveredRef.current = true;
          cursorTextRef.current = text;
          setIsHovered(true);
          setCursorText(text);
        }
      } else {
        if (isHoveredRef.current) {
          isHoveredRef.current = false;
          cursorTextRef.current = '';
          setIsHovered(false);
          setCursorText('');
        }
      }
    };

    const render = () => {
      // Direct, zero-lag 120fps hardware-accelerated tracking
      currentX += (targetX - currentX) * 0.92;
      currentY += (targetY - currentY) * 0.92;

      if (cursorDotRef.current) {
        cursorDotRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      }
      animationFrameId = requestAnimationFrame(render);
    };

    const onMouseLeave = () => {
      if (cursorDotRef.current) {
        cursorDotRef.current.style.opacity = '0';
      }
    };

    const onMouseEnter = () => {
      if (cursorDotRef.current) {
        cursorDotRef.current.style.opacity = '1';
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);
    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      ref={cursorDotRef}
      className="fixed top-0 left-0 pointer-events-none z-[9999] hidden lg:block -translate-x-1/2 -translate-y-1/2 will-change-transform opacity-0"
      style={{ left: 0, top: 0, opacity: 0 }}
    >
      <motion.div
        animate={{
          width: isHovered ? 88 : 12,
          height: isHovered ? 88 : 12,
        }}
        transition={{ type: 'spring', stiffness: 800, damping: 40 }}
        className={`-translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center transition-colors duration-150 ${
          isHovered
            ? 'bg-[#181715]/90 dark:bg-[#121110]/95 backdrop-blur-md border border-[#cc785c] shadow-2xl text-white'
            : 'bg-[#cc785c] shadow-sm'
        }`}
      >
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className="relative w-full h-full flex items-center justify-center p-1"
            >
              {/* Circular Progress Accent */}
              <svg className="absolute inset-0 w-full h-full -rotate-90 p-0.5" viewBox="0 0 40 40">
                <circle
                  cx="20"
                  cy="20"
                  r="18"
                  fill="none"
                  stroke="#cc785c"
                  strokeWidth="1.5"
                  strokeDasharray="113"
                  strokeDashoffset="25"
                />
              </svg>

              {/* Context Badge Text */}
              <span className="relative z-10 text-[9px] font-mono font-bold uppercase tracking-wider text-center px-2 text-[#faf9f5]">
                {cursorText}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
