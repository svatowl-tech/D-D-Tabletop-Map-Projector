/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Модульный движок процедурной генерации D&D 5e (VTT-ZERO Generator Engine).
 * Охватывает 7 специализированных систем:
 * 1. Bestiary Monster Engine (CR 0 - CR 30, расчет HP/AC, DPR, архетипы, легендарные действия)
 * 2. Social NPC Engine (раса, возраст, приметы, мировоззрение 3x3, идеал/привязанность/слабость, секрет, слух)
 * 3. Loot & Treasure Engine (Тиры 1-4, карманы врагов, драгоценные камни 10-5000 GP, артефакты, таблицы магии)
 * 4. Wandering Merchants Engine (караваны, контрабандисты, алхимики, гоблины-старьевщики, события встреч)
 * 5. City Stores & Markets Engine (размер поселения, кузница, алхимия, магия, храм, таверна, динамические цены)
 * 6. Equipment & Affix System (Префикс + База + Суффикс, Адамантин/Мифрил/Хладное железо, свойства)
 * 7. Magic & Spell Engine (Свитки, гримуары, процедурные заклинания, 60+ эффектов Дикой Магии)
 */

import {
  GeneratedMonster,
  CreatureType,
  MonsterArchetype,
  CreatureSize,
  MonsterAction,
  GeneratedNPC,
  DndAlignment,
  SocialAttitude,
  CampaignTier,
  GeneratedLoot,
  GemItem,
  ArtObject,
  MagicLootItem,
  GeneratedMerchant,
  MerchantType,
  MerchantInventoryItem,
  GeneratedStore,
  StoreCategory,
  SettlementSize,
  GeneratedEquipment,
  EquipmentMaterial,
  EquipmentCategory,
  GeneratedCustomSpell,
  GeneratedSpellbook,
  MagicSchool,
  AreaOfEffectShape,
  WildMagicSurgeEffect,
  HandoutCardPayload
} from '../types/generator';

// Утилита псевдослучайности
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const rollDie = (sides: number): number => Math.floor(Math.random() * sides) + 1;
const rollDice = (count: number, sides: number): number => {
  let total = 0;
  for (let i = 0; i < count; i++) total += rollDie(sides);
  return total;
};
const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

// ============================================================================
// 1. BESTIARY MONSTER ENGINE (CR 0 - CR 30)
// ============================================================================

const CR_PROPERTIES: Record<string, {
  crNum: number;
  prof: number;
  ac: number;
  hpMin: number;
  hpMax: number;
  attackBonus: number;
  dprMin: number;
  dprMax: number;
  saveDc: number;
  exp: number;
}> = {
  '0':   { crNum: 0, prof: 2, ac: 11, hpMin: 1, hpMax: 6, attackBonus: 3, dprMin: 1, dprMax: 2, saveDc: 10, exp: 10 },
  '1/8': { crNum: 0.125, prof: 2, ac: 12, hpMin: 7, hpMax: 20, attackBonus: 3, dprMin: 2, dprMax: 3, saveDc: 10, exp: 25 },
  '1/4': { crNum: 0.25, prof: 2, ac: 13, hpMin: 21, hpMax: 35, attackBonus: 3, dprMin: 4, dprMax: 5, saveDc: 10, exp: 50 },
  '1/2': { crNum: 0.5, prof: 2, ac: 13, hpMin: 36, hpMax: 49, attackBonus: 4, dprMin: 6, dprMax: 8, saveDc: 11, exp: 100 },
  '1':   { crNum: 1, prof: 2, ac: 13, hpMin: 50, hpMax: 70, attackBonus: 4, dprMin: 9, dprMax: 14, saveDc: 12, exp: 200 },
  '2':   { crNum: 2, prof: 2, ac: 13, hpMin: 71, hpMax: 85, attackBonus: 5, dprMin: 15, dprMax: 20, saveDc: 13, exp: 450 },
  '3':   { crNum: 3, prof: 2, ac: 13, hpMin: 86, hpMax: 100, attackBonus: 5, dprMin: 21, dprMax: 26, saveDc: 13, exp: 700 },
  '4':   { crNum: 4, prof: 2, ac: 14, hpMin: 101, hpMax: 115, attackBonus: 5, dprMin: 27, dprMax: 32, saveDc: 14, exp: 1100 },
  '5':   { crNum: 5, prof: 3, ac: 15, hpMin: 116, hpMax: 130, attackBonus: 6, dprMin: 33, dprMax: 38, saveDc: 15, exp: 1800 },
  '6':   { crNum: 6, prof: 3, ac: 15, hpMin: 131, hpMax: 145, attackBonus: 6, dprMin: 39, dprMax: 44, saveDc: 15, exp: 2300 },
  '7':   { crNum: 7, prof: 3, ac: 15, hpMin: 146, hpMax: 160, attackBonus: 6, dprMin: 45, dprMax: 50, saveDc: 15, exp: 2900 },
  '8':   { crNum: 8, prof: 3, ac: 16, hpMin: 161, hpMax: 175, attackBonus: 7, dprMin: 51, dprMax: 56, saveDc: 16, exp: 3900 },
  '9':   { crNum: 9, prof: 4, ac: 16, hpMin: 176, hpMax: 190, attackBonus: 7, dprMin: 57, dprMax: 62, saveDc: 16, exp: 5000 },
  '10':  { crNum: 10, prof: 4, ac: 17, hpMin: 191, hpMax: 205, attackBonus: 7, dprMin: 63, dprMax: 68, saveDc: 16, exp: 5900 },
  '12':  { crNum: 12, prof: 4, ac: 17, hpMin: 221, hpMax: 235, attackBonus: 8, dprMin: 75, dprMax: 80, saveDc: 17, exp: 8400 },
  '14':  { crNum: 14, prof: 5, ac: 18, hpMin: 251, hpMax: 265, attackBonus: 8, dprMin: 87, dprMax: 92, saveDc: 18, exp: 11500 },
  '16':  { crNum: 16, prof: 5, ac: 18, hpMin: 281, hpMax: 295, attackBonus: 9, dprMin: 99, dprMax: 104, saveDc: 18, exp: 15000 },
  '18':  { crNum: 18, prof: 6, ac: 19, hpMin: 311, hpMax: 325, attackBonus: 10, dprMin: 111, dprMax: 116, saveDc: 19, exp: 20000 },
  '20':  { crNum: 20, prof: 6, ac: 19, hpMin: 341, hpMax: 355, attackBonus: 10, dprMin: 123, dprMax: 140, saveDc: 19, exp: 25000 },
  '24':  { crNum: 24, prof: 7, ac: 20, hpMin: 480, hpMax: 540, attackBonus: 12, dprMin: 160, dprMax: 190, saveDc: 21, exp: 62000 },
  '30':  { crNum: 30, prof: 9, ac: 22, hpMin: 650, hpMax: 800, attackBonus: 15, dprMin: 250, dprMax: 320, saveDc: 23, exp: 155000 },
};

const MONSTER_NAME_PARTS: Record<CreatureType, { prefixes: string[]; roots: string[]; suffixes: string[] }> = {
  'Гуманоид': {
    prefixes: ['Безжалостный', 'Пепельный', 'Кровавый', 'Теневой', 'Железный', 'Ветеран', 'Культист'],
    roots: ['Наемник', 'Гладиатор', 'Берсерк', 'Убийца', 'Рыцарь смерти', 'Головорез', 'Мародер'],
    suffixes: ['из Черных Топей', 'Кровавого Пакта', 'Пепельного Ордена', 'Глубин', 'Пустошей']
  },
  'Нежить': {
    prefixes: ['Древний', 'Иссохший', 'Черепоносый', 'Проклятый', 'Склепный', 'Гниющий', 'Абсолютный'],
    roots: ['Владыка теней', 'Вурдалак', 'Скелет-центурион', 'Призрак', 'Упырь', 'Рыцарь склепа', 'Мумия'],
    suffixes: ['Погребенных Королей', 'Вечной Агонии', 'Черного Плача', 'Забытого Склепа']
  },
  'Чудовище': {
    prefixes: ['Хищный', 'Шипастый', 'Двуглавый', 'Пещерный', 'Ядовитый', 'Первобытный'],
    roots: ['Химера', 'Василиск', 'Мантикора', 'Грифон', 'Кокатрикс', 'Орочи', 'Бегемот'],
    suffixes: ['Разлома', 'Глубинного Лабиринта', 'Кровавого Ущелья', 'Черных Скал']
  },
  'Дракон': {
    prefixes: ['Древний', 'Пеплокрылый', 'Буреносный', 'Изумрудный', 'Сумеречный', 'Инфернальный'],
    roots: ['Дракон', 'Виверн', 'Змей бездны', 'Драколич', 'Драконий Патриарх', 'Огнекрыл'],
    suffixes: ['Пылающего Пика', 'Вечной Зимы', 'Погибели Царств', 'Оскверненной Пади']
  },
  'Аберрация': {
    prefixes: ['Мерцающий', 'Многоглазый', 'Звездный', 'Астральный', 'Искаженный', 'Безумный'],
    roots: ['Пожиратель разума', 'Созерцатель', 'Око глубин', 'Оболочник', 'Щупальценосец', 'Псевдопод'],
    suffixes: ['Дальнего Предела', 'Иных Измерений', 'Шепчущей Тьмы', 'Космической Пустоты']
  },
  'Исчадие': {
    prefixes: ['Адский', 'Серный', 'Пылающий', 'Оскверненный', 'Кровавый', 'Падший'],
    roots: ['Демон-палач', 'Дьявол ярости', 'Суккуб-жнец', 'Балор', 'Пит-финд', 'Цербер'],
    suffixes: ['Девяти Адов', 'Бездны', 'Вечного Мучения', 'Черного Пламени']
  },
  'Фея': {
    prefixes: ['Мерцающий', 'Сумеречный', 'Терновый', 'Лунноликий', 'Изумрудный', 'Коварный'],
    roots: ['Хранитель рощи', 'Сильф', 'Дриада-мститель', 'Эльфийский дух', 'Фавн-чародей'],
    suffixes: ['Благого Двора', 'Неблагого Двора', 'Зеркального Озера', 'Вечных Лесов']
  },
  'Элементаль': {
    prefixes: ['Пылающий', 'Громовой', 'Магматический', 'Буревой', 'Тектонический', 'Ледниковый'],
    roots: ['Мирмидонец', 'Вихрь ярости', 'Огненный владыка', 'Каменный колосс', 'Водный левиафан'],
    suffixes: ['Первородного Хаоса', 'Элементального Плана', 'Сердца Земли', 'Ревущей Бури']
  },
  'Растение': {
    prefixes: ['Ядовитый', 'Плотоядный', 'Терновый', 'Гнилостный', 'Споровый', 'Древний'],
    roots: ['Энт-осквернитель', 'Трупный цветок', 'Споровик', 'Душитель', 'Кровососущая лоза'],
    suffixes: ['Гнилой Трясины', 'Темной Чащи', 'Запретной Рощи', 'Кровавых Корней']
  },
  'Конструкт': {
    prefixes: ['Адамантиновый', 'Заводной', 'Рунический', 'Титанический', 'Паровой', 'Железный'],
    roots: ['Голем', 'Страж врат', 'Автоматон', 'Колосс', 'Механоид-убийца', 'Джаггернаут'],
    suffixes: ['Древней Кузницы', 'Забытых Магов', 'Несокрушимой Цитадели']
  },
  'Великан': {
    prefixes: ['Морозный', 'Огненный', 'Каменный', 'Штормовой', 'Холмовой', 'Титанический'],
    roots: ['Великан-вождь', 'Крушитель', 'Ярл', 'Дробитель скал', 'Буревестник'],
    suffixes: ['Северных Пиков', 'Пылающей Горы', 'Громовой Твердыни']
  },
  'Зверь': {
    prefixes: ['Свирепый', 'Пещерный', 'Саблезубый', 'Огромный', 'Теневой', 'Призрачный'],
    roots: ['Волк-одиночка', 'Медведь глубин', 'Вепрь', 'Пантера', 'Василисковый ящер', 'Паук-охотник'],
    suffixes: ['Дремучей Чащи', 'Мертвых Топей', 'Горных Троп']
  }
};

