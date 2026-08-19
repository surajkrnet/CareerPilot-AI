'use client';

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'cream' | 'coral' | 'teal' | 'amber' | 'dark' | 'success' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({
  children,
  variant = 'cream',
  size = 'md',
  className,
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center font-medium rounded-pill leading-none select-none';

  const variants = {
    cream: 'bg-[#efe9de] dark:bg-white/10 text-[#141413] dark:text-[#faf9f5] border border-[#e6dfd8] dark:border-white/10',
    coral: 'bg-[#cc785c] text-white',
    teal: 'bg-[#5db8a6]/15 text-[#3a8b7c] dark:text-[#5db8a6] border border-[#5db8a6]/30',
    amber: 'bg-[#e8a55a]/15 text-[#b07024] dark:text-[#e8a55a] border border-[#e8a55a]/30',
    success: 'bg-[#5db872]/15 text-[#2e8544] dark:text-[#5db872] border border-[#5db872]/30',
    dark: 'bg-[#efe9de] dark:bg-[#252320] text-[#141413] dark:text-[#faf9f5] border border-[#e6dfd8] dark:border-white/10',
    outline: 'bg-transparent text-[#6c6a64] dark:text-[#a09d96] border border-[#e6dfd8] dark:border-white/15',
  };

  const sizes = {
    sm: 'text-[11px] px-2.5 py-1 tracking-wider uppercase font-semibold font-mono',
    md: 'text-xs px-3 py-1.5 font-medium font-mono',
  };

  return (
    <span className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}>
      {children}
    </span>
  );
}
