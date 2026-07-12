// Everything to do with reading and writing the player's progress to
// LocalStorage. This is the only file that touches `localStorage` directly,
// so if Phase 2 ever adds cloud saves, this is the one file that needs a
// second implementation behind the same three functions.

import type { SaveData } from './types';
import { createStarterCollection, createStarterDeck } from './cards';

const SAVE_KEY = 'card-battler:save';
const CURRENT_VERSION = 1;

const STARTING_GOLD = 100;

export function createDefaultSave(): SaveData {
  return {
    version: CURRENT_VERSION,
    collection: createStarterCollection(),
    deck: createStarterDeck(),
    gold: STARTING_GOLD,
    packsUnopened: 0,
    settings: {
      reducedMotion: false,
    },
  };
}

/** Basic structural check so a corrupted or foreign value never reaches the app. */
function isValidSaveShape(value: unknown): value is SaveData {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.version === 'number' &&
    typeof v.collection === 'object' &&
    v.collection !== null &&
    Array.isArray(v.deck) &&
    typeof v.gold === 'number' &&
    typeof v.packsUnopened === 'number' &&
    typeof v.settings === 'object' &&
    v.settings !== null &&
    typeof (v.settings as Record<string, unknown>).reducedMotion === 'boolean'
  );
}

/** Loads the save, or returns a fresh default save if none exists or it's corrupted. */
export function loadSave(): SaveData {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return createDefaultSave();

    const parsed: unknown = JSON.parse(raw);
    if (!isValidSaveShape(parsed)) return createDefaultSave();

    // Future save-format migrations would branch on parsed.version here.
    return parsed;
  } catch {
    // Storage disabled (e.g. private browsing) or corrupted JSON - fall back
    // gracefully instead of crashing the app.
    return createDefaultSave();
  }
}

export function writeSave(data: SaveData): void {
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or unavailable - progress just won't persist this session.
  }
}

/** Wipes progress and returns a fresh default save for the caller to apply. */
export function resetSave(): SaveData {
  try {
    window.localStorage.removeItem(SAVE_KEY);
  } catch {
    // Nothing to do if storage isn't available.
  }
  return createDefaultSave();
}
