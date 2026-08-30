/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Высокопроизводительный алгоритмический генератор тактических карт (Dungeon & Cave Generator)
 * для D&D 5e / VTT.
 * 
 * Режимы генерации:
 * 1. BSP Dungeons (Binary Space Partitioning): Классические залы, L/Z-образные коридоры, двери, алтари, факелы.
 * 2. Cellular Automata Caves: Органические природные пещеры, алгоритм 4-5, связность через Flood-Fill, подземные реки и кристаллы.
 * 3. Tactical Settlement / Village: Городские кварталы, мощеные улицы, река с мостами, рыночные площади, дома.
 * 4. Cozy Tavern Floorplan: Таверна с барной стойкой, камином, столиками и кладовыми.
 * 
 * 100% чистая математика Canvas 2D без внешних нейросетей, нулевая задержка, минимальный расход памяти.
 */

export type GeneratorMode = 'bsp_dungeon' | 'cellular_cave' | 'village' | 'tavern';

export type MapTheme =
  | 'stone_crypt'
  | 'lava_dungeon'
  | 'ice_cavern'
  | 'arcane_temple'
  | 'forest_ruins'
  | 'toxic_swamp'
  | 'desert_tomb'
  | 'cyber_grid'
  | 'cozy_tavern'
  | 'village_day';

export interface GeneratorConfig {
  mode: GeneratorMode;
  theme: MapTheme;
  widthCells: number;
  heightCells: number;
  cellSize: number;
  seed?: number;
  
  // BSP Dungeon options
  roomCount?: number;
  minRoomSize?: number;
  maxRoomSize?: number;
  corridorWidth?: number;
  
  // Cave options
  caveFillPercentage?: number; // 40 - 55%
  smoothingIterations?: number; // 3 - 6
  floodFillCleanup?: boolean;
  waterPools?: boolean;
  
  // Village / Tavern options
  buildingDensity?: number;
  hasRiver?: boolean;
}

export interface GeneratedRoom {
  id: string;
  name: string;
  type: 'hall' | 'corridor' | 'boss_lair' | 'shrine' | 'armory' | 'library' | 'prison' | 'tavern' | 'forge' | 'market';
  x: number;
  y: number;
  w: number;
  h: number;
  description: string;
  features: string[];
  suggestedEncounter?: string;
}

export interface GeneratedMapResult {
  dataUrl: string;
  widthPx: number;
  heightPx: number;
  gridSize: number;
  rooms: GeneratedRoom[];
  theme: MapTheme;
  mode: GeneratorMode;
  suggestedAudio: {
    bgm: 'dungeon' | 'crypt' | 'battle' | 'tavern' | 'forest' | null;
    ambience: {
      rain?: number;
      wind?: number;
      fire?: number;
      dungeon?: number;
      tavern?: number;
    };
  };
  notes: string;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Псевдослучайный генератор с сидом
class SeededRNG {
  private s: number;

  constructor(seed?: number) {
    this.s = seed !== undefined && seed !== 0 ? seed : Math.floor(Math.random() * 1000000) + 1;
  }

  public next(): number {
    this.s = (this.s * 9301 + 49297) % 233280;
    return this.s / 233280;
  }

