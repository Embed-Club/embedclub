import { useRef, useCallback, useState, useEffect, type ReactNode } from 'react';

interface BorderGlowProps {
  children?: ReactNode;
  className?: string;
  edgeSensitivity?: number;
  glowColor?: string;
  backgroundColor?: string;
  borderRadius?: number;
  glowRadius?: number;
  glowIntensity?: number;
  coneSpread?: number;
  animated?: boolean;
  colors?: string[];
  fillOpacity?: number;
}

function parseHSL(hslStr: string): { h: number; s: number; l: number } {
  const match = hslStr.match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/);
  if (!match) return { h: 40, s: 80, l: 80 };
  return { h: parseFloat(match[1]), s: parseFloat(match[2]), l: parseFloat(match[3]) };
}

function buildBoxShadow(glowColor: string, intensity: number): string {
  const { h, s, l } = parseHSL(glowColor);
  const base = `${h}deg ${s}% ${l}%`;
  const layers: [number, number, number, number, number, boolean][] = [
    [0, 0, 0, 1, 100, true], [0, 0, 1, 0, 60, true], [0, 0, 3, 0, 50, true],
    [0, 0, 6, 0, 40, true], [0, 0, 15, 0, 30, true], [0, 0, 25, 2, 20, true],
    [0, 0, 50, 2, 10, true],
    [0, 0, 1, 0, 60, false], [0, 0, 3, 0, 50, false], [0, 0, 6, 0, 40, false],
    [0, 0, 15, 0, 30, false], [0, 0, 25, 2, 20, false], [0, 0, 50, 2, 10, false],
  ];
  return layers.map(([x, y, blur, spread, alpha, inset]) => {
    const a = Math.min(alpha * intensity, 100);
    return `${inset ? 'inset ' : ''}${x}px ${y}px ${blur}px ${spread}px hsl(${base} / ${a}%)`;
  }).join(', ');
}

