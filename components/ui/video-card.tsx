'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { VideoModal } from './video-modal';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface VideoCardProps {
  src?: string;
  title?: string;
  subtitle?: string;
  category?: string;
  variant?: 'dark' | 'cream';
  className?: string;
  showMeters?: boolean;
  onPlayClick?: () => void;
}

export function VideoCard({
  src = '/videos/mock-interview-session.mp4',
  title = 'AI Mock Interview Experience',
  subtitle = 'Live evaluation of STAR responses & technical depth',
  category = 'INTERACTIVE SHOWREEL',
  variant = 'dark',
  className,
  showMeters = false,
  onPlayClick,
}: VideoCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fallbackSrc = 'https://assets.mixkit.co/videos/preview/mixkit-woman-holding-a-video-call-on-laptop-42908-large.mp4';

  const handleContainerClick = () => {
    if (onPlayClick) {
      onPlayClick();
    } else {
      setIsModalOpen(true);
    }
  };

  const isDark = variant === 'dark';

  return (
    <>
      <motion.div
        whileHover={{ y: -4, scale: 1.01 }}
        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
        onClick={handleContainerClick}
        data-cursor="WATCH DEMO"
        className={twMerge(
          clsx(
            'rounded-2xl overflow-hidden border shadow-2xl relative group cursor-pointer transition-colors',
            isDark
              ? 'bg-[#181715] text-[#faf9f5] border-white/10'
              : 'bg-[#efe9de] text-[#141413] border-[#e6dfd8]',
            className
          )
        )}
      >
        {/* Video Preview Container — Plays Continuously on Autoplay Loop */}
        <div className="relative aspect-video bg-[#1f1e1b] overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            onError={() => setCurrentSrc(fallbackSrc)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
            key={currentSrc}
          >
            <source src={currentSrc} type="video/mp4" />
          </video>

          {/* Dark Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#181715] via-transparent to-transparent opacity-60 pointer-events-none" />

          {/* Top Category Badge */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-[#181715]/85 backdrop-blur-md text-[10px] font-mono uppercase tracking-widest text-[#cc785c] border border-white/10 shadow-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5db872] animate-pulse" />
              <span>{category}</span>
            </span>
          </div>

          {/* Live Indicator on bottom right */}
          <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-[#181715]/80 backdrop-blur-md text-[10px] font-mono uppercase tracking-wider text-[#faf9f5] border border-white/10">
              Live AI Grounded
            </span>
          </div>
        </div>

        {/* Card Footer & Showreel Info Bar */}
        <div className={clsx(
          'p-6 space-y-3 border-t',
          isDark ? 'bg-[#181715] border-white/10' : 'bg-[#efe9de] border-[#e6dfd8]'
        )}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-[#6c6a64]">CareerPilot Studio</p>
              <h4 className={clsx(
                'font-display text-xl sm:text-2xl mt-0.5',
                isDark ? 'text-[#faf9f5]' : 'text-[#141413]'
              )}>
                {title}
              </h4>
            </div>
            <span className="font-mono text-sm text-[#cc785c] font-bold">01 ↗</span>
          </div>

          <p className={clsx(
            'text-xs font-sans leading-relaxed',
            isDark ? 'text-[#a09d96]' : 'text-[#3d3d3a]'
          )}>
            {subtitle}
          </p>

          {showMeters && (
            <div className={clsx(
              'pt-3 border-t grid grid-cols-2 gap-4 text-xs font-mono',
              isDark ? 'border-white/10' : 'border-[#e6dfd8]'
            )}>
              <div>
                <span className="text-[#6c6a64] block text-[10px]">STAR STRUCTURE</span>
                <span className="text-[#5db872] font-bold">96% High Match</span>
              </div>
              <div>
                <span className="text-[#6c6a64] block text-[10px]">TECHNICAL ACCURACY</span>
                <span className="text-[#5db8a6] font-bold">94% Confidence</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Fullscreen Video Modal */}
      <VideoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        videoSrc={currentSrc}
        title={title}
      />
    </>
  );
}
