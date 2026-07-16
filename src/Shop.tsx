// The Shop screen. Phase 3 adds a real gold sink: a single Basic Booster
// Pack for now. Buying just deducts gold and hands off to the exact same
// pack-opening flow battle rewards already use - App.tsx owns the actual
// purchase (gold deduction + packsUnopened increment) so this component
// stays purely presentational, matching every other screen in the app.

import { BASIC_PACK_PRICE, PACK_ODDS } from './cards';

interface ShopProps {
  gold: number;
  onBuyPack: () => void;
  onBack: () => void;
}

export default function Shop({ gold, onBuyPack, onBack }: ShopProps) {
  const canAfford = gold >= BASIC_PACK_PRICE;

  return (
    <div className="screen shop-screen">
      <header className="screen-header">
        <button className="btn-icon" onClick={onBack} aria-label="Back to menu">
          ←
        </button>
        <h1>Shop</h1>
      </header>

      <div className="shop-gold-display">
        <span aria-hidden="true">💰</span> {gold} Gold
      </div>

      <div className="shop-pack-card">
        <div className="shop-pack-glow" aria-hidden="true" />
        <div className="shop-pack-art">
          <span aria-hidden="true">📦</span>
        </div>
        <h2 className="shop-pack-name">Basic Booster Pack</h2>
        <p className="shop-pack-desc">5 random cards. Duplicates allowed. Every card unlocked stays in your collection forever.</p>

        <div className="shop-pack-odds">
          <span className="shop-odds-row">
            <span className="shop-odds-label shop-odds-common">Common</span>
            <span>{Math.round(PACK_ODDS.Common * 100)}%</span>
          </span>
          <span className="shop-odds-row">
            <span className="shop-odds-label shop-odds-rare">Rare</span>
            <span>{Math.round(PACK_ODDS.Rare * 100)}%</span>
          </span>
          <span className="shop-odds-row">
            <span className="shop-odds-label shop-odds-epic">Epic</span>
            <span>{Math.round(PACK_ODDS.Epic * 100)}%</span>
          </span>
          <span className="shop-odds-row">
            <span className="shop-odds-label shop-odds-legendary">Legendary</span>
            <span>{Math.round(PACK_ODDS.Legendary * 100)}%</span>
          </span>
        </div>

        <div className="shop-pack-price">
          <span aria-hidden="true">💰</span> {BASIC_PACK_PRICE} Gold
        </div>

        <button className="btn btn-primary btn-large" onClick={onBuyPack} disabled={!canAfford}>
          {canAfford ? 'Buy Pack' : 'Not Enough Gold'}
        </button>
        {!canAfford && <p className="shop-hint">Win battles to earn more Gold.</p>}
      </div>
    </div>
  );
}
