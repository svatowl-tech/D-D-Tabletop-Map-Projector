/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * База данных D&D 5e SRD: бестиарий монстров со статблоками,
 * заклинания, состояния и магические предметы для быстрого доступа мастера.
 */

export interface SRDMonster {
  id: string;
  name: string;
  type: string; // Humanoid, Undead, Dragon, Beast, Fiend, etc.
  cr: string;
  ac: number;
  hp: number;
  speed: string;
  stats: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  traits: string[];
  actions: Array<{ name: string; desc: string; damage?: string }>;
}

export interface SRDSpell {
  id: string;
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: string;
  duration: string;
  aoe?: string;
  description: string;
}

export interface SRDCondition {
  id: string;
  name: string;
  color: string;
  description: string;
}

export interface SRDItem {
  id: string;
  name: string;
  type: string;
  rarity: string;
  description: string;
}

export const SRD_MONSTERS: SRDMonster[] = [
  {
    id: 'goblin',
    name: 'Goblin (Гоблин)',
    type: 'Small Humanoid (Goblinoid), Neutral Evil',
    cr: '1/4 (50 XP)',
    ac: 15,
    hp: 7,
    speed: '30 ft.',
    stats: { str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8 },
    traits: ['Nimble Escape: Может совершать Disengage или Hide бонусным действием.'],
    actions: [
      { name: 'Scimitar', desc: '+4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) slashing damage.', damage: '1d6+2' },
      { name: 'Shortbow', desc: '+4 to hit, range 80/320 ft., one target. Hit: 5 (1d6 + 2) piercing damage.', damage: '1d6+2' }
    ]
  },
  {
    id: 'skeleton',
    name: 'Skeleton (Скелет)',
    type: 'Medium Undead, Lawful Evil',
    cr: '1/4 (50 XP)',
    ac: 13,
    hp: 13,
    speed: '30 ft.',
    stats: { str: 10, dex: 14, con: 15, int: 6, wis: 8, cha: 5 },
    traits: ['Damage Vulnerabilities: Bludgeoning', 'Condition Immunities: Poisoned, Exhaustion'],
    actions: [
      { name: 'Shortsword', desc: '+4 to hit, reach 5 ft., Hit: 5 (1d6 + 2) piercing damage.', damage: '1d6+2' },
      { name: 'Shortbow', desc: '+4 to hit, range 80/320 ft., Hit: 5 (1d6 + 2) piercing damage.', damage: '1d6+2' }
    ]
  },
  {
    id: 'orc',
    name: 'Orc (Орк)',
    type: 'Medium Humanoid (Orc), Chaotic Evil',
    cr: '1/2 (100 XP)',
    ac: 13,
    hp: 15,
    speed: '30 ft.',
    stats: { str: 16, dex: 12, con: 16, int: 7, wis: 11, cha: 10 },
    traits: ['Aggressive: Бонусным действием может переместиться на свою скорость к врагу.'],
    actions: [
      { name: 'Greataxe', desc: '+5 to hit, reach 5 ft., Hit: 9 (1d12 + 3) slashing damage.', damage: '1d12+3' },
      { name: 'Javelin', desc: '+5 to hit, range 30/120 ft., Hit: 6 (1d6 + 3) piercing damage.', damage: '1d6+3' }
    ]
  },
  {
    id: 'bandit_captain',
    name: 'Bandit Captain (Главарь Бандитов)',
    type: 'Medium Humanoid, Non-Lawful',
    cr: '2 (450 XP)',
    ac: 15,
    hp: 65,
    speed: '30 ft.',
    stats: { str: 15, dex: 16, con: 14, int: 14, wis: 11, cha: 14 },
    traits: ['Multiattack: 3 melee attacks (2 with Scimitar, 1 with Dagger) or 2 ranged with Daggers.'],
    actions: [
      { name: 'Scimitar', desc: '+5 to hit, reach 5 ft., Hit: 6 (1d6 + 3) slashing.', damage: '1d6+3' },
      { name: 'Dagger', desc: '+5 to hit, reach 5 ft. or 20/60 ft., Hit: 5 (1d4 + 3) piercing.', damage: '1d4+3' },
      { name: 'Parry (Reaction)', desc: 'Adds 2 to its AC against one melee attack that would hit it.' }
    ]
  },
  {
    id: 'young_red_dragon',
    name: 'Young Red Dragon (Молодой Красный Дракон)',
    type: 'Large Dragon, Chaotic Evil',
    cr: '10 (5,900 XP)',
    ac: 18,
    hp: 178,
    speed: '40 ft., climb 40 ft., fly 80 ft.',
    stats: { str: 23, dex: 10, con: 21, int: 14, wis: 11, cha: 19 },
    traits: ['Damage Immunities: Fire', 'Blindsight 30 ft., Darkvision 120 ft.'],
    actions: [
      { name: 'Multiattack', desc: 'Makes three attacks: one with its Bite and two with its Claws.' },
      { name: 'Bite', desc: '+10 to hit, reach 10 ft., Hit: 17 (2d10 + 6) piercing + 3 (1d6) fire.', damage: '2d10+6+1d6' },
      { name: 'Claw', desc: '+10 to hit, reach 5 ft., Hit: 13 (2d6 + 6) slashing.', damage: '2d6+6' },
      { name: 'Fire Breath (Recharge 5-6)', desc: 'The dragon exhales fire in a 30-foot cone. Each creature must make a DC 17 Dex save, taking 56 (16d6) fire on failure, or half on success.', damage: '16d6' }
    ]
  },
  {
    id: 'mimic',
    name: 'Mimic (Мимик)',
    type: 'Medium Monstrosity (Shapechanger), Neutral',
    cr: '2 (450 XP)',
    ac: 12,
    hp: 58,
    speed: '15 ft.',
    stats: { str: 17, dex: 12, con: 15, int: 5, wis: 13, cha: 8 },
    traits: ['Shapechanger: Может превращаться в любой предмет (сундук, дверь, стол).', 'Adhesive: Существа, коснувшиеся мимика, становятся Grappled (DC 13 escape).'],
    actions: [
      { name: 'Pseudopod', desc: '+5 to hit, reach 5 ft., Hit: 7 (1d8 + 3) bludgeoning. Subject to Adhesive trait.', damage: '1d8+3' },
      { name: 'Bite', desc: '+5 to hit, reach 5 ft., Hit: 7 (1d8 + 3) piercing + 4 (1d8) acid damage.', damage: '1d8+3+1d8' }
    ]
  },
  {
    id: 'gelatinous_cube',
    name: 'Gelatinous Cube (Желатиновый Куб)',
    type: 'Large Ooze, Unaligned',
    cr: '2 (450 XP)',
    ac: 6,
    hp: 84,
    speed: '15 ft.',
    stats: { str: 14, dex: 3, con: 20, int: 1, wis: 6, cha: 1 },
    traits: ['Transparent: DC 15 Perception to spot while motionless.', 'Condition Immunities: Blinded, Charmed, Deafened, Exhaustion, Prone.'],
    actions: [
      { name: 'Pseudopod', desc: '+4 to hit, reach 5 ft., Hit: 10 (3d6) acid damage.', damage: '3d6' },
      { name: 'Engulf', desc: 'Enters creature space. DC 12 Dex save or engulfed, taking 10 (3d6) acid and Restrained.' }
    ]
  },
  {
    id: 'lich',
    name: 'Lich (Лич)',
    type: 'Medium Undead, Any Evil',
    cr: '21 (33,000 XP)',
    ac: 17,
    hp: 135,
    speed: '30 ft.',
    stats: { str: 11, dex: 16, con: 16, int: 20, wis: 14, cha: 16 },
    traits: ['Legendary Resistance (3/Day)', 'Rejuvenation (Phylactery)', 'Spellcasting (9th level wizard)'],
    actions: [
      { name: 'Paralyzing Touch', desc: '+12 to hit, reach 5 ft., Hit: 10 (3d6) cold damage, DC 18 Con save or Paralyzed for 1 min.', damage: '3d6' },
      { name: 'Power Word Kill (9th)', desc: 'Target creature with 100 HP or fewer dies instantly.' },
      { name: 'Finger of Death (7th)', desc: 'DC 18 Con save, 61 (7d8 + 30) necrotic damage. Rises as zombie if killed.' }
    ]
  }
];

