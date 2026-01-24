import React, { useState } from 'react';
import { functions } from '../services/firebase'; 
import { httpsCallable } from 'firebase/functions';

const createLeagueFunction = httpsCallable(functions, 'createLeague');

const LeagueManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleCreateLeague = async () => {
    setLoading(true);
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
    }
    setLoading(false);
  };

  return (
    <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 shadow-lg">
      <h2 className="text-xl font-bold text-white mb-4">Liga-Verwaltung</h2>
      <p className="text-slate-400 mb-6">Generiere eine neue Liga mit 10 Teams (Bot-Teams werden bei Bedarf erstellt) und einem vollständigen Spielplan.</p>

      {feedback && (
        <div className={`p-4 rounded-lg mb-4 text-center font-bold ${feedback.type === 'success' ? 'bg-emerald-900 text-emerald-300' : 'bg-red-900 text-red-300'}`}>
          {feedback.message}
        </div>
      )}

      <button
        onClick={handleCreateLeague}
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:opacity-90 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md"
      >
        {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Liga wird erstellt...
            </>
        ) : (
          'Neue Liga erstellen'
        )}
      </button>
    </div>
  );
};

export default LeagueManagement;
