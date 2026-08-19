'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends HTMLMotionProps<'div'> {
  variant?: 'cream' | 'dark' | 'coral' | 'flat' | 'dark-elevated';
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export function Card({
  variant = 'dark-elevated',
  children,
  className,
  hoverable = false,
  ...props
}: CardProps) {
  const variants = {
    cream: 'bg-[#efe9de] dark:bg-[#1f1e1b] text-[#141413] dark:text-[#faf9f5] border border-[#e6dfd8] dark:border-white/10 shadow-sm',
    dark: 'bg-[#ffffff] dark:bg-[#181715] text-[#141413] dark:text-[#faf9f5] border border-[#e6dfd8] dark:border-white/10 shadow-sm',
    'dark-elevated': 'bg-[#ffffff] dark:bg-[#252320] text-[#141413] dark:text-[#faf9f5] border border-[#e6dfd8] dark:border-white/10 shadow-sm',
    coral: 'bg-[#cc785c] text-white border border-[#b8674d] shadow-md',
    flat: 'bg-[#faf9f5] dark:bg-[#181715] text-[#141413] dark:text-[#faf9f5] border border-[#e6dfd8] dark:border-white/10',
  };

  return (
    <motion.div
      whileHover={hoverable ? { y: -4, transition: { duration: 0.2 } } : undefined}
      className={twMerge(
        clsx(
          'rounded-xl p-6 sm:p-8 transition-all',
          variants[variant],
          hoverable && 'cursor-pointer hover:shadow-md hover:border-[#cc785c]/60',
          className
        )
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
