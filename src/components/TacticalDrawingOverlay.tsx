/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Оверлей тактического рисования, шаблонов заклинаний (Spell AoE) и линейки-дальномера.
 */

import React, { useRef, useEffect } from 'react';
import { TacticalDrawing, SpellTemplate, RulerMeasurement } from '../types';

interface TacticalDrawingOverlayProps {
  width: number;
  height: number;
  drawings: TacticalDrawing[];
  activeDrawing?: TacticalDrawing | null;
  spellTemplate?: SpellTemplate | null;
  ruler?: RulerMeasurement | null;
  gridSize?: number;
}

export const TacticalDrawingOverlay: React.FC<TacticalDrawingOverlayProps> = React.memo(({
  width,
  height,
  drawings,
  activeDrawing,
  spellTemplate,
  ruler,
  gridSize = 50
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

    ctx.clearRect(0, 0, width, height);

    // 1. Отрисовка сохраненных тактических рисунков
    const allDrawings = activeDrawing ? [...drawings, activeDrawing] : drawings;

    allDrawings.forEach((d) => {
      if (!d.points || d.points.length === 0) return;

      ctx.save();
      ctx.strokeStyle = d.color;
      ctx.fillStyle = d.color;
      ctx.lineWidth = d.width;
      ctx.globalAlpha = d.type === 'highlighter' ? 0.35 : d.opacity ?? 0.9;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (d.type === 'freehand' || d.type === 'highlighter') {
        ctx.beginPath();
        ctx.moveTo(d.points[0].x, d.points[0].y);
        for (let i = 1; i < d.points.length; i++) {
          ctx.lineTo(d.points[i].x, d.points[i].y);
        }
        ctx.stroke();
      } else if (d.type === 'arrow' && d.points.length >= 2) {
        // Тактическая стрелка
        const p1 = d.points[0];
        const p2 = d.points[d.points.length - 1];

        const headlen = 16;
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // Наконечник стрелки
        ctx.beginPath();
        ctx.moveTo(p2.x, p2.y);
        ctx.lineTo(p2.x - headlen * Math.cos(angle - Math.PI / 6), p2.y - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(p2.x - headlen * Math.cos(angle + Math.PI / 6), p2.y - headlen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    });

    // 2. Отрисовка шаблонов заклинаний (Spell AoE Templates)
    if (spellTemplate) {
      const { shape, sizeFeet, originX, originY, angleDeg, color } = spellTemplate;
      const radiusPx = (sizeFeet / 5) * gridSize;

      ctx.save();
      ctx.fillStyle = color || 'rgba(242, 125, 38, 0.3)';
      ctx.strokeStyle = color || '#F27D26';
      ctx.lineWidth = 2.5;

      const angleRad = (angleDeg * Math.PI) / 180;

      if (shape === 'sphere') {
        // Круговая область (Fireball, Darkness)
        ctx.beginPath();
        ctx.arc(originX, originY, radiusPx, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Текст радиуса
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(`R: ${sizeFeet} ft.`, originX - 25, originY - radiusPx - 8);
      } else if (shape === 'cone') {
        // Конус 53.13 градуса (D&D 5e cone angle)
        const halfAngle = Math.PI / 6; // 30 deg each side

        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.arc(originX, originY, radiusPx, angleRad - halfAngle, angleRad + halfAngle);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(`CONE ${sizeFeet} ft.`, originX + Math.cos(angleRad) * (radiusPx + 15), originY + Math.sin(angleRad) * (radiusPx + 15));
      } else if (shape === 'line') {
        // Линия 5 ft шириной (Lightning Bolt)
        const lineLenPx = (sizeFeet / 5) * gridSize;
        const halfWidth = gridSize / 2;

        ctx.translate(originX, originY);
        ctx.rotate(angleRad);

        ctx.beginPath();
        ctx.rect(0, -halfWidth, lineLenPx, gridSize);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(`LINE ${sizeFeet} ft.`, lineLenPx / 2 - 30, -halfWidth - 8);
      } else if (shape === 'cube') {
        // Куб
        const sidePx = (sizeFeet / 5) * gridSize;
        ctx.beginPath();
        ctx.rect(originX - sidePx / 2, originY - sidePx / 2, sidePx, sidePx);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(`CUBE ${sizeFeet}x${sizeFeet} ft.`, originX - 45, originY - sidePx / 2 - 8);
      }

      ctx.restore();
    }

    // 3. Отрисовка линейки-дальномера (Ruler & Rangefinder)
    if (ruler) {
      const { startX, startY, currentX, currentY, distanceFeet, distanceCells, mode, color } = ruler;

      ctx.save();
      ctx.strokeStyle = color || '#00FF00';
      ctx.fillStyle = color || '#00FF00';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);

      // Линия измерения
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(currentX, currentY);
      ctx.stroke();

      // Точки начала и конца
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(startX, startY, 4, 0, Math.PI * 2);
      ctx.arc(currentX, currentY, 5, 0, Math.PI * 2);
      ctx.fill();

      // Плавающий бейдж с дистанцией
      const midX = (startX + currentX) / 2;
      const midY = (startY + currentY) / 2;

      const label = `${distanceFeet.toFixed(0)} ft (${distanceCells.toFixed(1)} sq) [${mode.toUpperCase()}]`;

      ctx.font = 'bold 12px monospace';
      const textMetrics = ctx.measureText(label);
      const bgW = textMetrics.width + 16;
      const bgH = 22;

      ctx.fillStyle = 'rgba(10, 10, 10, 0.9)';
      ctx.strokeStyle = color || '#00FF00';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(midX - bgW / 2, midY - bgH / 2, bgW, bgH, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(label, midX - bgW / 2 + 8, midY + 4);

      ctx.restore();
    }
  }, [width, height, drawings, activeDrawing, spellTemplate, ruler, gridSize]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute top-0 left-0 z-28"
      style={{ width: `${width}px`, height: `${height}px` }}
    />
  );
});
