'use client';

import React, { useRef, useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BackgroundVideoProps {
  src?: string;
  fallbackSrc?: string;
  poster?: string;
  opacity?: number;
  overlayGradient?: string;
  className?: string;
  children?: React.ReactNode;
}

export function BackgroundVideo({
  src = '/videos/hero-ambient-typing.mp4',
  fallbackSrc = 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-typing-on-a-keyboard-41382-large.mp4',
  poster,
  opacity = 0.85,
  overlayGradient = 'bg-gradient-to-t from-[#181715] via-[#181715]/70 to-[#181715]/40',
  className,
  children,
}: BackgroundVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    setCurrentSrc(src);
  }, [src]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Handle browser autoplay policy restrictions silently
      });
    }
  }, [currentSrc]);

  const handleVideoError = () => {
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    }
  };

  return (
    <div className={twMerge(clsx('relative overflow-hidden w-full', className))}>
      {/* HTML5 Video Element with AutoPlay, Loop, Muted, PlaysInline */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        poster={poster}
        onLoadedData={() => setIsLoaded(true)}
        onError={handleVideoError}
        style={{ opacity: isLoaded ? opacity : 0 }}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
        key={currentSrc}
      >
        <source src={currentSrc} type="video/mp4" />
      </video>

      {/* Fallback ambient floor */}
      <div className="absolute inset-0 bg-[#181715] -z-10" />

      {/* Overlay Tint for Contrast & Typography Legibility */}
      {overlayGradient && (
        <div className={twMerge(clsx('absolute inset-0 z-10 pointer-events-none', overlayGradient))} />
      )}

      {/* Content Container */}
      {children && <div className="relative z-20 h-full">{children}</div>}
    </div>
  );
}
