/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * macOS 10.13 (High Sierra) & Legacy WebKit / Safari 11-13.1 Hardware Compatibility Layer.
 * Обеспечивает полную совместимость: полифилы ES2018-ES2022, вендорные префиксы WebKit,
 * поддержку flexbox gap, кросс-оконный postMessage и отказоустойчивые fallback-механизмы
 * для работы на старых процессорах (Core 2 Duo / i3 / i5), 2 GB RAM и legacy GPU (GeForce 320M / Intel HD).
 */

// 1. Полифил globalThis (Safari < 12.1)
if (typeof globalThis === 'undefined') {
  if (typeof window !== 'undefined') {
    (window as any).globalThis = window;
  } else if (typeof global !== 'undefined') {
    (global as any).globalThis = global;
  } else if (typeof self !== 'undefined') {
    (self as any).globalThis = self;
  }
}

// 2. Полифил Array.prototype.at и String.prototype.at (Safari < 15.4)
if (!Array.prototype.at) {
  Array.prototype.at = function (index: number) {
    const n = Math.trunc(index) || 0;
    const len = this.length;
    const k = n >= 0 ? n : len + n;
    if (k < 0 || k >= len) return undefined;
    return this[k];
  };
}

if (!String.prototype.at) {
  String.prototype.at = function (index: number) {
    const n = Math.trunc(index) || 0;
    const len = this.length;
    const k = n >= 0 ? n : len + n;
    if (k < 0 || k >= len) return '';
    return this.charAt(k);
  };
}

// 3. Полифил Object.hasOwn (Safari < 15.4)
if (!Object.hasOwn) {
  Object.hasOwn = function (object: object, property: PropertyKey): boolean {
    if (object == null) {
      throw new TypeError('Cannot convert undefined or null to object');
    }
    return Object.prototype.hasOwnProperty.call(object, property);
  };
}

// 4. Полифил structuredClone (Safari < 15.4)
if (typeof window !== 'undefined' && typeof (window as any).structuredClone !== 'function') {
  (window as any).structuredClone = function <T>(value: T): T {
    if (value === undefined) return undefined as any;
    return JSON.parse(JSON.stringify(value));
  };
  if (typeof globalThis !== 'undefined') {
    (globalThis as any).structuredClone = (window as any).structuredClone;
  }
}

// 5. Полифил crypto.randomUUID (Safari < 15.4)
if (typeof window !== 'undefined' && window.crypto) {
  if (!(window.crypto as any).randomUUID) {
    (window.crypto as any).randomUUID = function (): string {
      return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c: any) =>
        (c ^ (window.crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
      );
    };
  }
}

// 6. Полифил Promise.allSettled (Safari < 13.1)
if (!Promise.allSettled) {
  Promise.allSettled = function <T>(promises: Iterable<Promise<T> | T>): Promise<PromiseSettledResult<T>[]> {
    return Promise.all(
      Array.from(promises).map((p) =>
        Promise.resolve(p).then(
          (value) => ({ status: 'fulfilled' as const, value }),
          (reason) => ({ status: 'rejected' as const, reason })
        )
      )
    );
  };
}

// 7. Полифил queueMicrotask (Safari < 12.1)
if (typeof window !== 'undefined' && typeof window.queueMicrotask !== 'function') {
  window.queueMicrotask = function (callback: VoidFunction): void {
    Promise.resolve()
      .then(callback)
      .catch((err) => {
        setTimeout(() => {
          throw err;
        }, 0);
      });
  };
}

// 8. Безопасный полифил ResizeObserver (Safari < 13.1)
if (typeof window !== 'undefined' && typeof (window as any).ResizeObserver === 'undefined') {
  (window as any).ResizeObserver = class {
    private callback: Function;
    private targets: Element[] = [];
    private listener: () => void;

    constructor(callback: Function) {
      this.callback = callback;
      this.listener = () => {
        const entries = this.targets.map((el) => ({
          target: el,
          contentRect: el.getBoundingClientRect()
        }));
        this.callback(entries, this);
      };
      window.addEventListener('resize', this.listener);
    }

    observe(target: Element) {
      if (!this.targets.includes(target)) {
        this.targets.push(target);
      }
      this.callback([{ target, contentRect: target.getBoundingClientRect() }], this);
    }

    unobserve(target: Element) {
      this.targets = this.targets.filter((t) => t !== target);
    }

    disconnect() {
      this.targets = [];
      window.removeEventListener('resize', this.listener);
    }
  };
}

// 9. Полифил Web Audio API с префиксом webkit (Safari 11-13)
if (typeof window !== 'undefined') {
  if (!window.AudioContext && (window as any).webkitAudioContext) {
    (window as any).AudioContext = (window as any).webkitAudioContext;
  }
}

// 10. Полифил requestAnimationFrame / cancelAnimationFrame
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

// 11. Полифил String.prototype.replaceAll (Safari < 13.1)
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

// 12. Полифил Array.prototype.flat и flatMap (Safari < 12)
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

if (typeof (Array.prototype as any).flatMap === 'undefined') {
  (Array.prototype as any).flatMap = function (callback: any, thisArg?: any) {
    return (this.map(callback, thisArg) as any).flat(1);
  };
}

// 13. Детекция и исправление отсутствия flexbox gap в Safari 11-13
if (typeof document !== 'undefined') {
  try {
    const flex = document.createElement('div');
    flex.style.display = 'flex';
    flex.style.flexDirection = 'column';
    flex.style.rowGap = '1px';
    flex.appendChild(document.createElement('div'));
    flex.appendChild(document.createElement('div'));
    (document.body || document.documentElement).appendChild(flex);
    const isSupported = flex.scrollHeight === 1;
    if (flex.parentNode) {
      flex.parentNode.removeChild(flex);
    }
    if (!isSupported) {
      document.documentElement.classList.add('no-flexbox-gap');
    }
  } catch (e) {
    // Безопасный игнор в средах без DOM
  }
}

// 14. Кроссбраузерная работа с Fullscreen API (macOS Safari 11/12/13 использует webkit prefix)
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

// 15. Подписка на изменения полноэкранного режима с учетом webkitfullscreenchange
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

// 16. Безопасное хранилище (Safe Storage) для приватного режима Safari и file:// на macOS 10.13
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