const BorderGlow: React.FC<BorderGlowProps> = ({
  children,
  className = '',
  edgeSensitivity = 30,
  glowColor = '40 80 80',
  backgroundColor = '#060010',
  borderRadius = 28,
  glowRadius = 40,
  glowIntensity = 1.0,
  coneSpread = 25,
  animated = false,
  colors = ['#c084fc', '#f472b6', '#38bdf8'],
  fillOpacity = 0.5,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [cursorAngle, setCursorAngle] = useState(45);
  const [edgeProximity, setEdgeProximity] = useState(0);
  const [proximityOpacity, setProximityOpacity] = useState(0);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleGlobalPointerMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const cardCenter = [rect.left + rect.width / 2, rect.top + rect.height / 2];
      
      const dx = e.clientX - cardCenter[0];
      const dy = e.clientY - cardCenter[1];
      const radians = Math.atan2(dy, dx);
      let degrees = radians * (180 / Math.PI) + 90;
      if (degrees < 0) degrees += 360;
      setCursorAngle(degrees);

      const nearbyRange = 300; 
      const dist = Math.sqrt(dx * dx + dy * dy);
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const isInside = mouseX >= 0 && mouseX <= rect.width && mouseY >= 0 && mouseY <= rect.height;
      
      if (isInside) {
          const cx = rect.width / 2;
          const cy = rect.height / 2;
          const idx = Math.abs(mouseX - cx);
          const idy = Math.abs(mouseY - cy);
          const kx = cx / idx;
          const ky = cy / idy;
          const proximityValue = Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
          setEdgeProximity(proximityValue);
          setProximityOpacity(1);
      } else {
          const outerProximity = Math.max(0, 1 - (dist - Math.min(rect.width, rect.height) / 2) / nearbyRange);
          setEdgeProximity(outerProximity * 0.5); 
          setProximityOpacity(outerProximity);
      }
    };

    window.addEventListener('mousemove', handleGlobalPointerMove);
    return () => window.removeEventListener('mousemove', handleGlobalPointerMove);
  }, []);

  const colorSensitivity = edgeSensitivity + 20;
  const borderOpacity = Math.max(0, (edgeProximity * 100 - colorSensitivity) / (100 - colorSensitivity)) * proximityOpacity;
  const glowOpacity = Math.max(0, (edgeProximity * 100 - edgeSensitivity) / (100 - edgeSensitivity)) * proximityOpacity;

  const buildMeshGradients = (colors: string[]) => {
    const POS = ['80% 55%', '69% 34%', '8% 6%', '41% 38%', '86% 85%', '82% 18%', '51% 4%'];
    const MAP = [0, 1, 2, 0, 1, 2, 1];
    const gradients = POS.map((p, i) => `radial-gradient(at ${p}, ${colors[Math.min(MAP[i], colors.length - 1)]} 0px, transparent 50%)`);
    gradients.push(`linear-gradient(${colors[0]} 0 100%)`);
    return gradients;
  };

  const meshGradients = buildMeshGradients(colors);
  const angleDeg = `${cursorAngle.toFixed(3)}deg`;

  return (
    <div
      ref={cardRef}
      className={`relative grid isolate ${className}`}
      style={{
        background: backgroundColor,
        borderRadius: `${borderRadius}px`,
        transform: 'translate3d(0, 0, 0.01px)',
        // biome-ignore lint/style/usePropertySignature: shadow
        boxShadow: 'rgba(0,0,0,0.1) 0 1px 2px, rgba(0,0,0,0.1) 0 2px 4px, rgba(0,0,0,0.1) 0 4px 8px, rgba(0,0,0,0.1) 0 8px 16px, rgba(0,0,0,0.1) 0 16px 32px, rgba(0,0,0,0.1) 0 32px 64px',
      }}
    >
      {/* mesh gradient border - Moved to Z-INDEX 20 to sit ABOVE image */}
      <div
        className="absolute inset-[1px] rounded-[inherit] z-20 pointer-events-none"
        style={{
          border: '1px solid transparent',
          background: [
            // No backgroundColor here so it's transparent inside the border line
            'linear-gradient(rgb(255 255 255 / 0%) 0% 100%) border-box',
            ...meshGradients.map(g => `${g} border-box`),
          ].join(', '),
          opacity: borderOpacity,
          maskImage: `conic-gradient(from ${angleDeg} at center, black ${coneSpread}%, transparent ${coneSpread + 15}%, transparent ${100 - coneSpread - 15}%, black ${100 - coneSpread}%)`,
          WebkitMaskImage: `conic-gradient(from ${angleDeg} at center, black ${coneSpread}%, transparent ${coneSpread + 15}%, transparent ${100 - coneSpread - 15}%, black ${100 - coneSpread}%)`,
          transition: 'opacity 0.4s ease-out',
        }}
      />

      {/* outer glow - High Z-index to avoid clipping */}
      <span
        className="absolute pointer-events-none z-30 rounded-[inherit]"
        style={{
          inset: `${-glowRadius}px`,
          maskImage: `conic-gradient(from ${angleDeg} at center, black 2.5%, transparent 10%, transparent 90%, black 97.5%)`,
          WebkitMaskImage: `conic-gradient(from ${angleDeg} at center, black 2.5%, transparent 10%, transparent 90%, black 97.5%)`,
          opacity: glowOpacity,
          mixBlendMode: 'plus-lighter',
          transition: 'opacity 0.4s ease-out',
        } as any}
      >
        <span
          className="absolute rounded-[inherit]"
          style={{
            inset: `${glowRadius}px`,
            boxShadow: buildBoxShadow(glowColor, glowIntensity),
          }}
        />
      </span>

      {/* Content Container - Lower Z-index (10) so border is visible over it */}
      <div className="flex flex-col relative overflow-hidden z-10 w-full h-full rounded-[inherit]">
        {children}
      </div>
    </div>
  );
};

export default BorderGlow;
