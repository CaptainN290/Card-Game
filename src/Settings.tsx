import { useState } from 'react';
import type { GameSettings } from './types';

interface SettingsProps {
  settings: GameSettings;
  onSettingsChange: (settings: GameSettings) => void;
  onResetProgress: () => void;
  onBack: () => void;
}

export default function Settings({ settings, onSettingsChange, onResetProgress, onBack }: SettingsProps) {
  const [confirmingReset, setConfirmingReset] = useState(false);

  return (
    <div className="screen settings-screen">
      <header className="screen-header">
        <button className="btn-icon" onClick={onBack} aria-label="Back to menu">
          ←
        </button>
        <h1>Settings</h1>
      </header>

      <section className="settings-section">
        <label className="settings-row">
          <span>Reduced Motion</span>
          <input
            type="checkbox"
            checked={settings.reducedMotion}
            onChange={(e) => onSettingsChange({ ...settings, reducedMotion: e.target.checked })}
          />
        </label>
        <p className="settings-description">Shortens animations during battles, pack openings, and the background atmosphere.</p>
      </section>

      <section className="settings-section">
        {!confirmingReset ? (
          <button className="btn btn-danger" onClick={() => setConfirmingReset(true)}>
            Reset Progress
          </button>
        ) : (
          <div className="confirm-box">
            <p>This permanently erases your collection, deck, and gold. This cannot be undone.</p>
            <div className="confirm-actions">
              <button className="btn btn-secondary" onClick={() => setConfirmingReset(false)}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  setConfirmingReset(false);
                  onResetProgress();
                }}
              >
                Yes, Reset Everything
              </button>
            </div>
          </div>
        )}
      </section>

      <p className="settings-version">Hollow Sigil · Phase 2</p>
    </div>
  );
}