export function generateMonster(options?: {
  cr?: string;
  type?: CreatureType;
  archetype?: MonsterArchetype;
  isBoss?: boolean;
}): GeneratedMonster {
  const crKeys = Object.keys(CR_PROPERTIES);
  const selectedCr = options?.cr || pick(['1/4', '1/2', '1', '2', '3', '5', '8', '10', '14', '20']);
  const crData = CR_PROPERTIES[selectedCr] || CR_PROPERTIES['2'];

  const type: CreatureType = options?.type || pick([
    'Гуманоид', 'Нежить', 'Чудовище', 'Дракон', 'Аберрация', 'Исчадие', 'Фея', 'Элементаль', 'Конструкт', 'Великан', 'Зверь'
  ]);
  const archetype: MonsterArchetype = options?.archetype || pick(['Брут', 'Застрельщик', 'Контролер', 'Танк']);
  const isBoss = options?.isBoss ?? (crData.crNum >= 10 || Math.random() < 0.25);

  // Определение размера
  let size: CreatureSize = 'Medium';
  let hitDieSides = 8;
  if (type === 'Великан' || crData.crNum >= 14) {
    size = 'Huge';
    hitDieSides = 12;
  } else if (crData.crNum >= 20) {
    size = 'Gargantuan';
    hitDieSides = 20;
  } else if (type === 'Зверь' && Math.random() < 0.3) {
    size = 'Large';
    hitDieSides = 10;
  } else if (archetype === 'Брут') {
    size = 'Large';
    hitDieSides = 10;
  }

  // Расчет статов с учетом архетипа
  const baseScore = Math.floor(10 + crData.crNum * 0.4);
  let str = baseScore;
  let dex = baseScore;
  let con = baseScore;
  let int = 10;
  let wis = 10;
  let cha = 10;

  if (archetype === 'Брут') {
    str += 4;
    con += 3;
    dex -= 2;
  } else if (archetype === 'Застрельщик') {
    dex += 5;
    con += 1;
    str -= 1;
  } else if (archetype === 'Контролер') {
    int += 5;
    wis += 4;
    con += 2;
  } else if (archetype === 'Танк') {
    con += 5;
    str += 2;
  }

  str = clamp(str, 6, 30);
  dex = clamp(dex, 6, 30);
  con = clamp(con, 8, 30);
  int = clamp(int, 3, 26);
  wis = clamp(wis, 6, 26);
  cha = clamp(cha, 4, 26);

  const conMod = Math.floor((con - 10) / 2);
  const strMod = Math.floor((str - 10) / 2);
  const dexMod = Math.floor((dex - 10) / 2);
  const intMod = Math.floor((int - 10) / 2);

  // Расчет HP и костей хитов
  let targetHp = Math.floor((crData.hpMin + crData.hpMax) / 2);
  if (archetype === 'Брут') targetHp = Math.floor(targetHp * 1.2);
  if (archetype === 'Застрельщик') targetHp = Math.floor(targetHp * 0.9);
  if (isBoss) targetHp = Math.floor(targetHp * 1.35);

  const avgHitDie = (hitDieSides + 1) / 2;
  const numDice = Math.max(1, Math.round(targetHp / (avgHitDie + conMod)));
  const finalHp = Math.max(1, numDice * Math.floor(avgHitDie) + numDice * conMod);
  const hitDiceStr = `${numDice}d${hitDieSides} + ${numDice * conMod}`;

  // Расчет AC
  let ac = crData.ac;
  let acType = 'природный доспех';
  if (archetype === 'Танк') {
    ac += 2;
    acType = 'латный доспех и ростовой щит';
  } else if (archetype === 'Застрельщик') {
    ac = 10 + dexMod + 1;
    acType = 'кожаный доспех и ловкость';
  }

  // Расчет атак и DPR
  const mainAttackBonus = Math.max(crData.attackBonus, crData.prof + (archetype === 'Застрельщик' ? dexMod : strMod));
  const saveDc = crData.saveDc;
  const dpr = Math.floor((crData.dprMin + crData.dprMax) / 2);

  // Генерация имени
  const nameParts = MONSTER_NAME_PARTS[type] || MONSTER_NAME_PARTS['Чудовище'];
  const monsterName = `${pick(nameParts.prefixes)} ${pick(nameParts.roots)} ${pick(nameParts.suffixes)}`;

  // Действия и Мультиатака
  const actions: MonsterAction[] = [];
  const traits: MonsterAction[] = [];
  const reactions: MonsterAction[] = [];

  // Архетипные черты
  if (archetype === 'Брут') {
    traits.push({
      name: 'Сокрушительная масса',
      desc: 'Существо наносит 1 дополнительную кость урона при атаках оружием ближнего боя.'
    });
  } else if (archetype === 'Застрельщик') {
    traits.push({
      name: 'Неуловимость',
      desc: 'Существо может совершать действия Отход или Рывок бонусным действием в каждый свой ход.'
    });
  } else if (archetype === 'Контролер') {
    traits.push({
      name: 'Аура подавления',
      desc: `Враги в пределах 15 футов совершают спасброски с помехой против ментальных эффектов существа (Сл ${saveDc}).`
    });
  } else if (archetype === 'Танк') {
    traits.push({
      name: 'Несгибаемый оплот',
      desc: 'Существо имеет преимущество на спасброски от сбивания с ног и перемещения силой.'
    });
  }

  // Атаки
  const numAttacks = crData.crNum >= 12 ? 3 : crData.crNum >= 5 ? 2 : 1;
  if (numAttacks > 1) {
    actions.push({
      name: 'Мультиатака',
      desc: `Существо совершает ${numAttacks} атаки в свой ход.`
    });
  }

  const singleHitDpr = Math.max(2, Math.floor(dpr / numAttacks));
  const diceCount = Math.max(1, Math.floor(singleHitDpr / 5));
  const bonusDmg = archetype === 'Застрельщик' ? dexMod : strMod;

  actions.push({
    name: archetype === 'Застрельщик' ? 'Выстрел из зачарованного лука' : 'Удар когтями / Оружием',
    desc: `Рукопашная или дальнобойная атака оружием: +${mainAttackBonus} к попаданию, досягаемость 5 фт. или дистанция 60/180 фт., одна цель. Попадание: ${diceCount}d8 + ${bonusDmg} (${singleHitDpr}) колющего/дробящего урона.`
  });

  if (type === 'Дракон' || crData.crNum >= 6) {
    actions.push({
      name: 'Дыхательное оружие (Перезарядка 5–6)',
      desc: `Существо выдыхает стихийную энергию конусом 30 футов или линией 60 футов. Каждое существо в зоне должно совершить спасбросок Ловкости Сл ${saveDc}, получая ${Math.max(4, Math.floor(crData.crNum * 3.5))}d6 урона стихией при провале или половину при успехе.`
    });
  }

  if (type === 'Аберрация' || type === 'Исчадие' || archetype === 'Контролер') {
    actions.push({
      name: 'Психический импульс / Подчинение',
      desc: `Одна цель в пределах 60 футов совершает спасбросок Мудрости Сл ${saveDc}. При провале цель становится Ошеломленной (Stunned) или Испуганной до конца своего следующего хода.`
    });
  }

  if (archetype === 'Танк' || crData.crNum >= 3) {
    reactions.push({
      name: 'Парирование щитом',
      desc: `Существо добавляет +${crData.prof} к своему КД против одной рукопашной атаки, которая должна была по нему попасть.`
    });
  }

  // Легендарные действия босса
  let legendaryActions;
  if (isBoss) {
    legendaryActions = {
      pointsPerRound: 3,
      actions: [
        {
          name: 'Смещение без провокации',
          desc: 'Существо перемещается на свою полную скорость без провокации атак (Стоимость: 1 действие).',
          cost: 1
        },
        {
          name: 'Быстрый выпад',
          desc: 'Существо совершает одну базовую атаку (Стоимость: 1 действие).',
          cost: 1
        },
        {
          name: 'Устрашающий рык / Всплеск силы',
          desc: `Все враги в пределах 30 футов совершают спасбросок Мудрости Сл ${saveDc} или становятся Испуганными на 1 раунд (Стоимость: 2 действия).`,
          cost: 2
        }
      ]
    };
  }

  const colors = ['#F27D26', '#E53E3E', '#9F7AEA', '#3182CE', '#38A169', '#D69E2E'];

  return {
    id: `monster_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: monsterName,
    cr: selectedCr,
    crNumber: crData.crNum,
    size,
    type,
    archetype,
    alignment: pick(['Хаотичный Злой', 'Законопослушный Злой', 'Нейтральный Злой', 'Нейтральный', 'Хаотичный Нейтральный']),
    ac,
    acType,
    hp: finalHp,
    hitDice: hitDiceStr,
    speed: archetype === 'Застрельщик' ? '40 фт., лазание 30 фт.' : '30 фт.',
    proficiencyBonus: crData.prof,
    abilities: { str, dex, con, int, wis, cha },
    savingThrows: `СИЛ +${strMod + crData.prof}, ТЕЛ +${conMod + crData.prof}`,
    skills: `Внимательность +${wis - 10 + crData.prof}, Скрытность +${dexMod}`,
    damageResistances: crData.crNum >= 5 ? 'Огонь, холод, немагическое дробящее оружие' : undefined,
    damageImmunities: crData.crNum >= 12 ? 'Яд, психический урон' : undefined,
    conditionImmunities: 'Очарование, Отравление, Испуг',
    senses: 'Темное зрение 120 фт., пассивное Внимательность 15',
    languages: 'Общий, Драконий, Язык Бездны',
    passivePerception: 10 + Math.floor((wis - 10) / 2) + crData.prof,
    traits,
    actions,
    reactions: reactions.length > 0 ? reactions : undefined,
    legendaryActions,
    flavor: `Древняя сущность класса «${type}» (${archetype}), внушающая ужас обитателям подземелий и странствующим героям.`,
    tacticsAdvice: `В бою использует тактику ${archetype.toLowerCase()}а: держит дистанцию, концентрирует атаки на уязвимых целях и использует окружение.`,
    avatarPlaceholderColor: pick(colors)
  };
}

// ============================================================================
// 2. SOCIAL NPC ENGINE
// ============================================================================

const NPC_RACES = [
  'Человек', 'Высший Эльф', 'Лесной Эльф', 'Горный Дворф', 'Дворф Холмов',
  'Тифлинг', 'Полуорк', 'Скальный Гном', 'Легконогий Полурослик', 'Драконорожденный',
  'Аасимар', 'Голиаф', 'Табакси', 'Кенку'
];

const NPC_CLASSES = [
  'Нищий оборванец', 'Мастер-кузнец', 'Городской стражник', 'Потомственный дворянин',
  'Ветеран-наемник', 'Алхимик-исследователь', 'Тайный культист', 'Владелец таверны',
  'Гильдейский вор', 'Жрец местного храма', 'Странствующий менестрель', 'Торговец редкостями'
];

const NPC_QUIRKS = [
  'Нервно теребит фамильное серебряное кольцо на безымянном пальце',
  'Постоянно оглядывается по сторонам, словно ожидая удара в спину',
  'Заикается при упоминании высшей знати или черной магии',
  'Густо пахнет трубочным табаком и сушеной лавандой',
  'Перебирает старинные костяные четки во время пауз в разговоре',
  'Щурит левый глаз со старым боевым шрамом через бровь',
  'Говорит вкрадчивым полушепотом, наклоняясь к самому уху',
  'Часто отвлекается на звон монет в чужих кошельках',
  'Носит маску или капюшон, скрывающий ожог на половине лица',
  'Постоянно полирует карманные серебряные карманные часы'
];

const NPC_APPEARANCES = [
  'Высокий, жилистый, с проницательным взглядом ястребиных глаз',
  'Коренастый, с густой заплетенной бородой и мозолистыми руками',
  'Изящный, в безупречном, но слегка потертом камзоле',
  'Сутулый, с всклокоченными волосами и пятнами алхимических чернил',
  'Крепко сложенный воин со следами ожогов и старых ран на шее',
  'Одет в темный дорожный плащ с глубоким капюшоном и серебряной фибулой'
];

const NPC_IDEALS = [
  'Семья: Кровь не водица, я сделаю все ради благополучия своего рода.',
  'Золото: У каждого в этом мире есть своя точная цена, вопрос лишь в сумме.',
  'Месть: Те, кто предал меня, однажды захлебнутся собственной кровью.',
  'Знания: Тайны мироздания дороже всех сокровищ смертных королей.',
  'Власть: Слабые подчиняются сильным, и я намерен быть на вершине.',
  'Справедливость: Закон должен быть един как для короля, так и для нищего.',
  'Свобода: Никакие цепи и законы не удержат вольный ветер.'
];

const NPC_BONDS = [
  'Хранит древний медальон с портретом давно погибшей возлюбленной.',
  'Тайно выплачивает огромный долг безжалостной гильдии воров.',
  'Прячет в приюте внебрачного ребенка от знатной особы города.',
  'Дал нерушимую клятву защищать святилище забытого божества.',
  'Ищет украденный гримуар своего погибшего наставника.'
];

const NPC_FLAWS = [
  'Непреодолимая тяга к азартным костям и подпольным ставкам.',
  'Беспардонное высокомерие: считает всех вокруг тупыми деревенщинами.',
  'Панический страх при виде открытого пламени или огненных заклинаний.',
  'Патологическая жадность: торгуется даже за глоток воды в пустыне.',
  'Тайная клептомания: машинально присваивает мелкие блестящие предметы.'
];

const NPC_SECRETS = [
  'Знает тайный подземный ход под городские казармы и королевскую казну.',
  'Является тайным связным культа Черного Солнца, готовящего восстание.',
  'Подделал документы на наследство и отравил своего старшего брата.',
  'Прячет в подвале дома беглого мага-еретика, разыскиваемого инквизицией.',
  'Продал контрабандистам карту расположения тайников городской стражи.'
];

const NPC_RUMORS = [
  'Говорят, в заброшенной крипте на холме по ночам горит зеленый огонь.',
  'Караван из столицы бесследно исчез в Туманных Топях три дня назад.',
  'Местный бургомистр платит 500 золотых за голову главаря разбойников.',
  'В шахтах на востоке шахтеры пробили стену в древний храм титанов.'
];

export function generateSocialNPC(options?: {
  race?: string;
  occupation?: string;
  attitude?: SocialAttitude;
}): GeneratedNPC {
  const race = options?.race || pick(NPC_RACES);
  const socialClass = options?.occupation || pick(NPC_CLASSES);
  const attitude = options?.attitude || pick(['Враждебный', 'Настороженный', 'Нейтральный', 'Дружелюбный'] as SocialAttitude[]);

  const alignments: DndAlignment[] = [
    'Законопослушный Добрый (LG)', 'Нейтральный Добрый (NG)', 'Хаотичный Добрый (CG)',
    'Законопослушный Нейтральный (LN)', 'Истинно Нейтральный (N)', 'Хаотичный Нейтральный (CN)',
    'Законопослушный Злой (LE)', 'Нейтральный Злой (NE)', 'Хаотичный Злой (CE)'
  ];

  const firstNames = ['Алдерик', 'Бран', 'Варис', 'Годрик', 'Дариус', 'Елена', 'Изольда', 'Лира', 'Морган', 'Роланд', 'Сильвия', 'Торин'];
  const lastNames = ['Черновод', 'Железнорук', 'Камнелом', 'Златоуст', 'Пепельный', 'Крылоносец', 'Быстроног', 'Вороний'];

  return {
    id: `npc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: `${pick(firstNames)} ${pick(lastNames)}`,
    race,
    gender: pick(['Мужской', 'Женский']),
    age: `${rollDice(2, 20) + 18} лет`,
    socialClass,
    occupation: socialClass,
    appearance: [pick(NPC_APPEARANCES)],
    quirks: [pick(NPC_QUIRKS)],
    alignment: pick(alignments),
    ideal: pick(NPC_IDEALS),
    bond: pick(NPC_BONDS),
    flaw: pick(NPC_FLAWS),
    attitude,
    secret: {
      text: pick(NPC_SECRETS),
      dc: rollDie(6) + 11, // DC 12-17
      checkType: pick(['Убеждение', 'Запугивание', 'Обман', 'Проницательность'])
    },
    rumor: {
      text: pick(NPC_RUMORS),
      isTrue: Math.random() < 0.75,
      questHook: 'Зацепка: исследовать слух для получения награды или редкого артефакта.'
    },
    roleplayTips: {
      voice: pick(['Хриплый и низкий', 'Бархатный с насмешливой интонацией', 'Быстрый и суетливый', 'Торжественный и медленный']),
      manner: pick(['Смотрит прямо в глаза', 'Держит руки на рукояти кинжала', 'Постоянно улыбается натянутой улыбкой'])
    },
    pocketItems: [
      `${rollDice(2, 6)} серебряных монет`,
      pick(['Смятое письмо с сургучной печатью', 'Заточенный кинжал в потайном кармане', 'Флакон сомнительного травяного настоя', 'Сломанная отмычка'])
    ]
  };
}

