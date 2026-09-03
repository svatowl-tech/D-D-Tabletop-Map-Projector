/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Оверлей стихийных эффектов и динамических бедствий на карте:
 * - 🔥 Пожар / Огонь / Инферно / Угли (Fire Hazards)
 * - 💧 Затопление / Вода / Кислота / Магма / Слизь (Liquid / Flood Hazards)
 * - ☁️ Задымление / Отравляющий газ / Туман / Миазма (Gas & Smoke Hazards)
 * 
 * Особенности:
 * - Высокопроизводительный анимированный Canvas 2D рендерер с органическими частицами,
 *   волнами жидкостей, языками пламени, пузырями кислоты и клубящимися облаками дыма.
 * - Полная поддержка предпросмотра активного мазка мастера в реальном времени.
 * - Полная синхронизация с экраном игроков (Projector View).
 */

import React, { useRef, useEffect } from 'react';
import { ElementalHazardZone, StrokePoint } from '../types';

interface Props {
  width: number;
  height: number;
  hazards: ElementalHazardZone[];
  activeHazard?: ElementalHazardZone | null;
}

export const ElementalHazardOverlay: React.FC<Props> = ({
  width,
  height,
  hazards,
  activeHazard
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      ctx.clearRect(0, 0, width, height);

      const allHazards = activeHazard ? [...hazards, activeHazard] : hazards;
      if (allHazards.length === 0) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      // Отрисовка зон стихий
      for (const zone of allHazards) {
        if (!zone.points || zone.points.length === 0) continue;

        const speed = zone.speed || 1.0;
        const time = elapsed * speed;
        const radius = Math.max(10, zone.radius || 40);
        const baseOpacity = zone.opacity ?? 0.8;
        const color = zone.color || '#FF4500';
        const secColor = zone.secondaryColor || '#FFD700';

        ctx.save();

        if (zone.element === 'fire') {
          renderFireZone(ctx, zone.points, radius, color, secColor, baseOpacity, time, zone.subType);
        } else if (zone.element === 'water') {
          renderWaterZone(ctx, zone.points, radius, color, secColor, baseOpacity, time, zone.subType);
        } else if (zone.element === 'gas') {
          renderGasZone(ctx, zone.points, radius, color, secColor, baseOpacity, time, zone.subType);
        }

        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [width, height, hazards, activeHazard]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute top-0 left-0 z-25"
      style={{ width: `${width}px`, height: `${height}px` }}
    />
  );
};

/**
 * 1. Рендеринг зон огня, инферно и тлеющих углей
 */
function renderFireZone(
  ctx: CanvasRenderingContext2D,
  points: StrokePoint[],
  radius: number,
  color: string,
  secondaryColor: string,
  opacity: number,
  time: number,
  subType?: string
) {
  const isEmbers = subType === 'fire_embers';

  // Базовый тепловой ореол (Glow trail)
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = radius * 2;
  ctx.strokeStyle = color;
  ctx.globalAlpha = opacity * 0.45;
  ctx.shadowColor = color;
  ctx.shadowBlur = radius * 0.8;

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
  ctx.restore();

  // Основная масса пламени и языки огня
  const step = Math.max(12, radius * 0.4);
  const sampledPoints = samplePointsAlongPath(points, step);

  for (let i = 0; i < sampledPoints.length; i++) {
    const pt = sampledPoints[i];
    const seed = (pt.x * 12.9898 + pt.y * 78.233 + i * 37) % 100;
    const pulse = Math.sin(time * 4 + seed) * 0.15;
    const currentR = radius * (1 + pulse);

    // Внешнее пламя
    const grad = ctx.createRadialGradient(pt.x, pt.y, currentR * 0.15, pt.x, pt.y, currentR);
    grad.addColorStop(0, secondaryColor);
    grad.addColorStop(0.55, color);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.save();
    ctx.fillStyle = grad;
    ctx.globalAlpha = opacity * (isEmbers ? 0.6 : 0.85);
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, currentR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Языки пламени и летящие искры (если не угли)
    if (!isEmbers) {
      for (let s = 0; s < 3; s++) {
        const sparkPhase = (time * (1.5 + s * 0.3) + seed + s * 30) % 1;
        const sparkAngle = (seed + s * 120 + Math.sin(time + s) * 20) * (Math.PI / 180);
        const sparkDist = (0.3 + sparkPhase * 0.9) * radius;
        const sx = pt.x + Math.cos(sparkAngle) * sparkDist;
        const sy = pt.y + Math.sin(sparkAngle) * sparkDist - sparkPhase * radius * 0.8; // Тяга вверх

        const sparkR = (1 - sparkPhase) * 3.5 + 1;
        ctx.save();
        ctx.fillStyle = secondaryColor;
        ctx.globalAlpha = opacity * (1 - sparkPhase) * 0.9;
        ctx.shadowColor = secondaryColor;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(sx, sy, sparkR, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    } else {
      // Тлеющие точки для углей
      const emberFlicker = (Math.sin(time * 6 + seed * 2) + 1) / 2;
      ctx.save();
      ctx.fillStyle = secondaryColor;
      ctx.globalAlpha = opacity * (0.4 + emberFlicker * 0.6);
      ctx.beginPath();
      ctx.arc(pt.x + (seed % 20) - 10, pt.y + ((seed * 3) % 20) - 10, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

/**
 * 2. Рендеринг зон воды, затопления, кислоты, лавы и слизи
 */
function renderWaterZone(
  ctx: CanvasRenderingContext2D,
  points: StrokePoint[],
  radius: number,
  color: string,
  secondaryColor: string,
  opacity: number,
  time: number,
  subType?: string
) {
  const isMagma = subType === 'water_magma';
  const isAcid = subType === 'water_acid';

  // Базовый слой жидкости
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = radius * 2;
  ctx.strokeStyle = color;
  ctx.globalAlpha = opacity * 0.85;

  if (isMagma) {
    ctx.shadowColor = '#FF3300';
    ctx.shadowBlur = radius * 0.5;
  }

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
  ctx.restore();

  // Анимированные переливы ряби / каустика / пузыри
  const step = Math.max(16, radius * 0.45);
  const sampledPoints = samplePointsAlongPath(points, step);

  for (let i = 0; i < sampledPoints.length; i++) {
    const pt = sampledPoints[i];
    const seed = (pt.x * 19.34 + pt.y * 43.12 + i * 17) % 100;

    if (isAcid || isMagma) {
      // Бурлящие пузырьки
      const bubblePhase = (time * 1.8 + seed) % 1;
      const bubbleR = bubblePhase * (radius * 0.35);
      const bx = pt.x + Math.sin(time + seed) * (radius * 0.4);
      const by = pt.y + Math.cos(time + seed) * (radius * 0.4);

      ctx.save();
      ctx.strokeStyle = secondaryColor;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = opacity * (1 - bubblePhase) * 0.8;
      ctx.beginPath();
      ctx.arc(bx, by, bubbleR, 0, Math.PI * 2);
      ctx.stroke();

      if (isMagma) {
        ctx.fillStyle = secondaryColor;
        ctx.fill();
      }
      ctx.restore();
    } else {
      // Водная рябь и солнечные блики
      const waveOffset = Math.sin(time * 2.5 + seed + pt.x * 0.05) * (radius * 0.25);
      const waveOffset2 = Math.cos(time * 2.0 + seed + pt.y * 0.05) * (radius * 0.25);

      ctx.save();
      ctx.strokeStyle = secondaryColor;
      ctx.lineWidth = 2;
      ctx.globalAlpha = opacity * 0.45;
      ctx.beginPath();
      ctx.ellipse(
        pt.x + waveOffset,
        pt.y + waveOffset2,
        radius * 0.45,
        radius * 0.2,
        Math.PI / 6,
        0,
        Math.PI * 2
      );
      ctx.stroke();
      ctx.restore();
    }
  }
}

/**
 * 3. Рендеринг зон газа, задымления, тумана и ядовитых паров
 */
function renderGasZone(
  ctx: CanvasRenderingContext2D,
  points: StrokePoint[],
  radius: number,
  color: string,
  secondaryColor: string,
  opacity: number,
  time: number,
  _subType?: string
) {
  // Клубящиеся объемные облака дыма
  const step = Math.max(18, radius * 0.5);
  const sampledPoints = samplePointsAlongPath(points, step);

  for (let i = 0; i < sampledPoints.length; i++) {
    const pt = sampledPoints[i];
    const seed = (pt.x * 37.11 + pt.y * 61.37 + i * 29) % 100;

    // 3 накладывающихся клубящихся круга со смещением от ветра/времени
    for (let puff = 0; puff < 3; puff++) {
      const angle = (puff * 120 + seed + time * 20) * (Math.PI / 180);
      const driftDist = (Math.sin(time * 0.8 + seed + puff) * 0.4 + 0.5) * (radius * 0.6);
      const cx = pt.x + Math.cos(angle) * driftDist;
      const cy = pt.y + Math.sin(angle) * driftDist;
      const puffR = radius * (0.8 + Math.sin(time * 1.2 + seed + puff) * 0.25);

      const grad = ctx.createRadialGradient(cx, cy, puffR * 0.1, cx, cy, puffR);
      grad.addColorStop(0, puff % 2 === 0 ? color : secondaryColor);
      grad.addColorStop(0.65, color);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.save();
      ctx.fillStyle = grad;
      ctx.globalAlpha = opacity * 0.45;
      ctx.beginPath();
      ctx.arc(cx, cy, puffR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

/**
 * Вспомогательная функция: сэмплирование точек вдоль пути мазка с заданным шагом
 */
function samplePointsAlongPath(points: StrokePoint[], stepPx: number): StrokePoint[] {
  if (points.length === 0) return [];
  if (points.length === 1) return [points[0]];

  const result: StrokePoint[] = [points[0]];
  let lastPoint = points[0];

  for (let i = 1; i < points.length; i++) {
    const current = points[i];
    const dx = current.x - lastPoint.x;
    const dy = current.y - lastPoint.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist >= stepPx) {
      const numSteps = Math.floor(dist / stepPx);
      for (let s = 1; s <= numSteps; s++) {
        const t = s / numSteps;
        result.push({
          x: lastPoint.x + dx * t,
          y: lastPoint.y + dy * t
        });
      }
      lastPoint = current;
    }
  }

  return result;
}
