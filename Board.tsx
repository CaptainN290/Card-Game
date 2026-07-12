// The battle screen. Owns the live BattleState and drives the turn flow:
// player acts -> end turn -> combat resolves -> AI acts -> AI ends turn ->
// combat resolves -> back to player. All actual game rules live in
// battle.ts; this file is purely about presenting that state and pacing it
// with small delays so combat is readable instead of instant.

import { useEffect, useRef, useState } from 'react';
import type { BattleReward, BattleState, BoardLane, Side } from './types';
import { endTurn, initBattle, planAIMoves, playCard } from './battle';
import { AI_DECK, getCardById, rollGoldReward, rollNewCardReward } from './cards';
import Card from './Card';

interface BoardProps {
  playerDeck: string[];
  ownedCardIds: string[];
  reducedMotion: boolean;
  onBattleEnd: (result: 'win' | 'loss', reward?: BattleReward) => void;
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
    const { state: newState, attackedLanes } = endTurn(state);
    setFlashLanes({ side: state.activeSide, lanes: attackedLanes });
    scheduleTimeout(() => {
      setBattle(newState);
      setFlashLanes(null);
      setIsResolving(false);
    }, 500);
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
    }
  }

  function handlePlayerEndTurn() {
    if (!isPlayerTurn) return;
    setSelectedHandCard(null);
    setIsResolving(true);
    handleEndTurnResolution(battle);
  }

  return (
    <div className="screen battle-screen">
      <div className="hp-energy-row enemy-row">
        <span className="side-label">Enemy</span>
        <div className="hp-bar-track">
          <div className="hp-bar-fill hp-bar-enemy" style={{ width: `${(battle.enemy.hp / battle.enemy.maxHp) * 100}%` }} />
        </div>
        <span className="hp-value">
          {battle.enemy.hp}/{battle.enemy.maxHp}
        </span>
      </div>

      <div className="lane-row">
        {battle.enemy.board.map((monster, i) => (
          <div
            key={i}
            className={`lane-slot ${monster ? 'lane-occupied' : 'lane-empty'} ${
              flashLanes?.side === 'enemy' && flashLanes.lanes.includes(i) ? 'lane-attacking' : ''
            }`}
          >
            {renderLaneContent(monster)}
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
              }`}
              onClick={() => handleLaneTap(i)}
            >
              {renderLaneContent(monster)}
            </div>
          );
        })}
      </div>

      <div className="hp-energy-row player-row">
        <span className="side-label">You</span>
        <div className="hp-bar-track">
          <div
            className="hp-bar-fill hp-bar-player"
            style={{ width: `${(battle.player.hp / battle.player.maxHp) * 100}%` }}
          />
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
