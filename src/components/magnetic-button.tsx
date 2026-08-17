"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface MagneticButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  strength?: number;
}

export function MagneticButton({
  children,
  className = "",
  strength = 0.22,
  ...props
}: MagneticButtonProps) {
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!btnRef.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } =
      btnRef.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const deltaX = (clientX - centerX) * strength;
    const deltaY = (clientY - centerY) * strength;
    setOffset({ x: deltaX, y: deltaY });
  };

  const handleMouseLeave = () => {
    setOffset({ x: 0, y: 0 });
  };

  return (
    <button
      ref={btnRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
        transition:
          offset.x === 0 && offset.y === 0
            ? "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)"
            : "transform 0.08s ease-out",
      }}
      className={cn(
        "relative inline-flex items-center justify-center transition-all duration-200 active:scale-[0.97]",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
