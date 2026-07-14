// The single card visual used everywhere: hand, board lanes, collection
// grid, deck list, and pack reveals. One component with a few props keeps
// the "what a card looks like" decision in exactly one place.

import type { CardDefinition } from './types';

interface CardProps {
  card: CardDefinition;
  /** 'compact' drops flavor text/tribe line for tight spaces like board lanes. */
  variant?: 'full' | 'compact';
  /** Renders a "???" silhouette instead of the real card. */
  locked?: boolean;
  /** Shown as an "x2" badge when greater than 1. */
  ownedCount?: number;
  /** Overrides displayed health, e.g. a board monster that has taken damage. */
  currentHealth?: number;
  disabled?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

/** Simple hand-drawn sword mark - deliberately built from straight polygons
 * (no bezier paths) so it renders identically everywhere, unlike an emoji
 * glyph whose look varies by OS. */
function SwordIcon() {
  return (
    <svg className="stat-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <polygon points="12,1 15,15 12,17 9,15" />
      <rect x="7" y="15" width="10" height="2" rx="1" />
      <rect x="11" y="17" width="2" height="5" />
      <circle cx="12" cy="23" r="1.4" />
    </svg>
  );
}

/** Shield mark for health, same straight-line-only construction as the sword. */
function ShieldIcon() {
  return (
    <svg className="stat-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <polygon points="12,2 19,5 19,12 12,22 5,12 5,5" />
    </svg>
  );
}

export default function Card({
  card,
  variant = 'full',
  locked = false,
  ownedCount,
  currentHealth,
  disabled = false,
  selected = false,
  onClick,
}: CardProps) {
  const isCompact = variant === 'compact';

  if (locked) {
    return (
      <div className={`card card-locked${isCompact ? ' card-compact' : ''}`}>
        <div className="card-art card-art-locked">
          <span className="card-locked-icon" aria-hidden="true">
            ?
          </span>
        </div>
        <div className="card-name">???</div>
      </div>
    );
  }

  const displayHealth = currentHealth ?? card.health;
  const isDamaged = currentHealth !== undefined && currentHealth < card.health;

  const classNames = [
    'card',
    isCompact ? 'card-compact' : '',
    disabled ? 'card-disabled' : '',
    selected ? 'card-selected' : '',
    `card-rarity-${card.rarity.toLowerCase()}`,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {ownedCount !== undefined && ownedCount > 1 && <span className="card-owned-badge">×{ownedCount}</span>}
      <div className="card-cost-badge">{card.cost}</div>
      <div className={`card-art tribe-${card.tribe.toLowerCase()}`}>
        <span className="card-icon" aria-hidden="true">
          {card.icon}
        </span>
      </div>
      <div className="card-name">{card.name}</div>
      {!isCompact && (
        <>
          <div className="card-tribe">
            {card.tribe} · {card.rarity}
          </div>
          <div className="card-description">{card.description}</div>
        </>
      )}
      <div className="card-stats">
        <span className="stat-pill card-attack">
          <SwordIcon />
          {card.attack}
        </span>
        <span className={isDamaged ? 'stat-pill card-health card-health-damaged' : 'stat-pill card-health'}>
          <ShieldIcon />
          {displayHealth}
        </span>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button type="button" className={classNames} onClick={onClick} disabled={disabled}>
        {content}
      </button>
    );
  }

  return <div className={classNames}>{content}</div>;
}
