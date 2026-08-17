"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  maxTilt?: number;
  glowColor?: string;
  enableGlow?: boolean;
  cardClassName?: string;
}

/**
 * 60fps/120fps Hardware-Accelerated 3D Tilt Card.
 *
 * Menggunakan direct DOM manipulation + requestAnimationFrame tanpa memicu
 * re-render React pada setiap pergerakan mouse, menjamin performa mulus 60-120 FPS
 * murni di GPU compositor layer.
 */
export function TiltCard({
  children,
  className = "",
  cardClassName = "",
  maxTilt = 5,
  glowColor = "rgba(255, 79, 163, 0.12)",
  enableGlow = true,
  style,
  ...props
}: TiltCardProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const sheenRef = React.useRef<HTMLDivElement>(null);
  const rafRef = React.useRef<number | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rx = ((y - centerY) / centerY) * -maxTilt;
    const ry = ((x - centerX) / centerX) * maxTilt;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (cardRef.current) {
        cardRef.current.style.transform = `perspective(1000px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateZ(0)`;
      }
      if (sheenRef.current && enableGlow) {
        sheenRef.current.style.opacity = "1";
        sheenRef.current.style.background = `radial-gradient(380px circle at ${x}px ${y}px, ${glowColor}, transparent 80%)`;
      }
    });
  };

  const handleMouseLeave = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (cardRef.current) {
      cardRef.current.style.transition = "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)";
      cardRef.current.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)";
      setTimeout(() => {
        if (cardRef.current) cardRef.current.style.transition = "";
      }, 450);
    }
    if (sheenRef.current) {
      sheenRef.current.style.opacity = "0";
    }
  };

  const handleMouseEnter = () => {
    if (cardRef.current) {
      cardRef.current.style.transition = "none";
    }
  };

  return (
    <div
      ref={containerRef}
      style={{ perspective: "1000px", ...style }}
      className={cn("relative w-full", className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      {...props}
    >
      <div
        ref={cardRef}
        style={{
          transformStyle: "preserve-3d",
          willChange: "transform",
          transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)",
        }}
        className={cn(
          "relative h-full w-full overflow-hidden rounded-2xl border transition-shadow duration-200",
          cardClassName,
        )}
      >
        {enableGlow && (
          <div
            ref={sheenRef}
            className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-200"
            aria-hidden="true"
          />
        )}
        <div className="h-full w-full">{children}</div>
      </div>
    </div>
  );
}
