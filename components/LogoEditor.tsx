import React, { useState } from 'react';
import { Club, ClubLogoData } from '../types';
import ClubLogo from './ClubLogo';
import * as Icons from 'lucide-react';
import { dataService } from '../services/dataService';

interface LogoEditorProps {
  club: Club;
}

// Handverlesene Liste passender Icons
const themedIcons = [
  // Core & Sport
  'Football', 'Shield', 'Trophy', 'Award', 'Medal', 'Goal', 'ShieldCheck', 'ShieldOff',
  // Power & Stärke
  'Sword', 'Swords', 'Crown', 'Flame', 'Bolt', 'Zap', 'Bomb', 'Hammer', 'Castle', 'TowerControl',
  // Tiere
  'Bird', 'Dog', 'Cat', 'Fish', 'Rabbit', 'Rat', 'Turtle', 'Snake', 'Bug',
  // Natur
  'Sun', 'Moon', 'Star', 'Mountain', 'Waves', 'Wind', 'Tornado', 'TreePine', 'Leaf', 'Flower', 'Clover', 'Sprout',
  // Abstrakt & Geometrisch
  'Triangle', 'Square', 'Circle', 'Hexagon', 'Octagon', 'Crosshair', 'Target', 'Atom', 'YinYang',
  // Sonstiges
  'Anchor', 'Flag', 'Key', 'Rocket', 'Diamond', 'Gem', 'Heart', 'Home', 'Plane', 'Car', 'Ship', 'Skull'
];

const LogoEditor: React.FC<LogoEditorProps> = ({ club }) => {
  const [logo, setLogo] = useState<ClubLogoData>(club.logo || { 
    shape: 'shield', 
    icon: 'Shield', 
    primaryColor: '#2563eb', 
    secondaryColor: '#ffffff' 
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setFeedback(null);
    try {
      await dataService.updateClub(club.id, { logo });
      setFeedback({type: 'success', message: 'Logo erfolgreich gespeichert!'});
    } catch (error) {
      console.error("Error saving logo:", error);
      setFeedback({type: 'error', message: 'Fehler beim Speichern des Logos.'});
    } finally {
      setIsSaving(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const filteredIcons = searchTerm
    ? themedIcons.filter(iconName => iconName.toLowerCase().includes(searchTerm.toLowerCase()))
    : themedIcons;

  return (
    <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700">
      <h3 className="text-xl font-black text-white mb-4">Logo-Editor</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Preview */}
        <div className="md:col-span-1 flex flex-col items-center justify-center bg-slate-900/80 p-6 rounded-xl border border-slate-700">
            <p className="text-sm text-slate-400 mb-4 font-bold uppercase tracking-wider">Vorschau</p>
            <ClubLogo logo={logo} size={128} />
             <div className="mt-4 text-center">
                <p className="font-bold text-white text-xl">{club.name}</p>
                <p className="text-slate-400">Dein Vereinslogo</p>
            </div>
        </div>

        {/* Editor */}
        <div className="md:col-span-2 space-y-6">
          {/* Shape Selection */}
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider">Form</label>
            <div className="flex gap-2 flex-wrap">
              {(['shield', 'circle', 'square', 'hexagon', 'heptagon'] as const).map(shape => (
                <button 
                  key={shape}
                  onClick={() => setLogo({ ...logo, shape })}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${logo.shape === shape ? 'bg-blue-600 text-white ring-2 ring-offset-2 ring-offset-slate-800 ring-blue-500' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'}`}>
                  {shape.charAt(0).toUpperCase() + shape.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label htmlFor="primaryColor" className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider">Primärfarbe</label>
                <input type="color" id="primaryColor" value={logo.primaryColor} onChange={e => setLogo({...logo, primaryColor: e.target.value})} className="w-full h-12 rounded-lg p-1 bg-slate-700 border-slate-600 cursor-pointer" />
            </div>
            <div>
                <label htmlFor="secondaryColor" className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider">Sekundärfarbe</label>
                <input type="color" id="secondaryColor" value={logo.secondaryColor} onChange={e => setLogo({...logo, secondaryColor: e.target.value})} className="w-full h-12 rounded-lg p-1 bg-slate-700 border-slate-600 cursor-pointer" />
            </div>
          </div>

          {/* Icon Selection */}
          <div>
             <label htmlFor="iconSearch" className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider">Icon</label>
             <input 
                type="text"
                id="iconSearch"
                placeholder="Suche Icons... z.B. Football, Crown"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border-slate-700 rounded-lg p-3 text-white focus:ring-blue-500 focus:border-blue-500"
              />
            <div className="h-48 overflow-y-auto mt-2 p-2 bg-slate-900 rounded-lg border border-slate-700 grid grid-cols-7 md:grid-cols-8 gap-2">
                {filteredIcons.map(iconName => {
                    const Icon = Icons[iconName as keyof typeof Icons] as React.ElementType;
                    if (!Icon) return null; // Falls ein Icon-Name nicht existiert
                    return (
                        <button 
                            key={iconName} 
                            onClick={() => setLogo({ ...logo, icon: iconName })}
                            title={iconName}
                            className={`aspect-square flex items-center justify-center rounded-lg transition-colors ${logo.icon === iconName ? 'bg-blue-600 text-white ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900' : 'bg-slate-800 hover:bg-slate-700'}`}>
                            <Icon className="h-5 w-5 text-white" />
                        </button>
                    )
                })}
                 {filteredIcons.length === 0 && <p className='col-span-full text-center text-slate-400 p-4'>Keine Icons gefunden.</p>}
            </div>
          </div>
            <div>
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-5 rounded-lg transition-colors shadow-lg active:scale-95 disabled:bg-slate-600 disabled:cursor-not-allowed">
                    {isSaving ? 'Wird gespeichert...' : 'Logo speichern'}
                </button>
                {feedback && (
                    <div className={`mt-3 p-3 rounded-lg text-sm font-bold text-center ${feedback.type === 'success' ? 'bg-green-500/10 text-green-300' : 'bg-red-500/10 text-red-300'}`}>
                        {feedback.message}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default LogoEditor;
