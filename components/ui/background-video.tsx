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
    const video = videoRef.current;
    if (!video) return;

    // IntersectionObserver to pause playback when out of viewport for max GPU performance
    let observer: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              video.play().catch(() => {});
            } else {
              video.pause();
            }
          });
        },
        { threshold: 0.1 }
      );
      observer.observe(video);
    }

    const attemptPlay = () => {
      video.play().then(() => {
        setIsLoaded(true);
      }).catch(() => {
        video.muted = true;
        video.play().then(() => setIsLoaded(true)).catch(() => {});
      });
    };

    if (video.readyState >= 2) {
      setIsLoaded(true);
      attemptPlay();
    }

    const handleLoadedData = () => {
      setIsLoaded(true);
      attemptPlay();
    };

    const handleCanPlay = () => {
      setIsLoaded(true);
      attemptPlay();
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadedmetadata', handleCanPlay);

    attemptPlay();

    return () => {
      if (observer) observer.disconnect();
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('loadedmetadata', handleCanPlay);
    };
  }, [currentSrc]);

  const handleVideoError = () => {
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    }
  };

  return (
    <div className={twMerge(clsx('relative overflow-hidden w-full contain-paint', className))}>
      {/* HTML5 Video Element with autoPlay, loop, muted, playsInline, preload, GPU acceleration */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        poster={poster}
        onLoadedData={() => setIsLoaded(true)}
        onCanPlay={() => setIsLoaded(true)}
        onError={handleVideoError}
        style={{ opacity: isLoaded ? opacity : 0.8 }}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 will-change-transform transform-gpu"
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
