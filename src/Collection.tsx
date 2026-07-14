// The Collection screen. Deck Builder is intentionally a tab here rather
// than its own menu item/screen, so it always feels like "part of managing
// your collection" instead of a separate destination.

import { useMemo, useState } from 'react';
import type { CardDefinition } from './types';
import { CARD_DATABASE, DECK_SIZE, MAX_COPIES_PER_CARD, getCardById } from './cards';
import Card from './Card';

interface CollectionProps {
  collection: Record<string, number>;
  deck: string[];
  onDeckChange: (newDeck: string[]) => void;
  onBack: () => void;
}

type CollectionTab = 'collection' | 'deck';

function countByCardId(cardIds: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const id of cardIds) {
    counts[id] = (counts[id] ?? 0) + 1;
  }
  return counts;
}

export default function Collection({ collection, deck, onDeckChange, onBack }: CollectionProps) {
  const [tab, setTab] = useState<CollectionTab>('collection');
  const [inspectedCard, setInspectedCard] = useState<CardDefinition | null>(null);

  const deckCounts = useMemo(() => countByCardId(deck), [deck]);
  const unlockedCount = Object.keys(collection).length;

  function canAddToDeck(cardId: string): boolean {
    const owned = collection[cardId] ?? 0;
    const inDeck = deckCounts[cardId] ?? 0;
    return deck.length < DECK_SIZE && inDeck < MAX_COPIES_PER_CARD && inDeck < owned;
  }

  function addToDeck(cardId: string) {
    if (!canAddToDeck(cardId)) return;
    onDeckChange([...deck, cardId]);
  }

  function removeFromDeck(cardId: string) {
    const index = deck.indexOf(cardId);
    if (index === -1) return;
    const newDeck = [...deck];
    newDeck.splice(index, 1);
    onDeckChange(newDeck);
  }

  return (
    <div className="screen collection-screen">
      <header className="screen-header">
        <button className="btn-icon" onClick={onBack} aria-label="Back to menu">
          ←
        </button>
        <h1>Collection</h1>
      </header>

      <div className="tab-bar">
        <button className={tab === 'collection' ? 'tab tab-active' : 'tab'} onClick={() => setTab('collection')}>
          My Collection
        </button>
        <button className={tab === 'deck' ? 'tab tab-active' : 'tab'} onClick={() => setTab('deck')}>
          Deck Builder
        </button>
      </div>

      {tab === 'collection' && (
        <div className="tab-panel">
          <p className="collection-progress">
            {unlockedCount}/{CARD_DATABASE.length} cards unlocked
          </p>
          <div className="card-grid">
            {CARD_DATABASE.map((card) => {
              const owned = collection[card.id] ?? 0;
              return (
                <Card
                  key={card.id}
                  card={card}
                  locked={owned === 0}
                  ownedCount={owned}
                  onClick={owned > 0 ? () => setInspectedCard(card) : undefined}
                />
              );
            })}
          </div>
        </div>
      )}

      {tab === 'deck' && (
        <div className="tab-panel">
          <p className={deck.length === DECK_SIZE ? 'deck-size deck-size-complete' : 'deck-size'}>
            Deck: {deck.length}/{DECK_SIZE}
          </p>

          <div className="deck-list">
            {Object.keys(deckCounts).length === 0 && (
              <p className="empty-hint">Your deck is empty. Add cards you own below.</p>
            )}
            {Object.entries(deckCounts).map(([cardId, count]) => {
              const card = getCardById(cardId);
              if (!card) return null;
              return (
                <div key={cardId} className="deck-list-row">
                  <Card card={card} variant="compact" ownedCount={count} />
                  <button className="btn-icon" onClick={() => removeFromDeck(cardId)} aria-label={`Remove ${card.name}`}>
                    −
                  </button>
                </div>
              );
            })}
          </div>

          <h2 className="section-subtitle">Add Cards</h2>
          <div className="card-grid">
            {CARD_DATABASE.filter((c) => (collection[c.id] ?? 0) > 0).map((card) => {
              const owned = collection[card.id] ?? 0;
              return (
                <Card
                  key={card.id}
                  card={card}
                  ownedCount={owned}
                  disabled={!canAddToDeck(card.id)}
                  onClick={() => addToDeck(card.id)}
                />
              );
            })}
          </div>
        </div>
      )}

      {inspectedCard && (
        <div className="modal-backdrop" onClick={() => setInspectedCard(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <p className={`inspect-rarity inspect-rarity-${inspectedCard.rarity.toLowerCase()}`}>
              {inspectedCard.rarity} · {inspectedCard.tribe}
            </p>
            <Card card={inspectedCard} ownedCount={collection[inspectedCard.id]} />
            <p className="inspect-owned">Owned: {collection[inspectedCard.id] ?? 0}</p>
            {canAddToDeck(inspectedCard.id) && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  addToDeck(inspectedCard.id);
                }}
              >
                Add to Deck
              </button>
            )}
            <button className="btn btn-secondary" onClick={() => setInspectedCard(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
