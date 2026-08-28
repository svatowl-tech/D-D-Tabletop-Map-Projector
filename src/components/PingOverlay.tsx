/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Компонент визуальных маркеров (Ping) на карте для указания точек интереса игрокам.
 */

import React from 'react';
import { MapPing } from '../types';

interface PingOverlayProps {
  pings: MapPing[];
}

export const PingOverlay: React.FC<PingOverlayProps> = ({ pings }) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {pings.map((ping) => (
        <div
          key={ping.id}
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: `${ping.x}px`, top: `${ping.y}px` }}
        >
          {/* Внешнее пульсирующее кольцо */}
          <div
            className="w-12 h-12 rounded-full border-2 animate-ping opacity-75"
            style={{ borderColor: ping.color }}
          />
          {/* Внутренняя точка */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full shadow-lg"
            style={{ backgroundColor: ping.color, boxShadow: `0 0 10px ${ping.color}` }}
          />
        </div>
      ))}
    </div>
  );
};
