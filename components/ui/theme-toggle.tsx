'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/providers/theme-provider';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center gap-2 p-1 rounded-full border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#cc785c]/40 ${
        isDark
          ? 'bg-[#1f1e1b] border-white/10 hover:border-white/20 text-[#faf9f5]'
          : 'bg-[#efe9de] border-[#e6dfd8] hover:border-[#cc785c]/40 text-[#141413]'
      } ${className}`}
      title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      aria-label={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
    >
      {/* Sliding indicator pill */}
      <div className="relative flex items-center justify-between w-14 h-7 px-1">
        <motion.div
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`absolute top-0.5 bottom-0.5 w-6 rounded-full shadow-md flex items-center justify-center ${
            isDark
              ? 'right-0.5 bg-[#252320] border border-[#cc785c]/60 text-[#cc785c]'
              : 'left-0.5 bg-white border border-[#e6dfd8] text-[#cc785c]'
          }`}
        >
          {isDark ? (
            <Moon className="w-3.5 h-3.5" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-[#cc785c]" />
          )}
        </motion.div>

        <div className="w-5 flex justify-center text-[#8e8b82]">
          <Sun className={`w-3.5 h-3.5 transition-opacity ${!isDark ? 'opacity-0' : 'opacity-40'}`} />
        </div>
        <div className="w-5 flex justify-center text-[#8e8b82]">
          <Moon className={`w-3.5 h-3.5 transition-opacity ${isDark ? 'opacity-0' : 'opacity-40'}`} />
        </div>
      </div>

      {showLabel && (
        <span className="text-xs font-mono pr-2 hidden sm:inline">
          {isDark ? 'Dark Theme' : 'Light Theme'}
        </span>
      )}
    </button>
  );
}
