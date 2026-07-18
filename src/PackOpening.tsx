// The booster pack opening screen. Sequence per the Phase 2 brief:
// pack appears -> camera zoom -> shake -> light escapes through cracks ->
// burst -> cards fly outward and flip individually as tapped -> rare cards
// glow -> legendary cards get a unique reveal treatment. The actual pack
// contents still come from openBoosterPack() - only the presentation of
// that same 5-card result changed from Phase 1.

import { useEffect, useRef, useState } from 'react';
import type { CardDefinition } from './types';
import { openBoosterPack } from './cards';
import { playPackOpen } from './sound';
import Card from './Card';

interface PackOpeningProps {
  /** How many unopened packs the player currently has (this screen opens one at a time). */
  packsUnopened: number;
  reducedMotion: boolean;
  onPackOpened: (revealedCardIds: string[]) => void;
  onDone: () => void;
}

type PackPhase = 'ready' | 'zooming' | 'shaking' | 'bursting' | 'revealing' | 'done';

const CARDS_PER_PACK = 5;

function revealSlotClass(card: CardDefinition, shown: boolean): string {
  if (!shown) return 'reveal-slot';
  if (card.rarity === 'Legendary') return 'reveal-slot reveal-slot-shown reveal-slot-legendary';
  if (card.rarity === 'Rare') return 'reveal-slot reveal-slot-shown reveal-slot-rare';
  return 'reveal-slot reveal-slot-shown';
}

export default function PackOpening({ packsUnopened, reducedMotion, onPackOpened, onDone }: PackOpeningProps) {
  const [phase, setPhase] = useState<PackPhase>('ready');
  const [revealedCards, setRevealedCards] = useState<CardDefinition[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [showBurstFlash, setShowBurstFlash] = useState(false);
  const timeoutsRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  function schedule(fn: () => void, ms: number) {
    const delay = reducedMotion ? Math.min(ms, 80) : ms;
    const id = window.setTimeout(fn, delay);
    timeoutsRef.current.push(id);
  }

  function handleTapPack() {
    if (phase !== 'ready') return;
    playPackOpen();
    setPhase('zooming');
    schedule(() => setPhase('shaking'), 400);
    schedule(() => setPhase('bursting'), 1100);
    schedule(() => setShowBurstFlash(true), 1100);
    schedule(() => {
      const cards = openBoosterPack(CARDS_PER_PACK);
      setRevealedCards(cards);
      setRevealedCount(0);
      setPhase('revealing');
      setShowBurstFlash(false);
      onPackOpened(cards.map((c) => c.id));
    }, 1550);
  }

  function handleRevealTap() {
    if (phase !== 'revealing') return;
    const next = revealedCount + 1;
    setRevealedCount(next);
    if (next >= revealedCards.length) {
      schedule(() => setPhase('done'), 500);
    }
  }

  function openAnother() {
    setPhase('ready');
    setRevealedCards([]);
    setRevealedCount(0);
  }

  return (
    <div className="screen pack-opening-screen">
      {showBurstFlash && <div className="pack-burst-flash" />}

      {phase === 'ready' && (
        <button type="button" className="pack-stage pack-stage-button" onClick={handleTapPack}>
          <div className="booster-pack-wrap">
            <img src="/images/booster-pack.png" alt="" className="booster-pack" />
          </div>
          <p className="pack-hint">Tap to open</p>
        </button>
      )}

      {phase !== 'ready' && phase !== 'revealing' && phase !== 'done' && (
        <div
          className={`pack-stage ${phase === 'zooming' ? 'pack-zooming' : ''} ${phase === 'shaking' ? 'pack-shaking' : ''} ${
            phase === 'bursting' ? 'pack-bursting' : ''
          }`}
        >
          <div className="booster-pack-wrap">
            <span className="pack-crack pack-crack-1" />
            <span className="pack-crack pack-crack-2" />
            <img src="/images/booster-pack.png" alt="" className="booster-pack" />
          </div>
        </div>
      )}

      {phase === 'revealing' && (
        <button type="button" className="reveal-stage reveal-stage-button" onClick={handleRevealTap}>
          <p className="pack-hint">
            Tap to reveal ({revealedCount}/{revealedCards.length})
          </p>
          <div className="reveal-grid">
            {revealedCards.map((card, i) => {
              const shown = i < revealedCount;
              return (
                <div key={card.id + i} className={revealSlotClass(card, shown)}>
                  {shown ? (
                    <Card card={card} />
                  ) : (
                    <div className="card card-locked">
                      <div className="card-art card-art-locked">
                        <span className="card-locked-icon" aria-hidden="true">
                          ?
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </button>
      )}

      {phase === 'done' && (
        <div className="reveal-stage">
          <h2 className="pack-done-title">New Cards!</h2>
          <div className="reveal-grid">
            {revealedCards.map((card, i) => (
              <Card key={card.id + i} card={card} />
            ))}
          </div>
          <div className="pack-done-actions">
            {packsUnopened > 0 && (
              <button className="btn btn-secondary btn-large" onClick={openAnother}>
                Open Another Pack ({packsUnopened} left)
              </button>
            )}
            <button className="btn btn-primary btn-large" onClick={onDone}>
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
