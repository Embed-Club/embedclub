'use client';

import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';

interface ChromaSceneProps {
  children: React.ReactNode;
  radius?: number;
  damping?: number;
  fadeOut?: number;
  ease?: string;
}

/**
 * ChromaScene: Global chroma container that manages mouse tracking and grayscale effects
 * for ALL child elements (categories and cards). Creates a circular area around the mouse
 * where content is revealed in full color, with grayscale applied outside the radius.
 */
const ChromaScene: React.FC<ChromaSceneProps> = ({
  children,
  radius = 300,
  damping = 0.45,
  fadeOut = 0.6,
  ease = 'power3.out'
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile / small screens; disable chroma overlays there
    const mq = window.matchMedia('(max-width: 640px)');
    const updateMobile = () => setIsMobile(mq.matches);
    updateMobile();
    mq.addEventListener('change', updateMobile);

    return () => mq.removeEventListener('change', updateMobile);
  }, []);

  useEffect(() => {
    if (isMobile) return; // skip chroma effects on mobile

    const el = rootRef.current;
    if (!el) return;

    // Initialize position to center of container
    const { width, height } = el.getBoundingClientRect();
    posRef.current = { x: width / 2, y: height / 2 };
    el.style.setProperty('--x', `${posRef.current.x}px`);
    el.style.setProperty('--y', `${posRef.current.y}px`);

    const handlePointerMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Animate mouse position with GSAP for smooth trailing
      gsap.to(posRef.current, {
        x,
        y,
        duration: damping,
        ease,
        onUpdate: () => {
          el.style.setProperty('--x', `${posRef.current.x}px`);
          el.style.setProperty('--y', `${posRef.current.y}px`);
        },
        overwrite: true
      });

      // Fade out the overlay when moving
      if (fadeRef.current) {
        gsap.to(fadeRef.current, { opacity: 0, duration: 0.25, overwrite: true });
      }
    };

    const handlePointerLeave = () => {
      // Fade back in when mouse leaves
      if (fadeRef.current) {
        gsap.to(fadeRef.current, {
          opacity: 1,
          duration: fadeOut,
          overwrite: true
        });
      }
    };

    el.addEventListener('pointermove', handlePointerMove);
    el.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      el.removeEventListener('pointermove', handlePointerMove);
      el.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [damping, ease, fadeOut, isMobile]);


  // Mobile: no overlays, keep content colored and stacked
  if (isMobile) {
    return <div className="relative w-full h-full">{children}</div>;
  }

  return (
    <div
      ref={rootRef}
      className={`relative w-full h-full`}
      style={
        {
          '--r': `${radius}px`,
          '--x': '50%',
          '--y': '50%'
        } as React.CSSProperties
      }
    >
      {/* Content: categories and cards */}
      {children}

      {/* Vignette overlay: creates circular grayscale reveal with dark edges */}
      <div
        className="absolute inset-0 pointer-events-none z-30"
        style={{
          backdropFilter: 'grayscale(1) brightness(0.78)',
          WebkitBackdropFilter: 'grayscale(1) brightness(0.78)',
          background: 'rgba(0,0,0,0.001)',
          maskImage:
            'radial-gradient(circle var(--r) at var(--x) var(--y),transparent 0%,transparent 15%,rgba(0,0,0,0.10) 30%,rgba(0,0,0,0.22) 45%,rgba(0,0,0,0.35) 60%,rgba(0,0,0,0.50) 75%,rgba(0,0,0,0.68) 88%,white 100%)',
          WebkitMaskImage:
            'radial-gradient(circle var(--r) at var(--x) var(--y),transparent 0%,transparent 15%,rgba(0,0,0,0.10) 30%,rgba(0,0,0,0.22) 45%,rgba(0,0,0,0.35) 60%,rgba(0,0,0,0.50) 75%,rgba(0,0,0,0.68) 88%,white 100%)'
        }}
      />

      {/* Fade overlay: soft glow that fades when moving mouse */}
      <div
        ref={fadeRef}
        className="absolute inset-0 pointer-events-none transition-opacity duration-[250ms] z-40"
        style={{
          backdropFilter: 'grayscale(1) brightness(0.78)',
          WebkitBackdropFilter: 'grayscale(1) brightness(0.78)',
          background: 'rgba(0,0,0,0.001)',
          maskImage:
            'radial-gradient(circle var(--r) at var(--x) var(--y),white 0%,white 15%,rgba(255,255,255,0.90) 30%,rgba(255,255,255,0.78) 45%,rgba(255,255,255,0.65) 60%,rgba(255,255,255,0.50) 75%,rgba(255,255,255,0.32) 88%,transparent 100%)',
          WebkitMaskImage:
            'radial-gradient(circle var(--r) at var(--x) var(--y),white 0%,white 15%,rgba(255,255,255,0.90) 30%,rgba(255,255,255,0.78) 45%,rgba(255,255,255,0.65) 60%,rgba(255,255,255,0.50) 75%,rgba(255,255,255,0.32) 88%,transparent 100%)',
          opacity: 1
        }}
      />
    </div>
  );
};

export default ChromaScene;
