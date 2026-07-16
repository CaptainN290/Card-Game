// Card data and everything derived from it: pack odds, reward rolls, the
// starter collection, and the fixed Phase 1 AI deck.
//
// This file only deals with card DATA and game-economy LOGIC. Visual
// treatment (colors, gradients) lives in index.css, keyed off `tribe` and
// `rarity` class names, so this file has nothing to do with presentation.

import type { CardDefinition, Rarity } from './types';

// ---------------------------------------------------------------------------
// Deck-building rules (shared by Collection.tsx and battle.ts)
// ---------------------------------------------------------------------------

export const DECK_SIZE = 20;
export const MAX_COPIES_PER_CARD = 2;

// ---------------------------------------------------------------------------
// Shop
// ---------------------------------------------------------------------------

export const BASIC_PACK_PRICE = 100;

// ---------------------------------------------------------------------------
// Card database
// ---------------------------------------------------------------------------
// Roughly 6 cards per tribe (2 Common / 2 Rare / 1 Epic / 1 Legendary), 30
// total. Stat totals scale up with cost so the curve stays sane, and each
// tribe leans into a distinct identity that future tribe-specific mechanics
// could build on:
//   Beast   - balanced generalist
//   Dragon  - modest early, huge late
//   Machine - high health, low attack (tanky)
//   Undead  - high attack, low health (glass cannon)
//   Mage    - balanced-aggressive, magic flavor

