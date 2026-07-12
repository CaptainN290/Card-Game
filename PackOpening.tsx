// The booster pack opening screen: Pack -> Shake -> Open -> Reveal five
// cards, one tap at a time. `onPackOpened` fires as soon as the pack's
// contents are rolled, so App.tsx can commit them to the collection right
// away rather than waiting on the player to finish tapping through reveals.

import { useEffect, useRef, useState } from 'react';
import type { CardDefinition } from './types';
import { openBoosterPack } from './cards';
import Card from './Card';

interface PackOpeningProps {
  /** How many unopened packs the player currently has (this screen opens one at a time). */
  packsUnopened: number;
  reducedMotion: boolean;
  onPackOpened: (revealedCardIds: string[]) => void;
  onDone: () => void;
}

type PackPhase = 'ready' | 'shaking' | 'opening' | 'revealing' | 'done';

const CARDS_PER_PACK = 5;

export default function PackOpening({ packsUnopened, reducedMotion, onPackOpened, onDone }: PackOpeningProps) {
  const [phase, setPhase] = useState<PackPhase>('ready');
  const [revealedCards, setRevealedCards] = useState<CardDefinition[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
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
    setPhase('shaking');
    schedule(() => setPhase('opening'), 700);
    schedule(() => {
      const cards = openBoosterPack(CARDS_PER_PACK);
      setRevealedCards(cards);
      setRevealedCount(0);
      setPhase('revealing');
      onPackOpened(cards.map((c) => c.id));
    }, 1100);
  }

  function handleRevealTap() {
    if (phase !== 'revealing') return;
    const next = revealedCount + 1;
    setRevealedCount(next);
    if (next >= revealedCards.length) {
      schedule(() => setPhase('done'), 400);
    }
  }

  function openAnother() {
    setPhase('ready');
    setRevealedCards([]);
    setRevealedCount(0);
  }

  return (
    <div className="screen pack-opening-screen">
      {phase === 'ready' && (
        <button type="button" className="pack-stage pack-stage-button" onClick={handleTapPack}>
          <span className="booster-pack" aria-hidden="true">
            📦
          </span>
          <p className="pack-hint">Tap to open</p>
        </button>
      )}

      {(phase === 'shaking' || phase === 'opening') && (
        <div className={`pack-stage ${phase === 'shaking' ? 'pack-shaking' : 'pack-bursting'}`}>
          <span className="booster-pack" aria-hidden="true">
            📦
          </span>
        </div>
      )}

      {phase === 'revealing' && (
        <button type="button" className="reveal-stage reveal-stage-button" onClick={handleRevealTap}>
          <p className="pack-hint">
            Tap to reveal ({revealedCount}/{revealedCards.length})
          </p>
          <div className="reveal-grid">
            {revealedCards.map((card, i) => (
              <div key={card.id + i} className={i < revealedCount ? 'reveal-slot reveal-slot-shown' : 'reveal-slot'}>
                {i < revealedCount ? (
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
            ))}
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
