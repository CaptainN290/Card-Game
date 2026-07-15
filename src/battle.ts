// The combat engine. Every function here is a pure function of
// `(state, ...args) -> newState` - nothing here touches the DOM, React, or
// LocalStorage, which makes it easy to test in isolation and easy to reuse
// if a future PvP mode needs the same rules.
//
// Combat rules (Phase 1, deliberately simple - no spells, traps, status
// effects, or summoning sickness):
//   - Each side has 5 lanes. One monster per lane.
//   - At the end of the active side's turn, every monster in their lanes
//     attacks the lane directly opposite it.
//   - If that opposing lane has a monster, both trade damage simultaneously
//     (a "clash"). Whichever drops to 0 health is destroyed. Damage a
//     monster survives persists - there is no healing between turns.
//   - If the opposing lane is empty, the attack goes straight to that
//     player's face.
//   - A newly-played monster can attack the same turn it's played (no
//     summoning sickness), which keeps the rules to a single sentence and
//     is an easy thing to layer a "haste"-style exception onto later.

import type { BattleState, BoardLane, BoardMonster, CombatantState, HandCard, Side } from './types';
import { getCardById } from './cards';

export const STARTING_HP = 30;
export const MAX_ENERGY_CAP = 10;
export const MAX_HAND_SIZE = 10;
export const BOARD_LANES = 5;
const INITIAL_HAND_SIZE = 5;

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