export const CARD_DATABASE: CardDefinition[] = [
  // --- Beast ---------------------------------------------------------------
  {
    id: 'dire-wolf-pup',
    name: 'Dire Wolf Pup',
    tribe: 'Beast',
    rarity: 'Common',
    cost: 1,
    attack: 1,
    health: 2,
    description: 'Small in size, but its howl already chills the blood.',
    icon: '🐺',
  },
  {
    id: 'bramble-boar',
    name: 'Bramble Boar',
    tribe: 'Beast',
    rarity: 'Common',
    cost: 2,
    attack: 3,
    health: 2,
    description: 'Charges through thornbrush without slowing down.',
    icon: '🐗',
  },
  {
    id: 'shadowfang-stalker',
    name: 'Shadowfang Stalker',
    tribe: 'Beast',
    rarity: 'Rare',
    cost: 3,
    attack: 4,
    health: 3,
    description: 'You never hear it coming. That is the point.',
    icon: '🐈\u200d⬛',
  },
  {
    id: 'grimhorn-stag',
    name: 'Grimhorn Stag',
    tribe: 'Beast',
    rarity: 'Rare',
    cost: 4,
    attack: 4,
    health: 5,
    description: 'Its antlers have been sharpened on a thousand battlefields.',
    icon: '🦌',
  },
  {
    id: 'alpha-direwolf',
    name: 'Alpha Direwolf',
    tribe: 'Beast',
    rarity: 'Epic',
    cost: 5,
    attack: 6,
    health: 6,
    description: 'The pack does not move until it does.',
    icon: '🦁',
  },
  {
    id: 'worldroot-behemoth',
    name: 'Worldroot Behemoth',
    tribe: 'Beast',
    rarity: 'Legendary',
    cost: 7,
    attack: 8,
    health: 9,
    description: 'Older than the forest it calls home.',
    icon: '🦣',
  },

  // --- Dragon ---------------------------------------------------------------
  {
    id: 'wyrmling-scout',
    name: 'Wyrmling Scout',
    tribe: 'Dragon',
    rarity: 'Common',
    cost: 1,
    attack: 2,
    health: 1,
    description: 'Too young to breathe fire, old enough to bite.',
    icon: '🦎',
  },
  {
    id: 'cinder-drakeling',
    name: 'Cinder Drakeling',
    tribe: 'Dragon',
    rarity: 'Common',
    cost: 2,
    attack: 2,
    health: 3,
    description: 'Smoke curls from its nostrils when it gets excited.',
    icon: '🐲',
  },
  {
    id: 'ashwing-serpent',
    name: 'Ashwing Serpent',
    tribe: 'Dragon',
    rarity: 'Rare',
    cost: 3,
    attack: 3,
    health: 4,
    description: 'Leaves a trail of cinders wherever it flies.',
    icon: '🐍',
  },
  {
    id: 'emberclaw-wyvern',
    name: 'Emberclaw Wyvern',
    tribe: 'Dragon',
    rarity: 'Rare',
    cost: 4,
    attack: 5,
    health: 4,
    description: 'Its talons glow red-hot before every dive.',
    icon: '🦇',
  },
  {
    id: 'voidscale-drake',
    name: 'Voidscale Drake',
    tribe: 'Dragon',
    rarity: 'Epic',
    cost: 6,
    attack: 7,
    health: 7,
    description: 'Scales that seem to swallow the light around them.',
    icon: '🐉',
  },
  {
    id: 'ancient-doomwyrm',
    name: 'Ancient Doomwyrm',
    tribe: 'Dragon',
    rarity: 'Legendary',
    cost: 8,
    attack: 10,
    health: 10,
    description: 'Kingdoms fell the last time it opened its eyes.',
    icon: '🐉',
  },

  // --- Machine ---------------------------------------------------------------
  {
    id: 'rustbolt-sentry',
    name: 'Rustbolt Sentry',
    tribe: 'Machine',
    rarity: 'Common',
    cost: 1,
    attack: 1,
    health: 3,
    description: 'Slow to react, but built to take a beating.',
    icon: '🤖',
  },
  {
    id: 'clockwork-guardian',
    name: 'Clockwork Guardian',
    tribe: 'Machine',
    rarity: 'Common',
    cost: 2,
    attack: 2,
    health: 4,
    description: 'Wound once a century, never once late.',
    icon: '⚙️',
  },
  {
    id: 'steamforged-golem',
    name: 'Steamforged Golem',
    tribe: 'Machine',
    rarity: 'Rare',
    cost: 3,
    attack: 3,
    health: 6,
    description: 'Forged in pressure, tempered in war.',
    icon: '🛡️',
  },
  {
    id: 'ironclad-automaton',
    name: 'Ironclad Automaton',
    tribe: 'Machine',
    rarity: 'Rare',
    cost: 4,
    attack: 4,
    health: 7,
    description: 'No orders needed. Only targets.',
    icon: '🦾',
  },
  {
    id: 'siege-colossus',
    name: 'Siege Colossus',
    tribe: 'Machine',
    rarity: 'Epic',
    cost: 5,
    attack: 5,
    health: 9,
    description: 'Walls do not stop it. Walls slow it down.',
    icon: '🗿',
  },
  {
    id: 'titan-prime',
    name: 'Titan Prime',
    tribe: 'Machine',
    rarity: 'Legendary',
    cost: 7,
    attack: 7,
    health: 12,
    description: 'The last machine built before the forges went silent.',
    icon: '🤖',
  },

  // --- Undead ---------------------------------------------------------------
  {
    id: 'bone-skitterer',
    name: 'Bone Skitterer',
    tribe: 'Undead',
    rarity: 'Common',
    cost: 1,
    attack: 2,
    health: 1,
    description: 'A handful of bones with a single bad idea.',
    icon: '🦴',
  },
  {
    id: 'graveyard-ghoul',
    name: 'Graveyard Ghoul',
    tribe: 'Undead',
    rarity: 'Common',
    cost: 2,
    attack: 3,
    health: 2,
    description: 'Digs fast when it is hungry.',
    icon: '🧟',
  },
  {
    id: 'wailing-banshee',
    name: 'Wailing Banshee',
    tribe: 'Undead',
    rarity: 'Rare',
    cost: 3,
    attack: 4,
    health: 3,
    description: 'Her scream reaches you long before she does.',
    icon: '👻',
  },
  {
    id: 'plague-wraith',
    name: 'Plague Wraith',
    tribe: 'Undead',
    rarity: 'Rare',
    cost: 4,
    attack: 5,
    health: 3,
    description: 'Where it walks, nothing green grows again.',
    icon: '☠️',
  },
  {
    id: 'deathless-reaper',
    name: 'Deathless Reaper',
    tribe: 'Undead',
    rarity: 'Epic',
    cost: 5,
    attack: 7,
    health: 4,
    description: 'It has already collected your name.',
    icon: '💀',
  },
  {
    id: 'lich-king-malvorath',
    name: 'Lich King Malvorath',
    tribe: 'Undead',
    rarity: 'Legendary',
    cost: 7,
    attack: 9,
    health: 7,
    description: 'He died only once. He did not care for it.',
    icon: '🧛',
  },

  // --- Mage ---------------------------------------------------------------
  {
    id: 'apprentice-conjurer',
    name: 'Apprentice Conjurer',
    tribe: 'Mage',
    rarity: 'Common',
    cost: 1,
    attack: 1,
    health: 2,
    description: 'Still learning which spells not to say indoors.',
    icon: '🧙',
  },
  {
    id: 'flameweaver-adept',
    name: 'Flameweaver Adept',
    tribe: 'Mage',
    rarity: 'Common',
    cost: 2,
    attack: 3,
    health: 1,
    description: 'Every lesson ends in singed eyebrows.',
    icon: '🔥',
  },
  {
    id: 'frostbind-sorceress',
    name: 'Frostbind Sorceress',
    tribe: 'Mage',
    rarity: 'Rare',
    cost: 3,
    attack: 3,
    health: 3,
    description: 'Her calm is colder than her spells.',
    icon: '❄️',
  },
  {
    id: 'stormcaller-elementalist',
    name: 'Stormcaller Elementalist',
    tribe: 'Mage',
    rarity: 'Rare',
    cost: 4,
    attack: 4,
    health: 4,
    description: 'Thunder answers before she finishes speaking.',
    icon: '⚡',
  },
  {
    id: 'archmage-of-the-veil',
    name: 'Archmage of the Veil',
    tribe: 'Mage',
    rarity: 'Epic',
    cost: 5,
    attack: 6,
    health: 5,
    description: 'She has read every book. She wrote three of them.',
    icon: '🧙\u200d♂️',
  },
  {
    id: 'astral-devourer',
    name: 'Astral Devourer',
    tribe: 'Mage',
    rarity: 'Legendary',
    cost: 8,
    attack: 9,
    health: 8,
    description: 'It does not cast spells. It unmakes them.',
    icon: '🌌',
  },
];

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

