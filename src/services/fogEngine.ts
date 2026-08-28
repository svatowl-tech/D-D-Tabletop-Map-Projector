/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Движок Тумана Войны (Fog of War) на базе HTML5 Canvas 2D.
 * 
 * Особенности для низкопроизводительных систем:
 * - Использует внеэкранный буфер (Offscreen Mask Canvas) в нативном разрешении карты.
 * - Применение аппаратного сглаживания и 'destination-out' для мгновенного стирания тумана.
 * - Оптимизированные непрерывные мазки кисти с lineCap='round' без лишних перерисовок.
 * - Полупрозрачный рендер (alpha = 0.55) для экрана мастера и непрозрачный (alpha = 1.0) для экрана игроков.
 */

import { DrawStrokePayload, StrokePoint } from '../types';

export class FogEngine {
  private maskCanvas: HTMLCanvasElement;
  private maskCtx: CanvasRenderingContext2D;
  private width: number = 1920;
  private height: number = 1080;

  constructor() {
    this.maskCanvas = document.createElement('canvas');
    this.maskCanvas.width = this.width;
    this.maskCanvas.height = this.height;
    
    const ctx = this.maskCanvas.getContext('2d', { willReadFrequently: false });
    if (!ctx) {
      throw new Error('Не удалось получить 2D контекст для FogEngine');
    }
    this.maskCtx = ctx;
    
    // По умолчанию карта полностью скрыта туманом
    this.fillAll();
  }

  /**
   * Изменение размера холста под точные габариты текущей карты
   */
  public resize(width: number, height: number, preserveFog: boolean = false): void {
    if (width <= 0 || height <= 0) return;
    if (this.width === width && this.height === height) return;

    if (preserveFog) {
      // Сохраняем предыдущий рисунок тумана при масштабировании
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

      // Заливаем новый размер черным и проецируем старый туман
      this.maskCtx.fillStyle = '#000000';
      this.maskCtx.fillRect(0, 0, width, height);
      if (tempCtx) {
        this.maskCtx.drawImage(tempCanvas, 0, 0, width, height);
      }
      
      // Очищаем временный холст
      tempCanvas.width = 0;
      tempCanvas.height = 0;
    } else {
      this.width = width;
      this.height = height;
      this.maskCanvas.width = width;
      this.maskCanvas.height = height;
      this.fillAll();
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
   * Нанесение непрерывного мазка кистью (открытие или сокрытие зоны)
   */
  public applyStroke(stroke: DrawStrokePayload): void {
    const { mode, radius, points } = stroke;
    if (!points || points.length === 0) return;

    this.maskCtx.save();
    
    if (mode === 'reveal') {
      // Режим ластика/открытия: стирает черный цвет, делая пиксели прозрачными
      this.maskCtx.globalCompositeOperation = 'destination-out';
      this.maskCtx.strokeStyle = 'rgba(0, 0, 0, 1)';
      this.maskCtx.fillStyle = 'rgba(0, 0, 0, 1)';
    } else {
      // Режим сокрытия: наносит черный непрозрачный туман
      this.maskCtx.globalCompositeOperation = 'source-over';
      this.maskCtx.strokeStyle = '#000000';
      this.maskCtx.fillStyle = '#000000';
    }

    this.maskCtx.lineWidth = radius * 2;
    this.maskCtx.lineCap = 'round';
    this.maskCtx.lineJoin = 'round';

    if (points.length === 1) {
      // Одиночный клик - рисуем окружность
      this.maskCtx.beginPath();
      this.maskCtx.arc(points[0].x, points[0].y, radius, 0, Math.PI * 2);
      this.maskCtx.fill();
    } else {
      // Непрерывная линия
      this.maskCtx.beginPath();
      this.maskCtx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        this.maskCtx.lineTo(points[i].x, points[i].y);
      }
      this.maskCtx.stroke();
    }

    this.maskCtx.restore();
  }

  /**
   * Отрисовка маски тумана на целевой отображаемый экранный Canvas
   * @param targetCtx Контекст отображаемого холста
   * @param isMaster Флаг: true - полупрозрачный для мастера, false - 100% непрозрачный для проектора
   * @param masterOpacity Настраиваемая прозрачность тумана для мастера (0.1 - 0.9)
   */
  public renderToCanvas(
    targetCtx: CanvasRenderingContext2D,
    isMaster: boolean,
    masterOpacity: number = 0.55
  ): void {
    const targetWidth = targetCtx.canvas.width;
    const targetHeight = targetCtx.canvas.height;

    targetCtx.clearRect(0, 0, targetWidth, targetHeight);
    targetCtx.save();

    if (isMaster) {
      // В окне мастера туман полупрозрачен, чтобы видеть локации и монстров
      targetCtx.globalAlpha = masterOpacity;
    } else {
      // В окне игроков туман 100% черный и непроницаемый
      targetCtx.globalAlpha = 1.0;
    }

    targetCtx.drawImage(this.maskCanvas, 0, 0, targetWidth, targetHeight);
    targetCtx.restore();
  }

  /**
   * Экспорт маски в Base64 Data URL для первоначальной синхронизации
   */
  public getMaskDataUrl(): string {
    return this.maskCanvas.toDataURL('image/png');
  }

  /**
   * Загрузка готовой маски из Data URL
   */
  public loadFromDataUrl(dataUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.maskCtx.clearRect(0, 0, this.width, this.height);
        this.maskCtx.globalCompositeOperation = 'source-over';
        this.maskCtx.drawImage(img, 0, 0, this.width, this.height);
        resolve();
      };
      img.onerror = (err) => {
        reject(err);
      };
      img.src = dataUrl;
    });
  }

  /**
   * Получение габаритов маски
   */
  public getDimensions(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  /**
   * Очистка памяти
   */
  public destroy(): void {
    this.maskCanvas.width = 0;
    this.maskCanvas.height = 0;
  }
}