export const SRD_SPELLS: SRDSpell[] = [
  {
    id: 'fireball',
    name: 'Fireball (Огненный Шар)',
    level: 3,
    school: 'Evocation',
    castingTime: '1 Action',
    range: '150 feet',
    components: 'V, S, M (bat guano and sulfur)',
    duration: 'Instantaneous',
    aoe: '20-foot radius sphere',
    description: 'Вспышка пламени взрывается в указанной точке. Каждое существо в сфере радиусом 20 футов совершает спасбросок Ловкости (DC заклинателя). Урон 8d6 огнем при провале или половина при успехе.'
  },
  {
    id: 'cure_wounds',
    name: 'Cure Wounds (Лечение Ран)',
    level: 1,
    school: 'Evocation',
    castingTime: '1 Action',
    range: 'Touch',
    components: 'V, S',
    duration: 'Instantaneous',
    description: 'Существо восстанавливает количество хитов, равное 1d8 + модификатор вашей базовой характеристики.'
  },
  {
    id: 'eldritch_blast',
    name: 'Eldritch Blast (Мистический Залп)',
    level: 0,
    school: 'Evocation',
    castingTime: '1 Action',
    range: '120 feet',
    components: 'V, S',
    duration: 'Instantaneous',
    description: 'Луч потрескивающей энергии устремляется к врагу. Совершите дальнобойную атаку. При попадании цель получает 1d10 урона силовым полем.'
  },
  {
    id: 'lightning_bolt',
    name: 'Lightning Bolt (Молния)',
    level: 3,
    school: 'Evocation',
    castingTime: '1 Action',
    range: 'Self (100-foot line)',
    components: 'V, S, M (fur and amber)',
    duration: 'Instantaneous',
    aoe: '100-foot line (5 ft. wide)',
    description: 'Луч молнии шириной 5 футов и длиной 100 футов. Каждое существо на линии получает 8d6 урона электричеством (спасбросок DC Dex на половину).'
  },
  {
    id: 'haste',
    name: 'Haste (Ускорение)',
    level: 3,
    school: 'Transmutation',
    castingTime: '1 Action',
    range: '30 feet',
    components: 'V, S, M (licorice root)',
    duration: 'Concentration, up to 1 minute',
    description: 'Скорость цели удваивается, +2 к AC, преимущество на спасброски Ловкости, и дополнительное действие каждый ход (Attack, Dash, Disengage, Hide, Use Object).'
  },
  {
    id: 'shield',
    name: 'Shield (Щит)',
    level: 1,
    school: 'Abjuration',
    castingTime: '1 Reaction (when hit by an attack)',
    range: 'Self',
    components: 'V, S',
    duration: '1 round',
    description: 'Невидимый магический барьер дает +5 к КД против всех атак до начала вашего следующего хода и блокирует урон от Magic Missile.'
  }
];

