/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Оверлей маркеров внимания (Ping Overlay) и лазерной указки (Laser Pointer).
 * Рисует пульсирующие кольца и неоновый след с плавным затуханием.
 */

import React, { useEffect, useRef } from 'react';
import { MapPing, LaserPoint } from '../types';

interface PingOverlayProps {
  pings: MapPing[];
  laserPoints?: LaserPoint[];
  width?: number;
  height?: number;
}

export const PingOverlay: React.FC<PingOverlayProps> = React.memo(({
  pings,
  laserPoints = [],
  width = 1920,
  height = 1080
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Если нет активных точек лазера - очищаем один раз и не запускаем rAF цикл
    if (laserPoints.length === 0) {
      ctx.clearRect(0, 0, width, height);
      return;
    }

    let animId: number = 0;

    const render = () => {
      const now = Date.now();
      ctx.clearRect(0, 0, width, height);

      let hasActivePoints = false;

      // Отрисовка лазерного следа с затуханием (1.5 сек)
      if (laserPoints.length > 1) {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 1; i < laserPoints.length; i++) {
          const p1 = laserPoints[i - 1];
          const p2 = laserPoints[i];
          const age = now - p2.timestamp;
          if (age > 1500) continue;

          hasActivePoints = true;
          const alpha = Math.max(0, 1 - age / 1500);

          // Внешнее неоновое свечение
          ctx.beginPath();
          ctx.strokeStyle = `rgba(255, 40, 40, ${alpha * 0.5})`;
          ctx.lineWidth = 10;
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();

          // Яркое ядро лазера
          ctx.beginPath();
          ctx.strokeStyle = `rgba(255, 240, 240, ${alpha})`;
          ctx.lineWidth = 3.5;
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }

        // Кончик лазера (яркая точка)
        const lastPoint = laserPoints[laserPoints.length - 1];
        if (now - lastPoint.timestamp < 1500) {
          hasActivePoints = true;
          ctx.fillStyle = '#FF2222';
          ctx.beginPath();
          ctx.arc(lastPoint.x, lastPoint.y, 4.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      } else if (laserPoints.length === 1) {
        const p = laserPoints[0];
        if (now - p.timestamp < 1500) {
          hasActivePoints = true;
          ctx.fillStyle = '#FF2222';
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Цикл продолжается только пока есть видимые затухающие точки
      if (hasActivePoints) {
        animId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    };

    render();

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [laserPoints, width, height]);

  return (
    <div
      className="absolute top-0 left-0 pointer-events-none overflow-hidden"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {/* Холст для лазерной указки */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute top-0 left-0 pointer-events-none"
        style={{ width: `${width}px`, height: `${height}px` }}
      />

      {/* Анимированные пульсирующие пинги мастера */}
      {pings.map((ping) => (
        <div
          key={ping.id}
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30"
          style={{ left: `${ping.x}px`, top: `${ping.y}px` }}
        >
          {/* Пульсирующие волны */}
          <div
            className="w-16 h-16 rounded-full border-2 animate-ping absolute -top-8 -left-8"
            style={{ borderColor: ping.color || '#F27D26' }}
          />
          <div
            className="w-8 h-8 rounded-full border-2 absolute -top-4 -left-4 animate-pulse"
            style={{ borderColor: ping.color || '#F27D26' }}
          />
          {/* Центральный маркер */}
          <div
            className="w-3.5 h-3.5 rounded-full shadow-lg border border-white"
            style={{ backgroundColor: ping.color || '#F27D26' }}
          />
        </div>
      ))}
    </div>
  );
});
