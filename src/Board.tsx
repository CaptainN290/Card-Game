// The battle screen. Owns the live BattleState and drives the turn flow:
// player acts -> end turn -> combat resolves -> AI acts -> AI ends turn ->
// combat resolves -> back to player. All actual game rules live in
// battle.ts; this file is purely about presenting that state and pacing it
// with small delays so combat is readable instead of instant.
//
// Phase 2 note: the only thing added here beyond presentation is reading the
// richer `events` array battle.ts now returns from endTurn() - that's just
// more detail about combat that already happened (for damage numbers and the
// dissolve effect), not a change to what happens.

import { useEffect, useRef, useState } from 'react';
import type { BattleReward, BattleState, BoardLane, Side } from './types';
import { endTurn, initBattle, planAIMoves, playCard } from './battle';
import { AI_DECK, getCardById, rollGoldReward, rollNewCardReward } from './cards';
import { playAttack, playCardPlay, playDefeat, playVictory } from './sound';
import Card from './Card';

interface BoardProps {
  playerDeck: string[];
  ownedCardIds: string[];
  reducedMotion: boolean;
  onBattleEnd: (result: 'win' | 'loss', reward?: BattleReward) => void;
}

interface FloatingDamage {
  id: string;
  side: Side;
  lane: number;
  amount: number;
  kind: 'face' | 'lane';
}

function renderLaneContent(monster: BoardLane) {
  if (!monster) return null;
  const cardDef = getCardById(monster.cardId);
  if (!cardDef) return null;
  return <Card card={cardDef} variant="compact" currentHealth={monster.currentHealth} />;
}