const CARD_BY_ID: Record<string, CardDefinition> = {};
for (const card of CARD_DATABASE) {
  CARD_BY_ID[card.id] = card;
}

export function getCardById(id: string): CardDefinition | undefined {
  return CARD_BY_ID[id];
}

// ---------------------------------------------------------------------------
// Fixed Phase 1 AI opponent deck
// ---------------------------------------------------------------------------
// One Common + one Rare from every tribe, two copies each = 20 cards. This
// keeps the single Phase 1 opponent fair for a new player whose starter deck
// is all Commons, while still touching every tribe. A future difficulty
// system could add more AI_DECK variants alongside this one.

export const AI_DECK: string[] = [
  'dire-wolf-pup',
  'dire-wolf-pup',
  'shadowfang-stalker',
  'shadowfang-stalker',
  'wyrmling-scout',
  'wyrmling-scout',
  'ashwing-serpent',
  'ashwing-serpent',
  'rustbolt-sentry',
  'rustbolt-sentry',
  'steamforged-golem',
  'steamforged-golem',
  'bone-skitterer',
  'bone-skitterer',
  'wailing-banshee',
  'wailing-banshee',
  'apprentice-conjurer',
  'apprentice-conjurer',
  'frostbind-sorceress',
  'frostbind-sorceress',
];

// ---------------------------------------------------------------------------
// Starter collection / deck for brand new players
// ---------------------------------------------------------------------------
// Two copies of every Common (10 unique Commons) makes an exact 20-card
// starter deck, so a new player can hit "Play" immediately without visiting
// the Deck Builder first.

export function createStarterCollection(): Record<string, number> {
  const collection: Record<string, number> = {};
  for (const card of CARD_DATABASE) {
    if (card.rarity === 'Common') {
      collection[card.id] = MAX_COPIES_PER_CARD;
    }
  }
  return collection;
}

export function createStarterDeck(): string[] {
  const deck: string[] = [];
  for (const card of CARD_DATABASE) {
    if (card.rarity === 'Common') {
      for (let i = 0; i < MAX_COPIES_PER_CARD; i++) {
        deck.push(card.id);
      }
    }
  }
  return deck;
}

// ---------------------------------------------------------------------------
// Rarity odds, booster packs, and battle rewards
// ---------------------------------------------------------------------------

export const RARITY_ORDER: Rarity[] = ['Common', 'Rare', 'Epic', 'Legendary'];

export const PACK_ODDS: Record<Rarity, number> = {
  Common: 0.55,
  Rare: 0.3,
  Epic: 0.12,
  Legendary: 0.03,
};

function rollRarity(): Rarity {
  const roll = Math.random();
  let cumulative = 0;
  for (const rarity of RARITY_ORDER) {
    cumulative += PACK_ODDS[rarity];
    if (roll < cumulative) return rarity;
  }
  return 'Common'; // safety net against floating point rounding
}

function randomCardOfRarity(rarity: Rarity): CardDefinition {
  const pool = CARD_DATABASE.filter((c) => c.rarity === rarity);
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Opens a booster pack, returning `count` cards (duplicates allowed). */
export function openBoosterPack(count = 5): CardDefinition[] {
  const results: CardDefinition[] = [];
  for (let i = 0; i < count; i++) {
    results.push(randomCardOfRarity(rollRarity()));
  }
  return results;
}

/** Battle reward: a lump sum of gold. */
export function rollGoldReward(): number {
  return Math.floor(Math.random() * 21) + 20; // 20-40
}

/**
 * Battle reward: a single new card. Prefers a card the player doesn't
 * already own (that's what makes it feel like a "new" card); falls back to
 * any card of the rolled rarity once the collection is complete.
 */
export function rollNewCardReward(ownedCardIds: Set<string>): CardDefinition {
  const unowned = CARD_DATABASE.filter((c) => !ownedCardIds.has(c.id));
  const pool = unowned.length > 0 ? unowned : CARD_DATABASE;

  const rarity = rollRarity();
  const candidates = pool.filter((c) => c.rarity === rarity);
  const finalPool = candidates.length > 0 ? candidates : pool;

  return finalPool[Math.floor(Math.random() * finalPool.length)];
}
