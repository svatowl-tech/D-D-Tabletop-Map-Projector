/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Встроенные легкие процедурные карты (Dungeon, Tavern, Forest)
 * для мгновенного старта и тестирования без необходимости искать сторонние файлы.
 */

export interface SampleMapDefinition {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  generateBlob: () => Promise<Blob>;
}

function createProceduralCanvas(width: number, height: number, drawFn: (ctx: CanvasRenderingContext2D) => void): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Не удалось создать контекст для карты'));
      return;
    }
    drawFn(ctx);
    canvas.toBlob((blob) => {
      // Освобождаем память холста
      canvas.width = 0;
      canvas.height = 0;
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Ошибка генерации Blob карты'));
      }
    }, 'image/jpeg', 0.85);
  });
}

export const SAMPLE_MAPS: SampleMapDefinition[] = [
  {
    id: 'dungeon_crypt',
    name: 'Склеп древних королей',
    description: 'Мрачное каменное подземелье с колоннами, саркофагами и тайными комнатами.',
    width: 1920,
    height: 1080,
    generateBlob: () => {
      return createProceduralCanvas(1920, 1080, (ctx) => {
        // Каменный пол
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(0, 0, 1920, 1080);

        // Плиточный узор
        const tileSize = 64;
        ctx.strokeStyle = '#292524';
        ctx.lineWidth = 2;
        for (let x = 0; x <= 1920; x += tileSize) {
          for (let y = 0; y <= 1080; y += tileSize) {
            const shade = 24 + ((x * y) % 15);
            ctx.fillStyle = `rgb(${shade}, ${shade - 2}, ${shade - 4})`;
            ctx.fillRect(x + 1, y + 1, tileSize - 2, tileSize - 2);
          }
        }

        // Стены комнат
        ctx.fillStyle = '#0c0a09';
        ctx.fillRect(0, 0, 1920, 40);
        ctx.fillRect(0, 1040, 1920, 40);
        ctx.fillRect(0, 0, 40, 1080);
        ctx.fillRect(1880, 0, 40, 1080);

        // Внутренние стены и коридоры
        ctx.fillRect(400, 40, 30, 700);
        ctx.fillRect(400, 850, 30, 200);
        ctx.fillRect(1100, 200, 30, 840);
        ctx.fillRect(400, 500, 700, 30);

        // Центральный зал с саркофагами
        ctx.fillStyle = '#44403c';
        ctx.strokeStyle = '#78716c';
        ctx.lineWidth = 3;
        
        // Саркофаги
        const sarcophagi = [
          { x: 650, y: 200, w: 120, h: 60 },
          { x: 850, y: 200, w: 120, h: 60 },
          { x: 750, y: 350, w: 140, h: 70 },
          { x: 1350, y: 400, w: 130, h: 65 },
          { x: 1550, y: 400, w: 130, h: 65 }
        ];

        sarcophagi.forEach((s) => {
          ctx.fillStyle = '#292524';
          ctx.fillRect(s.x, s.y, s.w, s.h);
          ctx.strokeRect(s.x, s.y, s.w, s.h);
          ctx.fillStyle = '#a8a29e';
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('⚰️', s.x + s.w / 2, s.y + s.h / 2 + 5);
        });

        // Колонны
        const pillars = [
          { x: 550, y: 150 }, { x: 950, y: 150 },
          { x: 550, y: 450 }, { x: 950, y: 450 },
          { x: 1300, y: 200 }, { x: 1700, y: 200 },
          { x: 1300, y: 800 }, { x: 1700, y: 800 }
        ];

        pillars.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 25, 0, Math.PI * 2);
          ctx.fillStyle = '#1c1917';
          ctx.fill();
          ctx.strokeStyle = '#d6d3d1';
          ctx.lineWidth = 3;
          ctx.stroke();
        });

        // Факелы со свечением
        const torches = [
          { x: 440, y: 100 }, { x: 440, y: 600 },
          { x: 1080, y: 300 }, { x: 1080, y: 800 }
        ];
        torches.forEach((t) => {
          const grad = ctx.createRadialGradient(t.x, t.y, 2, t.x, t.y, 100);
          grad.addColorStop(0, 'rgba(245, 158, 11, 0.4)');
          grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(t.x, t.y, 100, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ea580c';
          ctx.beginPath();
          ctx.arc(t.x, t.y, 6, 0, Math.PI * 2);
          ctx.fill();
        });
      });
    }
  },
  {
    id: 'cozy_tavern',
    name: 'Таверна «Пьяный Гоблин»',
    description: 'Теплая деревянная таверна с барной стойкой, столами, очагом и сценой барда.',
    width: 1920,
    height: 1080,
    generateBlob: () => {
      return createProceduralCanvas(1920, 1080, (ctx) => {
        // Деревянный дощатый пол
        ctx.fillStyle = '#3f220f';
        ctx.fillRect(0, 0, 1920, 1080);

        // Доски
        const plankHeight = 32;
        ctx.strokeStyle = '#271407';
        ctx.lineWidth = 2;
        for (let y = 0; y < 1080; y += plankHeight) {
          const woodTone = 50 + (y % 18);
          ctx.fillStyle = `rgb(${woodTone + 15}, ${woodTone}, ${Math.max(10, woodTone - 20)})`;
          ctx.fillRect(0, y, 1920, plankHeight - 2);
        }

        // Внешние стены сруба
        ctx.fillStyle = '#1c0d02';
        ctx.fillRect(0, 0, 1920, 40);
        ctx.fillRect(0, 1040, 1920, 40);
        ctx.fillRect(0, 0, 40, 1080);
        ctx.fillRect(1880, 0, 40, 1080);

        // Барная стойка
        ctx.fillStyle = '#5c3317';
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 4;
        ctx.fillRect(200, 200, 400, 60);
        ctx.strokeRect(200, 200, 400, 60);
        ctx.fillRect(540, 260, 60, 250);
        ctx.strokeRect(540, 260, 60, 250);

        // Полки с напитками за стойкой
        ctx.fillStyle = '#2b1608';
        ctx.fillRect(200, 80, 400, 70);

        // Очаг / камин
        ctx.fillStyle = '#78716c';
        ctx.fillRect(1750, 450, 120, 180);
        const fireGrad = ctx.createRadialGradient(1800, 540, 10, 1800, 540, 300);
        fireGrad.addColorStop(0, 'rgba(234, 88, 12, 0.5)');
        fireGrad.addColorStop(1, 'rgba(234, 88, 12, 0)');
        ctx.fillStyle = fireGrad;
        ctx.beginPath();
        ctx.arc(1800, 540, 300, 0, Math.PI * 2);
        ctx.fill();

        // Столы и стулья
        const tables = [
          { x: 900, y: 250, r: 55 },
          { x: 1300, y: 250, r: 55 },
          { x: 900, y: 600, r: 55 },
          { x: 1300, y: 600, r: 55 },
          { x: 900, y: 880, r: 65 },
          { x: 1400, y: 880, r: 65 }
        ];

        tables.forEach((tbl) => {
          // Стол
          ctx.beginPath();
          ctx.arc(tbl.x, tbl.y, tbl.r, 0, Math.PI * 2);
          ctx.fillStyle = '#6e3c1b';
          ctx.fill();
          ctx.strokeStyle = '#b45309';
          ctx.lineWidth = 3;
          ctx.stroke();

          // Стулья вокруг
          const chairDist = tbl.r + 25;
          const chairAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
          chairAngles.forEach((angle) => {
            const cx = tbl.x + Math.cos(angle) * chairDist;
            const cy = tbl.y + Math.sin(angle) * chairDist;
            ctx.beginPath();
            ctx.arc(cx, cy, 14, 0, Math.PI * 2);
            ctx.fillStyle = '#45230f';
            ctx.fill();
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 2;
            ctx.stroke();
          });
        });
      });
    }
  },
  {
    id: 'forest_clearing',
    name: 'Заколдованная поляна в лесу',
    description: 'Лесная опушка с каменным кругом друидов, ручьем и древними дубами.',
    width: 1920,
    height: 1080,
    generateBlob: () => {
      return createProceduralCanvas(1920, 1080, (ctx) => {
        // Трава
        ctx.fillStyle = '#14532d';
        ctx.fillRect(0, 0, 1920, 1080);

        // Ручей
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.moveTo(1200, 0);
        ctx.bezierCurveTo(1050, 400, 1400, 700, 1150, 1080);
        ctx.lineTo(1280, 1080);
        ctx.bezierCurveTo(1530, 700, 1180, 400, 1330, 0);
        ctx.closePath();
        ctx.fill();

        // Каменный мостик
        ctx.fillStyle = '#57534e';
        ctx.strokeStyle = '#a8a29e';
        ctx.lineWidth = 3;
        ctx.fillRect(1140, 500, 140, 80);
        ctx.strokeRect(1140, 500, 140, 80);

        // Круг друидических менгиров
        const circleX = 550;
        const circleY = 540;
        const circleR = 200;

        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI * 2) / 8;
          const mx = circleX + Math.cos(angle) * circleR;
          const my = circleY + Math.sin(angle) * circleR;

          ctx.save();
          ctx.translate(mx, my);
          ctx.rotate(angle);
          ctx.fillStyle = '#44403c';
          ctx.fillRect(-25, -15, 50, 30);
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 2;
          ctx.strokeRect(-25, -15, 50, 30);
          ctx.restore();
        }

        // Рунический алтарь в центре
        ctx.beginPath();
        ctx.arc(circleX, circleY, 50, 0, Math.PI * 2);
        ctx.fillStyle = '#292524';
        ctx.fill();
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Деревья (дубы)
        const trees = [
          { x: 120, y: 150, r: 80 }, { x: 300, y: 90, r: 70 },
          { x: 150, y: 900, r: 85 }, { x: 350, y: 980, r: 75 },
          { x: 1750, y: 180, r: 90 }, { x: 1650, y: 880, r: 95 }
        ];

        trees.forEach((t) => {
          ctx.beginPath();
          ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
          ctx.fillStyle = '#064e3b';
          ctx.fill();
          ctx.strokeStyle = '#047857';
          ctx.lineWidth = 4;
          ctx.stroke();
        });
      });
    }
  }
];
