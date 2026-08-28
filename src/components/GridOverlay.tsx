/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Компонент легковесной аппаратной сетки (Grid Overlay)
 * Использует CSS background gradient без накладных расходов canvas.
 */

import React from 'react';
import { GridConfig } from '../types';

interface GridOverlayProps {
  grid: GridConfig;
  width: number;
  height: number;
}

export const GridOverlay: React.FC<GridOverlayProps> = ({ grid, width, height }) => {
  if (!grid.enabled) return null;

  const style: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: `${width}px`,
    height: `${height}px`,
    pointerEvents: 'none',
    backgroundImage: `
      linear-gradient(to right, ${grid.color} 1px, transparent 1px),
      linear-gradient(to bottom, ${grid.color} 1px, transparent 1px)
    `,
    backgroundSize: `${grid.size}px ${grid.size}px`,
    backgroundPosition: `${grid.offsetX}px ${grid.offsetY}px`,
    opacity: grid.opacity
  };

  return <div id="grid-overlay" style={style} />;
};
