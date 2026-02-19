'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { StarsBackground } from './animate-ui/components/backgrounds/stars';

type ThemedStarsBackgroundProps = {
  children: React.ReactNode;
  speed?: number;
  factor?: number;
  pointerEvents?: boolean;
};

export function ThemedStarsBackground({
  children,
  speed = 10,
  factor = 0.5,
  pointerEvents = true,
}: ThemedStarsBackgroundProps) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // If not mounted yet, render with default dark theme
  if (!mounted) {
    return (
      <StarsBackground
        speed={speed}
        factor={factor}
        pointerEvents={pointerEvents}
        starColor="#fff"
        className="bg-[radial-gradient(ellipse_at_bottom,_#262626_0%,_#000_100%)]"
      >
        {children}
      </StarsBackground>
    );
  }

  const currentTheme = resolvedTheme || theme;
  const isLightMode = currentTheme === 'light';

  return (
    <StarsBackground
      speed={speed}
      factor={factor}
      pointerEvents={pointerEvents}
      starColor={isLightMode ? '#000' : '#fff'}
      className={
        isLightMode
          ? 'bg-[radial-gradient(ellipse_at_bottom,_#e5e5e5_0%,_#fff_100%)]'
          : 'bg-[radial-gradient(ellipse_at_bottom,_#262626_0%,_#000_100%)]'
      }
    >
      {children}
    </StarsBackground>
  );
}
