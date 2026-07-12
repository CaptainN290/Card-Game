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
        <span className="card-attack">⚔ {card.attack}</span>
        <span className={isDamaged ? 'card-health card-health-damaged' : 'card-health'}>♥ {displayHealth}</span>
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
