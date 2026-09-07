/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Оверлей тактической сетки (Grid Overlay).
 * Поддерживает квадратную сетку (Square) и гексагональную (Hex Pointy / Hex Flat).
 * Оптимизирован через Canvas 2D для минимального потребления памяти.
 */

import React, { useRef, useEffect } from 'react';
import { GridConfig } from '../types';

interface GridOverlayProps {
  grid: GridConfig;
  width: number;
  height: number;
}

export const GridOverlay: React.FC<GridOverlayProps> = React.memo(({ grid, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!grid.enabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    if (!grid.enabled || grid.size <= 0) return;

    ctx.save();
    ctx.strokeStyle = grid.color || 'rgba(255, 255, 255, 0.3)';
    ctx.globalAlpha = grid.opacity ?? 0.5;
    ctx.lineWidth = 1;

    const size = grid.size;
    const offX = (((grid.offsetX || 0) % size) + size) % size;
    const offY = (((grid.offsetY || 0) % size) + size) % size;

    if (grid.type === 'hex_pointy' || grid.type === 'hex_flat') {
      // Гексагональная сетка
      const radius = size / 2;
      const isPointy = grid.type === 'hex_pointy';

      const hexWidth = isPointy ? Math.sqrt(3) * radius : 2 * radius;
      const hexHeight = isPointy ? 2 * radius : Math.sqrt(3) * radius;

      const horizStep = isPointy ? hexWidth : 1.5 * radius;
      const vertStep = isPointy ? 1.5 * radius : hexHeight;

      const drawHex = (cx: number, cy: number) => {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * (isPointy ? i + 0.5 : i);
          const x = cx + radius * Math.cos(angle);
          const y = cy + radius * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      };

      for (let y = -size; y < height + size; y += vertStep) {
        const row = Math.floor(y / vertStep);
        const rowOffsetX = (row % 2) * (horizStep / 2);
        for (let x = -size; x < width + size; x += horizStep) {
          drawHex(x + rowOffsetX + offX, y + offY);
        }
      }
    } else {
      // Квадратная сетка (Square Grid)
      ctx.beginPath();

      // Вертикальные линии
      for (let x = offX; x <= width; x += size) {
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, height);
      }

      // Горизонтальные линии
      for (let y = offY; y <= height; y += size) {
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(width, y + 0.5);
      }

      ctx.stroke();
    }

    ctx.restore();
  }, [grid, width, height]);

  if (!grid.enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute top-0 left-0"
      style={{ width: `${width}px`, height: `${height}px` }}
    />
  );
});
