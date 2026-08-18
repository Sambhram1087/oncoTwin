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

  const size = Math.max(80, Math.min(220, 80 + volumeMl * 2));

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-muted to-background border border-border"
        style={{ width: "100%", height: 280, perspective: "800px" }}
      >
        <div
          className={cn(
            "rounded-full",
            spin && "animate-[spin_8s_linear_infinite]"
          )}
          style={{
            width: size,
            height: size,
            background: wireframe
              ? "repeating-conic-gradient(hsl(var(--primary)) 0deg 10deg, transparent 10deg 20deg)"
              : `radial-gradient(circle at 35% 30%, hsl(var(--accent)) 0%, hsl(var(--primary)) 55%, hsl(222 47% 20%) 100%)`,
            opacity: opacity / 100,
            boxShadow: "0 20px 60px -10px hsl(var(--primary) / 0.5)",
            transformStyle: "preserve-3d",
          }}
        />
        <span className="absolute bottom-3 right-4 text-xs text-muted-foreground">
          {meshVertices.toLocaleString()} mesh vertices (demo render)
        </span>
      </div>

      <div className="flex flex-wrap gap-4 items-center text-sm w-full justify-center">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={wireframe}
            onChange={(e) => setWireframe(e.target.checked)}
          />
          Wireframe
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={spin} onChange={(e) => setSpin(e.target.checked)} />
          Auto-rotate
        </label>
        <label className="flex items-center gap-2">
          Opacity
          <input
            type="range"
            min={20}
            max={100}
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
          />
        </label>
      </div>
    </div>
  );
}
