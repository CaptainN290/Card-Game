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

/** Original geometric emblem - a warded ring around a hollow diamond, built
 * entirely from straight lines and circles so it's cheap, crisp at any size,
 * and carries no resemblance to any existing game's logo. */
function SigilEmblem() {
  return (
    <svg className="sigil-emblem" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <linearGradient id="sigilGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ecc978" />
          <stop offset="100%" stopColor="#c9a24a" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="42" fill="none" stroke="url(#sigilGold)" strokeWidth="2.5" />
      <circle cx="50" cy="50" r="31" fill="none" stroke="url(#sigilGold)" strokeWidth="1" opacity="0.55" />
      <polygon points="50,25 67,50 50,75 33,50" fill="none" stroke="url(#sigilGold)" strokeWidth="2" />
      <circle cx="50" cy="50" r="5" fill="none" stroke="url(#sigilGold)" strokeWidth="1.5" opacity="0.8" />
      <line x1="50" y1="8" x2="50" y2="1" stroke="url(#sigilGold)" strokeWidth="2" />
      <line x1="92" y1="50" x2="99" y2="50" stroke="url(#sigilGold)" strokeWidth="2" />
      <line x1="50" y1="92" x2="50" y2="99" stroke="url(#sigilGold)" strokeWidth="2" />
      <line x1="8" y1="50" x2="1" y2="50" stroke="url(#sigilGold)" strokeWidth="2" />
      <line x1="79.7" y1="20.3" x2="83.2" y2="16.8" stroke="url(#sigilGold)" strokeWidth="1.5" opacity="0.7" />
      <line x1="79.7" y1="79.7" x2="83.2" y2="83.2" stroke="url(#sigilGold)" strokeWidth="1.5" opacity="0.7" />
      <line x1="20.3" y1="79.7" x2="16.8" y2="83.2" stroke="url(#sigilGold)" strokeWidth="1.5" opacity="0.7" />
      <line x1="20.3" y1="20.3" x2="16.8" y2="16.8" stroke="url(#sigilGold)" strokeWidth="1.5" opacity="0.7" />
    </svg>
  );
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
        <SigilEmblem />
        <h1 className="menu-title text-gilded">Hollow Sigil</h1>
        <p className="menu-subtitle">A Dark Fantasy Deck Battler</p>
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
