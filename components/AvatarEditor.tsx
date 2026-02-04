
import React, { useState, useMemo, useEffect } from 'react';
import { Player, AvatarData } from '../types';
import { createAvatar } from '@dicebear/core';
import * as collections from '@dicebear/collection';
import { dataService } from '../services/dataService';
import { useDebounce } from '../hooks/useDebounce';
import { Check, Dices, Save } from 'lucide-react';

interface AvatarEditorProps {
  player: Player;
  onClose?: () => void; // Optional: To close a modal after saving
}

// Expanded avatar styles
const avatarStyles = {
    adventurer: { name: 'Abenteurer', collection: collections.adventurer },
    pixelArt: { name: 'Pixel Art', collection: collections.pixelArt },
    bottts: { name: 'Roboter', collection: collections.bottts },
    miniavs: { name: 'Minimalistisch', collection: collections.miniavs },
    personas: { name: 'Personas', collection: collections.personas },
    initials: { name: 'Initialen', collection: collections.initials },
    micah: { name: 'Micah', collection: collections.micah },
    funEmoji: { name: 'Emojis', collection: collections.funEmoji },
};

type AvatarStyleId = keyof typeof avatarStyles;

const AvatarEditor: React.FC<AvatarEditorProps> = ({ player }) => {
  const [style, setStyle] = useState<AvatarStyleId>(player.avatar?.style || 'adventurer');
  const [seed, setSeed] = useState(player.avatar?.seed || player.name);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const debouncedSeed = useDebounce(seed, 300); // 300ms delay

  const avatarSvg = useMemo(() => {
    const selectedStyle = avatarStyles[style]?.collection;
    if (!selectedStyle) return '';
    try {
         return createAvatar(selectedStyle, {
            seed: debouncedSeed,
            size: 128,
            radius: 50,
        }).toString();
    } catch (e) {
        console.error("Dicebear error:", e)
        return ''; // Return empty string on error
    }
  }, [style, debouncedSeed]);

  const handleSave = async () => {
    setIsSaving(true);
    setIsSuccess(false);
    try {
      const avatarData: AvatarData = { style, seed: debouncedSeed };
      await dataService.updatePlayer(player.id, { avatar: avatarData });
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 2000);
    } catch (error) {
      console.error("Error saving avatar:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const randomizeSeed = () => {
    setSeed(Math.random().toString(36).substring(7));
  };
  
  const hasChanges = player.avatar?.style !== style || player.avatar?.seed !== debouncedSeed;

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-4 sm:p-6 rounded-3xl border-2 border-slate-700/50 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Avatar anpassen</h3>
            <button
              onClick={handleSave}
              disabled={isSaving || isSuccess || !hasChanges}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg disabled:shadow-none ${ isSuccess ? 'bg-emerald-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'} disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed`}>
              {isSuccess ? <><Check size={16}/> Gespeichert</> : <><Save size={16}/> Speichern</>}
            </button>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Editor Controls (Left Side on Large Screens) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Style Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Stil</label>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(avatarStyles).map(([id, { name }]) => (
                <button
                  key={id}
                  onClick={() => setStyle(id as AvatarStyleId)}
                  className={`px-3 py-1.5 text-sm rounded-lg font-semibold transition-all border-2 ${style === id ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-700 text-slate-300'}`}>
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Seed Input */}
          <div>
            <label htmlFor="seedInput" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Generator-Seed</label>
            <div className="flex gap-2">
                 <input
                    type="text"
                    id="seedInput"
                    value={seed}
                    onChange={(e) => setSeed(e.target.value)}
                    className="w-full bg-slate-950/50 border-2 border-slate-700/80 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Dein Name, ein Wort etc..."
                />
                <button onClick={randomizeSeed} className="p-3 bg-slate-800/60 border-2 border-slate-700/80 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-all">
                    <Dices size={24} />
                </button>
            </div>
             <p className="text-xs text-slate-500 mt-2">Ändere diesen Wert, um deinen Avatar einzigartig zu machen.</p>
          </div>
        </div>

        {/* Preview (Right Side on Large Screens) */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center bg-slate-950/30 p-4 rounded-2xl border-2 border-slate-700/50">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500/20 to-slate-900/10 flex items-center justify-center p-1 shadow-inner">
             <div dangerouslySetInnerHTML={{ __html: avatarSvg }} className="w-full h-full rounded-full overflow-hidden" />
          </div>
          <div className="mt-4 text-center">
            <p className="font-black text-2xl text-white italic uppercase tracking-tighter">{player.name}</p>
            <p className="text-sm text-slate-400 font-semibold">Level {player.level}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvatarEditor;
