// The app shell. Owns the persisted save data and which screen is showing.
// There's no router library - `screen` is just a string, and each screen is
// a conditionally-rendered component that reports outcomes back up via
// callback props. For an app this size that's simpler and easier to follow
// than wiring up routes, and it sidesteps any "404 on refresh" concerns
// entirely on static hosts, since there are no URL-based routes to begin
// with.

import { useEffect, useState } from 'react';
import type { BattleReward, GameScreen, GameSettings, SaveData } from './types';
import { loadSave, resetSave, writeSave } from './save';
import { CARD_DATABASE, DECK_SIZE } from './cards';
import Menu from './Menu';
import Board from './Board';
import Collection from './Collection';
import Settings from './Settings';
import PackOpening from './PackOpening';

export default function App() {
  const [save, setSave] = useState<SaveData>(() => loadSave());
  const [screen, setScreen] = useState<GameScreen>('menu');

  useEffect(() => {
    writeSave(save);
  }, [save]);

  function handlePlay() {
    if (save.deck.length !== DECK_SIZE) return; // Menu already disables the button in this case.
    setScreen('battle');
  }

  function handleBattleEnd(result: 'win' | 'loss', reward?: BattleReward) {
    if (result === 'win' && reward) {
      if (reward.type === 'gold') {
        const goldAmount = reward.goldAmount;
        setSave((prev) => ({ ...prev, gold: prev.gold + goldAmount }));
      } else if (reward.type === 'card') {
        const wonCard = reward.card;
        setSave((prev) => ({
          ...prev,
          collection: { ...prev.collection, [wonCard.id]: (prev.collection[wonCard.id] ?? 0) + 1 },
        }));
      } else if (reward.type === 'pack') {
        setSave((prev) => ({ ...prev, packsUnopened: prev.packsUnopened + 1 }));
        setScreen('packOpening');
        return;
      }
    }
    setScreen('menu');
  }

  function handlePackOpened(revealedCardIds: string[]) {
    setSave((prev) => {
      const collection = { ...prev.collection };
      for (const id of revealedCardIds) {
        collection[id] = (collection[id] ?? 0) + 1;
      }
      return { ...prev, collection, packsUnopened: Math.max(0, prev.packsUnopened - 1) };
    });
  }

  function handleDeckChange(newDeck: string[]) {
    setSave((prev) => ({ ...prev, deck: newDeck }));
  }

  function handleSettingsChange(newSettings: GameSettings) {
    setSave((prev) => ({ ...prev, settings: newSettings }));
  }

  function handleResetProgress() {
    setSave(resetSave());
    setScreen('menu');
  }

  return (
    <div className="app-shell">
      <div className={save.settings.reducedMotion ? 'atmosphere atmosphere-reduced' : 'atmosphere'} aria-hidden="true">
        <div className="atmosphere-rays" />
        <div className="atmosphere-fog" />
        <div className="embers">
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className="ember" />
          ))}
        </div>
        <div className="atmosphere-vignette" />
      </div>

      {screen === 'menu' && (
        <Menu
          gold={save.gold}
          collectionCount={Object.keys(save.collection).length}
          totalCards={CARD_DATABASE.length}
          deckSize={save.deck.length}
          packsUnopened={save.packsUnopened}
          onPlay={handlePlay}
          onCollection={() => setScreen('collection')}
          onSettings={() => setScreen('settings')}
          onOpenPacks={() => setScreen('packOpening')}
        />
      )}

      {screen === 'battle' && (
        <Board
          playerDeck={save.deck}
          ownedCardIds={Object.keys(save.collection)}
          reducedMotion={save.settings.reducedMotion}
          onBattleEnd={handleBattleEnd}
        />
      )}

      {screen === 'collection' && (
        <Collection
          collection={save.collection}
          deck={save.deck}
          onDeckChange={handleDeckChange}
          onBack={() => setScreen('menu')}
        />
      )}

      {screen === 'settings' && (
        <Settings
          settings={save.settings}
          onSettingsChange={handleSettingsChange}
          onResetProgress={handleResetProgress}
          onBack={() => setScreen('menu')}
        />
      )}

      {screen === 'packOpening' && (
        <PackOpening
          packsUnopened={save.packsUnopened}
          reducedMotion={save.settings.reducedMotion}
          onPackOpened={handlePackOpened}
          onDone={() => setScreen('menu')}
        />
      )}
    </div>
  );
}
