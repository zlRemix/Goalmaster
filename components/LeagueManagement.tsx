import React, { useState } from 'react';
import { functions } from '../services/firebase';
import { httpsCallable } from 'firebase/functions';

const createLeagueFunction = httpsCallable(functions, 'createLeague');
const simulateLeagueMatchesFunction = httpsCallable(functions, 'simulateLeagueMatches');

const LeagueManagement: React.FC = () => {
  const [loading, setLoading] = useState<string | null>(null); // 'create', 'simulate', or null
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleCreateLeague = async () => {
    if (loading) return;
    setLoading('create');
    setFeedback(null);
    try {
      const result = await createLeagueFunction();
      const data = result.data as { success: boolean; message: string };
      if (data.success) {
        setFeedback({ type: 'success', message: data.message });
      } else {
        throw new Error(data.message || 'Ein unbekannter Fehler ist aufgetreten.');
      }
    } catch (error: any) {
      console.error("Fehler beim Erstellen der Liga:", error);
      setFeedback({ type: 'error', message: error.message || 'Die Liga konnte nicht erstellt werden.' });
    } finally {
      setLoading(null);
    }
  };

  const handleSimulateMatches = async () => {
    if (loading) return;
    setLoading('simulate');
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
      console.error("Fehler beim Simulieren der Spiele:", error);
      setFeedback({ type: 'error', message: error.message || 'Die Spiele konnten nicht simuliert werden.' });
    } finally {
      setLoading(null);
    }
  };


  const LoadingSpinner: React.FC = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  return (
    <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 shadow-lg">
      <h2 className="text-xl font-bold text-white mb-4">Liga-Verwaltung</h2>
      <p className="text-slate-400 mb-6">Verwalte den Lebenszyklus deiner Liga. Erstelle eine neue Saison oder simuliere alle ausstehenden Spiele.</p>

      {feedback && (
        <div className={`p-4 rounded-lg mb-4 text-center font-bold ${feedback.type === 'success' ? 'bg-emerald-800/80 text-emerald-300' : 'bg-red-800/80 text-red-300'}`}>
          {feedback.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 flex flex-col items-center text-center">
            <h3 className="font-bold text-white">Neue Saison starten</h3>
            <p className="text-slate-400 text-sm mt-1 mb-4 flex-grow">Löscht alle alten Spieldaten und generiert eine komplett neue Liga mit 10 Teams und neuem Spielplan.</p>
             <button
                onClick={handleCreateLeague}
                disabled={!!loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:opacity-90 text-white font-bold py-3 px-5 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md"
            >
                {loading === 'create' && <LoadingSpinner />}
                {loading === 'create' ? 'Wird erstellt...' : 'Neue Liga erstellen'}
            </button>
        </div>

        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 flex flex-col items-center text-center">
             <h3 className="font-bold text-white">Spieltag simulieren</h3>
             <p className="text-slate-400 text-sm mt-1 mb-4 flex-grow">Simuliert die Ergebnisse aller noch ausstehenden Spiele in der aktuellen Liga.</p>
            <button
                onClick={handleSimulateMatches}
                disabled={!!loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:opacity-90 text-white font-bold py-3 px-5 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md"
            >
                {loading === 'simulate' && <LoadingSpinner />}
                {loading === 'simulate' ? 'Simuliert...' : 'Alle Spiele simulieren'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default LeagueManagement;
