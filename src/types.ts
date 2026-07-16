// Shared type definitions for the whole app.
//
// Keeping these in one file (instead of scattering them across every module)
// is what lets cards.ts, battle.ts, save.ts, and every component agree on a
// single shape for a "card", a "battle state", and so on. When Phase 2 adds
// new tribes, mechanics, or screens, this is the file to extend first.

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------

export type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';

export type Tribe = 'Beast' | 'Dragon' | 'Machine' | 'Undead' | 'Mage';

export interface CardDefinition {
  id: string;
  name: string;
  tribe: Tribe;
  rarity: Rarity;
  cost: number;
  attack: number;
  health: number;
  description: string;
  /** Emoji used as placeholder artwork until real card art exists. */
  icon: string;
}

// ---------------------------------------------------------------------------
// Save data (everything persisted to LocalStorage)
// ---------------------------------------------------------------------------

export interface GameSettings {
  reducedMotion: boolean;
}

export interface SaveData {
  /** Bumped whenever the save shape changes, so save.ts can migrate old saves. */
  version: number;
  /** cardId -> number of copies owned. Absence of a key means 0 owned. */
  collection: Record<string, number>;
  /** Card ids currently in the active deck. A card may appear up to twice. */
  deck: string[];
  gold: number;
  /** Booster packs earned but not yet opened. */
  packsUnopened: number;
  settings: GameSettings;
}

// ---------------------------------------------------------------------------
// Screens (App.tsx swaps between these; no router library needed)
// ---------------------------------------------------------------------------

export type GameScreen = 'menu' | 'battle' | 'collection' | 'shop' | 'settings' | 'packOpening';

// ---------------------------------------------------------------------------
// Battle rewards
// ---------------------------------------------------------------------------

export type BattleReward =
  | { type: 'gold'; goldAmount: number }
  | { type: 'card'; card: CardDefinition }
  | { type: 'pack' };

// ---------------------------------------------------------------------------
// Battle / combat
// ---------------------------------------------------------------------------

export type Side = 'player' | 'enemy';

/** A card that has been played onto the board and is now a physical monster. */
export interface BoardMonster {
  instanceId: string;
  cardId: string;
  attack: number;
  currentHealth: number;
  maxHealth: number;
}

/** A lane on the board: either an active monster, or empty. */
export type BoardLane = BoardMonster | null;

/** A card sitting in a player's hand (not yet played). */
export interface HandCard {
  instanceId: string;
  cardId: string;
}

export interface CombatantState {
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  /** Remaining cards in draw order. Index 0 is drawn next. */
  deck: string[];
  hand: HandCard[];
  /** Always length 5. board[i] faces the opponent's board[i]. */
  board: BoardLane[];
}

export interface BattleState {
  player: CombatantState;
  enemy: CombatantState;
  activeSide: Side;
  turnNumber: number;
  winner: Side | null;
  /** Human-readable battle log, oldest first. */
  log: string[];
}