// ============================================================================
// 3. LOOT & TREASURE ENGINE (Tiers 1 - 4)
// ============================================================================

const GEMS_10GP = ['Агат', 'Лазурит', 'Малахит', 'Обсидиан', 'Тигровый глаз', 'Бирюза'];
const GEMS_50GP = ['Хризопраз', 'Яшма', 'Лунный камень', 'Оникс', 'Кровавик', 'Цитрин'];
const GEMS_500GP = ['Александрит', 'Черный жемчуг', 'Топаз', 'Аквамарин', 'Перидот'];
const GEMS_1000GP = ['Бриллиант', 'Изумруд', 'Сапфир', 'Рубин', 'Звездный рубин', 'Огненный опал'];

const ART_OBJECTS_25GP = [
  'Серебряный кубок с гравировкой драконьей пасти',
  'Резная костяная статуэтка крылатой горгульи',
  'Шелковый платок с вышитым золотой нитью гербом',
  'Маленькое зеркальце в раме из чеканной меди'
];

const ART_OBJECTS_250GP = [
  'Золотая корона с инкрустацией мелкими рубинами',
  'Шелковый гобелен с изображением древней битвы титанов',
  'Церемониальный серебряный кинжал с ножнами из змеиной кожи',
  'Шкатулка из слоновой кости с бархатной подкладкой'
];

const MAGIC_ITEMS_TIER1: MagicLootItem[] = [
  { name: 'Зелье лечения (2d4+2)', rarity: 'Обычный', type: 'Зелье', desc: 'Восстанавливает 2d4+2 хитов при употреблении.' },
  { name: 'Свиток заклинания 1 круга (Щит / Волна грома)', rarity: 'Обычный', type: 'Свиток', desc: 'Позволяет сотворить заклинание один раз.' },
  { name: 'Плащ колыхания', rarity: 'Обычный', type: 'Чудесный предмет', desc: 'Позволяет бонусным действием заставить плащ героически развеваться на ветру.' },
  { name: 'Оружие +1', rarity: 'Необычный', type: 'Оружие', desc: '+1 к броскам атаки и урона.' }
];

