/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Встроенные векторные и процедурные оверлеи/тайлы (Sample Overlays)
 * для демонстрации и использования функции наложения нескольких картинок.
 */

export interface SampleOverlayDefinition {
  id: string;
  name: string;
  category: 'tile' | 'prop' | 'effect' | 'token';
  description: string;
  width: number;
  height: number;
  generateBlob: () => Promise<Blob>;
}

export const SAMPLE_OVERLAYS: SampleOverlayDefinition[] = [
  {
    id: 'secret_room_tile',
    name: 'Каменная тайная комната (Тайл)',
    category: 'tile',
    description: 'Накладной фрагмент подземелья 400x300px с каменной кладкой и дверью',
    width: 400,
    height: 300,
    generateBlob: () => {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 300;
      const ctx = canvas.getContext('2d')!;

      // Каменные плиты
      ctx.fillStyle = '#22252A';
      ctx.fillRect(0, 0, 400, 300);

      // Сетка каменной кладки
      ctx.strokeStyle = '#15171C';
      ctx.lineWidth = 3;
      const tileSize = 50;
      for (let x = 0; x <= 400; x += tileSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 300);
        ctx.stroke();
      }
      for (let y = 0; y <= 300; y += tileSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(400, y);
        ctx.stroke();
      }

      // Стены по периметру
      ctx.strokeStyle = '#5A3825';
      ctx.lineWidth = 8;
      ctx.strokeRect(4, 4, 392, 292);

      // Центральный узор
      ctx.strokeStyle = '#F27D26';
      ctx.lineWidth = 2;
      ctx.strokeRect(100, 75, 200, 150);

      ctx.fillStyle = '#F27D26';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SECRET VAULT ROOM', 200, 155);

      return new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/png');
      });
    }
  },
  {
    id: 'magic_circle_overlay',
    name: 'Магический круг призыва',
    category: 'effect',
    description: 'Светящаяся руническая печать с прозрачным фоном',
    width: 300,
    height: 300,
    generateBlob: () => {
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d')!;

      // Прозрачный фон
      ctx.clearRect(0, 0, 300, 300);

      const cx = 150;
      const cy = 150;

      // Свечение
      const grad = ctx.createRadialGradient(cx, cy, 30, cx, cy, 140);
      grad.addColorStop(0, 'rgba(242, 125, 38, 0.4)');
      grad.addColorStop(0.7, 'rgba(242, 125, 38, 0.15)');
      grad.addColorStop(1, 'rgba(242, 125, 38, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, 140, 0, Math.PI * 2);
      ctx.fill();

      // Окружности
      ctx.strokeStyle = '#F27D26';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, 130, 0, Math.PI * 2);
      ctx.arc(cx, cy, 110, 0, Math.PI * 2);
      ctx.arc(cx, cy, 60, 0, Math.PI * 2);
      ctx.stroke();

      // Пентаграмма / Звезда
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const x = cx + Math.cos(angle) * 110;
        const y = cy + Math.sin(angle) * 110;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();

      return new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/png');
      });
    }
  },
  {
    id: 'treasure_chest_prop',
    name: 'Золотой сундук с сокровищами',
    category: 'prop',
    description: 'Интерактивный маркер сундука для размещения на карте',
    width: 120,
    height: 100,
    generateBlob: () => {
      const canvas = document.createElement('canvas');
      canvas.width = 120;
      canvas.height = 100;
      const ctx = canvas.getContext('2d')!;

      ctx.clearRect(0, 0, 120, 100);

      // Тень
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.ellipse(60, 85, 45, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // Корпус сундука
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(20, 40, 80, 45);

      // Крышка
      ctx.fillStyle = '#A0522D';
      ctx.beginPath();
      ctx.arc(60, 40, 40, Math.PI, 0);
      ctx.fill();

      // Золотая оковка
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(20, 36, 80, 6);
      ctx.fillRect(35, 15, 8, 70);
      ctx.fillRect(77, 15, 8, 70);

      // Замок
      ctx.fillStyle = '#FFF8DC';
      ctx.fillRect(54, 38, 12, 16);
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(60, 44, 2, 0, Math.PI * 2);
      ctx.fill();

      return new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/png');
      });
    }
  },
  {
    id: 'dragon_boss_token',
    name: 'Токен Босса: Древний Дракон',
    category: 'token',
    description: 'Круглый тактический токен с золотой рамкой 150x150px',
    width: 150,
    height: 150,
    generateBlob: () => {
      const canvas = document.createElement('canvas');
      canvas.width = 150;
      canvas.height = 150;
      const ctx = canvas.getContext('2d')!;

      ctx.clearRect(0, 0, 150, 150);

      // Тень
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.arc(75, 78, 68, 0, Math.PI * 2);
      ctx.fill();

      // Фон токена
      ctx.fillStyle = '#7A1C1C';
      ctx.beginPath();
      ctx.arc(75, 75, 65, 0, Math.PI * 2);
      ctx.fill();

      // Золотая рамка
      ctx.strokeStyle = '#F27D26';
      ctx.lineWidth = 6;
      ctx.stroke();

      // Драконья эмблема
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 36px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🐉', 75, 68);

      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('RED DRAGON', 75, 115);

      return new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/png');
      });
    }
  }
];