export const SRD_CONDITIONS: SRDCondition[] = [
  {
    id: 'blinded',
    name: 'Blinded (Ослеплен)',
    color: '#E53E3E',
    description: 'Существо автоматически проваливает проверки, требующие зрения. Атаки по нему имеют преимущество, его атаки совершаются с помехой.'
  },
  {
    id: 'charmed',
    name: 'Charmed (Очарован)',
    color: '#ED64A6',
    description: 'Существо не может атаковать того, кто его очаровал. Очарователь совершает социальные проверки с преимуществом.'
  },
  {
    id: 'frightened',
    name: 'Frightened (Испуган)',
    color: '#9F7AEA',
    description: 'Помеха на проверки характеристик и атаки, пока источник страха в поле зрения. Не может добровольно приблизиться к источнику.'
  },
  {
    id: 'grappled',
    name: 'Grappled (Захвачен)',
    color: '#DD6B20',
    description: 'Скорость равна 0. Захват прекращается, если цель выбита из досягаемости захватившего.'
  },
  {
    id: 'invisible',
    name: 'Invisible (Невидим)',
    color: '#4FD1C5',
    description: 'Невозможно увидеть без магии. Атаки по невидимому совершаются с помехой, его атаки имеют преимущество.'
  },
  {
    id: 'paralyzed',
    name: 'Paralyzed (Парализован)',
    color: '#D69E2E',
    description: 'Недееспособен, не может двигаться и говорить. Автопровал спасбросков Силы и Ловкости. Атаки имеют преимущество, попадания в пределах 5 фт — критические.'
  },
  {
    id: 'poisoned',
    name: 'Poisoned (Отравлен)',
    color: '#48BB78',
    description: 'Помеха на все броски атак и проверки характеристик.'
  },
  {
    id: 'prone',
    name: 'Prone (Сбит с ног)',
    color: '#A0AEC0',
    description: 'Может только ползти (тратит 2 фт за 1 фт). Помеха на свои атаки. Атаки ближнего боя по лежачему имеют преимущество, дальние — помеху.'
  },
  {
    id: 'stunned',
    name: 'Stunned (Оглушен)',
    color: '#ECC94B',
    description: 'Недееспособен, не может двигаться, говорит с запинками. Автопровал спасбросков Силы/Ловкости. Атаки по нему совершаются с преимуществом.'
  },
  {
    id: 'unconscious',
    name: 'Unconscious (Без сознания)',
    color: '#1A202C',
    description: 'Недееспособен, падает ничком, роняет всё из рук. Автопровал Силы/Ловкости. Атаки имеют преимущество, атаки в 5 фт — критические попадания.'
  }
];

export const SRD_ITEMS: SRDItem[] = [
  {
    id: 'potion_healing',
    name: 'Potion of Healing (Зелье Лечения)',
    type: 'Potion',
    rarity: 'Common',
    description: 'Восстанавливает 2d4 + 2 хитов.'
  },
  {
    id: 'bag_of_holding',
    name: 'Bag of Holding (Бездонная Сумка)',
    type: 'Wondrous Item',
    rarity: 'Uncommon',
    description: 'Вмещает до 500 фунтов веса и до 64 кубических футов объема, всегда весит 15 фунтов.'
  },
  {
    id: 'cloak_elvenkind',
    name: 'Cloak of Elvenkind (Плащ Эльфийского Рода)',
    type: 'Wondrous Item (Attunement)',
    rarity: 'Uncommon',
    description: 'Преимущество на проверки Скрытности (Stealth). Враги совершают проверки Perception на поиск вас с помехой.'
  },
  {
    id: 'sword_plus_one',
    name: '+1 Weapon (+1 Оружие)',
    type: 'Weapon',
    rarity: 'Uncommon',
    description: '+1 бонус к броскам атак и урона. Считается магическим оружием.'
  }
];
