import React, { useState, useMemo } from 'react';
import { Player } from '../types';
import { createAvatar } from '@dicebear/core';
import * as collections from '@dicebear/collection';
import { dataService } from '../services/dataService';

interface AvatarEditorProps {
  player: Player;
}

const avatarStyles = {
  adventurer: { name: 'Abenteurer', collection: collections.adventurer },
  pixelArt: { name: 'Pixel Art', collection: collections.pixelArt },
  bottts: { name: 'Roboter', collection: collections.bottts },
  miniavs: { name: 'Minimalistisch', collection: collections.miniavs },
  personas: { name: 'Personas', collection: collections.personas },
};

type AvatarStyleId = keyof typeof avatarStyles;

const AvatarEditor: React.FC<AvatarEditorProps> = ({ player }) => {
  const [style, setStyle] = useState<AvatarStyleId>(player.avatar?.style || 'adventurer');
  const [seed, setSeed] = useState(player.avatar?.seed || player.name);
  const [isSaving, setIsSaving] = useState(false);

  const avatarSvg = useMemo(() => {
    const selectedStyle = avatarStyles[style]?.collection;
    if (!selectedStyle) return '';
    return createAvatar(selectedStyle, {
      seed: seed,
      size: 128,
      radius: 50, // Makes circle avatars
    }).toString();
  }, [style, seed]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const avatarData = { style, seed };
      await dataService.updatePlayer(player.id, { avatar: avatarData });
      // Add success feedback if needed
    } catch (error) {
      console.error("Error saving avatar:", error);
      // Add error feedback if needed
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-slate-800/80 p-6 rounded-3xl border border-slate-700 mt-6">
      <h3 className="text-lg font-bold text-white mb-4">Avatar-Generator</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Preview */}
        <div className="md:col-span-1 flex flex-col items-center justify-center bg-slate-900/50 p-6 rounded-xl border border-slate-700/50">
          <p className="text-sm text-slate-400 mb-4">Vorschau</p>
          <div dangerouslySetInnerHTML={{ __html: avatarSvg }} style={{ width: 128, height: 128 }} />
          <div className="mt-4 text-center">
            <p className="font-bold text-white text-xl">{player.name}</p>
            <p className="text-slate-400">Dein Spieler-Avatar</p>
          </div>
        </div>

        {/* Editor */}
        <div className="md:col-span-2 space-y-6">
          {/* Style Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Avatar-Stil</label>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(avatarStyles).map(([id, { name }]) => (
                <button
                  key={id}
                  onClick={() => setStyle(id as AvatarStyleId)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${style === id ? 'bg-emerald-500 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'}`}>
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Seed Input */}
          <div>
            <label htmlFor="seedInput" className="block text-sm font-medium text-slate-300 mb-2">Dein "Seed"</label>
            <p className="text-xs text-slate-400 mb-2">Gib ein Wort oder einen Satz ein, um deinen Avatar einzigartig zu machen.</p>
            <input
              type="text"
              id="seedInput"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              className="w-full bg-slate-900 border-slate-700 rounded-lg p-2 text-white"
              placeholder="z.B. dein Spielername"
            />
          </div>

          <div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-5 rounded-lg transition-colors shadow-lg active:scale-95 disabled:bg-slate-600 disabled:cursor-not-allowed">
              {isSaving ? 'Wird gespeichert...' : 'Avatar speichern'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvatarEditor;
