import { DECK_SIZE } from './cards';

interface MenuProps {
  gold: number;
  collectionCount: number;
  totalCards: number;
  deckSize: number;
  packsUnopened: number;
  onPlay: () => void;
  onCollection: () => void;
  onSettings: () => void;
  onOpenPacks: () => void;
}

export default function Menu({
  gold,
  collectionCount,
  totalCards,
  deckSize,
  packsUnopened,
  onPlay,
  onCollection,
  onSettings,
  onOpenPacks,
}: MenuProps) {
  const deckReady = deckSize === DECK_SIZE;

  return (
    <div className="screen menu-screen">
      <div className="menu-stats">
        <span className="menu-stat">💰 {gold} Gold</span>
        <span className="menu-stat">
          🗂️ {collectionCount}/{totalCards} Cards
        </span>
      </div>

      <div className="menu-hero">
        <span className="menu-hero-icon" aria-hidden="true">
          🃏
        </span>
        <h1 className="menu-title">Card Battler</h1>
        <p className="menu-subtitle">A dark fantasy deck battler</p>
      </div>

      <div className="menu-buttons">
        <button className="btn btn-primary btn-large" onClick={onPlay} disabled={!deckReady}>
          Play
        </button>
        {!deckReady && (
          <p className="menu-hint">
            Build a {DECK_SIZE}-card deck in Collection first ({deckSize}/{DECK_SIZE})
          </p>
        )}

        <button className="btn btn-secondary btn-large" onClick={onCollection}>
          Collection
        </button>
        <button className="btn btn-secondary btn-large" onClick={onSettings}>
          Settings
        </button>

        {packsUnopened > 0 && (
          <button className="btn btn-accent btn-large" onClick={onOpenPacks}>
            📦 Open Packs ({packsUnopened})
          </button>
        )}
      </div>
    </div>
  );
}