const MAGIC_ITEMS_TIER2: MagicLootItem[] = [
  { name: 'Зелье высшего лечения (4d4+4)', rarity: 'Необычный', type: 'Зелье', desc: 'Восстанавливает 4d4+4 хитов.' },
  { name: 'Плащ защиты (+1 AC / Спасброски)', rarity: 'Необычный', type: 'Чудесный предмет', desc: '+1 к КД и спасброскам при настройке.' },
  { name: 'Огненный меч (Flametongue)', rarity: 'Редкий', type: 'Оружие', desc: 'Бонусным действием вспыхивает, нанося +2d6 урона огнем при попадании.' },
  { name: 'Кольцо защиты от магии', rarity: 'Редкий', type: 'Кольцо', desc: 'Преимущество на спасброски против заклинаний.' }
];

const MAGIC_ITEMS_TIER3: MagicLootItem[] = [
  { name: 'Зелье превосходного лечения (8d4+8)', rarity: 'Редкий', type: 'Зелье', desc: 'Восстанавливает 8d4+8 хитов.' },
  { name: 'Пояс силы огненного великана (STR 25)', rarity: 'Очень редкий', type: 'Чудесный предмет', desc: 'Устанавливает показатель Силы на 25.' },
  { name: 'Оружие +3', rarity: 'Очень редкий', type: 'Оружие', desc: '+3 к броскам атаки и урона.' },
  { name: 'Посох могущества (Staff of Power)', rarity: 'Очень редкий', type: 'Посох', desc: 'Дает +2 к КД и атакующим заклинаниям, заряды мощной магии.' }
];

const MAGIC_ITEMS_TIER4: MagicLootItem[] = [
  { name: 'Кольцо исполнения трех желаний (Ring of Three Wishes)', rarity: 'Легендарный', type: 'Кольцо', desc: 'Позволяет сотворить заклинание Исполнение желаний (Wish) 3 раза.' },
  { name: 'Священный Мститель (Holy Avenger)', rarity: 'Легендарный', type: 'Оружие', desc: '+3 меч паладина с аурой преимущества против магии.' },
  { name: 'Сфера всевластия стихий', rarity: 'Артефакт', type: 'Артефакт', desc: 'Древний артефакт, дарующий власть над бурями и разломами.' }
];

export function generateLoot(options?: {
  tier?: CampaignTier;
  mode?: 'individual' | 'hoard';
}): GeneratedLoot {
  const tier: CampaignTier = options?.tier || 'Tier 2 (Ур. 5-10)';
  const mode = options?.mode || 'hoard';

  let cp = 0;
  let sp = 0;
  let gp = 0;
  let pp = 0;
  const gems: GemItem[] = [];
  const artObjects: ArtObject[] = [];
  const magicItems: MagicLootItem[] = [];
  const trinkets: string[] = [];

  if (mode === 'individual') {
    if (tier === 'Tier 1 (Ур. 1-4)') {
      cp = rollDice(4, 6) * 10;
      sp = rollDice(3, 6);
      gp = rollDice(1, 6);
    } else if (tier === 'Tier 2 (Ур. 5-10)') {
      sp = rollDice(4, 6) * 10;
      gp = rollDice(2, 6) * 10;
      pp = rollDie(4);
    } else if (tier === 'Tier 3 (Ур. 11-16)') {
      gp = rollDice(4, 6) * 100;
      pp = rollDice(1, 6) * 10;
    } else {
      gp = rollDice(6, 6) * 100;
      pp = rollDice(3, 6) * 10;
    }
    trinkets.push(pick([
      'Игральные кости из кости виверны с гравировкой черепов',
      'Письмо на непонятном наречии с сургучной печатью черного ворона',
      'Сломанный серебряный компас, стрелка которого указывает на север подземелья',
      'Окаменевшее яйцо неизвестной рептилии',
      'Бронзовый ключ замысловатой формы'
    ]));
  } else {
    // Hoard Mode
    if (tier === 'Tier 1 (Ур. 1-4)') {
      cp = rollDice(6, 6) * 100;
      sp = rollDice(3, 6) * 100;
      gp = rollDice(2, 6) * 10;
      gems.push({ name: pick(GEMS_10GP), valueGp: 10, quantity: rollDice(2, 6), description: 'Небольшие полированные самоцветы.' });
      artObjects.push({ name: pick(ART_OBJECTS_25GP), valueGp: 25, description: 'Искусная работа ремесленника.' });
      magicItems.push(pick(MAGIC_ITEMS_TIER1));
      magicItems.push(pick(MAGIC_ITEMS_TIER1));
    } else if (tier === 'Tier 2 (Ур. 5-10)') {
      sp = rollDice(4, 6) * 100;
      gp = rollDice(4, 6) * 100;
      pp = rollDice(2, 6) * 10;
      gems.push({ name: pick(GEMS_50GP), valueGp: 50, quantity: rollDice(3, 6), description: 'Ограненные драгоценные камни благородного блеска.' });
      artObjects.push({ name: pick(ART_OBJECTS_250GP), valueGp: 250, description: 'Драгоценное произведение ювелирного искусства.' });
      magicItems.push(pick(MAGIC_ITEMS_TIER2));
      magicItems.push(pick(MAGIC_ITEMS_TIER2));
      if (Math.random() < 0.5) magicItems.push(pick(MAGIC_ITEMS_TIER1));
    } else if (tier === 'Tier 3 (Ур. 11-16)') {
      gp = rollDice(8, 6) * 1000;
      pp = rollDice(5, 6) * 100;
      gems.push({ name: pick(GEMS_500GP), valueGp: 500, quantity: rollDice(2, 4), description: 'Редчайшие самоцветы исключительной чистоты.' });
      magicItems.push(pick(MAGIC_ITEMS_TIER3));
      magicItems.push(pick(MAGIC_ITEMS_TIER3));
      magicItems.push(pick(MAGIC_ITEMS_TIER2));
    } else {
      gp = rollDice(12, 6) * 1000;
      pp = rollDice(8, 6) * 1000;
      gems.push({ name: pick(GEMS_1000GP), valueGp: 1000, quantity: rollDice(3, 6), description: 'Исполинские бриллианты и королевские сапфиры.' });
      magicItems.push(pick(MAGIC_ITEMS_TIER4));
      magicItems.push(pick(MAGIC_ITEMS_TIER3));
      magicItems.push(pick(MAGIC_ITEMS_TIER3));
    }
  }

  const totalGemsVal = gems.reduce((sum, g) => sum + g.valueGp * g.quantity, 0);
  const totalArtVal = artObjects.reduce((sum, a) => sum + a.valueGp, 0);
  const totalCoinsGp = Math.floor(cp / 100 + sp / 10 + gp + pp * 10);
  const totalValueGp = totalCoinsGp + totalGemsVal + totalArtVal;

  return {
    id: `loot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    tier,
    mode,
    title: mode === 'hoard' ? `Сокровищница (${tier})` : `Карманы врагов (${tier})`,
    coins: { cp, sp, gp, pp, totalGpEquivalent: totalCoinsGp },
    trinkets,
    gems,
    artObjects,
    magicItems,
    totalValueGp,
    containerDescription: mode === 'hoard'
      ? 'Окованный адамантином сундук с титаническим навесным замком и рунической гравировкой.'
      : 'Кожаный дорожный мешок, спрятанный за поясом поверженного врага.',
    trapOrHazard: mode === 'hoard' && Math.random() < 0.4
      ? 'Ловушка: Игла с ядом виверны (Сл 14 Ловкости или 4d6 урона ядом) в замочной скважине.'
      : undefined
  };
}

// ============================================================================
// 4. WANDERING MERCHANTS ENGINE
// ============================================================================

export function generateMerchant(options?: { type?: MerchantType }): GeneratedMerchant {
  const type: MerchantType = options?.type || pick([
    'Караванщик-кочевник',
    'Скупщик краденого / Контрабандист',
    'Таинственный бродячий алхимик',
    'Гоблин-старьевщик'
  ]);

  let name = '';
  let title = '';
  let desc = '';
  let guards = '';
  let goldReserveGp = 0;
  let quirk = '';
  const inventory: MerchantInventoryItem[] = [];

  if (type === 'Караванщик-кочевник') {
    name = 'Малик ибн-Рашид';
    title = 'Глава песчаного каравана';
    desc = 'Загорелый торговец в шелковых одеяниях с караваном навьюченных верблюдов и тяжелогруженых повозок.';
    guards = '4 наемника-ветерана в кольчугах с ятаганами и 2 ездовых верблюда.';
    goldReserveGp = rollDice(4, 6) * 100 + 500;
    quirk = 'Угощает чаем с шафраном и никогда не начинает торги без долгой беседы.';
    inventory.push(
      { id: '1', name: 'Карта окрестных руин и подземелий', price: '75 GP', priceGp: 75, quantity: 1, rarity: 'Необычный', desc: 'Детальная карта с отметками тайных троп.' },
      { id: '2', name: 'Рулон драгоценного шелка', price: '50 GP', priceGp: 50, quantity: 4, rarity: 'Обычный', desc: 'Роскошная ткань из дальних стран.' },
      { id: '3', name: 'Рационы длительного хранения (10 дней)', price: '5 GP', priceGp: 5, quantity: 8, rarity: 'Обычный', desc: 'Сушеное мясо с пряностями.' },
      { id: '4', name: 'Ездовая лошадь / Верблюд', price: '100 GP', priceGp: 100, quantity: 2, rarity: 'Обычный', desc: 'Выносливое животное со сбруей.' }
    );
  } else if (type === 'Скупщик краденого / Контрабандист') {
    name = 'Кривой Джакс';
    title = 'Связной гильдии теней';
    desc = 'Невзрачный человек в темном плаще, стоящий у потайного фургона с двойным дном.';
    guards = '2 скрытных головореза со смазанными ядом арбалетами в тени деревьев.';
    goldReserveGp = rollDice(6, 6) * 100 + 800;
    quirk = 'Постоянно озирается по сторонам и поднимает цены на 150%, если чувствует страх.';
    inventory.push(
      { id: '1', name: 'Яд бледной гадюки (3 дозы)', price: '150 GP', priceGp: 150, quantity: 3, rarity: 'Редкий', desc: 'Сл 13 Телосложения или 3d6 урона ядом.', isIllegal: true },
      { id: '2', name: 'Воровские инструменты высшего качества', price: '60 GP', priceGp: 60, quantity: 2, rarity: 'Необычный', desc: 'Дают +1 к проверкам взлома замков.', isIllegal: true },
      { id: '3', name: 'Запретный свиток Невидимости', price: '200 GP', priceGp: 200, quantity: 1, rarity: 'Редкий', desc: 'Свиток со стертой гильдейской печатью.', isIllegal: true },
      { id: '4', name: 'Кольцо с потайным отделением для яда', price: '45 GP', priceGp: 45, quantity: 2, rarity: 'Необычный', desc: 'Серебряное кольцо с нажимным камнем.' }
    );
  } else if (type === 'Таинственный бродячий алхимик') {
    name = 'Профессор Альбус Крэг';
    title = 'Странствующий трансмутатор';
    desc = 'Седовласый чудак в закопченных очках-гогглах и повозкой, дымящей зеленым паром.';
    guards = '1 заводной механический голем-охранник из бронзы.';
    goldReserveGp = rollDice(3, 6) * 100 + 300;
    quirk = 'Разговаривает сам с собой и может случайно взорвать колбу во время сделки.';
    inventory.push(
      { id: '1', name: 'Нестабильное зелье скорости', price: '120 GP', priceGp: 120, quantity: 2, rarity: 'Редкий', desc: 'Дает эффект Ускорения на 1 минуту, но с 10% шансом оглушения.' },
      { id: '2', name: 'Колба концентрированной кислоты (4d6)', price: '50 GP', priceGp: 50, quantity: 4, rarity: 'Необычный', desc: 'Разъедает замки и наносит 4d6 урона кислотой.' },
      { id: '3', name: 'Сушеное сердце виверны', price: '180 GP', priceGp: 180, quantity: 1, rarity: 'Редкий', desc: 'Редчайший ингредиент для мощных зелий.' },
      { id: '4', name: 'Алхимический огонь (3 склянки)', price: '75 GP', priceGp: 75, quantity: 3, rarity: 'Обычный', desc: 'Поджигает цель на 1d4 урона в раунд.' }
    );
  } else {
    // Гоблин-старьевщик
    name = 'Грызлик Мешкохват';
    title = 'Собиратель диковин';
    desc = 'Низкорослый суетливый гоблин с тележкой, доверху заваленной блестящим мусором и странными реликвиями.';
    guards = '1 дрессированный пещерный гигантский барсук на железной цепи.';
    goldReserveGp = rollDice(2, 6) * 50 + 100;
    quirk = 'Принимает в уплату блестящие пуговицы и хвастается «невероятной магией» каждой ржавой ложки.';
    inventory.push(
      { id: '1', name: 'Ржавый загадочный амулет (Шанс артефакта 5%)', price: '30 GP', priceGp: 30, quantity: 1, rarity: 'Редкий', desc: 'Покрыт странными древними рунами.', isUnidentifiedArtifact: true },
      { id: '2', name: 'Светящийся синим гриб в банке', price: '10 GP', priceGp: 10, quantity: 3, rarity: 'Обычный', desc: 'Освещает радиус 10 футов холодным светом.' },
      { id: '3', name: 'Сломанный механический воробей', price: '15 GP', priceGp: 15, quantity: 1, rarity: 'Необычный', desc: 'При заводе ключом чирикает и машет крыльями.' },
      { id: '4', name: 'Связка старинных ржавых ключей', price: '8 GP', priceGp: 8, quantity: 1, rarity: 'Обычный', desc: 'Один из ключей может подойти к забытому подземелью.' }
    );
  }

  const events = [
    {
      title: 'Нападение стаи гоблинов / волков',
      description: 'Торговец отбивается от нападающих и обещает постоянную скидку 25%, если герои спасут его груз.',
      resolutionSkill: 'Проверка Запугивания (DC 13) или победа в коротком бою',
      discountReward: 'Скидка 25% на весь ассортимент'
    },
    {
      title: 'Сломалось кованое колесо повозки',
      description: 'Тяжелая повозка увязла в канаве. Торговец просит помочь починить ось.',
      resolutionSkill: 'Проверка Атлетики (DC 14) или использование инструментов ремесленника',
      discountReward: 'Бесплатное зелье лечения или ценный подарок'
    },
    {
      title: 'Опасный туманный тракт',
      description: 'Торговец боится ехать через лес призраков и нанимает партию в качестве эскорта на 5 миль.',
      resolutionSkill: 'Проверка Выживания (DC 12) для безопасной проводки',
      discountReward: 'Оплата 100 GP и доступ к закрытому тайному инвентарю'
    }
  ];

  return {
    id: `merchant_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name,
    type,
    title,
    description: desc,
    guardsAndBeasts: guards,
    goldReserveGp,
    encounterEvent: pick(events),
    inventory,
    haggleDc: rollDie(4) + 11, // DC 12-15
    quirk
  };
}

