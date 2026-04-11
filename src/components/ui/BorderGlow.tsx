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
      
      // Calculate angle from center
      const dx = e.clientX - cardCenter[0];
      const dy = e.clientY - cardCenter[1];
      const radians = Math.atan2(dy, dx);
      let degrees = radians * (180 / Math.PI) + 90;
      if (degrees < 0) degrees += 360;
      setCursorAngle(degrees);

      // Distance-based proximity (Magnetic Effect)
      const nearbyRange = 300; // How far away the "magnetic" field reaches
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Calculate how "inside" or "near" the mouse is
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const isInside = mouseX >= 0 && mouseX <= rect.width && mouseY >= 0 && mouseY <= rect.height;
      
      if (isInside) {
          // Inner proximity logic (original)
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
          // Nearby logic
          const outerProximity = Math.max(0, 1 - (dist - Math.min(rect.width, rect.height) / 2) / nearbyRange);
          setEdgeProximity(outerProximity * 0.5); // Lower intensity when outside
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
      className={`relative grid isolate border border-white/10 ${className}`}
      style={{
        background: backgroundColor,
        borderRadius: `${borderRadius}px`,
        transform: 'translate3d(0, 0, 0.01px)',
      }}
    >
      <div
        className="absolute inset-0 rounded-[inherit] -z-[1]"
        style={{
          border: '1px solid transparent',
          background: [
            `linear-gradient(${backgroundColor} 0 100%) padding-box`,
            'linear-gradient(rgb(255 255 255 / 0%) 0% 100%) border-box',
            ...meshGradients.map(g => `${g} border-box`),
          ].join(', '),
          opacity: borderOpacity,
          maskImage: `conic-gradient(from ${angleDeg} at center, black ${coneSpread}%, transparent ${coneSpread + 15}%, transparent ${100 - coneSpread - 15}%, black ${100 - coneSpread}%)`,
          WebkitMaskImage: `conic-gradient(from ${angleDeg} at center, black ${coneSpread}%, transparent ${coneSpread + 15}%, transparent ${100 - coneSpread - 15}%, black ${100 - coneSpread}%)`,
          transition: 'opacity 0.4s ease-out',
        }}
      />

      <span
        className="absolute pointer-events-none z-[1] rounded-[inherit]"
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

      <div className="flex flex-col relative overflow-hidden z-[1] w-full h-full">
        {children}
      </div>
    </div>
  );
};

export default BorderGlow;
