"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Lightweight CSS-only rotating tumor visualization.
 *
 * This stands in for the full interactive Cornerstone3D / React-Three-Fiber
 * brain + tumor mesh viewer described in the product brief (orbit controls,
 * opacity, wireframe, cross-sections, etc). The component's props
 * (`volumeMl`, `meshVertices`) are the same values a real mesh renderer
 * would consume, so swapping this for an R3F <Canvas> scene later only
 * touches this one file.
 */
export function TumorVisualization({
  volumeMl,
  meshVertices,
}: {
  volumeMl: number;
  meshVertices: number;
}) {
  const [wireframe, setWireframe] = useState(false);
  const [opacity, setOpacity] = useState(85);
  const [spin, setSpin] = useState(true);

  const size = Math.max(80, Math.min(200, 80 + volumeMl * 2));

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Viewport */}
      <div
        className="relative flex items-center justify-center rounded-2xl overflow-hidden border border-border"
        style={{
          width: "100%",
          height: 280,
          background:
            "radial-gradient(ellipse at 50% 30%, hsl(222 47% 10%) 0%, hsl(222 47% 5%) 100%)",
        }}
      >
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
            backgroundSize: "30px 30px",
          }}
        />

        {/* Glow ring behind sphere */}
        <div
          className="absolute rounded-full"
          style={{
            width: size + 60,
            height: size + 60,
            background: `radial-gradient(circle, hsl(var(--primary) / 0.2) 0%, transparent 70%)`,
            animation: spin ? "pulse 3s ease-in-out infinite" : "none",
          }}
        />

        {/* Tumor sphere */}
        <div
          className={cn(
            "relative rounded-full transition-all duration-500",
            spin && "animate-[spin_10s_linear_infinite]"
          )}
          style={{
            width: size,
            height: size,
            background: wireframe
              ? "repeating-conic-gradient(hsl(var(--primary)) 0deg 8deg, transparent 8deg 20deg)"
              : `radial-gradient(circle at 35% 30%, hsl(var(--accent)) 0%, hsl(var(--primary)) 45%, hsl(var(--secondary) / 0.8) 80%, hsl(222 47% 12%) 100%)`,
            opacity: opacity / 100,
            boxShadow: `0 0 40px -8px hsl(var(--primary) / 0.7),
              0 0 80px -20px hsl(var(--secondary) / 0.4),
              inset 0 8px 20px hsl(var(--accent) / 0.3)`,
          }}
        />

        {/* Corner info */}
        <div className="absolute bottom-3 right-4 flex flex-col items-end gap-0.5">
          <span className="text-[10px] text-muted-foreground font-mono">
            {meshVertices.toLocaleString()} vertices
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">
            {volumeMl} mL · demo render
          </span>
        </div>

        {/* Axis label */}
        <div className="absolute top-3 left-4">
          <span className="badge badge-info text-[10px]">3D Model</span>
        </div>
      </div>

      {/* Controls */}
      <div className="w-full grid grid-cols-3 gap-3">
        <label className="flex items-center gap-2 text-xs bg-muted/40 rounded-xl px-3 py-2.5 cursor-pointer hover:bg-muted transition-colors border border-border/50">
          <input
            type="checkbox"
            checked={wireframe}
            onChange={(e) => setWireframe(e.target.checked)}
            className="accent-[hsl(var(--primary))]"
          />
          <span className="text-muted-foreground">Wireframe</span>
        </label>

        <label className="flex items-center gap-2 text-xs bg-muted/40 rounded-xl px-3 py-2.5 cursor-pointer hover:bg-muted transition-colors border border-border/50">
          <input
            type="checkbox"
            checked={spin}
            onChange={(e) => setSpin(e.target.checked)}
            className="accent-[hsl(var(--primary))]"
          />
          <span className="text-muted-foreground">Auto-rotate</span>
        </label>

        <div className="flex items-center gap-2 text-xs bg-muted/40 rounded-xl px-3 py-2.5 border border-border/50">
          <span className="text-muted-foreground whitespace-nowrap">Opacity</span>
          <input
            type="range"
            min={20}
            max={100}
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            className="w-full accent-[hsl(var(--primary))]"
          />
        </div>
      </div>
    </div>
  );
}
