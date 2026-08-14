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
  variant = 'cream',
  children,
  className,
  hoverable = false,
  ...props
}: CardProps) {
  const variants = {
    cream: 'bg-[#efe9de] text-[#141413] border border-[#e6dfd8]',
    dark: 'bg-[#181715] text-[#faf9f5] border border-white/10',
    'dark-elevated': 'bg-[#252320] text-[#faf9f5] border border-white/10',
    coral: 'bg-[#cc785c] text-white border border-[#b8674d]',
    flat: 'bg-[#faf9f5] text-[#141413] border border-[#e6dfd8]',
  };

  return (
    <motion.div
      whileHover={hoverable ? { y: -4, transition: { duration: 0.2 } } : undefined}
      className={twMerge(
        clsx(
          'rounded-lg p-6 sm:p-8 transition-shadow',
          variants[variant],
          hoverable && 'cursor-pointer hover:shadow-md',
          className
        )
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
