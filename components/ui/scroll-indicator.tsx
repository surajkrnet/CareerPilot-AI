'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function ScrollIndicator({ targetId = 'section-introduce' }: { targetId?: string }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 220) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClick = () => {
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.4 }}
          onClick={handleClick}
          className="absolute bottom-8 left-8 sm:left-12 z-30 flex items-center gap-3 cursor-pointer group select-none"
        >
          <span className="font-mono text-[11px] uppercase tracking-widest text-[#faf9f5]/80 group-hover:text-[#faf9f5] transition-colors">
            Scroll to discover
          </span>
          <div className="w-[1px] h-9 bg-white/20 relative overflow-hidden">
            <div className="w-full h-full bg-[#cc785c] animate-scroll-indicator" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