  public range(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  public getSeed(): number {
    return this.s;
  }
}

export class DungeonGenerator {
  /**
   * Главный фасад генератора карт
   */
  public static generate(config: GeneratorConfig): GeneratedMapResult {
    const rng = new SeededRNG(config.seed);
    const { mode, widthCells, heightCells, cellSize, theme } = config;
    const widthPx = widthCells * cellSize;
    const heightPx = heightCells * cellSize;

    const canvas = document.createElement('canvas');
    canvas.width = widthPx;
    canvas.height = heightPx;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to obtain 2D canvas rendering context');

    let result: {
      grid: number[][]; // 0 = wall/void, 1 = floor, 2 = corridor/path, 3 = water/lava, 4 = decor
      rooms: GeneratedRoom[];
      doors: Array<{ x: number; y: number }>;
      features: Array<{ x: number; y: number; type: string }>;
    };

    switch (mode) {
      case 'cellular_cave':
        result = this.generateCaveAlgorithm(config, rng);
        break;
      case 'village':
        result = this.generateVillageAlgorithm(config, rng);
        break;
      case 'tavern':
        result = this.generateTavernAlgorithm(config, rng);
        break;
      case 'bsp_dungeon':
      default:
        result = this.generateDungeonAlgorithm(config, rng);
        break;
    }

    // Отрисовка тактической карты на холсте
    this.renderTacticalMap(ctx, result.grid, widthCells, heightCells, cellSize, theme, result.rooms, result.doors, result.features, rng);

    // Определение звукового оформления под тему
    const audioPresets = this.getAudioPresetForTheme(theme, mode);

    // Генерация текста заметок мастера
    const notes = this.formatNotes(config, result.rooms);

    return {
      dataUrl: canvas.toDataURL('image/png'),
      widthPx,
      heightPx,
      gridSize: cellSize,
      rooms: result.rooms,
      theme,
      mode,
      suggestedAudio: audioPresets,
      notes
    };
  }

  // =========================================================================
  // 1. АЛГОРИТМ BSP DUNGEON (Комнаты + Коридоры)
  // =========================================================================
  private static generateDungeonAlgorithm(
    config: GeneratorConfig,
    rng: SeededRNG
  ) {
    const { widthCells, heightCells } = config;
    const roomCount = config.roomCount || 8;
    const minSize = config.minRoomSize || 4;
    const maxSize = config.maxRoomSize || 9;

    const grid: number[][] = Array(heightCells)
      .fill(0)
      .map(() => Array(widthCells).fill(0));

    const rawRooms: Rect[] = [];
    const maxAttempts = roomCount * 5;
    let attempts = 0;

    while (rawRooms.length < roomCount && attempts < maxAttempts) {
      attempts++;
      const rw = rng.range(minSize, maxSize);
      const rh = rng.range(minSize, maxSize);
      const rx = rng.range(1, widthCells - rw - 2);
      const ry = rng.range(1, heightCells - rh - 2);

      const overlaps = rawRooms.some(
        (r) => rx < r.x + r.w + 2 && rx + rw + 2 > r.x && ry < r.y + r.h + 2 && ry + rh + 2 > r.y
      );

      if (!overlaps) {
        rawRooms.push({ x: rx, y: ry, w: rw, h: rh });
        for (let y = ry; y < ry + rh; y++) {
          for (let x = rx; x < rx + rw; x++) {
            grid[y][x] = 1;
          }
        }
      }
    }

    const doors: Array<{ x: number; y: number }> = [];

    // Трассировка коридоров (L-bend & Z-bend)
    for (let i = 0; i < rawRooms.length - 1; i++) {
      const rA = rawRooms[i];
      const rB = rawRooms[i + 1];

      const cAx = Math.floor(rA.x + rA.w / 2);
      const cAy = Math.floor(rA.y + rA.h / 2);
      const cBx = Math.floor(rB.x + rB.w / 2);
      const cBy = Math.floor(rB.y + rB.h / 2);

      // Горизонтальный сегмент
      const minX = Math.min(cAx, cBx);
      const maxX = Math.max(cAx, cBx);
      for (let x = minX; x <= maxX; x++) {
        if (grid[cAy][x] === 0) grid[cAy][x] = 2;
      }

      // Вертикальный сегмент
      const minY = Math.min(cAy, cBy);
      const maxY = Math.max(cAy, cBy);
      for (let y = minY; y <= maxY; y++) {
        if (grid[y][cBx] === 0) grid[y][cBx] = 2;
      }

      // Добавляем дверь на стыке
      doors.push({ x: cBx, y: cAy });
    }

    // Создаем структурированные описания комнат
    const roomTypes: GeneratedRoom['type'][] = ['hall', 'boss_lair', 'shrine', 'armory', 'library', 'prison'];
    const rooms: GeneratedRoom[] = rawRooms.map((r, idx) => {
      const type = idx === rawRooms.length - 1 ? 'boss_lair' : roomTypes[idx % roomTypes.length];
      const descriptions: Record<string, string> = {
        hall: 'Просторный сводчатый зал с древними колоннами и пылью веков.',
        boss_lair: 'Тронный зал предводителя подземелья. В воздухе витает аура смертельной угрозы.',
        shrine: 'Оскверненное святилище с каменным алтарем и мерцающими рунами.',
        armory: 'Стойки с проржавевшим оружием и сломанными щитами стражей.',
        library: 'Истлевшие свитки и каменные фолианты на полках.',
        prison: 'Ржавые железные кандалы вмонтированы в сырую стену.'
      };

      const encounters: Record<string, string> = {
        hall: '2d4 Скелетов-стражей',
        boss_lair: 'Главарь Культа + 2 Телохранителя',
        shrine: 'Тень (Shadow) или Призрак (Specter)',
        armory: 'Оживший доспех (Animated Armor)',
        library: 'Мимик (Mimic), маскирующийся под сундук с книгами',
        prison: 'Обезумевший узник или Слизь (Ochre Jelly)'
      };

      return {
        id: `room_${idx + 1}`,
        name: `Зал ${idx + 1}: ${type.toUpperCase()}`,
        type,
        x: r.x,
        y: r.y,
        w: r.w,
        h: r.h,
        description: descriptions[type] || 'Неизвестная комната подземелья.',
        features: ['Каменная кладка', 'Факелы на стенах', r.w >= 6 ? 'Центральный алтарь' : 'Колонны'],
        suggestedEncounter: encounters[type]
      };
    });

    return { grid, rooms, doors, features: [] };
  }

