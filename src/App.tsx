/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Главный роутер приложения D&D Tabletop Map Projector.
 * Определяет роль (DM View или Player View) на основе URL параметров:
 * ?mode=player или #player -> Экран проектора/игроков.
 * По умолчанию -> Экран мастера с инструментами.
 */

import React, { useState, useEffect } from 'react';
import { AppMode } from './types';
import { DMView } from './components/DMView';
import { PlayerView } from './components/PlayerView';

export default function App() {
  const [mode, setMode] = useState<AppMode>('dm');

  useEffect(() => {
    const checkMode = () => {
      const params = new URLSearchParams(window.location.search);
      const isPlayer = params.get('mode') === 'player' || window.location.hash === '#player';
      setMode(isPlayer ? 'player' : 'dm');
    };

    checkMode();
    window.addEventListener('popstate', checkMode);
    window.addEventListener('hashchange', checkMode);

    return () => {
      window.removeEventListener('popstate', checkMode);
      window.removeEventListener('hashchange', checkMode);
    };
  }, []);

  if (mode === 'player') {
    return <PlayerView />;
  }

  return <DMView />;
}