let instanceCounter = 0;
function generateInstanceId(): string {
  instanceCounter += 1;
  return `inst-${Date.now()}-${instanceCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

function cardName(cardId: string): string {
  return getCardById(cardId)?.name ?? 'Unknown card';
}

function otherSide(side: Side): Side {
  return side === 'player' ? 'enemy' : 'player';
}

// ---------------------------------------------------------------------------
// Setting up a battle
// ---------------------------------------------------------------------------

function createCombatant(deckIds: string[]): CombatantState {
  const shuffled = shuffle(deckIds);
  const hand: HandCard[] = [];
  for (let i = 0; i < INITIAL_HAND_SIZE && i < shuffled.length; i++) {
    hand.push({ instanceId: generateInstanceId(), cardId: shuffled[i] });
  }
  const deck = shuffled.slice(hand.length);
  const emptyBoard: BoardLane[] = [null, null, null, null, null];

  return {
    hp: STARTING_HP,
    maxHp: STARTING_HP,
    energy: 0,
    maxEnergy: 0,
    deck,
    hand,
    board: emptyBoard,
  };
}

/**
 * Gives `side` their start-of-turn refresh: max energy goes up by 1 (capped),
 * energy refills to that new max, and they draw a card if they have room in
 * hand and cards left in their deck.
 *
 * A side's very first turn is the exception: their opening 5-card hand
 * already counts as their "first draw", so this skips the bonus draw only
 * when maxEnergy is still 0 (i.e. this side hasn't had a turn yet). Without
 * this, both sides would open with 6 cards but only 1 energy to spend on
 * their first turn, which is cluttered for no real benefit.
 */
function startTurn(state: BattleState, side: Side): BattleState {
  const combatant = state[side];
  const isFirstTurnForSide = combatant.maxEnergy === 0;
  const newMaxEnergy = Math.min(combatant.maxEnergy + 1, MAX_ENERGY_CAP);

  let hand = combatant.hand;
  let deck = combatant.deck;
  const log = [...state.log];

  if (!isFirstTurnForSide && deck.length > 0 && hand.length < MAX_HAND_SIZE) {
    const [drawnId, ...rest] = deck;
    deck = rest;
    hand = [...hand, { instanceId: generateInstanceId(), cardId: drawnId }];
  }

  const updated: CombatantState = {
    ...combatant,
    maxEnergy: newMaxEnergy,
    energy: newMaxEnergy,
    hand,
    deck,
  };

  return { ...state, [side]: updated, log };
}

/** Starts a fresh battle between two decks (lists of card ids). */
export function initBattle(playerDeckIds: string[], enemyDeckIds: string[]): BattleState {
  let state: BattleState = {
    player: createCombatant(playerDeckIds),
    enemy: createCombatant(enemyDeckIds),
    activeSide: 'player',
    turnNumber: 1,
    winner: null,
    log: ['The battle begins.'],
  };
  state = startTurn(state, 'player');
  return state;
}

// ---------------------------------------------------------------------------
// Playing a card
// ---------------------------------------------------------------------------

export interface PlayCardResult {
  state: BattleState;
  success: boolean;
  error?: string;
}

export function playCard(state: BattleState, side: Side, handInstanceId: string, lane: number): PlayCardResult {
  if (state.winner) return { state, success: false, error: 'The battle is already over.' };
  if (state.activeSide !== side) return { state, success: false, error: "It isn't your turn." };
  if (lane < 0 || lane >= BOARD_LANES) return { state, success: false, error: 'That lane does not exist.' };

  const combatant = state[side];
  if (combatant.board[lane] !== null) {
    return { state, success: false, error: 'That lane is already occupied.' };
  }

  const handCard = combatant.hand.find((h) => h.instanceId === handInstanceId);
  if (!handCard) return { state, success: false, error: "That card isn't in hand." };

  const cardDef = getCardById(handCard.cardId);
  if (!cardDef) return { state, success: false, error: 'Unknown card.' };

  if (combatant.energy < cardDef.cost) {
    return { state, success: false, error: 'Not enough energy.' };
  }

  const newMonster: BoardMonster = {
    instanceId: generateInstanceId(),
    cardId: cardDef.id,
    attack: cardDef.attack,
    currentHealth: cardDef.health,
    maxHealth: cardDef.health,
  };

  const newBoard = [...combatant.board];
  newBoard[lane] = newMonster;

  const updated: CombatantState = {
    ...combatant,
    energy: combatant.energy - cardDef.cost,
    hand: combatant.hand.filter((h) => h.instanceId !== handInstanceId),
    board: newBoard,
  };

  const who = side === 'player' ? 'You' : 'The enemy';
  const newState: BattleState = {
    ...state,
    [side]: updated,
    log: [...state.log, `${who} played ${cardDef.name}.`],
  };

  return { state: newState, success: true };
}

// ---------------------------------------------------------------------------
// Ending a turn: resolve combat, then hand play to the other side
// ---------------------------------------------------------------------------

export interface CombatEvent {
  lane: number;
  isFaceDamage: boolean;
  /** Damage dealt to the defending monster (clash) or defending player's HP (face hit). */
  damageToDefender: number;
  defenderDestroyed: boolean;
  /** 0 for face hits - an empty lane can't hit back. */
  damageToAttacker: number;
  attackerDestroyed: boolean;
}

export interface EndTurnResult {
  state: BattleState;
  /** Lane indices (on the attacking side's board) that attacked this resolution. */
  attackedLanes: number[];
  /** Same information as attackedLanes, structured for damage numbers / dissolve animations. */
  events: CombatEvent[];
}

export function endTurn(state: BattleState): EndTurnResult {
  if (state.winner) return { state, attackedLanes: [], events: [] };

  const attackerSide = state.activeSide;
  const defenderSide = otherSide(attackerSide);
  const attacker = state[attackerSide];
  const defender = state[defenderSide];

  const newAttackerBoard = [...attacker.board];
  const newDefenderBoard = [...defender.board];
  let defenderHp = defender.hp;
  const log = [...state.log];
  const attackedLanes: number[] = [];
  const events: CombatEvent[] = [];

  for (let lane = 0; lane < BOARD_LANES; lane++) {
    const attackingMonster = newAttackerBoard[lane];
    if (!attackingMonster) continue;
    attackedLanes.push(lane);

    const defendingMonster = newDefenderBoard[lane];
    const attackerName = cardName(attackingMonster.cardId);

    if (defendingMonster) {
      const defenderName = cardName(defendingMonster.cardId);
      const remainingDefenderHealth = defendingMonster.currentHealth - attackingMonster.attack;
      const remainingAttackerHealth = attackingMonster.currentHealth - defendingMonster.attack;

      log.push(`${attackerName} clashes with ${defenderName} in lane ${lane + 1}.`);

      newDefenderBoard[lane] =
        remainingDefenderHealth > 0 ? { ...defendingMonster, currentHealth: remainingDefenderHealth } : null;
      newAttackerBoard[lane] =
        remainingAttackerHealth > 0 ? { ...attackingMonster, currentHealth: remainingAttackerHealth } : null;

      if (remainingDefenderHealth <= 0) log.push(`${defenderName} is destroyed.`);
      if (remainingAttackerHealth <= 0) log.push(`${attackerName} is destroyed.`);

      events.push({
        lane,
        isFaceDamage: false,
        damageToDefender: attackingMonster.attack,
        defenderDestroyed: remainingDefenderHealth <= 0,
        damageToAttacker: defendingMonster.attack,
        attackerDestroyed: remainingAttackerHealth <= 0,
      });
    } else {
      defenderHp -= attackingMonster.attack;
      log.push(`${attackerName} strikes directly for ${attackingMonster.attack}.`);

      events.push({
        lane,
        isFaceDamage: true,
        damageToDefender: attackingMonster.attack,
        defenderDestroyed: false,
        damageToAttacker: 0,
        attackerDestroyed: false,
      });
    }
  }

  let winner: Side | null = null;
  if (defenderHp <= 0) {
    defenderHp = 0;
    winner = attackerSide;
    log.push(attackerSide === 'player' ? 'You are victorious!' : 'The enemy is victorious.');
  }

  let newState: BattleState = {
    ...state,
    [attackerSide]: { ...attacker, board: newAttackerBoard },
    [defenderSide]: { ...defender, board: newDefenderBoard, hp: defenderHp },
    log,
    winner,
  };

  if (!winner) {
    newState = { ...newState, activeSide: defenderSide, turnNumber: state.turnNumber + 1 };
    newState = startTurn(newState, defenderSide);
  }

  return { state: newState, attackedLanes, events };
}

// ---------------------------------------------------------------------------
// Simple AI (Phase 1 has exactly one opponent, so one heuristic is enough)
// ---------------------------------------------------------------------------

export interface AIMove {
  handInstanceId: string;
  lane: number;
}

/**
 * Plans the enemy's whole turn up front, against a snapshot of the current
 * state. Board.tsx applies each move in sequence with a short delay between
 * them for visual clarity; since nothing else can change enemy energy or
 * lanes mid-turn, replaying these moves via the real playCard() always
 * matches this plan exactly.
 */
export function planAIMoves(state: BattleState): AIMove[] {
  if (state.activeSide !== 'enemy' || state.winner) return [];

  const moves: AIMove[] = [];
  let energy = state.enemy.energy;
  const simulatedBoard = [...state.enemy.board];
  const playerBoard = state.player.board;

  const playableHand = state.enemy.hand
    .map((h) => ({ hand: h, card: getCardById(h.cardId) }))
    .filter((entry): entry is { hand: HandCard; card: NonNullable<typeof entry.card> } => entry.card !== undefined)
    .sort((a, b) => b.card.cost - a.card.cost); // biggest threats first

  for (const entry of playableHand) {
    if (entry.card.cost > energy) continue;

    const emptyLanes: number[] = [];
    for (let i = 0; i < BOARD_LANES; i++) {
      if (simulatedBoard[i] === null) emptyLanes.push(i);
    }
    if (emptyLanes.length === 0) break;

    let bestLane = emptyLanes[0];
    let bestScore = -Infinity;
    for (const lane of emptyLanes) {
      const opposing = playerBoard[lane];
      let score: number;
      if (!opposing) {
        score = 100 + entry.card.attack; // guaranteed face damage, prefer biggest hit
      } else {
        const wouldKill = entry.card.attack >= opposing.currentHealth;
        const wouldSurvive = opposing.attack < entry.card.health;
        if (wouldKill && wouldSurvive) score = 80; // clean kill
        else if (wouldKill) score = 50; // trade
        else score = 10; // bad block, but still better than nothing
      }
      if (score > bestScore) {
        bestScore = score;
        bestLane = lane;
      }
    }

    moves.push({ handInstanceId: entry.hand.instanceId, lane: bestLane });
    simulatedBoard[bestLane] = {
      instanceId: 'planned',
      cardId: entry.card.id,
      attack: entry.card.attack,
      currentHealth: entry.card.health,
      maxHealth: entry.card.health,
    };
    energy -= entry.card.cost;
  }

  return moves;
}
