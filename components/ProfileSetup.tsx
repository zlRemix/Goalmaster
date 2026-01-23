import React, { useState } from 'react';
import { POSITIONS } from '../constants';
import { PlayerPosition } from '../types';

interface ProfileSetupProps {
  userId: string;
  onProfileCreate: (userId: string, name: string, position: PlayerPosition, wantsManagerRole: boolean, clubName?: string) => Promise<void>;
}

const ProfileSetup: React.FC<ProfileSetupProps> = ({ userId, onProfileCreate }) => {
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
    } catch (err) {
      setError('Fehler beim Erstellen des Profils. Bitte versuche es erneut.');
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white">
        <div className="w-full max-w-md bg-slate-900 rounded-2xl shadow-2xl p-8 border border-slate-800">
            <h1 className="text-3xl font-black text-center text-emerald-400 mb-2">Profil erstellen</h1>
            <p className="text-center text-slate-400 mb-8">Willkommen! Richte dein Spielerprofil ein.</p>
            
            <form onSubmit={handleCreateProfile} className="space-y-6">
                <div>
                    <label htmlFor="playerName" className="block text-sm font-bold text-slate-300 mb-2">Spielername</label>
                    <input
                        id="playerName"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Dein Name im Spiel"
                        className="w-full bg-slate-800 border-2 border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="position" className="block text-sm font-bold text-slate-300 mb-2">Position</label>
                    <select
                        id="position"
                        value={position}
                        onChange={(e) => setPosition(e.target.value as PlayerPosition)}
                        className="w-full bg-slate-800 border-2 border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition appearance-none"
                    >
                        {POSITIONS.map(p => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center justify-between">
                    <label htmlFor="managerRole" className="text-slate-300 flex items-center space-x-3 cursor-pointer">
                        <input
                            id="managerRole"
                            type="checkbox"
                            checked={wantsManagerRole}
                            onChange={(e) => setWantsManagerRole(e.target.checked)}
                            className="h-5 w-5 rounded bg-slate-700 border-slate-600 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                        />
                        <span className="font-bold">Ich möchte auch Manager sein</span>
                    </label>
                </div>

                {wantsManagerRole && (
                    <div>
                        <label htmlFor="clubName" className="block text-sm font-bold text-slate-300 mb-2">Vereinsname</label>
                        <input
                            id="clubName"
                            type="text"
                            value={clubName}
                            onChange={(e) => setClubName(e.target.value)}
                            placeholder="Name deines neuen Vereins"
                            className="w-full bg-slate-800 border-2 border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                            required
                        />
                    </div>
                )}

                {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg disabled:bg-slate-600 disabled:cursor-not-allowed hover:bg-emerald-500 transition-colors shadow-lg active:scale-95"
                >
                    {isLoading ? 'Erstelle Profil...' : 'Profil erstellen & Starten'}
                </button>
            </form>
        </div>
        <footer className="text-center text-slate-600 text-sm mt-8">
            <p>&copy; 2024 ProSoccer</p>
        </footer>
    </div>
  );
};

export default ProfileSetup;