export default function Board({ playerDeck, ownedCardIds, reducedMotion, onBattleEnd }: BoardProps) {
  const [battle, setBattle] = useState<BattleState>(() => initBattle(playerDeck, AI_DECK));
  const [selectedHandCard, setSelectedHandCard] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [flashLanes, setFlashLanes] = useState<{ side: Side; lanes: number[] } | null>(null);
  const [dissolvingLanes, setDissolvingLanes] = useState<{ side: Side; lane: number }[]>([]);
  const [floatingDamage, setFloatingDamage] = useState<FloatingDamage[]>([]);
  const [showLog, setShowLog] = useState(false);
  const timeoutsRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  function scheduleTimeout(fn: () => void, ms: number) {
    const delay = reducedMotion ? Math.min(ms, 80) : ms;
    const id = window.setTimeout(fn, delay);
    timeoutsRef.current.push(id);
  }

  function handleEndTurnResolution(state: BattleState) {
    const { state: newState, attackedLanes, events } = endTurn(state);
    const attackerSide = state.activeSide;
    const defenderSide: Side = attackerSide === 'player' ? 'enemy' : 'player';

    const floaters: FloatingDamage[] = [];
    const dissolves: { side: Side; lane: number }[] = [];

    events.forEach((event, index) => {
      if (event.isFaceDamage) {
        floaters.push({ id: `f${index}`, side: defenderSide, lane: event.lane, amount: event.damageToDefender, kind: 'face' });
      } else {
        floaters.push({ id: `d${index}`, side: defenderSide, lane: event.lane, amount: event.damageToDefender, kind: 'lane' });
        if (event.damageToAttacker > 0) {
          floaters.push({ id: `a${index}`, side: attackerSide, lane: event.lane, amount: event.damageToAttacker, kind: 'lane' });
        }
        if (event.defenderDestroyed) dissolves.push({ side: defenderSide, lane: event.lane });
        if (event.attackerDestroyed) dissolves.push({ side: attackerSide, lane: event.lane });
      }
    });

    if (events.length > 0) playAttack();

    setFlashLanes({ side: attackerSide, lanes: attackedLanes });
    setDissolvingLanes(dissolves);
    setFloatingDamage(floaters);

    scheduleTimeout(() => {
      setBattle(newState);
      setFlashLanes(null);
      setDissolvingLanes([]);
      setFloatingDamage([]);
      setIsResolving(false);
    }, 700);
  }

  function runAITurn() {
    setIsResolving(true);
    const moves = planAIMoves(battle);

    const applyNextMove = (index: number, state: BattleState) => {
      if (index >= moves.length) {
        scheduleTimeout(() => handleEndTurnResolution(state), 400);
        return;
      }
      const move = moves[index];
      const result = playCard(state, 'enemy', move.handInstanceId, move.lane);
      const nextState = result.success ? result.state : state;
      setBattle(nextState);
      scheduleTimeout(() => applyNextMove(index + 1, nextState), 550);
    };

    scheduleTimeout(() => applyNextMove(0, battle), 550);
  }

  // Kick off the enemy's turn whenever it becomes active. The dependency
  // array only changes when activeSide/winner actually change, so this
  // fires exactly once per enemy turn - it won't re-trigger mid-turn.
  useEffect(() => {
    if (battle.activeSide === 'enemy' && !battle.winner) {
      runAITurn();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battle.activeSide, battle.winner]);

  const isPlayerTurn = battle.activeSide === 'player' && !isResolving && !battle.winner;

  function handleHandCardTap(instanceId: string) {
    if (!isPlayerTurn) return;
    setSelectedHandCard((prev) => (prev === instanceId ? null : instanceId));
  }

  function handleLaneTap(lane: number) {
    if (!isPlayerTurn || !selectedHandCard) return;
    const result = playCard(battle, 'player', selectedHandCard, lane);
    if (result.success) {
      setBattle(result.state);
      setSelectedHandCard(null);
      playCardPlay();
    }
  }

  function handlePlayerEndTurn() {
    if (!isPlayerTurn) return;
    setSelectedHandCard(null);
    setIsResolving(true);
    handleEndTurnResolution(battle);
  }

  function findFloater(side: Side, lane: number, kind: 'face' | 'lane') {
    return floatingDamage.find((f) => f.side === side && f.lane === lane && f.kind === kind);
  }

  return (
    <div className="screen battle-screen">
      <div className="enemy-status">
        <div className="hp-energy-row enemy-row">
          <span className="side-label">Enemy</span>
          <div className="hp-bar-track">
            <div className="hp-bar-fill hp-bar-enemy" style={{ width: `${(battle.enemy.hp / battle.enemy.maxHp) * 100}%` }} />
            {findFloater('enemy', -1, 'face') && (
              <span className="damage-number-face">-{findFloater('enemy', -1, 'face')?.amount}</span>
            )}
          </div>
          <span className="hp-value">
            {battle.enemy.hp}/{battle.enemy.maxHp}
          </span>
        </div>
      </div>

      <div className="lane-row">
        {battle.enemy.board.map((monster, i) => (
          <div
            key={i}
            className={`lane-slot ${monster ? 'lane-occupied' : 'lane-empty'} ${
              flashLanes?.side === 'enemy' && flashLanes.lanes.includes(i) ? 'lane-attacking' : ''
            } ${dissolvingLanes.some((d) => d.side === 'enemy' && d.lane === i) ? 'lane-dissolving' : ''}`}
          >
            {renderLaneContent(monster)}
            {findFloater('enemy', i, 'lane') && (
              <span className="damage-number">-{findFloater('enemy', i, 'lane')?.amount}</span>
            )}
          </div>
        ))}
      </div>

      <div className="battle-center">
        <span className="turn-indicator">
          Turn {battle.turnNumber} · {battle.activeSide === 'player' ? 'Your Turn' : 'Enemy Turn'}
        </span>
        <button className="btn-small" onClick={() => setShowLog((s) => !s)}>
          Log
        </button>
      </div>

      <div className="lane-row">
        {battle.player.board.map((monster, i) => {
          const isTargetable = isPlayerTurn && !!selectedHandCard && monster === null;
          return (
            <div
              key={i}
              className={`lane-slot ${monster ? 'lane-occupied' : 'lane-empty'} ${isTargetable ? 'lane-targetable' : ''} ${
                flashLanes?.side === 'player' && flashLanes.lanes.includes(i) ? 'lane-attacking' : ''
              } ${dissolvingLanes.some((d) => d.side === 'player' && d.lane === i) ? 'lane-dissolving' : ''}`}
              onClick={() => handleLaneTap(i)}
            >
              {renderLaneContent(monster)}
              {findFloater('player', i, 'lane') && (
                <span className="damage-number">-{findFloater('player', i, 'lane')?.amount}</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="player-status">
        <div className="hp-energy-row player-row">
          <span className="side-label">You</span>
          <div className="hp-bar-track">
            <div
              className="hp-bar-fill hp-bar-player"
              style={{ width: `${(battle.player.hp / battle.player.maxHp) * 100}%` }}
            />
            {findFloater('player', -1, 'face') && (
              <span className="damage-number-face">-{findFloater('player', -1, 'face')?.amount}</span>
            )}
          </div>
          <span className="hp-value">
            {battle.player.hp}/{battle.player.maxHp}
          </span>
        </div>

        <div className="energy-pips">
          {Array.from({ length: battle.player.maxEnergy }).map((_, i) => (
            <span key={i} className={i < battle.player.energy ? 'pip pip-filled' : 'pip'} />
          ))}
        </div>
      </div>

      <div className="hand-row">
        {battle.player.hand.map((handCard) => {
          const cardDef = getCardById(handCard.cardId);
          if (!cardDef) return null;
          const affordable = cardDef.cost <= battle.player.energy;
          return (
            <Card
              key={handCard.instanceId}
              card={cardDef}
              disabled={!isPlayerTurn || !affordable}
              selected={selectedHandCard === handCard.instanceId}
              onClick={() => handleHandCardTap(handCard.instanceId)}
            />
          );
        })}
      </div>

      <button className="btn btn-primary btn-large end-turn-btn" onClick={handlePlayerEndTurn} disabled={!isPlayerTurn}>
        End Turn
      </button>

      {showLog && (
        <div className="battle-log-drawer">
          <div className="battle-log-header">
            <span>Battle Log</span>
            <button className="btn-icon" onClick={() => setShowLog(false)} aria-label="Close log">
              ×
            </button>
          </div>
          <ul className="battle-log-list">
            {battle.log.slice(-30).map((entry, i) => (
              <li key={i}>{entry}</li>
            ))}
          </ul>
        </div>
      )}

      {battle.winner && (
        <BattleEndOverlay
          won={battle.winner === 'player'}
          ownedCardIds={ownedCardIds}
          onChooseReward={(reward) => onBattleEnd('win', reward)}
          onContinueAfterLoss={() => onBattleEnd('loss')}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Victory / defeat overlay with reward selection
// ---------------------------------------------------------------------------

interface BattleEndOverlayProps {
  won: boolean;
  ownedCardIds: string[];
  onChooseReward: (reward: BattleReward) => void;
  onContinueAfterLoss: () => void;
}

function BattleEndOverlay({ won, ownedCardIds, onChooseReward, onContinueAfterLoss }: BattleEndOverlayProps) {
  const [resolved, setResolved] = useState<BattleReward | null>(null);

  useEffect(() => {
    if (won) playVictory();
    else playDefeat();
    // Fire once when the overlay first mounts for this outcome.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!won) {
    return (
      <div className="modal-backdrop">
        <div className="modal-content battle-end-content">
          <h2 className="battle-end-title battle-end-defeat">Defeat</h2>
          <p>Your forces were overwhelmed this time. Regroup and try again.</p>
          <button className="btn btn-primary btn-large" onClick={onContinueAfterLoss}>
            Return to Menu
          </button>
        </div>
      </div>
    );
  }

  if (resolved) {
    return (
      <div className="modal-backdrop">
        <div className="modal-content battle-end-content">
          <h2 className="battle-end-title battle-end-victory">Reward Claimed</h2>
          {resolved.type === 'gold' && <p className="reward-reveal-text">+{resolved.goldAmount} Gold</p>}
          {resolved.type === 'card' && (
            <div className="reward-reveal-card">
              <Card card={resolved.card} />
            </div>
          )}
          {resolved.type === 'pack' && <p className="reward-reveal-text">A Booster Pack awaits!</p>}
          <button className="btn btn-primary btn-large" onClick={() => onChooseReward(resolved)}>
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-content battle-end-content">
        <h2 className="battle-end-title battle-end-victory">Victory!</h2>
        <p>Choose your reward:</p>
        <div className="reward-choices">
          <button
            className="reward-choice-btn"
            onClick={() => setResolved({ type: 'gold', goldAmount: rollGoldReward() })}
          >
            <span className="reward-icon" aria-hidden="true">
              💰
            </span>
            <span>Gold</span>
          </button>
          <button
            className="reward-choice-btn"
            onClick={() => setResolved({ type: 'card', card: rollNewCardReward(new Set(ownedCardIds)) })}
          >
            <span className="reward-icon" aria-hidden="true">
              🃏
            </span>
            <span>New Card</span>
          </button>
          <button className="reward-choice-btn" onClick={() => setResolved({ type: 'pack' })}>
            <span className="reward-icon" aria-hidden="true">
              📦
            </span>
            <span>Booster Pack</span>
          </button>
        </div>
      </div>
    </div>
  );
}
