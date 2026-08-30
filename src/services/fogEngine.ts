/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Движок Тумана Войны (Fog of War) на базе HTML5 Canvas 2D.
 * 
 * Особенности:
 * - Внеэкранный масочный буфер в нативном разрешении карты.
 * - Поддержка кисти, прямоугольных зон (Rectangle Area) и круговых зон (Circle Area).
 * - Инвертирование маски (Invert Fog).
 * - Стили отображения: Classic Black, Mountain White Mist, Toxic Green Vapor, Crypt Grave Darkness.
 * - Быстрый экспорт/импорт маски через Data URL и бинарный буфер.
 */

import { DrawStrokePayload, FogTextureStyle } from '../types';

export class FogEngine {
  private maskCanvas: HTMLCanvasElement;
  private maskCtx: CanvasRenderingContext2D;
  private width: number = 1920;
  private height: number = 1080;
  private currentStyle: FogTextureStyle = 'classic_black';

  constructor() {
    this.maskCanvas = document.createElement('canvas');
    this.maskCanvas.width = this.width;
    this.maskCanvas.height = this.height;
    
    const ctx = this.maskCanvas.getContext('2d', { willReadFrequently: false });
    if (!ctx) {
      throw new Error('Не удалось получить 2D контекст для FogEngine');
    }
    this.maskCtx = ctx;
    
    // По умолчанию туман войны выключен (карта полностью открыта)
    this.clearAll();
  }

  public setStyle(style: FogTextureStyle): void {
    this.currentStyle = style;
  }

  public getStyle(): FogTextureStyle {
    return this.currentStyle;
  }

  /**
   * Изменение размера холста под габариты текущей карты
   */
  public resize(width: number, height: number, preserveFog: boolean = false): void {
    if (width <= 0 || height <= 0) return;
    if (this.width === width && this.height === height) return;

    if (preserveFog) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = this.width;
      tempCanvas.height = this.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.drawImage(this.maskCanvas, 0, 0);
      }

      this.width = width;
      this.height = height;
      this.maskCanvas.width = width;
      this.maskCanvas.height = height;

      this.maskCtx.fillStyle = '#000000';
      this.maskCtx.fillRect(0, 0, width, height);
      if (tempCtx) {
        this.maskCtx.drawImage(tempCanvas, 0, 0, width, height);
      }
      