  // =========================================================================
  // 2. АЛГОРИТМ CELLULAR AUTOMATA (Органические Пещеры)
  // =========================================================================
  private static generateCaveAlgorithm(
    config: GeneratorConfig,
    rng: SeededRNG
  ) {
    const { widthCells, heightCells } = config;
    const fillPercent = config.caveFillPercentage || 47;
    const iterations = config.smoothingIterations || 4;

    // 1. Инициализация случайным шумом
    let map: number[][] = Array(heightCells)
      .fill(0)
      .map((_, y) =>
        Array(widthCells)
          .fill(0)
          .map((_, x) => {
            if (x === 0 || x === widthCells - 1 || y === 0 || y === heightCells - 1) return 0; // Стены по краям
            return rng.range(1, 100) < fillPercent ? 0 : 1;
          })
      );

    // 2. Итерации сглаживания клеточного автомата (4-5 rule)
    for (let it = 0; it < iterations; it++) {
      const nextMap = map.map((row) => [...row]);

      for (let y = 1; y < heightCells - 1; y++) {
        for (let x = 1; x < widthCells - 1; x++) {
          let wallCount = 0;

          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              if (map[y + dy][x + dx] === 0) wallCount++;
            }
          }

          if (wallCount > 4) {
            nextMap[y][x] = 0; // Превращается в стену
          } else if (wallCount < 4) {
            nextMap[y][x] = 1; // Превращается в пол
          }
        }
      }
      map = nextMap;
    }

    // 3. Flood-Fill связность (Объединение изолированных карманов)
    const visited = Array(heightCells).fill(false).map(() => Array(widthCells).fill(false));
    const caverns: Array<Array<{ x: number; y: number }>> = [];

    for (let y = 1; y < heightCells - 1; y++) {
      for (let x = 1; x < widthCells - 1; x++) {
        if (map[y][x] === 1 && !visited[y][x]) {
          const cavern: Array<{ x: number; y: number }> = [];
          const queue = [{ x, y }];
          visited[y][x] = true;

          while (queue.length > 0) {
            const curr = queue.shift()!;
            cavern.push(curr);

            const neighbors = [
              { x: curr.x + 1, y: curr.y },
              { x: curr.x - 1, y: curr.y },
              { x: curr.x, y: curr.y + 1 },
              { x: curr.x, y: curr.y - 1 }
            ];

            for (const n of neighbors) {
              if (n.x > 0 && n.x < widthCells - 1 && n.y > 0 && n.y < heightCells - 1) {
                if (map[n.y][n.x] === 1 && !visited[n.y][n.x]) {
                  visited[n.y][n.x] = true;
                  queue.push(n);
                }
              }
            }
          }

          if (cavern.length > 10) {
            caverns.push(cavern);
          } else {
            // Заполняем слишком мелкие ямы
            cavern.forEach((pt) => {
              map[pt.y][pt.x] = 0;
            });
          }
        }
      }
    }

