"use client";

import * as React from "react";

interface ParticleCanvasProps {
  particleColor?: string;
  lineColor?: string;
  maxParticles?: number;
  className?: string;
}

/**
 * 60fps/120fps Smooth Delta-Timed Ambient Particle Canvas.
 * Menggunakan requestAnimationFrame dengan timestamp delta-time dan batched 2D context paths.
 */
export function InteractiveParticleCanvas({
  particleColor = "rgba(156, 15, 80, 0.35)",
  lineColor = "rgba(156, 15, 80, 0.1)",
  maxParticles = 28,
  className = "",
}: ParticleCanvasProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let isVisible = true;
    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      if (!canvas) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });

    // Track mouse coordinates
    const mouse = { x: -1000, y: -1000 };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    canvas.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    // Generate particles
    const particles = Array.from({ length: maxParticles }, () => ({
      x: Math.random() * (width || 800),
      y: Math.random() * (height || 400),
      vx: (Math.random() - 0.5) * 32,
      vy: (Math.random() - 0.5) * 32,
      size: Math.random() * 1.5 + 1,
    }));

    // Sleep when offscreen
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.02 },
    );
    observer.observe(canvas);

    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      if (isVisible && width > 0 && height > 0) {
        ctx.clearRect(0, 0, width, height);

        // Update positions
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.x += p.vx * dt;
          p.y += p.vy * dt;

          if (p.x < 0) { p.x = 0; p.vx *= -1; }
          if (p.x > width) { p.x = width; p.vx *= -1; }
          if (p.y < 0) { p.y = 0; p.vy *= -1; }
          if (p.y > height) { p.y = height; p.vy *= -1; }

          // Mouse subtle repulsion
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 10000 && distSq > 0) {
            const dist = Math.sqrt(distSq);
            p.x -= (dx / dist) * 40 * dt;
            p.y -= (dy / dist) * 40 * dt;
          }

          // Draw node
          ctx.fillStyle = particleColor;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();

          // Connect nearby nodes
          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dpx = p.x - p2.x;
            const dpy = p.y - p2.y;
            const distPSq = dpx * dpx + dpy * dpy;
            if (distPSq < 6400) {
              const distP = Math.sqrt(distPSq);
              ctx.strokeStyle = lineColor;
              ctx.lineWidth = (1 - distP / 80) * 1.1;
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        }
      }
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      observer.disconnect();
    };
  }, [particleColor, lineColor, maxParticles]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      aria-hidden="true"
    />
  );
}
