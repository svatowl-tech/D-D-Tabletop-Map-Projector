/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * macOS 10.13 (High Sierra) & Legacy WebKit / Safari 11-13 Hardware Compatibility Layer.
 * Обеспечивает полифилы, вендорные префиксы и отказоустойчивые fallback-механизмы
 * для работы на старых процессорах (Core 2 Duo), 2 GB RAM и legacy GPU (GeForce 320M).
 */

// 1. Полифил globalThis (Safari < 12.1)
if (typeof globalThis === 'undefined') {
  (window as any).globalThis = window;
}

// 2. Полифил Web Audio API с префиксом webkit (Safari 11-13)
if (typeof window !== 'undefined') {
  if (!window.AudioContext && (window as any).webkitAudioContext) {
    (window as any).AudioContext = (window as any).webkitAudioContext;
  }
}

// 3. Полифил requestAnimationFrame / cancelAnimationFrame
if (typeof window !== 'undefined') {
  const vendors = ['webkit', 'moz'];
  for (let x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = (window as any)[vendors[x] + 'RequestAnimationFrame'];
    window.cancelAnimationFrame =
      (window as any)[vendors[x] + 'CancelAnimationFrame'] ||
      (window as any)[vendors[x] + 'CancelRequestAnimationFrame'];
  }

  if (!window.requestAnimationFrame) {
    let lastTime = 0;
    window.requestAnimationFrame = (callback: FrameRequestCallback): number => {
      const currTime = Date.now();
      const timeToCall = Math.max(0, 16 - (currTime - lastTime));
      const id = window.setTimeout(() => callback(currTime + timeToCall), timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };
  }

  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = (id: number): void => {
      clearTimeout(id);
    };
  }
}

// 4. Полифил String.prototype.replaceAll (Safari < 13.1)
if (typeof String.prototype.replaceAll === 'undefined') {
  String.prototype.replaceAll = function (search: string | RegExp, replacement: any): string {
    if (search instanceof RegExp) {
      if (!search.global) {
        throw new TypeError('replaceAll must be called with a global RegExp');
      }
      return this.replace(search, replacement);
    }
    return this.split(search).join(String(replacement));
  };
}

// 5. Полифил Array.prototype.flat (Safari < 12)
if (typeof (Array.prototype as any).flat === 'undefined') {
  (Array.prototype as any).flat = function (depth: number = 1): any[] {
    const flatten = (arr: any[], d: number): any[] => {
      return d > 0
        ? arr.reduce((acc, val) => acc.concat(Array.isArray(val) ? flatten(val, d - 1) : val), [])
        : arr.slice();
    };
    return flatten(this, depth);
  };
}

// 6. Кроссбраузерная работа с Fullscreen API (macOS Safari 11/12/13 uses webkit prefix)
export function isElementFullscreen(): boolean {
  if (typeof document === 'undefined') return false;
  const doc = document as any;
  return !!(
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement
  );
}

export function requestAppFullscreen(element: HTMLElement = document.documentElement): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const el = element as any;
      if (el.requestFullscreen) {
        const res = el.requestFullscreen();
        if (res && typeof res.then === 'function') {
          res.then(() => resolve(true)).catch(() => resolve(false));
          return;
        }
        resolve(true);
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
        resolve(true);
      } else if (el.mozRequestFullScreen) {
        el.mozRequestFullScreen();
        resolve(true);
      } else if (el.msRequestFullscreen) {
        el.msRequestFullscreen();
        resolve(true);
      } else {
        resolve(false);
      }
    } catch (err) {
      console.warn('[macOSCompatibility] Fullscreen request error:', err);
      resolve(false);
    }
  });
}

export function exitAppFullscreen(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const doc = document as any;
      if (doc.exitFullscreen) {
        const res = doc.exitFullscreen();
        if (res && typeof res.then === 'function') {
          res.then(() => resolve(true)).catch(() => resolve(false));
          return;
        }
        resolve(true);
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
        resolve(true);
      } else if (doc.mozCancelFullScreen) {
        doc.mozCancelFullScreen();
        resolve(true);
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen();
        resolve(true);
      } else {
        resolve(false);
      }
    } catch (err) {
      console.warn('[macOSCompatibility] Fullscreen exit error:', err);
      resolve(false);
    }
  });
}

export function toggleAppFullscreen(element: HTMLElement = document.documentElement): Promise<boolean> {
  if (isElementFullscreen()) {
    return exitAppFullscreen();
  } else {
    return requestAppFullscreen(element);
  }
}

// 7. Подписка на изменения полноэкранного режима с учетом webkitfullscreenchange
export function addFullscreenChangeListener(callback: (isFullscreen: boolean) => void): () => void {
  if (typeof document === 'undefined') return () => {};

  const handler = () => {
    callback(isElementFullscreen());
  };

  document.addEventListener('fullscreenchange', handler);
  document.addEventListener('webkitfullscreenchange', handler);
  document.addEventListener('mozfullscreenchange', handler);
  document.addEventListener('MSFullscreenChange', handler);

  return () => {
    document.removeEventListener('fullscreenchange', handler);
    document.removeEventListener('webkitfullscreenchange', handler);
    document.removeEventListener('mozfullscreenchange', handler);
    document.removeEventListener('MSFullscreenChange', handler);
  };
}

// 8. Безопасное хранилище (Safe Storage) для приватного режима Safari на macOS 10.13
const memoryStorageFallback: Record<string, string> = {};

export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return memoryStorageFallback[key] || null;
    }
  },
  setItem: (key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      memoryStorageFallback[key] = value;
      return false;
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      delete memoryStorageFallback[key];
    }
  }
};
