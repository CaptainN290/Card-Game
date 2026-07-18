import { DECK_SIZE } from './cards';

interface MenuProps {
  gold: number;
  collectionCount: number;
  totalCards: number;
  deckSize: number;
  packsUnopened: number;
  onPlay: () => void;
  onCollection: () => void;
  onShop: () => void;
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
  onShop,
  onSettings,
  onOpenPacks,
}: MenuProps) {
  const deckReady = deckSize === DECK_SIZE;

  return (
    <div className="screen menu-screen">
      <div className="menu-stats">
        <span className="menu-stat">
          <img src="/images/gold-icon.png" alt="" className="icon-inline" />
          {gold} Gold
        </span>
        <span className="menu-stat">
          🗂️ {collectionCount}/{totalCards} Cards
        </span>
      </div>

      <div className="menu-hero">
        <img src="/images/logo.png" alt="Hollow Sigil" className="game-logo" />
        <p className="menu-subtitle">A Dark Fantasy Deck Battler</p>
      </div>

      <div className="menu-buttons">
        <button className="btn btn-large menu-btn-image menu-btn-play" onClick={onPlay} disabled={!deckReady}>
          Play
        </button>
        {!deckReady && (
          <p className="menu-hint">
            Build a {DECK_SIZE}-card deck in Collection first ({deckSize}/{DECK_SIZE})
          </p>
        )}

        <button className="btn btn-large menu-btn-image menu-btn-collection" onClick={onCollection}>
          Collection
        </button>
        <button className="btn btn-large menu-btn-image menu-btn-shop" onClick={onShop}>
          Shop
        </button>
        <button className="btn btn-large menu-btn-image menu-btn-settings" onClick={onSettings}>
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
