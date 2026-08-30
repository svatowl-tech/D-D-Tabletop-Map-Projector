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
}

export const PingOverlay: React.FC<PingOverlayProps> = ({ pings, laserPoints = [] }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animId: number;

    const render = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const now = Date.now();

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

          const alpha = Math.max(0, 1 - age / 1500);

          // Внешнее неоновое свечение
          ctx.beginPath();
          ctx.strokeStyle = `rgba(255, 30, 30, ${alpha * 0.4})`;
          ctx.lineWidth = 10;
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();

          // Яркое ядро лазера
          ctx.beginPath();
          ctx.strokeStyle = `rgba(255, 230, 230, ${alpha})`;
          ctx.lineWidth = 3.5;
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }

        // Кончик лазера (яркая точка)
        const lastPoint = laserPoints[laserPoints.length - 1];
        if (now - lastPoint.timestamp < 1500) {
          ctx.fillStyle = '#FF0000';
          ctx.shadowColor = '#FF0000';
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(lastPoint.x, lastPoint.y, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [laserPoints]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Холст для лазерной указки */}
      <canvas
        ref={canvasRef}
        width={3840}
        height={2160}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
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
};