// ============================================================================
// 5. CITY STORES & MARKETS ENGINE
// ============================================================================

export function generateStore(options?: {
  category?: StoreCategory;
  settlementSize?: SettlementSize;
}): GeneratedStore {
  const category: StoreCategory = options?.category || pick([
    'Кузница и Оружейная',
    'Алхимическая лавка и Травник',
    'Магическая лавка / Башня чародея',
    'Храм и Часовня',
    'Таверна и Лавка провизии'
  ]);

  const settlementSize: SettlementSize = options?.settlementSize || 'Городок (Town)';

  let name = '';
  let owner = '';
  let personality = '';
  let atmosphere = '';
  let priceMod = 1.0;
  let priceReason = 'Стандартные рыночные расценки.';
  const goods: MerchantInventoryItem[] = [];
  const services: { name: string; cost: string; desc: string }[] = [];

  if (category === 'Кузница и Оружейная') {
    name = pick(['Кузница «Наковальня Грома»', 'Оружейная Барона', 'Пламя и Молот', 'Адамантиновый Горн']);
    owner = 'Дворф Драгомир Железнобокий';
    personality = 'Прямолинейный, грубоватый, презирает дешевые поделки и ценит настоящую сталь.';
    atmosphere = 'Грохот тяжелых молотов, запах раскаленного угля, искры и ряды сверкающих клинков на стенах.';
    goods.push(
      { id: '1', name: 'Двуручный меч из вороненой стали', price: '50 GP', priceGp: 50, quantity: 2, rarity: 'Обычный', desc: 'Отличная балансировка, 2d6 урона.' },
      { id: '2', name: 'Полный латный доспех (Plate Armor)', price: '1500 GP', priceGp: 1500, quantity: 1, rarity: 'Редкий', desc: '18 КД, максимальная защита от физических атак.' },
      { id: '3', name: 'Щит с укрепленным умбоном', price: '15 GP', priceGp: 15, quantity: 4, rarity: 'Обычный', desc: '+2 к КД.' },
      { id: '4', name: 'Композитный длинный лук', price: '65 GP', priceGp: 65, quantity: 2, rarity: 'Обычный', desc: '1d8 урона, увеличенное натяжение.' }
    );
    services.push(
      { name: 'Заточка оружия мастера (+1 к урону на 1 бой)', cost: '10 GP', desc: 'Особая бритвенная заточка клинка.' },
      { name: 'Ремонт и подгонка доспехов под размер', cost: '25 GP', desc: 'Устраняет штрафы на перемещение.' },
      { name: 'Ковка подков для боевых коней', cost: '5 GP', desc: 'Комплект из 4 подков из хладного железа.' }
    );
  } else if (category === 'Алхимическая лавка и Травник') {
    name = pick(['Лавка «Изумрудная Склянка»', 'Травник дядюшки Ремуса', 'Эликсиры Саламандры', 'Сумеречный Котел']);
    owner = 'Гномка Мирабелла Вспышкоцвет';
    personality = 'Эксцентричная, с пятнами краски на щеках, восторженно рассказывает о ядах и экстрактах.';
    atmosphere = 'Стеклянные реторты с бурлящими жидкостями, пучки сушеных трав под потолком, легкий запах мяты и серы.';
    goods.push(
      { id: '1', name: 'Зелье лечения (2d4+2)', price: '50 GP', priceGp: 50, quantity: 6, rarity: 'Обычный', desc: 'Стандартный эликсир исцеления.' },
      { id: '2', name: 'Универсальное противоядие', price: '60 GP', priceGp: 60, quantity: 3, rarity: 'Необычный', desc: 'Снимает эффект Отравления и дает преимущество на спасброски.' },
      { id: '3', name: 'Алхимический огонь (Flask)', price: '50 GP', priceGp: 50, quantity: 4, rarity: 'Обычный', desc: 'Липкая смесь, наносящая урон огнем.' },
      { id: '4', name: 'Зелье дыхания под водой', price: '180 GP', priceGp: 180, quantity: 1, rarity: 'Редкий', desc: 'Позволяет дышать под водой 1 час.' }
    );
    services.push(
      { name: 'Идентификация неизвестного яда или травы', cost: '15 GP', desc: 'Определение свойств образца.' },
      { name: 'Варка индивидуального зелья на заказ', cost: '100 GP + ингредиенты', desc: 'Требуется 24 часа работы.' }
    );
  } else if (category === 'Магическая лавка / Башня чародея') {
    name = pick(['Арканный Эмпориум Морденкайнена', 'Башня Семи Светил', 'Свитки и Руны', 'Око Вечности']);
    owner = 'Высший эльф Аларик Звездный Шепот';
    personality = 'Холодный, высокомерный интеллектуал, требующий уважения к тайным искусствам.';
    atmosphere = 'Левитирующие книги, тихое гудение магических кристаллов, фиолетовое свечение рун на полу.';
    goods.push(
      { id: '1', name: 'Жемчужина для заклинаний (100 GP)', price: '100 GP', priceGp: 100, quantity: 3, rarity: 'Необычный', desc: 'Необходима для заклинания Опознание (Identify).' },
      { id: '2', name: 'Алмазная пыль (300 GP)', price: '300 GP', priceGp: 300, quantity: 2, rarity: 'Редкий', desc: 'Компонент для Возрождения (Revivify).' },
      { id: '3', name: 'Свиток заклинания 3 круга (Огненный шар)', price: '250 GP', priceGp: 250, quantity: 1, rarity: 'Редкий', desc: 'Свиток могущественного взрыва 8d6.' },
      { id: '4', name: 'Палочка обнаружения магии (3 заряда)', price: '350 GP', priceGp: 350, quantity: 1, rarity: 'Необычный', desc: 'Позволяет накладывать Detect Magic.' }
    );
    services.push(
      { name: 'Опознание магического предмета (Identify)', cost: '25 GP', desc: 'Полное раскрытие свойств артефакта.' },
      { name: 'Переписывание заклинания в книгу мага', cost: '50 GP за круг', desc: 'Услуги скриптория башни.' }
    );
  } else if (category === 'Храм и Часовня') {
    name = pick(['Храм Негасимого Света', 'Часовня Павших Героев', 'Обитель Милосердной Девы', 'Алтарь Бури']);
    owner = 'Верховный жрец Самуил';
    personality = 'Благочестивый, внимательный к чужим страданиям, проповедует жертвенность и помощь ближнему.';
    atmosphere = 'Горящие белые свечи, эхо молитв, золотые лики богов и благоухание ладана.';
    goods.push(
      { id: '1', name: 'Святая вода (Флакон)', price: '25 GP', priceGp: 25, quantity: 8, rarity: 'Обычный', desc: '2d6 урона лучистой энергией по нежити и исчадиям.' },
      { id: '2', name: 'Священный символ из серебра', price: '20 GP', priceGp: 20, quantity: 3, rarity: 'Обычный', desc: 'Фокусировка для божественных заклинаний.' },
      { id: '3', name: 'Свиток Снятия Проклятия (Remove Curse)', price: '200 GP', priceGp: 200, quantity: 1, rarity: 'Редкий', desc: 'Снимает проклятия и эффекты настройки.' }
    );
    services.push(
      { name: 'Снятие проклятия или болезни', cost: '100 GP', desc: 'Божественный ритуал очищения.' },
      { name: 'Ритуал Воскрешения (Revivify / Raise Dead)', cost: '500 GP + компоненты', desc: 'Возвращение погибшего спутника к жизни.' },
      { name: 'Благословение на поход (+1d4 к одному спасброску)', cost: '10 GP пожертвования', desc: 'Действует до следующего длительного отдыха.' }
    );
  } else {
    // Таверна и Лавка провизии
    name = pick(['Таверна «Пьяный Дракон»', 'Постоялый двор «Три Пескаря»', 'Кабачок «Свинья и Свисток»', 'Путник']);
    owner = 'Трактирщик Барнаби Толстяк';
    personality = 'Громогласный весельчак, знающий все городские сплетни и слухи.';
    atmosphere = 'Тепло камина, звон кружек с элем, запах жареного вепря и смех завсегдатаев.';
    goods.push(
      { id: '1', name: 'Пеньковая веревка (50 футов) и крюк-кошка', price: '4 GP', priceGp: 4, quantity: 5, rarity: 'Обычный', desc: 'Надежное снаряжение для скалолазания.' },
      { id: '2', name: 'Факелы (набор из 5 штук)', price: '1 GP', priceGp: 1, quantity: 10, rarity: 'Обычный', desc: 'Горят 1 час каждый.' },
      { id: '3', name: 'Бочонок отборного Дворфийского стаута', price: '12 GP', priceGp: 12, quantity: 2, rarity: 'Обычный', desc: 'Крепкий эль, согревающий в холода.' },
      { id: '4', name: 'Теплый спальный мешок и палатка на двоих', price: '15 GP', priceGp: 15, quantity: 3, rarity: 'Обычный', desc: 'Защита от ночного холода.' }
    );
    services.push(
      { name: 'Аренда комнаты на ночь (с горячим ужином)', cost: '2 GP', desc: 'Безопасный ночлег с замком на двери.' },
      { name: 'Аренда тайной приватной комнаты для переговоров', cost: '5 GP', desc: 'Полная звукоизоляция от лишних ушей.' }
    );
  }

  // Модификаторы цен в зависимости от размера поселения
  if (settlementSize === 'Деревня (Village)') {
    priceMod = 1.25;
    priceReason = 'Дефицит привозных товаров в отдаленной деревне (+25%).';
  } else if (settlementSize === 'Торговый мегаполис (Metropolis)') {
    priceMod = 0.9;
    priceReason = 'Высокая конкуренция и избыток товаров в мегаполисе (-10%).';
  }

  return {
    id: `store_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name,
    category,
    settlementSize,
    ownerName: owner,
    ownerPersonality: personality,
    atmosphere,
    priceModifier: priceMod,
    priceModifierReason: priceReason,
    goods,
    services,
    rumorOrNotice: 'Объявление на стене: Гильдия купцов ищет отряд для охраны ценного груза на перевале.'
  };
}

// ============================================================================
// 6. EQUIPMENT & AFFIX SYSTEM
// ============================================================================

const WEAPON_BASES = ['Двуручный меч', 'Длинный меч', 'Боевой топор', 'Кинжал', 'Рапира', 'Длинный лук', 'Тяжелый арбалет', 'Боевой молот', 'Копье'];
const ARMOR_BASES = ['Полный латный доспех', 'Кольчуга', 'Чешуйчатый доспех', 'Кожаный доспех', 'Кираса', 'Ростовой щит'];

const MATERIALS: Array<{ name: EquipmentMaterial; desc: string; rarityMod: string; costMult: number }> = [
  { name: 'Обычная сталь / Кожа', desc: 'Качественная работа оружейника.', rarityMod: 'Обычный', costMult: 1 },
  { name: 'Адамантин', desc: 'Автоматические критические удары по объектам; доспех блокирует входящие критические удары.', rarityMod: 'Редкий', costMult: 6 },
  { name: 'Мифрил', desc: 'Отсутствие штрафа на скрытность для тяжелой брони; вес уменьшен вдвое.', rarityMod: 'Редкий', costMult: 5 },
  { name: 'Хладное железо', desc: 'Наносит дополнительно 2d6 урона по существам типа «Фея» и «Исчадие».', rarityMod: 'Редкий', costMult: 4 },
  { name: 'Древесина темного железа', desc: 'Сверхлегкая прочная древесина: увеличивает дистанцию выстрела на 30 футов.', rarityMod: 'Необычный', costMult: 3 },
  { name: 'Обсидиан глубин', desc: 'Лезвие покрыто бритвенно-острыми кристаллами, игнорирующими сопротивление рубящему урону.', rarityMod: 'Редкий', costMult: 4 },
  { name: 'Драконья кость', desc: 'Оружие насыщено первородной стихией дракона (+1d6 урона огнем/холодом).', rarityMod: 'Очень редкий', costMult: 8 },
  { name: 'Благородное серебрение', desc: 'Эффективно преодолевает сопротивление нежити, оборотней и призраков.', rarityMod: 'Необычный', costMult: 2 }
];

const WEAPON_PREFIXES = [
  { name: 'Острое (Keen)', effect: 'Критический диапазон ударов расширен до 19–20.' },
  { name: 'Балансированное', effect: '+1 к инициативе владельца при экипировке.' },
  { name: 'Зазубренное', effect: 'Накладывает эффект Кровотечения (1d4 урона в начале хода врага на 2 раунда).' },
  { name: 'Руническое', effect: '+1 к спасброскам владельца против заклинаний.' },
  { name: 'Тяжелое кованое', effect: 'При критическом ударе сбивает цель с ног (Сл 14 Силы).' }
];

const ARMOR_PREFIXES = [
  { name: 'Укрепленное пластинами', effect: '+1 к КД против дистанционных стрелковых атак.' },
  { name: 'Огнестойкое', effect: 'Дает сопротивление урону огнем.' },
  { name: 'Зеркальной полировки', effect: 'Преимущество на спасброски против заклинаний Ослепления и Очарования.' },
  { name: 'Непробиваемое', effect: 'Уменьшает весь входящий немагический дробящий урон на 3.' }
];

const SUFFIXES = [
  { name: 'Вечного Пламени', effect: 'Наносит дополнительно 1d6 урона огнем и освещает 20 футов вокруг ярким светом.' },
  { name: 'Ледяного Касания', effect: 'Наносит +1d6 урона холодом и снижает скорость цели на 10 футов.' },
  { name: 'Утренней Зари', effect: 'Наносит +1d8 лучистого урона нежити и демонам.' },
  { name: 'Безмолвного Шага', effect: 'Дает преимущество на проверки Ловкости (Скрытность).' },
  { name: 'Буревестника', effect: 'Раз в день позволяет совершить удар молнией на 3d10 урона электричеством.' },
  { name: 'Пожирателя Душ', effect: 'При добивании врага восстанавливает владельцу 2d6 временных хитов.' }
];

export function generateEquipment(options?: {
  category?: EquipmentCategory;
  material?: EquipmentMaterial;
}): GeneratedEquipment {
  const isWeapon = Math.random() < 0.6;
  const category: EquipmentCategory = options?.category || (isWeapon ? 'Оружие ближнего боя' : 'Доспех');
  const baseItem = isWeapon ? pick(WEAPON_BASES) : pick(ARMOR_BASES);
  const materialData = options?.material
    ? MATERIALS.find((m) => m.name === options.material) || MATERIALS[0]
    : pick(MATERIALS);

  const prefixData = isWeapon ? pick(WEAPON_PREFIXES) : pick(ARMOR_PREFIXES);
  const suffixData = pick(SUFFIXES);

  const fullName = `${prefixData.name} ${materialData.name !== 'Обычная сталь / Кожа' ? materialData.name + ' ' : ''}${baseItem} ${suffixData.name}`;

  const props: string[] = [
    `Материал (${materialData.name}): ${materialData.desc}`,
    `Префикс (${prefixData.name}): ${prefixData.effect}`,
    `Суффикс (${suffixData.name}): ${suffixData.effect}`
  ];

  let baseVal = isWeapon ? 75 : 250;
  baseVal *= materialData.costMult;
  baseVal += 450; // Магические зачарования

  return {
    id: `equip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    fullName,
    prefix: prefixData.name,
    baseItem,
    suffix: suffixData.name,
    category,
    material: materialData.name,
    rarity: materialData.rarityMod === 'Очень редкий' ? 'Очень редкий' : 'Редкий',
    damageOrAc: isWeapon ? '1d8/1d10 + урон зачарования' : '+18 КД / сопротивления',
    bonus: '+1 к атакам и спасброскам',
    properties: props,
    lore: `Легендарный образец кузнечного искусства, выкованный древними мастерами для битвы с порождениями тьмы.`,
    attunementRequired: true,
    valueGp: baseVal
  };
}