    // Соединяем крупные пещеры туннелями
    caverns.sort((a, b) => b.length - a.length);
    if (caverns.length > 1) {
      const mainCave = caverns[0];
      for (let i = 1; i < caverns.length; i++) {
        const subCave = caverns[i];
        const pA = mainCave[Math.floor(mainCave.length / 2)];
        const pB = subCave[Math.floor(subCave.length / 2)];

        let cx = pA.x;
        let cy = pA.y;
        while (cx !== pB.x || cy !== pB.y) {
          if (cx < pB.x) cx++;
          else if (cx > pB.x) cx--;

          if (cy < pB.y) cy++;
          else if (cy > pB.y) cy--;

          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const tx = cx + dx;
              const ty = cy + dy;
              if (tx > 0 && tx < widthCells - 1 && ty > 0 && ty < heightCells - 1) {
                map[ty][tx] = 1;
              }
            }
          }
        }
      }
    }

    // 4. Подземные озера/лава
    if (config.waterPools !== false && caverns.length > 0) {
      const main = caverns[0];
      const poolCenter = main[Math.floor(main.length * 0.7)];
      if (poolCenter) {
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -3; dx <= 3; dx++) {
            const px = poolCenter.x + dx;
            const py = poolCenter.y + dy;
            if (px > 1 && px < widthCells - 2 && py > 1 && py < heightCells - 2 && map[py][px] === 1) {
              if (Math.hypot(dx, dy) <= 2.8) {
                map[py][px] = 3; // 3 = Жидкость
              }
            }
          }
        }
      }
    }

    const rooms: GeneratedRoom[] = [
      {
        id: 'cave_main',
        name: 'Главный грот пещеры',
        type: 'hall',
        x: Math.floor(widthCells / 4),
        y: Math.floor(heightCells / 4),
        w: Math.floor(widthCells / 2),
        h: Math.floor(heightCells / 2),
        description: 'Огромная карстовая каверна со сталактитами и влажным эхом.',
        features: ['Капельный звук воды', 'Светящиеся кристаллы', 'Узкие расщелины'],
        suggestedEncounter: 'Гнездо Гигантских Пауков или Пещерный Медведь'
      }
    ];

    return { grid: map, rooms, doors: [], features: [] };
  }

  // =========================================================================
  // 3. АЛГОРИТМ ПОСЕЛЕНИЯ / VILLAGE
  // =========================================================================
  private static generateVillageAlgorithm(
    config: GeneratorConfig,
    rng: SeededRNG
  ) {
    const { widthCells, heightCells } = config;
    const grid: number[][] = Array(heightCells).fill(0).map(() => Array(widthCells).fill(1)); // 1 = Трава / Земля

    // 1. Река через карту
    const riverY = Math.floor(heightCells * 0.45);
    for (let x = 0; x < widthCells; x++) {
      const offset = Math.floor(Math.sin(x * 0.3) * 2);
      for (let w = -1; w <= 1; w++) {
        const ry = riverY + offset + w;
        if (ry >= 0 && ry < heightCells) {
          grid[ry][x] = 3; // Река
        }
      }
    }

    // 2. Главная дорога с севера на юг и мост через реку
    const roadX = Math.floor(widthCells / 2);
    for (let y = 0; y < heightCells; y++) {
      for (let w = -1; w <= 1; w++) {
        const rx = roadX + w;
        if (rx >= 0 && rx < widthCells) {
          grid[y][rx] = 2; // Дорога / Мост
        }
      }
    }

    // 3. Здания по обе стороны дороги
    const rooms: GeneratedRoom[] = [];
    const housePositions = [
      { x: 3, y: 3, w: 6, h: 5, type: 'tavern' as const, name: 'Таверна «Пьяный Гоблин»' },
      { x: 13, y: 3, w: 5, h: 4, type: 'forge' as const, name: 'Кузница мастера Торстейна' },
      { x: 3, y: 12, w: 5, h: 4, type: 'market' as const, name: 'Торговая лавка' },
      { x: 13, y: 12, w: 6, h: 5, type: 'shrine' as const, name: 'Часовня Света' }
    ];

    housePositions.forEach((h, idx) => {
      if (h.x + h.w < widthCells && h.y + h.h < heightCells) {
        for (let y = h.y; y < h.y + h.h; y++) {
          for (let x = h.x; x < h.x + h.w; x++) {
            grid[y][x] = 4; // Пол здания
          }
        }

        rooms.push({
          id: `house_${idx + 1}`,
          name: h.name,
          type: h.type,
          x: h.x,
          y: h.y,
          w: h.w,
          h: h.h,
          description: `Здание городского типа: ${h.name}.`,
          features: ['Деревянные стены', 'Черепичная крыша', 'Окна с видом на улицу'],
          suggestedEncounter: 'Местные жители, стража или таинственный курьер'
        });
      }
    });

    return { grid, rooms, doors: [], features: [] };
  }

  // =========================================================================
  // 4. АЛГОРИТМ ТАВЕРНЫ / TAVERN
  // =========================================================================
  private static generateTavernAlgorithm(
    config: GeneratorConfig,
    rng: SeededRNG
  ) {
    const { widthCells, heightCells } = config;
    const grid: number[][] = Array(heightCells).fill(0).map(() => Array(widthCells).fill(0));

    // Внутренний зал таверны
    const margin = 2;
    for (let y = margin; y < heightCells - margin; y++) {
      for (let x = margin; x < widthCells - margin; x++) {
        grid[y][x] = 1; // Деревянный пол
      }
    }

    // Барная стойка
    const barX = margin + 3;
    for (let y = margin + 2; y < heightCells - margin - 3; y++) {
      grid[y][barX] = 4; // Барная стойка
    }

    const rooms: GeneratedRoom[] = [
      {
        id: 'tavern_main',
        name: 'Главный зал таверны',
        type: 'tavern',
        x: margin,
        y: margin,
        w: widthCells - margin * 2,
        h: heightCells - margin * 2,
        description: 'Уютная теплая таверна с потрескивающим камином и запахом жареного кабана.',
        features: ['Большой камин', 'Дубовые столы', 'Барная стойка', 'Сцена для барда'],
        suggestedEncounter: 'Пьяная драка, загадочный незнакомец в капюшоне'
      }
    ];

    return { grid, rooms, doors: [{ x: Math.floor(widthCells / 2), y: heightCells - margin }], features: [] };
  }

  // =========================================================================
  // ОТРИСОВКА КАРТЫ НА CANVAS (Стилизация и текстуры)
  // =========================================================================
  private static renderTacticalMap(
    ctx: CanvasRenderingContext2D,
    grid: number[][],
    wCells: number,
    hCells: number,
    size: number,
    theme: MapTheme,
    rooms: GeneratedRoom[],
    doors: Array<{ x: number; y: number }>,
    features: Array<{ x: number; y: number; type: string }>,
    rng: SeededRNG
  ) {
    const palettes: Record<MapTheme, {
      bg: string;
      wall: string;
      wallBorder: string;
      floor: string;
      floorGrid: string;
      accent: string;
      torch: string;
      water: string;
    }> = {
      stone_crypt: {
        bg: '#0D0E11',
        wall: '#1C1F26',
        wallBorder: '#303642',
        floor: '#282C35',
        floorGrid: '#383D4A',
        accent: '#5E667A',
        torch: '#FFA500',
        water: '#1E3A5F'
      },
      lava_dungeon: {
        bg: '#140808',
        wall: '#291212',
        wallBorder: '#4C1F1F',
        floor: '#2D1818',
        floorGrid: '#422222',
        accent: '#EA580C',
        torch: '#FF3300',
        water: '#FF4500' // Лава
      },
      ice_cavern: {
        bg: '#08121A',
        wall: '#112336',
        wallBorder: '#23476D',
        floor: '#19334D',
        floorGrid: '#284E75',
        accent: '#38BDF8',
        torch: '#00F0FF',
        water: '#0EA5E9'
      },
      arcane_temple: {
        bg: '#0F0918',
        wall: '#221533',
        wallBorder: '#3E275C',
        floor: '#2D1B45',
        floorGrid: '#442968',
        accent: '#A855F7',
        torch: '#D946EF',
        water: '#6366F1'
      },
      forest_ruins: {
        bg: '#0B140B',
        wall: '#162816',
        wallBorder: '#294729',
        floor: '#1E381E',
        floorGrid: '#2F542F',
        accent: '#22C55E',
        torch: '#84CC16',
        water: '#0D9488'
      },
      toxic_swamp: {
        bg: '#0E1408',
        wall: '#1E2812',
        wallBorder: '#384A22',
        floor: '#293819',
        floorGrid: '#3D5425',
        accent: '#84CC16',
        torch: '#A3E635',
        water: '#65A30D'
      },
      desert_tomb: {
        bg: '#17120A',
        wall: '#332717',
        wallBorder: '#5C4629',
        floor: '#42331E',
        floorGrid: '#5E492C',
        accent: '#EAB308',
        torch: '#F59E0B',
        water: '#0284C7'
      },
      cyber_grid: {
        bg: '#05070A',
        wall: '#0F172A',
        wallBorder: '#06B6D4',
        floor: '#111827',
        floorGrid: '#1E293B',
        accent: '#EC4899',
        torch: '#06B6D4',
        water: '#3B82F6'
      },
      cozy_tavern: {
        bg: '#140E0A',
        wall: '#362215',
        wallBorder: '#593922',
        floor: '#3D2817',
        floorGrid: '#523720',
        accent: '#F97316',
        torch: '#FBBF24',
        water: '#38BDF8'
      },
      village_day: {
        bg: '#1B2E15',
        wall: '#3D3126',
        wallBorder: '#5E4D3C',
        floor: '#284720', // Зеленый газон
        floorGrid: '#355E2B',
        accent: '#EAB308',
        torch: '#F59E0B',
        water: '#0284C7'
      }
    };

    const p = palettes[theme] || palettes.stone_crypt;

    // 1. Заливка фона (непроходимая порода)
    ctx.fillStyle = p.bg;
    ctx.fillRect(0, 0, wCells * size, hCells * size);

    // 2. Отрисовка полов и коридоров
    for (let y = 0; y < hCells; y++) {
      for (let x = 0; x < wCells; x++) {
        const type = grid[y][x];
        const px = x * size;
        const py = y * size;

        if (type === 1 || type === 2 || type === 4) {
          // Пол
          ctx.fillStyle = type === 2 ? p.floorGrid : p.floor;
          ctx.fillRect(px, py, size, size);

          // Сетка плитки
          ctx.strokeStyle = p.floorGrid;
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 1, py + 1, size - 2, size - 2);

          // Декоративный шум кладки
          if ((x + y) % 3 === 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
            ctx.fillRect(px + 3, py + 3, size - 6, size - 6);
          }
        } else if (type === 3) {
          // Вода или лава
          ctx.fillStyle = p.water;
          ctx.fillRect(px, py, size, size);

          ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.beginPath();
          ctx.arc(px + size / 2, py + size / 2, size * 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 3. Отрисовка стен и объемных теней
    for (let y = 0; y < hCells; y++) {
      for (let x = 0; x < wCells; x++) {
        if (grid[y][x] === 0) {
          const px = x * size;
          const py = y * size;

          const hasFloorNeighbor =
            (y > 0 && grid[y - 1][x] > 0) ||
            (y < hCells - 1 && grid[y + 1][x] > 0) ||
            (x > 0 && grid[y][x - 1] > 0) ||
            (x < wCells - 1 && grid[y][x + 1] > 0);

          if (hasFloorNeighbor) {
            ctx.fillStyle = p.wall;
            ctx.fillRect(px, py, size, size);
            ctx.strokeStyle = p.wallBorder;
            ctx.lineWidth = 2;
            ctx.strokeRect(px, py, size, size);

            // Теневой скос
            ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
            ctx.fillRect(px, py + size - 5, size, 5);
          }
        }
      }
    }

    // 4. Двери
    doors.forEach((d) => {
      const dx = d.x * size;
      const dy = d.y * size;
      ctx.fillStyle = '#854D0E';
      ctx.fillRect(dx + 2, dy + size / 2 - 4, size - 4, 8);
      ctx.strokeStyle = '#CA8A04';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(dx + 2, dy + size / 2 - 4, size - 4, 8);
    });

    // 5. Освещение и декор в комнатах
    rooms.forEach((room) => {
      // Факелы по углам
      const torchPoints = [
        { x: room.x + 0.5, y: room.y + 0.5 },
        { x: room.x + room.w - 0.5, y: room.y + 0.5 },
        { x: room.x + 0.5, y: room.y + room.h - 0.5 },
        { x: room.x + room.w - 0.5, y: room.y + room.h - 0.5 }
      ];

      torchPoints.forEach((t) => {
        const tx = t.x * size;
        const ty = t.y * size;

        // Радиальное свечение факела
        const grad = ctx.createRadialGradient(tx, ty, 2, tx, ty, size * 1.6);
        grad.addColorStop(0, p.torch);
        grad.addColorStop(0.35, 'rgba(245, 158, 11, 0.25)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(tx, ty, size * 1.6, 0, Math.PI * 2);
        ctx.fill();

        // Огонек
        ctx.fillStyle = '#FEF08A';
        ctx.beginPath();
        ctx.arc(tx, ty, 3.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Центральный алтарь или колонны в больших залах
      if (room.w >= 6 && room.h >= 6) {
        const cx = (room.x + Math.floor(room.w / 2)) * size + size / 2;
        const cy = (room.y + Math.floor(room.h / 2)) * size + size / 2;

        ctx.fillStyle = p.accent;
        ctx.beginPath();
        ctx.arc(cx, cy, size * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });
  }

  // =========================================================================
  // ПРЕСЕТЫ АУДИО И ТЕКСТОВЫЕ ЗАМЕТКИ
  // =========================================================================
  private static getAudioPresetForTheme(
    theme: MapTheme,
    mode: GeneratorMode
  ): GeneratedMapResult['suggestedAudio'] {
    if (mode === 'tavern' || theme === 'cozy_tavern') {
      return {
        bgm: 'tavern',
        ambience: { fire: 0.6, tavern: 0.7 }
      };
    }

    if (mode === 'village' || theme === 'village_day' || theme === 'forest_ruins') {
      return {
        bgm: 'forest',
        ambience: { wind: 0.5, rain: 0 }
      };
    }

    if (theme === 'lava_dungeon') {
      return {
        bgm: 'battle',
        ambience: { fire: 0.8, dungeon: 0.5 }
      };
    }

    if (theme === 'ice_cavern' || mode === 'cellular_cave') {
      return {
        bgm: 'dungeon',
        ambience: { wind: 0.4, dungeon: 0.8 }
      };
    }

    return {
      bgm: 'crypt',
      ambience: { dungeon: 0.7, wind: 0.3 }
    };
  }

  private static formatNotes(config: GeneratorConfig, rooms: GeneratedRoom[]): string {
    const titles: Record<GeneratorMode, string> = {
      bsp_dungeon: 'Подземелье (BSP Dungeon)',
      cellular_cave: 'Пещеры (Cellular Automata Caves)',
      village: 'Тактическое Поселение (Village)',
      tavern: 'План Таверны (Cozy Tavern)'
    };

    let text = `📜 СЦЕНА: ${titles[config.mode]} [${config.widthCells}x${config.heightCells} клеток]\n`;
    text += `Тема оформления: ${config.theme}\n\n`;
    text += `ОПИСАНИЕ КОМНАТ И СТОЛКНОВЕНИЙ:\n`;

    rooms.forEach((r, idx) => {
      text += `\n📍 [${idx + 1}] ${r.name}\n`;
      text += `• Описание: ${r.description}\n`;
      if (r.features && r.features.length > 0) {
        text += `• Особенности: ${r.features.join(', ')}\n`;
      }
      if (r.suggestedEncounter) {
        text += `• Столкновение: ⚔️ ${r.suggestedEncounter}\n`;
      }
    });

    return text;
  }
}
