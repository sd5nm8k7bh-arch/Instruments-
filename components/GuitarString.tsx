
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { audioEngine } from '../services/audioEngine';

interface Props {
  frequency: number;
  label: string;
  color: string;
}

const GuitarString: React.FC<Props> = ({ frequency, label, color }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlucking, setIsPlucking] = useState(false);
  const [offset, setOffset] = useState(0);
  const [vibration, setVibration] = useState(0);
  const requestRef = useRef<number>();
  const lastY = useRef<number>(0);
  const activePointerId = useRef<number | null>(null);
  const stringId = useRef(`string-${label}-${frequency}`);

  const startVibration = useCallback((finalOffset: number) => {
    let startTime = performance.now();
    let amplitude = Math.abs(finalOffset) > 5 ? finalOffset : 20;
    
    const animate = (time: number) => {
      const elapsed = time - startTime;
      const decay = Math.exp(-elapsed / 400);
      const vib = amplitude * Math.sin(elapsed * 0.25) * decay;
      
      setVibration(vib);
      
      if (decay > 0.01) {
        requestRef.current = requestAnimationFrame(animate);
      } else {
        setVibration(0);
      }
    };
    
    requestRef.current = requestAnimationFrame(animate);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Prevent multiple pointers on the same string if one is already active
    if (activePointerId.current !== null) return;
    
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    
    activePointerId.current = e.pointerId;
    setIsPlucking(true);
    lastY.current = e.clientY;
    
    // Instant Sound Trigger
    audioEngine.startNote(stringId.current, frequency);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPlucking || e.pointerId !== activePointerId.current) return;
    
    const delta = e.clientY - lastY.current;
    const newOffset = Math.max(-120, Math.min(120, offset + delta));
    
    setOffset(newOffset);
    lastY.current = e.clientY;

    // Real-time Pitch Bending
    audioEngine.updateBend(stringId.current, newOffset);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.pointerId !== activePointerId.current) return;
    
    setIsPlucking(false);
    activePointerId.current = null;
    startVibration(offset);
    setOffset(0);
    
    // Let the note ring out for a short duration
    setTimeout(() => {
      audioEngine.stopNote(stringId.current);
    }, 500);
  };

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const path = `M 0 50 Q 400 ${50 + offset + vibration} 800 50`;

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-32 flex items-center justify-center cursor-ns-resize group select-none touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="absolute left-4 text-xs font-bold text-gray-600 uppercase tracking-widest pointer-events-none z-10">
        {label}
      </div>
      
      <svg className="w-full h-full pointer-events-none overflow-visible" viewBox="0 0 800 100" preserveAspectRatio="none">
        {/* Glow */}
        <path 
          d={path} 
          fill="none" 
          stroke={color} 
          strokeWidth="10" 
          className="opacity-10 blur-md transition-opacity duration-300"
          style={{ opacity: isPlucking ? 0.3 : 0.1 }}
        />
        {/* Shadow */}
        <path 
          d={path} 
          fill="none" 
          stroke="black" 
          strokeWidth="4" 
          transform="translate(0, 2)"
          className="opacity-40"
        />
        {/* Main String */}
        <path 
          d={path} 
          fill="none" 
          stroke={color} 
          strokeWidth={isPlucking ? "3.5" : "2.5"} 
          strokeLinecap="round"
          className="transition-[stroke-width] duration-75"
        />
        {/* High-tension Shine */}
        <path 
          d={path} 
          fill="none" 
          stroke="white" 
          strokeWidth="0.8" 
          className="opacity-30"
        />
      </svg>

      {/* Interactive Zone indicator */}
      <div className={`absolute inset-0 transition-colors rounded-xl ${isPlucking ? 'bg-amber-500/5' : 'bg-white/5 opacity-0 group-hover:opacity-10'}`} />
    </div>
  );
};

export default GuitarString;