// ============================================================================
// 7. MAGIC, SPELLS & WILD MAGIC ENGINE
// ============================================================================

const MAGE_NAMES = ['Бигби', 'Морденкайнен', 'Тензер', 'Оттилюк', 'Расталин', 'Элминстер', 'Мордред', 'Агаззар', 'Нистул', 'Леомунд'];
const SPELL_ELEMENTS = ['Испепеляющая', 'Ледяная', 'Громовая', 'Психическая', 'Астральная', 'Кислотная', 'Теневая', 'Солнечная'];
const SPELL_SHAPES = ['Сфера', 'Конус', 'Луч', 'Цилиндр', 'Волна', 'Разлом', 'Кнут', 'Кара', 'Инферно'];

const WILD_MAGIC_EFFECTS: Array<{ title: string; desc: string; duration: string; cat: WildMagicSurgeEffect['category'] }> = [
  { title: 'Люминесцентная кожа', desc: 'Кожа заклинателя начинает ярко светиться синим или зеленым цветом (яркий свет 15 фт).', duration: '1d4 дней', cat: 'Трансформация' },
  { title: 'Шелковый перьепад', desc: 'Вокруг заклинателя в радиусе 20 футов взлетают левитирующие перья, замедляя падение всех существ.', duration: '1 минута', cat: 'Хаотичный дар' },
  { title: 'Комнатный папоротник', desc: 'Заклинатель превращается в комнатный цветок в глиняном горшке до начала своего следующего хода.', duration: '1 раунд', cat: 'Комический' },
  { title: 'Пространственный скачок', desc: 'Заклинатель мгновенно телепортируется на 30 футов в случайном направлении.', duration: 'Мгновенно', cat: 'Боевой всплеск' },
  { title: 'Аура невидимости', desc: 'Заклинатель и все существа в радиусе 10 футов становятся невидимыми на 1 минуту.', duration: '1 минута', cat: 'Хаотичный дар' },
  { title: 'Дар поэта', desc: 'Заклинатель может говорить только рифмами. Если нарушает — получает 1d4 психического урона.', duration: '1 час', cat: 'Комический' },
  { title: 'Золотой дождь', desc: 'Из рукавов заклинателя высыпается 50 золотых монет, которые испаряются синим дымом через 1 минуту.', duration: '1 минута', cat: 'Комический' },
  { title: 'Призыв безумного флампа', desc: 'В 5 футах от кастера появляется испуганный фламп, который пищит и медленно улетает.', duration: '1 минута', cat: 'Комический' },
  { title: 'Исполинский рост', desc: 'Рост заклинателя увеличивается на 1d10 дюймов, а голос становится громоподобным.', duration: 'Постоянно (или до рассеивания)', cat: 'Трансформация' },
  { title: 'Инфернальный щит', desc: 'Огненные искры окружают кастера: любой ударивший его в ближнем бою получает 1d10 урона огнем.', duration: '1 минута', cat: 'Боевой всплеск' },
  { title: 'Статическая буря', desc: 'Молния бьет в землю рядом с кастером. Все существа в пределах 10 фт совершают спасбросок Ловкости Сл 13 или получают 2d8 урона электричеством.', duration: 'Мгновенно', cat: 'Стихийная аномалия' },
  { title: 'Зеркальные глаза', desc: 'Глаза заклинателя становятся зеркальными сферами, даруя Темное зрение на 120 футов.', duration: '1 час', cat: 'Трансформация' },
  { title: 'Голос призраков', desc: 'Каждое слово заклинателя сопровождается жутким загробным эхом, пугая слабых созданий.', duration: '10 минут', cat: 'Комический' },
  { title: 'Левитация гравитации', desc: 'Гравитация вокруг кастера ослабевает: все предметы весом до 10 фунтов медленно взмывают к потолку.', duration: '1 минута', cat: 'Стихийная аномалия' },
  { title: 'Восстановление ячейки', desc: 'Кастер восстанавливает свою наивысшую потраченную ячейку заклинаний.', duration: 'Мгновенно', cat: 'Хаотичный дар' },
  { title: 'Бабочки хаоса', desc: 'Рой разноцветных иллюзорных бабочек ослепляет всех существ в радиусе 10 футов на 1 раунд.', duration: '1 раунд', cat: 'Стихийная аномалия' },
  { title: 'Удвоенное колдовство', desc: 'Следующее сотворенное заклинание 1-3 круга дублируется бесплатно на вторую цель.', duration: 'До следующего хода', cat: 'Хаотичный дар' },
  { title: 'Призрачный оркестр', desc: 'Невидимые флейты и барабаны начинают громко играть торжественный гимн над головой кастера.', duration: '10 минут', cat: 'Комический' },
  { title: 'Холодное дыхание', desc: 'Кастер выдыхает ледяной пар: при попытке говорить изо рта сыплются снежинки.', duration: '1 час', cat: 'Комический' },
  { title: 'Уязвимость к магии', desc: 'Кастер получает уязвимость ко всем видам урона до начала своего следующего хода.', duration: '1 раунд', cat: 'Боевой всплеск' }
];

