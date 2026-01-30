import React, { useState, ElementType } from 'react';
import { PlayerPosition } from '../types';
import { Shield, Sword, UserSquare, Hexagon } from 'lucide-react';


interface ProfileSetupProps {
  userId: string;
  onProfileCreate: (userId: string, name: string, position: PlayerPosition, wantsManagerRole: boolean, clubName?: string) => Promise<void>;
  onLogout: () => void;
}

const positionOptions: { position: PlayerPosition; icon: ElementType, name: string, description: string }[] = [
    { position: 'Stürmer', icon: Sword, name: 'Stürmer', description: 'Fokus auf Offensive und Tore.' },
    { position: 'Mittelfeld', icon: Hexagon, name: 'Mittelfeld', description: 'Kontrolliert das Spielgeschehen.' },
    { position: 'Abwehr', icon: Shield, name: 'Abwehr', description: 'Verteidigt das eigene Tor.' },
    { position: 'Torwart', icon: UserSquare, name: 'Torwart', description: 'Hält den Kasten sauber.' },
];


const ProfileSetup: React.FC<ProfileSetupProps> = ({ userId, onProfileCreate, onLogout }) => {
  const [name, setName] = useState('');
  const [position, setPosition] = useState<PlayerPosition>('Stürmer');
  const [wantsManagerRole, setWantsManagerRole] = useState(false);
  const [clubName, setClubName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Bitte gib einen Spielernamen ein.');
      return;
    }
    if (wantsManagerRole && !clubName.trim()) {
        setError('Bitte gib einen Vereinsnamen an.');
        return;
    }
    setIsLoading(true);
    setError('');
    try {
      await onProfileCreate(userId, name, position, wantsManagerRole, clubName);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Erstellen des Profils. Bitte versuche es erneut.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-lg mx-auto">
            <div className="bg-slate-800/80 rounded-2xl shadow-2xl p-6 md:p-8 border border-slate-700/80 mb-4">
                <h1 className="text-3xl font-black text-center text-white mb-2">Profil erstellen</h1>
                <p className="text-center text-slate-400 mb-8">Richte dein <span className="font-bold text-blue-400">Spielerprofil</span> ein, um loszulegen.</p>
                
                <form onSubmit={handleCreateProfile} className="space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="playerName" className="text-sm font-bold text-slate-300 uppercase tracking-wider">Spielername</label>
                        <input
                            id="playerName"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Dein Name im Spiel"
                            className="w-full bg-slate-900/80 border-2 border-slate-700 rounded-lg px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                            required
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">Position wählen</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {positionOptions.map(({ position: pos, icon: Icon, name: posName, description }) => (
                                <button
                                    type="button"
                                    key={pos}
                                    onClick={() => setPosition(pos)}
                                    className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${position === pos ? 'bg-blue-500/10 border-blue-500' : 'bg-slate-800/60 border-slate-700 hover:border-slate-500'}`}
                                >
                                    <Icon className={`h-6 w-6 mb-2 ${position === pos ? 'text-blue-400' : 'text-slate-400'}`} />
                                    <p className={`font-bold text-sm ${position === pos ? 'text-white' : 'text-slate-200'}`}>{posName}</p>
                                    <p className={`text-xs mt-1 ${position === pos ? 'text-blue-200/80' : 'text-slate-400/80'}`}>{description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 space-y-4">
                         <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/70">
                            <label htmlFor="managerRole" className="flex items-center justify-between cursor-pointer">
                                <span className="font-bold text-slate-200">Verein gründen & Manager sein</span>
                                 <input
                                    id="managerRole"
                                    type="checkbox"
                                    checked={wantsManagerRole}
                                    onChange={(e) => setWantsManagerRole(e.target.checked)}
                                    className="h-6 w-6 rounded-md bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900 shadow-inner"
                                />
                            </label>
                         </div>

                        {wantsManagerRole && (
                            <div className="space-y-2 animate-in fade-in duration-300 slide-in-from-top-4">
                                <label htmlFor="clubName" className="text-sm font-bold text-slate-300 uppercase tracking-wider">Vereinsname</label>
                                <input
                                    id="clubName"
                                    type="text"
                                    value={clubName}
                                    onChange={(e) => setClubName(e.target.value)}
                                    placeholder="Name deines neuen Vereins"
                                    className="w-full bg-slate-900/80 border-2 border-slate-700 rounded-lg px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                                    required={wantsManagerRole}
                                />
                            </div>
                        )}
                    </div>

                    {error && <p className="text-red-400 text-sm text-center bg-red-500/10 p-3 rounded-lg border border-red-500/20">{error}</p>}

                    <div className="pt-4">
                        <button 
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 text-white font-bold py-4 rounded-lg disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed hover:bg-blue-500 transition-all duration-200 shadow-lg shadow-blue-900/30 active:scale-[0.98]"
                        >
                            {isLoading ? 'Profil wird erstellt...' : 'Spielen'}
                        </button>
                    </div>
                </form>
            </div>
             <button
                onClick={onLogout}
                className="w-full text-center mt-6 text-slate-500 hover:text-blue-400 font-bold text-sm transition-colors"
            >
                Abmelden
            </button>
            <footer className="text-center text-slate-600 text-xs mt-8">
                <p>0.1.0-alpha.1</p>
            </footer>
        </div>
    </div>
  );
};

export default ProfileSetup;
