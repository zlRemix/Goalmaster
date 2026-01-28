import React, { useState, useEffect } from 'react';
import { functions, db } from '../services/firebase';
import { httpsCallable } from 'firebase/functions';
import { collection, getDocs } from 'firebase/firestore';
import { Club } from '../types';

// Pointing to the rebuilt 'createLeague' function
const createLeagueFunction = httpsCallable(functions, 'createLeague');
const simulateLeagueMatchesFunction = httpsCallable(functions, 'simulateLeagueMatches');

interface LeagueManagementProps {
  onLeagueCreated?: () => void;
}

const LeagueManagement: React.FC<LeagueManagementProps> = ({ onLeagueCreated }) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClubIds, setSelectedClubIds] = useState<string[]>([]);
  const [leagueName, setLeagueName] = useState<string>('1. Bundesliga');

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const clubsCollection = collection(db, 'clubs');
        const clubsSnapshot = await getDocs(clubsCollection);
        const clubsList = clubsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Club[];
        setClubs(clubsList);
      } catch (error) {
        console.error("Fehler beim Abrufen der Vereine:", error);
        setFeedback({ type: 'error', message: 'Fehler beim Laden der Vereine.' });
      }
    };
    fetchClubs();
  }, []);

  const handleClubSelection = (clubId: string) => {
    setSelectedClubIds(prev =>
      prev.includes(clubId) ? prev.filter(id => id !== clubId) : [...prev, clubId]
    );
  };

  const handleCreateLeague = async () => {
    if (selectedClubIds.length < 2) {
      setFeedback({ type: 'error', message: 'Bitte wählen Sie mindestens zwei Vereine aus.' });
      return;
    }
    if (!leagueName.trim()) {
      setFeedback({ type: 'error', message: 'Bitte geben Sie einen Namen für die Liga ein.' });
      return;
    }

    setLoading('Erstelle Liga...');
    setFeedback(null);
    console.log(`[FE] Calling 'createLeague' with ${selectedClubIds.length} clubs and name "${leagueName}"`);

    try {
      const result = await createLeagueFunction({ clubIds: selectedClubIds, leagueName: leagueName.trim() });
      const data = result.data as { success: boolean; message: string };
      console.log(`[FE] 'createLeague' returned:`, data);

      if (data.success) {
        setFeedback({ type: 'success', message: data.message });
        onLeagueCreated?.();
      } else {
        throw new Error(data.message || 'Ein unbekannter Fehler ist aufgetreten.');
      }
    } catch (error: any) {
      console.error("[FE] FATAL ERROR calling 'createLeague':", error);
      setFeedback({ type: 'error', message: `FEHLER: ${error.message || 'Die Liga konnte nicht erstellt werden.'}` });
    } finally {
      setLoading(null);
    }
  };

  const handleSimulateMatches = async () => {
    setLoading('Simuliere Ligaspiele...');
    setFeedback(null);
    try {
      const result = await simulateLeagueMatchesFunction();
      const data = result.data as { success: boolean; message: string };
      if (data.success) {
        setFeedback({ type: 'success', message: data.message });
      } else {
        throw new Error(data.message || 'Ein unbekannter Fehler ist aufgetreten.');
      }
    } catch (error: any) {
      setFeedback({ type: 'error', message: error.message || 'Die Ligaspiele konnten nicht simuliert werden.' });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="p-4 bg-slate-800/80 text-white rounded-3xl border border-slate-700">
      <h2 className="text-2xl font-bold mb-4">Liga-Management</h2>
      {feedback && <div className={`p-3 mb-4 rounded-lg ${feedback.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>{feedback.message}</div>}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Neue Liga Erstellen</h3>
        <div className="mb-4">
          <label htmlFor="leagueName" className="block mb-2 text-sm font-medium text-slate-300">Name der Liga:</label>
          <input id="leagueName" type="text" value={leagueName} onChange={(e) => setLeagueName(e.target.value)} className="w-full p-2 bg-slate-900 border-slate-700 rounded-lg text-white"/>
        </div>
        <div className="mb-4">
          <h4 className="block mb-2 text-sm font-medium text-slate-300">Vereine auswählen ({selectedClubIds.length}):</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto p-2 bg-slate-900/50 rounded-lg border border-slate-700/50">
            {clubs.map(club => <div key={club.id} onClick={() => handleClubSelection(club.id)} className={`p-2 rounded-lg cursor-pointer transition-colors ${selectedClubIds.includes(club.id) ? 'bg-blue-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>{club.name}</div>)}
          </div>
        </div>
        <button onClick={handleCreateLeague} disabled={!!loading} className="w-full bg-blue-600 hover:bg-blue-500 py-3 px-5 rounded-lg disabled:bg-slate-600 font-bold">
          {loading === 'Erstelle Liga...' ? 'Wird erstellt...' : 'Liga Erstellen'}
        </button>
      </div>
      <div>
        <h3 className="text-xl font-semibold mb-2">Spielsimulation</h3>
        <button onClick={handleSimulateMatches} disabled={!!loading} className="w-full bg-green-600 hover:bg-green-500 py-3 px-5 rounded-lg disabled:bg-slate-600 font-bold">
          {loading === 'Simuliere Ligaspiele...' ? 'Simuliert...' : 'Alle Ligaspiele Simulieren'}
        </button>
      </div>
    </div>
  );
};

export default LeagueManagement;