export function generateCustomSpell(options?: {
  school?: MagicSchool;
  level?: number;
}): GeneratedCustomSpell {
  const mage = pick(MAGE_NAMES);
  const element = pick(SPELL_ELEMENTS);
  const shape = pick(SPELL_SHAPES);
  const school: MagicSchool = options?.school || pick([
    'Воплощение (Evocation)', 'Ограждение (Abjuration)', 'Иллюзия (Illusion)',
    'Некромантия (Necromancy)', 'Очарование (Enchantment)', 'Преобразование (Transmutation)'
  ]);

  const level = options?.level ?? (Math.floor(Math.random() * 6) + 1); // 1 to 6
  const damageDice = level * 2 + 1;

  const aoeShapes: AreaOfEffectShape[] = ['Сфера (Sphere)', 'Конус (Cone)', 'Луч (Line)', 'Цилиндр (Cylinder)', 'Одиночная цель (Single)'];
  const chosenShape = pick(aoeShapes);
  const conditions = ['Ошеломлен (Stunned)', 'Испуган (Frightened)', 'Замедлен (Slowed)', 'Ослеплен (Blinded)', 'Отравлен (Poisoned)', 'Сбит с ног (Prone)'];
  const appliedCondition = Math.random() < 0.65 ? pick(conditions) : undefined;

  return {
    id: `spell_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: `${element} ${shape} ${mage}`,
    creatorMage: mage,
    school,
    level,
    levelText: level === 0 ? 'Заговор (Cantrip)' : `${level} круг заклинаний`,
    castingTime: '1 основное действие',
    range: chosenShape === 'Одиночная цель (Single)' ? '60 футов' : '120 футов',
    aoeShape: chosenShape,
    aoeSizeFeet: chosenShape === 'Сфера (Sphere)' ? 20 : chosenShape === 'Конус (Cone)' ? 30 : 60,
    components: 'В, С, М (горсть пепла и кусочек янтаря)',
    duration: 'Мгновенно (концентрация до 1 минуты для дебаффов)',
    saveType: pick(['DEX', 'CON', 'WIS']),
    damageFormula: `${damageDice}d6`,
    damageType: element.includes('Ледяная') ? 'холод' : element.includes('Испепеляющая') ? 'огонь' : 'психический',
    appliedCondition,
    description: `Заклинатель выпускает концентрированный поток арканной энергии, создающий ${chosenShape.toLowerCase()} в указанной точке. Каждое существо в зоне действия совершает спасбросок, получая ${damageDice}d6 урона стихией при провале или половину урона при успехе.${
      appliedCondition ? ` При провале спасброска цель также становится ${appliedCondition} на 1 минуту.` : ''
    }`,
    higherLevelsDesc: `Если заклинание накладывается ячейкой ${level + 1} круга или выше, урон увеличивается на 1d6 за каждый круг выше ${level}-го.`
  };
}

export function rollWildMagicSurge(): WildMagicSurgeEffect {
  const d100 = rollDie(100);
  const base = pick(WILD_MAGIC_EFFECTS);
  return {
    d100Roll: d100,
    title: base.title,
    desc: base.desc,
    duration: base.duration,
    category: base.cat
  };
}

// ============================================================================
// УНИВЕРСАЛЬНЫЕ КОНВЕРТЕРЫ В КАРТОЧКИ (Handout Card Payload)
// ============================================================================

export function monsterToHandoutCard(m: GeneratedMonster): HandoutCardPayload {
  return {
    id: m.id,
    category: 'monster',
    title: m.name,
    subtitle: `${m.size} ${m.type} (${m.archetype}), ${m.alignment}`,
    badge: `CR ${m.cr} (${m.hitDice})`,
    rarityColor: '#F27D26',
    stats: [
      { label: 'КД (AC)', value: `${m.ac} (${m.acType})` },
      { label: 'ХИТЫ (HP)', value: `${m.hp} (${m.hitDice})` },
      { label: 'СКОРОСТЬ', value: m.speed },
      { label: 'СИЛ/ЛОВ/ТЕЛ', value: `${m.abilities.str} / ${m.abilities.dex} / ${m.abilities.con}` },
      { label: 'ИНТ/МУД/ХАР', value: `${m.abilities.int} / ${m.abilities.wis} / ${m.abilities.cha}` },
      { label: 'СЛ СПАСБРОСКА', value: `DC ${8 + m.proficiencyBonus + Math.floor((m.abilities.con - 10) / 2)}` }
    ],
    sections: [
      {
        title: 'ОСОБЕННОСТИ И ЧЕРТЫ',
        type: 'item_list',
        items: m.traits.map((t) => ({ name: t.name, desc: t.desc }))
      },
      {
        title: 'ДЕЙСТВИЯ (ACTIONS)',
        type: 'item_list',
        items: m.actions.map((a) => ({ name: a.name, desc: a.desc }))
      },
      ...(m.legendaryActions ? [{
        title: `ЛЕГЕНДАРНЫЕ ДЕЙСТВИЯ (${m.legendaryActions.pointsPerRound} ОЧКА В РАУНД)`,
        type: 'item_list' as const,
        items: m.legendaryActions.actions.map((la) => ({ name: la.name, desc: la.desc, badge: `${la.cost} очка` }))
      }] : [])
    ],
    flavorText: m.flavor,
    footerNote: `Спасброски: ${m.savingThrows} | Чувства: ${m.senses}`,
    gmNotesHidden: `Совет по тактике: ${m.tacticsAdvice}`
  };
}

export function npcToHandoutCard(npc: GeneratedNPC): HandoutCardPayload {
  return {
    id: npc.id,
    category: 'npc',
    title: npc.name,
    subtitle: `${npc.race}, ${npc.age} • ${npc.socialClass}`,
    badge: npc.alignment.split(' ')[0],
    rarityColor: '#9F7AEA',
    stats: [
      { label: 'ОТНОШЕНИЕ', value: npc.attitude },
      { label: 'МИРОВОЗЗРЕНИЕ', value: npc.alignment },
      { label: 'ПРОВЕРКА DC', value: `${npc.secret.dc} (${npc.secret.checkType})` }
    ],
    sections: [
      {
        title: 'ПСИХОЛОГИЧЕСКИЙ ПРОФИЛЬ',
        type: 'text',
        content: `• ИДЕАЛ: ${npc.ideal}\n• ПРИВЯЗАННОСТЬ: ${npc.bond}\n• СЛАБОСТЬ: ${npc.flaw}`
      },
      {
        title: 'ВНЕШНОСТЬ И ПРИМЕТЫ',
        type: 'text',
        content: `${npc.appearance.join('. ')}\nПривычка: ${npc.quirks.join('. ')}`
      },
      {
        title: 'СЛУХ ИЛИ ЗАЦЕПКА ДЛЯ КВЕСТА',
        type: 'quote',
        content: `«${npc.rumor.text}» (${npc.rumor.isTrue ? 'Истинный слух' : 'Ложная молва'})`
      }
    ],
    flavorText: `Голос: ${npc.roleplayTips.voice}. Манера: ${npc.roleplayTips.manner}.`,
    footerNote: `В карманах: ${npc.pocketItems.join(', ')}`,
    gmNotesHidden: `ТАЙНЫЙ СЕКРЕТ (Сл ${npc.secret.dc} ${npc.secret.checkType}): ${npc.secret.text}`
  };
}

export function lootToHandoutCard(loot: GeneratedLoot): HandoutCardPayload {
  return {
    id: loot.id,
    category: 'loot',
    title: loot.title,
    subtitle: `Ценность: ~${loot.totalValueGp.toLocaleString()} GP • ${loot.containerDescription}`,
    badge: loot.tier,
    rarityColor: '#D69E2E',
    stats: [
      { label: 'МОНЕТЫ', value: `${loot.coins.gp} GP, ${loot.coins.sp} SP, ${loot.coins.cp} CP, ${loot.coins.pp} PP` },
      { label: 'ИТОГО ЗОЛОТОМ', value: `${loot.totalValueGp} GP` }
    ],
    sections: [
      ...(loot.gems.length > 0 ? [{
        title: 'ДРАГОЦЕННЫЕ КАМНИ (GEMS)',
        type: 'item_list' as const,
        items: loot.gems.map((g) => ({ name: `${g.name} (x${g.quantity})`, cost: `${g.valueGp * g.quantity} GP`, desc: g.description }))
      }] : []),
      ...(loot.artObjects.length > 0 ? [{
        title: 'ПРОИЗВЕДЕНИЯ ИСКУССТВА (ART OBJECTS)',
        type: 'item_list' as const,
        items: loot.artObjects.map((a) => ({ name: a.name, cost: `${a.valueGp} GP`, desc: a.description }))
      }] : []),
      ...(loot.magicItems.length > 0 ? [{
        title: 'МАГИЧЕСКИЕ ПРЕДМЕТЫ (MAGIC ITEMS)',
        type: 'item_list' as const,
        items: loot.magicItems.map((m) => ({ name: m.name, badge: m.rarity, desc: m.desc }))
      }] : []),
      ...(loot.trinkets.length > 0 ? [{
        title: 'БЫТОВЫЕ БЕЗДЕЙЛУШКИ (TRINKETS)',
        type: 'text' as const,
        content: loot.trinkets.join('\n')
      }] : [])
    ],
    footerNote: loot.trapOrHazard ? `ВНИМАНИЕ: ${loot.trapOrHazard}` : 'Контейнер безопасен для вскрытия.',
    gmNotesHidden: loot.trapOrHazard
  };
}

export function merchantToHandoutCard(m: GeneratedMerchant): HandoutCardPayload {
  return {
    id: m.id,
    category: 'merchant',
    title: `${m.name} — ${m.title}`,
    subtitle: `${m.type} • Запас золота: ${m.goldReserveGp} GP • Сл торга: ${m.haggleDc}`,
    badge: m.type,
    rarityColor: '#38A169',
    stats: [
      { label: 'КАССА (ВЫКУП)', value: `${m.goldReserveGp} GP` },
      { label: 'СЛ ТОРГА (HAGGLE)', value: `DC ${m.haggleDc}` },
      { label: 'ОХРАНА', value: m.guardsAndBeasts }
    ],
    sections: [
      {
        title: 'АССОРТИМЕНТ ТОВАРОВ',
        type: 'item_list',
        items: m.inventory.map((i) => ({
          name: i.name,
          cost: i.price,
          desc: `${i.desc} (Остаток: ${i.quantity} шт.)`,
          badge: i.isIllegal ? 'Контрабанда' : i.isUnidentifiedArtifact ? 'Неопознано' : undefined
        }))
      },
      {
        title: `СОБЫТИЕ ВСТРЕЧИ: ${m.encounterEvent.title}`,
        type: 'quote',
        content: `${m.encounterEvent.description}\nПроверка: ${m.encounterEvent.resolutionSkill} → Награда: ${m.encounterEvent.discountReward}`
      }
    ],
    flavorText: `${m.description} Особенность: ${m.quirk}`,
    footerNote: `Готов выкупать найденный лут героев в пределах ${m.goldReserveGp} GP.`
  };
}

export function storeToHandoutCard(s: GeneratedStore): HandoutCardPayload {
  return {
    id: s.id,
    category: 'store',
    title: s.name,
    subtitle: `${s.category} • ${s.settlementSize} • Владелец: ${s.ownerName}`,
    badge: `Цены: x${s.priceModifier}`,
    rarityColor: '#3182CE',
    stats: [
      { label: 'ВЛАДЕЛЕЦ', value: s.ownerName },
      { label: 'КОЭФФИЦИЕНТ ЦЕН', value: `x${s.priceModifier} (${s.priceModifierReason})` }
    ],
    sections: [
      {
        title: 'ТОВАРЫ НА ПРИЛАВКЕ',
        type: 'item_list',
        items: s.goods.map((g) => ({
          name: g.name,
          cost: `${Math.round(g.priceGp * s.priceModifier)} GP`,
          desc: `${g.desc} (В наличии: ${g.quantity})`
        }))
      },
      ...(s.services.length > 0 ? [{
        title: 'УСЛУГИ И МАСТЕРСКАЯ',
        type: 'item_list' as const,
        items: s.services.map((srv) => ({ name: srv.name, cost: srv.cost, desc: srv.desc }))
      }] : [])
    ],
    flavorText: `Атмосфера: ${s.atmosphere}\nХарактер торговца: ${s.ownerPersonality}`,
    footerNote: s.rumorOrNotice
  };
}

export function equipmentToHandoutCard(eq: GeneratedEquipment): HandoutCardPayload {
  return {
    id: eq.id,
    category: 'equipment',
    title: eq.fullName,
    subtitle: `${eq.category} • ${eq.material} • ${eq.rarity}`,
    badge: eq.rarity,
    rarityColor: eq.rarity === 'Очень редкий' ? '#9F7AEA' : '#D69E2E',
    stats: [
      { label: 'ТИП / БОНУС', value: `${eq.damageOrAc} (${eq.bonus})` },
      { label: 'СТОИМОСТЬ', value: `${eq.valueGp} GP` },
      { label: 'НАСТРОЙКА', value: eq.attunementRequired ? 'Требуется' : 'Не требуется' }
    ],
    sections: [
      {
        title: 'МАГИЧЕСКИЕ СВОЙСТВА И АФФИКСЫ',
        type: 'text',
        content: eq.properties.join('\n\n')
      }
    ],
    flavorText: eq.lore,
    footerNote: `Качественная работа: префикс «${eq.prefix}» и суффикс «${eq.suffix}».`
  };
}

export function spellToHandoutCard(sp: GeneratedCustomSpell): HandoutCardPayload {
  return {
    id: sp.id,
    category: 'magic',
    title: sp.name,
    subtitle: `${sp.levelText}, ${sp.school}`,
    badge: `${sp.level} КРУГ`,
    rarityColor: '#E53E3E',
    stats: [
      { label: 'ВРЕМЯ НАКЛАДЫВАНИЯ', value: sp.castingTime },
      { label: 'ДИСТАНЦИЯ / ЗОНА', value: `${sp.range} (${sp.aoeShape} ${sp.aoeSizeFeet} фт.)` },
      { label: 'КОМПОНЕНТЫ', value: sp.components },
      { label: 'ДЛИТЕЛЬНОСТЬ', value: sp.duration },
      { label: 'СПАСБРОСОК / УРОН', value: `Сл ${sp.saveType} | ${sp.damageFormula} (${sp.damageType})` }
    ],
    sections: [
      {
        title: 'ОПИСАНИЕ ЗАКЛИНАНИЯ',
        type: 'text',
        content: sp.description
      },
      {
        title: 'НА БОЛЕЕ ВЫСОКИХ КРУГАХ',
        type: 'text',
        content: sp.higherLevelsDesc
      }
    ],
    flavorText: `Создано древним архимагом по имени ${sp.creatorMage}.`,
    footerNote: sp.appliedCondition ? `Дополнительное состояние: ${sp.appliedCondition}` : undefined
  };
}

export function wildMagicToHandoutCard(wm: WildMagicSurgeEffect): HandoutCardPayload {
  return {
    id: `wm_${Date.now()}`,
    category: 'wild_magic',
    title: `[d100: ${wm.d100Roll}] ${wm.title}`,
    subtitle: `Всплеск дикой магии • Категория: ${wm.category}`,
    badge: `d100: ${wm.d100Roll}`,
    rarityColor: '#E53E3E',
    stats: [
      { label: 'БРОСОК d100', value: wm.d100Roll },
      { label: 'КАТЕГОРИЯ', value: wm.category },
      { label: 'ДЛИТЕЛЬНОСТЬ', value: wm.duration }
    ],
    sections: [
      {
        title: 'ЭФФЕКТ СРЫВА ЗАКЛИНАНИЯ',
        type: 'quote',
        content: wm.desc
      }
    ],
    flavorText: 'Ткань Плетения разорвана хаотичным всплеском арканной энергии.',
    footerNote: `Действует: ${wm.duration}`
  };
}
