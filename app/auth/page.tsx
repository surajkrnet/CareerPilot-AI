'use client';

import React from 'react';
import { motion } from 'framer-motion';
import AuthForm from '@/components/auth-form';

export default function AuthPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 pt-28 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md flex justify-center"
      >
        <AuthForm />
      </motion.div>
    </div>
  );
}