      tempCanvas.width = 0;
      tempCanvas.height = 0;
    } else {
      this.width = width;
      this.height = height;
      this.maskCanvas.width = width;
      this.maskCanvas.height = height;
      this.clearAll();
    }
  }

  /**
   * Скрыть всё: заливает всю площадь 100% черным туманом
   */
  public fillAll(): void {
    this.maskCtx.globalCompositeOperation = 'source-over';
    this.maskCtx.fillStyle = '#000000';
    this.maskCtx.fillRect(0, 0, this.width, this.height);
  }

  /**
   * Открыть всё: полностью очищает туман войны
   */
  public clearAll(): void {
    this.maskCtx.clearRect(0, 0, this.width, this.height);
  }

  /**
   * Инвертирование тумана (открытые зоны становятся закрытыми, и наоборот)
   */
  public invert(): void {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.width;
    tempCanvas.height = this.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Копируем текущую маску
    tempCtx.drawImage(this.maskCanvas, 0, 0);

    // Заливаем базовый холст черным
    this.maskCtx.globalCompositeOperation = 'source-over';
    this.maskCtx.fillStyle = '#000000';
    this.maskCtx.fillRect(0, 0, this.width, this.height);

    // Вычитаем инвертированную маску
    this.maskCtx.globalCompositeOperation = 'destination-out';
    this.maskCtx.drawImage(tempCanvas, 0, 0);

    tempCanvas.width = 0;
    tempCanvas.height = 0;
  }

  /**
   * Применение мазка кистью или геометрической зоны
   */
  public applyStroke(stroke: DrawStrokePayload): void {
    const { mode, shape, radius, points, rect } = stroke;

    this.maskCtx.save();
    
    if (mode === 'reveal') {
      this.maskCtx.globalCompositeOperation = 'destination-out';
      this.maskCtx.strokeStyle = 'rgba(0, 0, 0, 1)';
      this.maskCtx.fillStyle = 'rgba(0, 0, 0, 1)';
    } else {
      this.maskCtx.globalCompositeOperation = 'source-over';
      this.maskCtx.strokeStyle = '#000000';
      this.maskCtx.fillStyle = '#000000';
    }

    if (shape === 'rect' && rect) {
      // Прямоугольная область раскрытия / сокрытия
      this.maskCtx.fillRect(rect.x, rect.y, rect.width, rect.height);
      this.maskCtx.restore();
      return;
    }

    if (shape === 'circle' && points && points.length > 0) {
      // Круговая зона
      const p = points[0];
      this.maskCtx.beginPath();
      this.maskCtx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      this.maskCtx.fill();
      this.maskCtx.restore();
      return;
    }

    // Свободная кисть
    if (points && points.length > 0) {
      this.maskCtx.lineWidth = radius * 2;
      this.maskCtx.lineCap = 'round';
      this.maskCtx.lineJoin = 'round';

      if (points.length === 1) {
        this.maskCtx.beginPath();
        this.maskCtx.arc(points[0].x, points[0].y, radius, 0, Math.PI * 2);
        this.maskCtx.fill();
      } else {
        this.maskCtx.beginPath();
        this.maskCtx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          this.maskCtx.lineTo(points[i].x, points[i].y);
        }
        this.maskCtx.stroke();
      }
    }

    this.maskCtx.restore();
  }

  /**
   * Отрисовка маски тумана на экранный Canvas с выбранным стилем
   */
  public renderToCanvas(
    targetCtx: CanvasRenderingContext2D,
    isMaster: boolean,
    masterOpacity: number = 0.55,
    style: FogTextureStyle = this.currentStyle
  ): void {
    const targetWidth = targetCtx.canvas.width;
    const targetHeight = targetCtx.canvas.height;

    targetCtx.clearRect(0, 0, targetWidth, targetHeight);
    targetCtx.save();

    if (isMaster) {
      targetCtx.globalAlpha = masterOpacity;
    } else {
      targetCtx.globalAlpha = 1.0;
    }

    // Рендеринг базового слоя маски
    targetCtx.drawImage(this.maskCanvas, 0, 0, targetWidth, targetHeight);

    // Стилизация текстур (Mountain Mist, Toxic Vapor, Crypt)
    if (style !== 'classic_black') {
      targetCtx.save();
      targetCtx.globalCompositeOperation = 'source-in';

      if (style === 'mountain_mist') {
        targetCtx.fillStyle = isMaster ? 'rgba(230, 240, 255, 0.95)' : 'rgba(240, 245, 255, 1.0)';
        targetCtx.fillRect(0, 0, targetWidth, targetHeight);
      } else if (style === 'toxic_vapor') {
        targetCtx.fillStyle = isMaster ? 'rgba(10, 45, 20, 0.95)' : '#072410';
        targetCtx.fillRect(0, 0, targetWidth, targetHeight);
      } else if (style === 'crypt_darkness') {
        targetCtx.fillStyle = isMaster ? 'rgba(25, 15, 35, 0.95)' : '#12081C';
        targetCtx.fillRect(0, 0, targetWidth, targetHeight);
      }
      targetCtx.restore();
    }

    targetCtx.restore();
  }

  public getMaskDataUrl(): string {
    return this.maskCanvas.toDataURL('image/png');
  }

  public loadFromDataUrl(dataUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.maskCtx.clearRect(0, 0, this.width, this.height);
        this.maskCtx.globalCompositeOperation = 'source-over';
        this.maskCtx.drawImage(img, 0, 0, this.width, this.height);
        resolve();
      };
      img.onerror = (err) => reject(err);
      img.src = dataUrl;
    });
  }

  public getDimensions(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  public destroy(): void {
    this.maskCanvas.width = 0;
    this.maskCanvas.height = 0;
  }
}
