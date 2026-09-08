"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface HolographicBeamsProps extends React.HTMLAttributes<HTMLDivElement> {
  density?: number;
  speed?: number;
  aberration?: number;
  opacity?: number;
}

const HolographicBeams = ({
  className,
  density = 22,
  speed = 0.7,
  aberration = 2.5,
  opacity = 55,
  style,
  ...props
}: HolographicBeamsProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = container.offsetWidth;
    let height = container.offsetHeight;
    let time = 0;
    let animationFrameId = 0;
    let running = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const noise = (x: number, t: number) =>
      (Math.sin(x * 0.01 + t) + Math.sin(x * 0.03 + t * 2) * 0.5 + Math.sin(x * 0.1 + t * 4) * 0.25) / 1.75;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = container.offsetWidth;
      height = container.offsetHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const drawBeam = (x: number, t: number, color: string, widthMod: number) => {
      const n = noise(x, t * 0.5);
      const beamHeight = height * (0.62 + n * 0.32);
      const beamWidth = (width / density) * widthMod;
      const gradient = ctx.createLinearGradient(x, height, x, height - beamHeight);
      gradient.addColorStop(0, color);
      gradient.addColorStop(0.72, color.replace(/,[^,]+\)$/, ", 0.04)"));
      gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(x - beamWidth / 2, height);
      ctx.lineTo(x + beamWidth / 2, height);
      ctx.lineTo(x + beamWidth, height - beamHeight);
      ctx.lineTo(x - beamWidth, height - beamHeight);
      ctx.fill();
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "screen";
      time += 0.01 * speed;
      const spacing = width / density;

      for (let i = 0; i <= density; i++) {
        const x = i * spacing;
        const indigoAlpha = (opacity / 100) * (0.5 + 0.5 * Math.cos(i * 0.5 + time));
        const coralAlpha = (opacity / 100) * (0.5 + 0.5 * Math.sin(i * 0.6 + time * 1.1));
        const sageAlpha = (opacity / 100) * (0.6 + 0.4 * Math.sin(i * 0.3 - time));
        drawBeam(x - aberration, time + i * 0.1, `rgba(107, 91, 138, ${indigoAlpha * 0.72})`, 1.6);
        drawBeam(x + aberration, time + i * 0.12 + 10, `rgba(224, 140, 126, ${coralAlpha * 0.48})`, 1.45);
        drawBeam(x, time + i * 0.1 + 5, `rgba(154, 216, 210, ${sageAlpha * 0.58})`, 0.8);
      }

      if (running) animationFrameId = requestAnimationFrame(draw);
    };

    const observer = new IntersectionObserver(([entry]) => {
      const nextRunning = entry.isIntersecting && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (nextRunning && !running) {
        running = true;
        animationFrameId = requestAnimationFrame(draw);
      } else if (!nextRunning && running) {
        running = false;
        cancelAnimationFrame(animationFrameId);
      }
    });

    window.addEventListener("resize", resize);
    observer.observe(container);
    resize();
    draw();

    return () => {
      running = false;
      observer.disconnect();
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [density, speed, aberration, opacity]);

  return (
    <div
      ref={containerRef}
      className={cn("pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#211e2a]", className)}
      style={style}
      aria-hidden="true"
      {...props}
    >
      <canvas ref={canvasRef} className="block h-full w-full blur-[5px]" />
      <div
        className="absolute inset-0 z-10 opacity-[0.12]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0) 50%, rgba(0,0,0,0.85) 50%), linear-gradient(90deg, rgba(107,91,138,0.08), rgba(154,216,210,0.025), rgba(224,140,126,0.07))",
          backgroundSize: "100% 4px, 3px 100%",
        }}
      />
      <div className="absolute inset-0 z-20 bg-[radial-gradient(ellipse_at_50%_58%,transparent_5%,rgba(33,30,42,0.28)_58%,#211e2a_100%)]" />
      <div className="absolute inset-x-0 bottom-0 z-20 h-1/3 bg-gradient-to-t from-[#211e2a]/55 to-transparent" />
    </div>
  );
};

export default HolographicBeams;
