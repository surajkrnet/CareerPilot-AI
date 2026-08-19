'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'secondary-dark' | 'outline' | 'ghost' | 'coral-outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className,
  icon,
  iconPosition = 'left',
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-[#cc785c]/40 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variants = {
    primary: 'bg-[#cc785c] text-white hover:bg-[#a9583e] active:bg-[#964a32] shadow-sm',
    secondary: 'bg-[#ffffff] dark:bg-[#1f1e1b] text-[#141413] dark:text-[#faf9f5] border border-[#e6dfd8] dark:border-white/10 hover:bg-[#efe9de] dark:hover:bg-[#252320] shadow-sm',
    'secondary-dark': 'bg-[#efe9de] dark:bg-[#252320] text-[#141413] dark:text-[#faf9f5] hover:bg-[#e4dcce] dark:hover:bg-[#2d2b27] border border-[#e6dfd8] dark:border-white/10 shadow-sm',
    outline: 'bg-transparent text-[#141413] dark:text-[#faf9f5] border border-[#e6dfd8] dark:border-white/15 hover:border-[#cc785c] hover:text-[#cc785c]',
    ghost: 'bg-transparent text-[#141413] dark:text-[#faf9f5] hover:bg-black/5 dark:hover:bg-white/10',
    'coral-outline': 'bg-transparent text-[#cc785c] border border-[#cc785c] hover:bg-[#cc785c] hover:text-white',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 h-8 gap-1.5',
    md: 'text-sm px-4 py-2 h-10 gap-2',
    lg: 'text-base px-6 py-3 h-12 gap-2.5',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
      {...props}
    >
      {icon && iconPosition === 'left' && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{children}</span>
      {icon && iconPosition === 'right' && <span className="inline-flex shrink-0">{icon}</span>}
    </motion.button>
  );
}
