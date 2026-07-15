// Placeholder sound hooks. No audio files ship in Phase 1/2 - these exist so
// call sites (button presses, card draws, attacks, pack openings, victory /
// defeat) already have a single, obvious place to wire up real audio later
// without hunting through every component. Swap the console.debug calls for
// an actual Audio()/WebAudio implementation when real sound assets exist.

type SoundName = 'buttonPress' | 'cardDraw' | 'cardPlay' | 'attack' | 'packOpen' | 'victory' | 'defeat';

function play(name: SoundName): void {
  // Intentionally silent for now. Left as a named, obvious seam:
  // e.g. `new Audio(`/sounds/${name}.mp3`).play()` once assets exist.
  if (typeof console !== 'undefined' && console.debug) {
    console.debug(`[sound placeholder] ${name}`);
  }
}

export const playButtonPress = () => play('buttonPress');
export const playCardDraw = () => play('cardDraw');
export const playCardPlay = () => play('cardPlay');
export const playAttack = () => play('attack');
export const playPackOpen = () => play('packOpen');
export const playVictory = () => play('victory');
export const playDefeat = () => play('defeat');
