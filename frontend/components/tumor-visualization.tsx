"use client";

import { useRef, useEffect, useState } from "react";

export default function TumorVisualization() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setMousePos({ x, y });
    };

    const container = containerRef.current;
    container?.addEventListener("mousemove", handleMouseMove);
    return () => container?.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full min-h-[400px] flex items-center justify-center relative overflow-hidden group perspective-[1000px]"
    >
      {/* Background depth rings */}
      <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
        <div className="w-[300px] h-[300px] rounded-full border border-primary/30 animate-[spin-slow_20s_linear_infinite]" />
        <div className="absolute w-[400px] h-[400px] rounded-full border border-secondary/20 border-dashed animate-[spin-slow_30s_linear_infinite_reverse]" />
        <div className="absolute w-[500px] h-[500px] rounded-full border border-accent/10 animate-[spin-slow_40s_linear_infinite]" />
      </div>

      {/* Main interactive visualization container */}
      <div 
        className="relative w-64 h-64 transition-transform duration-200 ease-out preserve-3d"
        style={{
          transform: `rotateY(${mousePos.x * 30}deg) rotateX(${-mousePos.y * 30}deg)`
        }}
      >
        {/* Core sphere with multiple radial gradients to simulate 3D lighting */}
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,_hsl(var(--primary))_0%,_hsl(var(--secondary))_50%,_hsl(var(--background))_100%)] shadow-[0_0_60px_-10px_hsl(var(--primary)/0.6)] animate-pulse-glow" />
        
        {/* Inner pulsing core */}
        <div className="absolute inset-4 rounded-full bg-[radial-gradient(circle_at_70%_70%,_hsl(var(--accent))_0%,_transparent_60%)] opacity-60 mix-blend-screen" />
        
        {/* Orbital rings */}
        <div className="absolute inset-[-20%] rounded-full border border-primary/40 [transform:rotateX(75deg)] animate-[spin-slow_8s_linear_infinite]" />
        <div className="absolute inset-[-40%] rounded-full border border-secondary/30 [transform:rotateX(60deg)_rotateY(45deg)] animate-[spin-slow_12s_linear_infinite]" />
        
        {/* Measurement annotations (visible on hover) */}
        <div className="absolute -right-16 top-1/2 w-12 border-b border-dashed border-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
           <span className="absolute -top-5 right-0 text-xs font-mono text-primary bg-background/80 px-1">32mm</span>
        </div>
        <div className="absolute right-1/2 -bottom-12 h-12 border-l border-dashed border-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
           <span className="absolute bottom-0 left-2 text-xs font-mono text-secondary bg-background/80 px-1">45mm</span>
        </div>
      </div>
      
      {/* HUD overlay */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity">
        <div className="font-mono text-[10px] uppercase text-primary">
          <p>Sagittal: 0.82</p>
          <p>Coronal: 0.91</p>
          <p>Axial: 0.88</p>
        </div>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
          <div className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" style={{ animationDelay: '200ms' }} />
          <div className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" style={{ animationDelay: '400ms' }} />
        </div>
      </div>
    </div>
  );
}
